const { prisma } = require('../prisma/client');

/**
 * Get all patients assigned to a caregiver
 */
async function getCaregiverPatients(caregiverId, options = {}) {
  const { search, status, limit = 50, offset = 0 } = options;

  // Get active assignments
  const where = {
    caregiverId,
    status: 'active',
  };

  const assignments = await prisma.caregiverAssignment.findMany({
    where,
    include: {
      patient: {
        include: {
          user: {
            select: {
              email: true,
            },
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
    const lastSynced = lastReadingMap.get(patient.id);

    // Calculate age from dateOfBirth
    let age = null;
    if (patient.dateOfBirth) {
      const today = new Date();
      const birthDate = new Date(patient.dateOfBirth);
      age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
    }

    // Calculate trend (compare last 2 predictions)
    let trend = 'stable';
    if (prediction) {
      // Get previous prediction for trend
      // This is simplified - in production, you'd want to compare more data points
      trend = 'stable'; // Default, can be enhanced
    }

    // Map risk category to status
    let status = 'Watch';
    if (prediction) {
      if (prediction.riskCategory === 'Stable') status = 'Stable';
      else if (prediction.riskCategory === 'High-Risk Decline') status = 'Declining';
      else status = 'Watch';
    }

    return {
      id: patient.id,
      name: `${patient.firstName || ''} ${patient.lastName || ''}`.trim() || 'Unknown',
      firstName: patient.firstName,
      lastName: patient.lastName,
      age,
      currentScore: {
        healthStabilityScore: prediction?.healthStabilityScore || null,
        riskCategory: prediction?.riskCategory || null,
        trend,
      },
      lastSynced: lastSynced?.toISOString() || null,
    };
  });

  // Apply search filter
  if (search) {
    const searchLower = search.toLowerCase();
    patients = patients.filter(
      (p) =>
        p.name.toLowerCase().includes(searchLower) ||
        p.firstName?.toLowerCase().includes(searchLower) ||
        p.lastName?.toLowerCase().includes(searchLower)
    );
  }

  // Apply status filter
  if (status) {
    patients = patients.filter((p) => p.currentScore?.riskCategory === status || p.status === status);
  }

  return {
    patients,
    pagination: {
      total: patients.length,
      limit,
      offset,
    },
  };
}

/**
 * Get detailed patient view for caregiver
 */
async function getCaregiverPatientDetails(caregiverId, patientId) {
  // Verify caregiver has access to this patient
  const assignment = await prisma.caregiverAssignment.findFirst({
    where: {
      caregiverId,
      patientId,
      status: 'active',
    },
  });

  if (!assignment) {
    throw new Error('Patient not assigned to this caregiver');
  }

  // Get patient info
  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
    include: {
      user: {
        select: {
          email: true,
        },
      },
    },
  });

  if (!patient) {
    throw new Error('Patient not found');
  }

  // Get latest prediction
  const latestPrediction = await prisma.healthPrediction.findFirst({
    where: { patientId },
    orderBy: { timestamp: 'desc' },
  });

  // Get last 7 days of predictions for trajectory
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const predictions = await prisma.healthPrediction.findMany({
    where: {
      patientId,
      timestamp: { gte: sevenDaysAgo },
    },
    orderBy: { timestamp: 'asc' },
  });

  // Format trajectory (daily aggregation for last 7 days)
  const trajectoryMap = new Map();
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  predictions.forEach((pred) => {
    const date = new Date(pred.timestamp);
    const dayName = days[date.getDay()];
    
    if (!trajectoryMap.has(dayName)) {
      trajectoryMap.set(dayName, {
        time: dayName,
        scores: [],
      });
    }
    trajectoryMap.get(dayName).scores.push(pred.healthStabilityScore);
  });

  // Calculate averages and create simplified trajectory
  // This is a simplified version - in production, you'd want more sophisticated decomposition
  const trajectory = Array.from(trajectoryMap.entries()).map(([time, data]) => {
    const avgScore = data.scores.reduce((sum, s) => sum + s, 0) / data.scores.length;
    return {
      time,
      sleep: avgScore * 0.4, // Simplified decomposition
      cardio: avgScore * 0.5,
      activity: avgScore * 0.3,
    };
  });

  // Get decomposition metrics (simplified - based on latest prediction)
  const decomposition = {
    sleepRhythm: latestPrediction ? latestPrediction.lstmScore * 0.42 : null,
    cardioVariability: latestPrediction ? latestPrediction.isolationScore * 0.62 : null,
    activityConsistency: latestPrediction ? latestPrediction.healthStabilityScore * 0.4 : null,
  };

  // Get active flags
  const activeFlag = await prisma.patientFlag.findFirst({
    where: {
      patientId,
      status: 'pending',
    },
    orderBy: { createdAt: 'desc' },
  });

  const riskIdentification = activeFlag
    ? {
        level: activeFlag.priority === 'urgent' || activeFlag.priority === 'high' ? 'high' : 'medium',
        message: activeFlag.reason,
        recommendations: [activeFlag.reason],
      }
    : {
        level: 'low',
        message: 'No active risk flags',
        recommendations: [],
      };

  // Get last sensor reading timestamp
  const lastReading = await prisma.sensorReading.findFirst({
    where: { patientId },
    orderBy: { timestamp: 'desc' },
    select: { timestamp: true },
  });

  // Get recent sensor readings (last 10) for entry log
  const recentReadings = await prisma.sensorReading.findMany({
    where: { patientId },
    orderBy: { timestamp: 'desc' },
    take: 10,
    select: {
      id: true,
      timestamp: true,
      bloodPressure: true,
      bloodGlucose: true,
      heartRate: true,
      activity: true,
    },
  });

  // Calculate age
  let age = null;
  if (patient.dateOfBirth) {
    const today = new Date();
    const birthDate = new Date(patient.dateOfBirth);
    age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
  }

  // Generate case ID (simplified)
  const caseId = `SDD-2026-${patient.id.substring(0, 2).toUpperCase()}`;

  return {
    patient: {
      id: patient.id,
      firstName: patient.firstName,
      lastName: patient.lastName,
      age,
      caseId,
    },
    currentScore: {
      healthStabilityScore: latestPrediction?.healthStabilityScore || null,
      riskCategory: latestPrediction?.riskCategory || null,
      confidence: 94.0, // Placeholder - could be calculated from model confidence
      timestamp: latestPrediction?.timestamp.toISOString() || null,
    },
    trajectory,
    decomposition,
    riskIdentification,
    lastSynced: lastReading?.timestamp.toISOString() || null,
    recentReadings: recentReadings.map(reading => ({
      id: reading.id,
      timestamp: reading.timestamp.toISOString(),
      bloodPressure: reading.bloodPressure,
      bloodGlucose: reading.bloodGlucose,
      heartRate: reading.heartRate,
      activity: reading.activity,
    })),
  };
}

module.exports = {
  getCaregiverPatients,
  getCaregiverPatientDetails,
};

