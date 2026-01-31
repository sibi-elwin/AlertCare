// AlertCare - Alert Routing System
// Routes alerts based on severity: small → caregiver, major → doctor, critical → hospital

/**
 * Determines alert severity based on ML model deviations
 */
export const determineAlertSeverity = (stabilityIndex, news2Score, previousStabilityIndex = null) => {
  // Calculate deviation from baseline
  const deviation = previousStabilityIndex !== null 
    ? Math.abs(stabilityIndex - previousStabilityIndex)
    : 0;
  
  // Critical: NEWS2 = 3 OR stability index < 30 OR large drop
  if (news2Score === 3 || stabilityIndex < 30 || (deviation > 40 && stabilityIndex < 50)) {
    return 'critical';
  }
  
  // Major: NEWS2 = 2 OR stability index < 60 OR moderate drop
  if (news2Score === 2 || stabilityIndex < 60 || (deviation > 20 && stabilityIndex < 70)) {
    return 'major';
  }
  
  // Small: Any other deviation
  if (deviation > 10 || stabilityIndex < 80) {
    return 'small';
  }
  
  return 'normal';
};

/**
 * Routes alert to appropriate recipient based on severity
 */
export const routeAlert = async (patientId, severity, vitals, stabilityIndex, news2Score) => {
  const patientData = await import('./patient-data');
  const logistics = await import('./logistics-bridge');
  
  const getPatientDoctor = patientData.getPatientDoctor;
  const getPatientCaregiver = patientData.getPatientCaregiver;
  const getPatientLocation = patientData.getPatientLocation;
  const findNearestHospital = logistics.findNearestHospital;
  
  const doctor = getPatientDoctor(patientId);
  const caregiver = getPatientCaregiver(patientId);
  const location = getPatientLocation(patientId);
  
  const alert = {
    id: `alert-${Date.now()}`,
    patientId,
    severity,
    timestamp: new Date().toISOString(),
    vitals,
    stabilityIndex,
    news2Score,
    routedTo: [],
  };
  
  switch (severity) {
    case 'critical':
      // Critical: Alert hospital immediately
      if (location) {
        const nearestHospital = await findNearestHospital(location.latitude, location.longitude);
        alert.routedTo.push({
          type: 'hospital',
          hospital: nearestHospital,
          priority: 'immediate',
        });
      }
      
      // Also alert doctor
      if (doctor) {
        alert.routedTo.push({
          type: 'doctor',
          doctorId: doctor.id,
          doctorName: doctor.name,
          priority: 'high',
        });
      }
      
      // Also alert caregiver
      if (caregiver) {
        alert.routedTo.push({
          type: 'caregiver',
          caregiverId: caregiver.id,
          caregiverName: caregiver.name,
          priority: 'high',
        });
      }
      break;
      
    case 'major':
      // Major: Alert doctor first
      if (doctor) {
        alert.routedTo.push({
          type: 'doctor',
          doctorId: doctor.id,
          doctorName: doctor.name,
          priority: 'high',
        });
      }
      
      // Also notify caregiver
      if (caregiver) {
        alert.routedTo.push({
          type: 'caregiver',
          caregiverId: caregiver.id,
          caregiverName: caregiver.name,
          priority: 'medium',
        });
      }
      break;
      
    case 'small':
      // Small: Alert caregiver only
      if (caregiver) {
        alert.routedTo.push({
          type: 'caregiver',
          caregiverId: caregiver.id,
          caregiverName: caregiver.name,
          priority: 'low',
        });
      }
      break;
      
    default:
      // Normal: No alert needed
      return null;
  }
  
  // Store alert
  storeAlert(alert);
  
  // Send notifications (SMS, push, etc.)
  await sendAlertNotifications(alert);
  
  return alert;
};

/**
 * Store alert in history
 */
const alerts = [];
const MAX_ALERTS = 1000;

function storeAlert(alert) {
  alerts.push(alert);
  if (alerts.length > MAX_ALERTS) {
    alerts.shift();
  }
}

/**
 * Get alert history for a patient
 */
export const getPatientAlerts = (patientId, limit = 50) => {
  return alerts
    .filter(alert => alert.patientId === patientId)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, limit);
};

/**
 * Get alerts for a doctor
 */
export const getDoctorAlerts = (doctorId, limit = 50) => {
  return alerts
    .filter(alert => 
      alert.routedTo.some(route => route.type === 'doctor' && route.doctorId === doctorId)
    )
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, limit);
};

/**
 * Get alerts for a caregiver
 */
export const getCaregiverAlerts = (caregiverId, limit = 50) => {
  return alerts
    .filter(alert => 
      alert.routedTo.some(route => route.type === 'caregiver' && route.caregiverId === caregiverId)
    )
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, limit);
};

/**
 * Send alert notifications
 */
async function sendAlertNotifications(alert) {
  // In production, this would send SMS, push notifications, etc.
  console.log('Alert notification:', alert);
  
  // You can integrate with your SMS service here
  // await sendSMS(phoneNumber, alertMessage);
}

/**
 * Doctor escalates to hospital (can't resolve)
 */
export const escalateToHospital = async (patientId, doctorId, reason) => {
  const patientData = await import('./patient-data');
  const logistics = await import('./logistics-bridge');
  
  const getPatientLocation = patientData.getPatientLocation;
  const findNearestHospital = logistics.findNearestHospital;
  const updatePatientPermissions = patientData.updatePatientPermissions;
  
  const location = getPatientLocation(patientId);
  if (!location) {
    throw new Error('Patient location not available');
  }
  
  const nearestHospital = await findNearestHospital(location.latitude, location.longitude);
  
  const escalation = {
    id: `escalation-${Date.now()}`,
    patientId,
    doctorId,
    reason,
    timestamp: new Date().toISOString(),
    hospital: nearestHospital,
    status: 'pending',
  };
  
  // Store escalation
  storeEscalation(escalation);
  
  // Grant hospital access to patient data
  updatePatientPermissions(patientId, { hospital: true });
  
  return escalation;
};

const escalations = [];

function storeEscalation(escalation) {
  escalations.push(escalation);
}

export const getEscalations = (patientId = null) => {
  if (patientId) {
    return escalations.filter(e => e.patientId === patientId);
  }
  return escalations;
};
