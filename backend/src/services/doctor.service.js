const { prisma } = require('../prisma/client');

/**
 * Get all patients assigned to a doctor
 */
async function getDoctorPatients(doctorId, options = {}) {
  const { search, status, limit = 50, offset = 0 } = options;

  // Get active assignments
  const where = {
    doctorId,
    status: status || 'active', // Default to active assignments
  };

  const assignments = await prisma.doctorAssignment.findMany({
    where,
    include: {
      patient: {
        include: {
          user: {
            select: {
              email: true,
            },
          },
          caregiverAssignments: {
            where: {
              status: 'active',
            },
            include: {
              caregiver: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  phone: true,
                },
              },
            },
            take: 1, // Only get the first active caregiver
          },
        },
      },
    },
    skip: offset,
    take: limit,
  });

  // Get latest predictions for each patient
  const patientIds = assignments.map((a) => a.patientId);
  const latestPredictions = await prisma.healthPrediction.findMany({
    where: {
      patientId: { in: patientIds },
    },
    orderBy: { timestamp: 'desc' },
    distinct: ['patientId'],
  });

  const predictionMap = new Map();
  latestPredictions.forEach((pred) => {
    if (!predictionMap.has(pred.patientId)) {
      predictionMap.set(pred.patientId, pred);
    }
  });

  // Get last sensor reading timestamp for each patient
  const lastReadings = await prisma.sensorReading.findMany({
    where: {
      patientId: { in: patientIds },
    },
    orderBy: { timestamp: 'desc' },
    distinct: ['patientId'],
    select: {
      patientId: true,
      timestamp: true,
    },
  });

  const lastReadingMap = new Map();
  lastReadings.forEach((reading) => {
    if (!lastReadingMap.has(reading.patientId)) {
      lastReadingMap.set(reading.patientId, reading.timestamp);
    }
  });

  // Format patients with scores and trends
  let patients = assignments.map((assignment) => {
    const patient = assignment.patient;
    const prediction = predictionMap.get(patient.id);
    const lastReading = lastReadingMap.get(patient.id);

    // Calculate trend (simplified - compare with previous prediction)
    let trend = 'stable';
    if (prediction) {
      // In a real implementation, you'd compare with previous predictions
      if (prediction.healthStabilityScore < 50) {
        trend = 'declining';
      } else if (prediction.healthStabilityScore > 75) {
        trend = 'improving';
      }
    }

    // Get assigned caregiver if any
    const caregiverAssignment = patient.caregiverAssignments?.[0];
    const caregiver = caregiverAssignment?.caregiver;

    return {
      id: patient.id,
      userId: patient.userId,
      name: `${patient.firstName || ''} ${patient.lastName || ''}`.trim() || 'Patient',
      firstName: patient.firstName,
      lastName: patient.lastName,
      email: patient.user?.email,
      phone: patient.phone,
      dateOfBirth: patient.dateOfBirth,
      address: patient.address,
      assignment: {
        id: assignment.id,
        selectedAt: assignment.selectedAt,
        status: assignment.status,
        notes: assignment.notes,
      },
      caregiver: caregiver
        ? {
            id: caregiver.id,
            name: `${caregiver.firstName || ''} ${caregiver.lastName || ''}`.trim() || 'Caregiver',
            firstName: caregiver.firstName,
            lastName: caregiver.lastName,
            phone: caregiver.phone,
          }
        : null,
      latestPrediction: prediction
        ? {
            healthStabilityScore: prediction.healthStabilityScore,
            riskCategory: prediction.riskCategory,
            timestamp: prediction.timestamp,
          }
        : null,
      lastReading: lastReading || null,
      trend,
    };
  });

  // Apply search filter if provided
  if (search) {
    const searchLower = search.toLowerCase();
    patients = patients.filter(
      (p) =>
        p.name.toLowerCase().includes(searchLower) ||
        p.email?.toLowerCase().includes(searchLower) ||
        p.phone?.includes(search)
    );
  }

  return {
    patients,
    total: patients.length,
  };
}

/**
 * Get detailed patient view for a doctor
 */
async function getDoctorPatientDetails(doctorId, patientId) {
  // Verify assignment exists
  const assignment = await prisma.doctorAssignment.findFirst({
    where: {
      doctorId,
      patientId,
      status: 'active',
    },
  });

  if (!assignment) {
    throw new Error('Patient not assigned to this doctor');
  }

  // Get patient with full details
  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
    include: {
      user: {
        select: {
          email: true,
        },
      },
      sensorReadings: {
        orderBy: { timestamp: 'desc' },
        take: 100, // Last 100 readings
      },
      predictions: {
        orderBy: { timestamp: 'desc' },
        take: 30, // Last 30 predictions
      },
    },
  });

  if (!patient) {
    throw new Error('Patient not found');
  }

  // Get latest prediction
  const latestPrediction = patient.predictions[0] || null;

  // Get caregiver assignments
  const caregiverAssignments = await prisma.caregiverAssignment.findMany({
    where: {
      patientId,
      status: 'active',
    },
    include: {
      caregiver: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phone: true,
        },
      },
    },
  });

  // Get guidance
  const guidance = await prisma.careTeamGuidance.findMany({
    where: {
      patientId,
      doctorId,
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  // Get notes
  const notes = await prisma.caregiverNote.findMany({
    where: {
      patientId,
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
    include: {
      caregiver: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  return {
    patient: {
      id: patient.id,
      userId: patient.userId,
      name: `${patient.firstName || ''} ${patient.lastName || ''}`.trim() || 'Patient',
      firstName: patient.firstName,
      lastName: patient.lastName,
      email: patient.user?.email,
      phone: patient.phone,
      dateOfBirth: patient.dateOfBirth,
      address: patient.address,
    },
    assignment: {
      id: assignment.id,
      selectedAt: assignment.selectedAt,
      status: assignment.status,
      notes: assignment.notes,
    },
    latestPrediction,
    recentReadings: patient.sensorReadings,
    recentPredictions: patient.predictions,
    caregivers: caregiverAssignments.map((ca) => ({
      id: ca.caregiver.id,
      name: `${ca.caregiver.firstName || ''} ${ca.caregiver.lastName || ''}`.trim(),
      phone: ca.caregiver.phone,
      assignedAt: ca.assignedAt,
    })),
    guidance,
    notes: notes.map((note) => ({
      id: note.id,
      content: note.content,
      caregiver: note.caregiver
        ? `${note.caregiver.firstName || ''} ${note.caregiver.lastName || ''}`.trim()
        : 'Unknown',
      createdAt: note.createdAt,
    })),
  };
}

module.exports = {
  getDoctorPatients,
  getDoctorPatientDetails,
};

