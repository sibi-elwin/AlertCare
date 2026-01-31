const { prisma } = require('../prisma/client');

/**
 * Determine alert severity and recipient based on ML risk category
 * @param {string} riskCategory - ML risk category
 * @param {number} healthStabilityScore - Health stability score
 * @returns {Object} Alert configuration
 */
function determineAlertConfig(riskCategory, healthStabilityScore) {
  // Early Instability (70-89) → Alert caregiver
  if (riskCategory === 'Early Instability') {
    return {
      sendToCaregiver: true,
      sendToDoctor: false,
      priority: 'normal',
      severity: 'low',
    };
  }
  
  // Sustained Deterioration (50-69) → Alert both caregiver and doctor
  if (riskCategory === 'Sustained Deterioration') {
    return {
      sendToCaregiver: true,
      sendToDoctor: true,
      priority: 'high',
      severity: 'medium',
    };
  }
  
  // High-Risk Decline (<50) → Alert doctor (critical)
  if (riskCategory === 'High-Risk Decline') {
    return {
      sendToCaregiver: true, // Also notify caregiver
      sendToDoctor: true,
      priority: 'high',
      severity: 'critical',
    };
  }
  
  // Stable (≥90) → No alert
  return {
    sendToCaregiver: false,
    sendToDoctor: false,
    priority: null,
    severity: null,
  };
}

/**
 * Create automated alerts based on ML prediction
 * @param {string} patientId - Patient ID
 * @param {string} predictionId - HealthPrediction ID
 * @param {string} riskCategory - Risk category from ML
 * @param {number} healthStabilityScore - Health stability score
 * @returns {Promise<Array>} Array of created alerts
 */
async function createAlertsFromPrediction(patientId, predictionId, riskCategory, healthStabilityScore) {
  // Skip if stable
  if (riskCategory === 'Stable') {
    return [];
  }

  const alertConfig = determineAlertConfig(riskCategory, healthStabilityScore);
  
  if (!alertConfig.sendToCaregiver && !alertConfig.sendToDoctor) {
    return [];
  }

  const alerts = [];

  // Get patient's assigned caregiver and doctor
  const [caregiverAssignment, doctorAssignment] = await Promise.all([
    prisma.caregiverAssignment.findFirst({
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
    }),
    prisma.doctorAssignment.findFirst({
      where: {
        patientId,
        status: 'active',
      },
      include: {
        doctor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    }),
  ]);

  // Create alert message
  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
    select: {
      firstName: true,
      lastName: true,
    },
  });

  const patientName = `${patient?.firstName || ''} ${patient?.lastName || ''}`.trim() || 'Patient';
  
  let alertMessage;
  if (riskCategory === 'Early Instability') {
    alertMessage = `Early Instability Detected: ${patientName} shows early warning signs (Health Score: ${healthStabilityScore.toFixed(1)}). Please monitor closely.`;
  } else if (riskCategory === 'Sustained Deterioration') {
    alertMessage = `Sustained Deterioration Alert: ${patientName} shows ongoing health decline (Health Score: ${healthStabilityScore.toFixed(1)}). Clinical review recommended.`;
  } else if (riskCategory === 'High-Risk Decline') {
    alertMessage = `CRITICAL ALERT: ${patientName} shows high-risk decline (Health Score: ${healthStabilityScore.toFixed(1)}). Immediate medical attention required.`;
  }

  // Send to caregiver if needed
  if (alertConfig.sendToCaregiver && caregiverAssignment) {
    const caregiverAlert = await prisma.careTeamGuidance.create({
      data: {
        patientId,
        caregiverId: caregiverAssignment.caregiverId,
        message: alertMessage,
        priority: alertConfig.priority,
        acknowledged: false,
      },
    });
    alerts.push({
      type: 'caregiver',
      id: caregiverAlert.id,
      caregiverId: caregiverAssignment.caregiverId,
    });
  }

  // Send to doctor if needed
  if (alertConfig.sendToDoctor && doctorAssignment) {
    const doctorAlert = await prisma.careTeamGuidance.create({
      data: {
        patientId,
        doctorId: doctorAssignment.doctorId,
        message: alertMessage,
        priority: alertConfig.priority,
        acknowledged: false,
      },
    });
    alerts.push({
      type: 'doctor',
      id: doctorAlert.id,
      doctorId: doctorAssignment.doctorId,
    });
  }

  return alerts;
}

/**
 * Get alerts for a caregiver
 * @param {string} caregiverId - Caregiver ID
 * @param {object} options - Query options
 * @returns {Promise<Object>} Alerts data
 */
async function getCaregiverAlerts(caregiverId, options = {}) {
  const { limit = 50, offset = 0, acknowledged = false } = options;

  const where = {
    caregiverId,
    acknowledged: acknowledged === true ? true : acknowledged === false ? false : undefined,
  };

  // Remove undefined values
  Object.keys(where).forEach(key => where[key] === undefined && delete where[key]);

  const alerts = await prisma.careTeamGuidance.findMany({
    where,
    include: {
      patient: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phone: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: limit,
    skip: offset,
  });

  return {
    alerts,
    total: alerts.length,
  };
}

/**
 * Get alerts for a doctor
 * @param {string} doctorId - Doctor ID
 * @param {object} options - Query options
 * @returns {Promise<Object>} Alerts data
 */
async function getDoctorAlerts(doctorId, options = {}) {
  const { limit = 50, offset = 0, acknowledged = false } = options;

  const where = {
    doctorId,
    acknowledged: acknowledged === true ? true : acknowledged === false ? false : undefined,
  };

  // Remove undefined values
  Object.keys(where).forEach(key => where[key] === undefined && delete where[key]);

  const alerts = await prisma.careTeamGuidance.findMany({
    where,
    include: {
      patient: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phone: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: limit,
    skip: offset,
  });

  return {
    alerts,
    total: alerts.length,
  };
}

module.exports = {
  determineAlertConfig,
  createAlertsFromPrediction,
  getCaregiverAlerts,
  getDoctorAlerts,
};

