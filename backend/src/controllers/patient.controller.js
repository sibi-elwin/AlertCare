const { getPatientDashboard, getPatientTrajectory } = require('../services/dashboard.service');
const { prisma } = require('../prisma/client');

/**
 * Get patient profile by userId
 * GET /api/patients/profile/:userId
 */
const getProfileByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    const patient = await prisma.patient.findUnique({
      where: { userId },
      select: {
        id: true,
        userId: true,
        firstName: true,
        lastName: true,
        phone: true,
        dateOfBirth: true,
        address: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient profile not found',
      });
    }

    res.json({
      success: true,
      data: patient,
    });
  } catch (error) {
    console.error('Get patient profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Get patient dashboard data
 * GET /api/patients/:patientId/dashboard
 */
const getDashboard = async (req, res) => {
  try {
    const { patientId } = req.params;

    const dashboardData = await getPatientDashboard(patientId);

    res.json({
      success: true,
      data: dashboardData,
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    if (error.message === 'Patient not found') {
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
 * Get patient trajectory data
 * GET /api/patients/:patientId/predictions/trajectory
 */
const getTrajectory = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { days = 30, granularity = 'daily' } = req.query;

    const trajectory = await getPatientTrajectory(
      patientId,
      parseInt(days),
      granularity
    );

    res.json({
      success: true,
      data: { trajectory },
    });
  } catch (error) {
    console.error('Get trajectory error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Sync wearable device data
 * POST /api/patients/:patientId/sync-wearable
 */
const syncWearable = async (req, res) => {
  try {
    const { patientId } = req.params;

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

    // In a real implementation, this would trigger a background job
    // to sync data from the wearable device API
    // For now, we'll just return a success response

    res.json({
      success: true,
      message: 'Wearable sync initiated',
      data: {
        syncId: `sync-${Date.now()}`,
        status: 'pending',
      },
    });
  } catch (error) {
    console.error('Sync wearable error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Get available doctors for patient selection
 * GET /api/patients/doctors/available
 */
const getAvailableDoctors = async (req, res) => {
  try {
    const { specialization, search } = req.query;

    const where = {};
    
    // Filter by specialization if provided
    if (specialization) {
      where.specialization = specialization;
    }
    
    // Search by name if provided
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { specialization: { contains: search, mode: 'insensitive' } },
      ];
    }

    const doctors = await prisma.doctor.findMany({
      where,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        licenseNumber: true,
        specialization: true,
        createdAt: true,
      },
      orderBy: [
        { specialization: 'asc' },
        { lastName: 'asc' },
        { firstName: 'asc' },
      ],
    });

    // Format doctors for response
    const formattedDoctors = doctors.map(doctor => ({
      id: doctor.id,
      name: `${doctor.firstName || ''} ${doctor.lastName || ''}`.trim() || 'Doctor',
      firstName: doctor.firstName,
      lastName: doctor.lastName,
      phone: doctor.phone,
      licenseNumber: doctor.licenseNumber,
      specialization: doctor.specialization,
    }));

    res.json({
      success: true,
      data: {
        doctors: formattedDoctors,
        total: formattedDoctors.length,
      },
    });
  } catch (error) {
    console.error('Get available doctors error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Assign a doctor to a patient
 * POST /api/patients/:patientId/doctors/:doctorId/assign
 */
const assignDoctor = async (req, res) => {
  try {
    const { patientId, doctorId } = req.params;
    const { notes } = req.body;

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

    // Verify doctor exists
    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found',
      });
    }

    // Check if assignment already exists
    const existingAssignment = await prisma.doctorAssignment.findUnique({
      where: {
        patientId_doctorId: {
          patientId,
          doctorId,
        },
      },
    });

    if (existingAssignment) {
      // Update existing assignment to active if it was inactive
      if (existingAssignment.status === 'inactive') {
        const updated = await prisma.doctorAssignment.update({
          where: { id: existingAssignment.id },
          data: {
            status: 'active',
            selectedAt: new Date(),
            notes: notes || existingAssignment.notes,
          },
        });

        return res.json({
          success: true,
          message: 'Doctor assignment reactivated',
          data: updated,
        });
      }

      return res.json({
        success: true,
        message: 'Doctor already assigned to this patient',
        data: existingAssignment,
      });
    }

    // Create new assignment
    const assignment = await prisma.doctorAssignment.create({
      data: {
        patientId,
        doctorId,
        status: 'active', // Patient selects doctor, so it's active immediately
        notes: notes || null,
      },
      include: {
        doctor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            specialization: true,
          },
        },
      },
    });

    res.json({
      success: true,
      message: 'Doctor assigned successfully',
      data: assignment,
    });
  } catch (error) {
    console.error('Assign doctor error:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        message: 'Doctor is already assigned to this patient',
      });
    }
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Acknowledge guidance
 * POST /api/patients/:patientId/guidance/:guidanceId/acknowledge
 */
const acknowledgeGuidance = async (req, res) => {
  try {
    const { patientId, guidanceId } = req.params;

    // Verify guidance belongs to patient
    const guidance = await prisma.careTeamGuidance.findFirst({
      where: {
        id: guidanceId,
        patientId,
      },
    });

    if (!guidance) {
      return res.status(404).json({
        success: false,
        message: 'Guidance not found',
      });
    }

    // Update guidance
    const updated = await prisma.careTeamGuidance.update({
      where: { id: guidanceId },
      data: {
        acknowledged: true,
        acknowledgedAt: new Date(),
      },
    });

    res.json({
      success: true,
      message: 'Guidance acknowledged',
      data: updated,
    });
  } catch (error) {
    console.error('Acknowledge guidance error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

module.exports = {
  getProfileByUserId,
  getDashboard,
  getTrajectory,
  syncWearable,
  acknowledgeGuidance,
  getAvailableDoctors,
  assignDoctor,
};

