const {
  getCaregiverPatients,
  getCaregiverPatientDetails,
} = require('../services/caregiver.service');
const { getCaregiverAlerts } = require('../services/alert.service');
const { prisma } = require('../prisma/client');

/**
 * Get caregiver profile by userId
 * GET /api/caregivers/profile/:userId
 */
const getProfileByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    const caregiver = await prisma.caregiver.findUnique({
      where: { userId },
      select: {
        id: true,
        userId: true,
        firstName: true,
        lastName: true,
        phone: true,
        licenseNumber: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!caregiver) {
      return res.status(404).json({
        success: false,
        message: 'Caregiver profile not found',
      });
    }

    res.json({
      success: true,
      data: caregiver,
    });
  } catch (error) {
    console.error('Get caregiver profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Get all patients for a caregiver
 * GET /api/caregivers/:caregiverId/patients
 */
const getPatients = async (req, res) => {
  try {
    const { caregiverId } = req.params;
    const { search, status, limit, offset } = req.query;

    const result = await getCaregiverPatients(caregiverId, {
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
    console.error('Get caregiver patients error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Get detailed patient view
 * GET /api/caregivers/:caregiverId/patients/:patientId
 */
const getPatientDetails = async (req, res) => {
  try {
    const { caregiverId, patientId } = req.params;

    const details = await getCaregiverPatientDetails(caregiverId, patientId);

    res.json({
      success: true,
      data: details,
    });
  } catch (error) {
    console.error('Get patient details error:', error);
    if (error.message === 'Patient not assigned to this caregiver' || error.message === 'Patient not found') {
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
 * Get caregiver notes for a patient
 * GET /api/caregivers/:caregiverId/patients/:patientId/notes
 */
const getNotes = async (req, res) => {
  try {
    const { caregiverId, patientId } = req.params;

    // Verify access
    const assignment = await prisma.caregiverAssignment.findFirst({
      where: {
        caregiverId,
        patientId,
        status: 'active',
      },
    });

    if (!assignment) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    const notes = await prisma.caregiverNote.findMany({
      where: {
        patientId,
        caregiverId,
      },
      include: {
        caregiver: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: {
        notes: notes.map((note) => ({
          id: note.id,
          content: note.content,
          caregiverId: note.caregiverId,
          caregiverName: `${note.caregiver.firstName || ''} ${note.caregiver.lastName || ''}`.trim() || 'Caregiver',
          timestamp: note.createdAt.toISOString(),
        })),
      },
    });
  } catch (error) {
    console.error('Get notes error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Add a caregiver note
 * POST /api/caregivers/:caregiverId/patients/:patientId/notes
 */
const addNote = async (req, res) => {
  try {
    const { caregiverId, patientId } = req.params;
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Note content is required',
      });
    }

    // Verify access
    const assignment = await prisma.caregiverAssignment.findFirst({
      where: {
        caregiverId,
        patientId,
        status: 'active',
      },
    });

    if (!assignment) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    const note = await prisma.caregiverNote.create({
      data: {
        patientId,
        caregiverId,
        content: content.trim(),
      },
    });

    res.json({
      success: true,
      message: 'Note added successfully',
      data: {
        note: {
          id: note.id,
          content: note.content,
          timestamp: note.createdAt.toISOString(),
        },
      },
    });
  } catch (error) {
    console.error('Add note error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Send guidance to patient
 * POST /api/caregivers/:caregiverId/patients/:patientId/guidance
 */
const sendGuidance = async (req, res) => {
  try {
    const { caregiverId, patientId } = req.params;
    const { message, priority = 'normal' } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Guidance message is required',
      });
    }

    // Verify access
    const assignment = await prisma.caregiverAssignment.findFirst({
      where: {
        caregiverId,
        patientId,
        status: 'active',
      },
    });

    if (!assignment) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    const guidance = await prisma.careTeamGuidance.create({
      data: {
        patientId,
        caregiverId,
        message: message.trim(),
        priority: priority || 'normal',
      },
    });

    res.json({
      success: true,
      message: 'Guidance sent successfully',
      data: {
        guidance: {
          id: guidance.id,
          message: guidance.message,
          timestamp: guidance.createdAt.toISOString(),
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
 * Get alerts for a caregiver
 * GET /api/caregivers/:caregiverId/alerts
 */
const getAlerts = async (req, res) => {
  try {
    const { caregiverId } = req.params;
    const { limit, offset, acknowledged } = req.query;

    const result = await getCaregiverAlerts(caregiverId, {
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
      acknowledged: acknowledged === 'true' ? true : acknowledged === 'false' ? false : undefined,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Get caregiver alerts error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Flag patient for clinical review
 * POST /api/caregivers/:caregiverId/patients/:patientId/flag
 */
const flagPatient = async (req, res) => {
  try {
    const { caregiverId, patientId } = req.params;
    const { reason, priority = 'medium' } = req.body;

    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Flag reason is required',
      });
    }

    // Verify access
    const assignment = await prisma.caregiverAssignment.findFirst({
      where: {
        caregiverId,
        patientId,
        status: 'active',
      },
    });

    if (!assignment) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    const flag = await prisma.patientFlag.create({
      data: {
        patientId,
        caregiverId,
        reason: reason.trim(),
        priority: priority || 'medium',
        status: 'pending',
      },
    });

    res.json({
      success: true,
      message: 'Patient flagged for clinical review',
      data: {
        flag: {
          id: flag.id,
          reason: flag.reason,
          priority: flag.priority,
          timestamp: flag.createdAt.toISOString(),
        },
      },
    });
  } catch (error) {
    console.error('Flag patient error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

module.exports = {
  getProfileByUserId,
  getAlerts,
  getPatients,
  getPatientDetails,
  getNotes,
  addNote,
  sendGuidance,
  flagPatient,
};

