const { prisma } = require('../prisma/client');
const {
  getDoctorPatients,
  getDoctorPatientDetails,
} = require('../services/doctor.service');
const { getDoctorAlerts } = require('../services/alert.service');

/**
 * Get doctor profile by userId
 * GET /api/doctors/profile/:userId
 */
const getProfileByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    const doctor = await prisma.doctor.findUnique({
      where: { userId },
      select: {
        id: true,
        userId: true,
        firstName: true,
        lastName: true,
        phone: true,
        licenseNumber: true,
        specialization: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor profile not found',
      });
    }

    res.json({
      success: true,
      data: doctor,
    });
  } catch (error) {
    console.error('Get doctor profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Get all patients assigned to a doctor
 * GET /api/doctors/:doctorId/patients
 */
const getPatients = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { search, status, limit, offset } = req.query;

    const result = await getDoctorPatients(doctorId, {
      search,
      status,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Get doctor patients error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Get detailed patient view
 * GET /api/doctors/:doctorId/patients/:patientId
 */
const getPatientDetails = async (req, res) => {
  try {
    const { doctorId, patientId } = req.params;

    const details = await getDoctorPatientDetails(doctorId, patientId);

    res.json({
      success: true,
      data: details,
    });
  } catch (error) {
    console.error('Get patient details error:', error);
    if (error.message === 'Patient not assigned to this doctor' || error.message === 'Patient not found') {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Get available caregivers for assignment
 * GET /api/doctors/caregivers/available
 */
const getAvailableCaregivers = async (req, res) => {
  try {
    const { search } = req.query;

    const where = {};
    
    // Search by name if provided
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const caregivers = await prisma.caregiver.findMany({
      where,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        licenseNumber: true,
        createdAt: true,
      },
      orderBy: [
        { lastName: 'asc' },
        { firstName: 'asc' },
      ],
    });

    // Get patient counts for each caregiver
    const caregiverIds = caregivers.map(c => c.id);
    const assignmentCounts = await prisma.caregiverAssignment.groupBy({
      by: ['caregiverId'],
      where: {
        caregiverId: { in: caregiverIds },
        status: 'active',
      },
      _count: {
        id: true,
      },
    });

    const countMap = new Map();
    assignmentCounts.forEach(item => {
      countMap.set(item.caregiverId, item._count.id);
    });

    // Format caregivers for response
    const formattedCaregivers = caregivers.map(caregiver => ({
      id: caregiver.id,
      name: `${caregiver.firstName || ''} ${caregiver.lastName || ''}`.trim() || 'Caregiver',
      firstName: caregiver.firstName,
      lastName: caregiver.lastName,
      phone: caregiver.phone,
      licenseNumber: caregiver.licenseNumber,
      patientsCount: countMap.get(caregiver.id) || 0,
      available: true, // All caregivers are available for assignment
    }));

    res.json({
      success: true,
      data: {
        caregivers: formattedCaregivers,
        total: formattedCaregivers.length,
      },
    });
  } catch (error) {
    console.error('Get available caregivers error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Assign a caregiver to a patient (by doctor)
 * POST /api/doctors/:doctorId/patients/:patientId/caregivers/:caregiverId/assign
 */
const assignCaregiver = async (req, res) => {
  try {
    const { doctorId, patientId, caregiverId } = req.params;
    const { notes } = req.body;

    // Verify doctor exists and has access to patient
    const doctorAssignment = await prisma.doctorAssignment.findFirst({
      where: {
        doctorId,
        patientId,
        status: 'active',
      },
    });

    if (!doctorAssignment) {
      return res.status(403).json({
        success: false,
        message: 'Doctor does not have access to this patient',
      });
    }

    // Verify patient exists
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found',
      });
    }

    // Verify caregiver exists
    const caregiver = await prisma.caregiver.findUnique({
      where: { id: caregiverId },
    });

    if (!caregiver) {
      return res.status(404).json({
        success: false,
        message: 'Caregiver not found',
      });
    }

    // Check if patient already has an active caregiver assignment
    const existingActiveAssignment = await prisma.caregiverAssignment.findFirst({
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
          },
        },
      },
    });

    if (existingActiveAssignment) {
      const caregiverName = `${existingActiveAssignment.caregiver.firstName || ''} ${existingActiveAssignment.caregiver.lastName || ''}`.trim() || 'a caregiver';
      return res.status(400).json({
        success: false,
        message: `Patient already has an active caregiver assigned: ${caregiverName}. Please remove the existing assignment first.`,
        data: existingActiveAssignment,
      });
    }

    // Check if this specific caregiver is already assigned (even if inactive)
    const existingAssignment = await prisma.caregiverAssignment.findUnique({
      where: {
        patientId_caregiverId: {
          patientId,
          caregiverId,
        },
      },
    });

    if (existingAssignment) {
      // If it was inactive, reactivate it
      if (existingAssignment.status === 'inactive') {
        const updated = await prisma.caregiverAssignment.update({
          where: { id: existingAssignment.id },
          data: {
            status: 'active',
            assignedBy: doctorId,
            assignedAt: new Date(),
            notes: notes || existingAssignment.notes,
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

        return res.json({
          success: true,
          message: 'Caregiver assignment reactivated',
          data: updated,
        });
      }

      return res.status(400).json({
        success: false,
        message: 'This caregiver is already assigned to this patient',
        data: existingAssignment,
      });
    }

    // Create new assignment
    const assignment = await prisma.caregiverAssignment.create({
      data: {
        patientId,
        caregiverId,
        assignedBy: doctorId,
        status: 'active',
        notes: notes || null,
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

    res.json({
      success: true,
      message: 'Caregiver assigned successfully',
      data: assignment,
    });
  } catch (error) {
    console.error('Assign caregiver error:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        message: 'Caregiver is already assigned to this patient',
      });
    }
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Send guidance/prescription/comment to patient
 * POST /api/doctors/:doctorId/patients/:patientId/guidance
 */
const sendGuidance = async (req, res) => {
  try {
    const { doctorId, patientId } = req.params;
    const { message, priority = 'normal' } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Guidance message is required',
      });
    }

    // Verify doctor has access to this patient
    const assignment = await prisma.doctorAssignment.findFirst({
      where: {
        doctorId,
        patientId,
        status: 'active',
      },
    });

    if (!assignment) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Patient not assigned to this doctor.',
      });
    }

    // Create guidance record
    const guidance = await prisma.careTeamGuidance.create({
      data: {
        patientId,
        doctorId,
        message: message.trim(),
        priority: priority || 'normal',
        acknowledged: false,
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    res.json({
      success: true,
      message: 'Guidance sent successfully',
      data: {
        guidance: {
          id: guidance.id,
          message: guidance.message,
          priority: guidance.priority,
          timestamp: guidance.createdAt.toISOString(),
          patientName: `${guidance.patient.firstName || ''} ${guidance.patient.lastName || ''}`.trim() || 'Patient',
        },
      },
    });
  } catch (error) {
    console.error('Send guidance error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Get alerts for a doctor
 * GET /api/doctors/:doctorId/alerts
 */
const getAlerts = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { limit, offset, acknowledged } = req.query;

    const result = await getDoctorAlerts(doctorId, {
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
      acknowledged: acknowledged === 'true' ? true : acknowledged === 'false' ? false : undefined,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Get doctor alerts error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

module.exports = {
  getProfileByUserId,
  getPatients,
  getPatientDetails,
  getAvailableCaregivers,
  assignCaregiver,
  sendGuidance,
  getAlerts,
};

