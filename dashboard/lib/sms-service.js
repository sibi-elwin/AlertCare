// AlertCare - SMS Notification Service
// Simulates SMS sending to caregivers for periodic health updates

/**
 * Stores phone numbers and SMS preferences in localStorage (for demo)
 * In production, this would be stored in a database
 */
const STORAGE_KEY = 'alertcare_caretaker_phones';
const SMS_PREFERENCES_KEY = 'alertcare_sms_preferences';

/**
 * Registers a phone number for a patient/caretaker
 */
export const registerPhoneNumber = (patientId, phoneNumber, caretakerName) => {
  const stored = getStoredPhoneNumbers();
  stored[patientId] = {
    phone: phoneNumber,
    caretaker: caretakerName,
    registeredAt: new Date().toISOString(),
    verified: false, // In production, would require OTP verification
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  return stored[patientId];
};

/**
 * Gets stored phone numbers
 */
export const getStoredPhoneNumbers = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

/**
 * Gets phone number for a specific patient
 */
export const getPhoneNumber = (patientId) => {
  const stored = getStoredPhoneNumbers();
  return stored[patientId] || null;
};

/**
 * Sets SMS preferences for a patient
 */
export const setSMSPreferences = (patientId, preferences) => {
  const stored = getStoredPreferences();
  stored[patientId] = {
    ...preferences,
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(SMS_PREFERENCES_KEY, JSON.stringify(stored));
  return stored[patientId];
};

/**
 * Gets SMS preferences for a patient
 */
export const getSMSPreferences = (patientId) => {
  const stored = getStoredPreferences();
  return stored[patientId] || {
    enabled: true,
    frequency: 'daily', // 'realtime', 'daily', 'weekly'
    alertOnCritical: true,
    alertOnWarning: false,
  };
};

/**
 * Gets all stored preferences
 */
const getStoredPreferences = () => {
  try {
    const stored = localStorage.getItem(SMS_PREFERENCES_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

/**
 * Simulates sending an SMS message
 * In production, this would integrate with Twilio, AWS SNS, or similar service
 */
export const sendSMS = async (phoneNumber, message) => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // In production, this would be:
  // const response = await fetch('/api/sms/send', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ to: phoneNumber, message }),
  // });
  // return await response.json();
  
  console.log(`[SMS] To: ${phoneNumber}`);
  console.log(`[SMS] Message: ${message}`);
  
  return {
    success: true,
    messageId: `sms-${Date.now()}`,
    sentAt: new Date().toISOString(),
  };
};

/**
 * Generates a health update message based on patient status
 */
export const generateHealthUpdateMessage = (patient, vitals) => {
  const status = patient.stabilityIndex >= 70 ? 'stable' : 
                 patient.stabilityIndex >= 40 ? 'monitoring' : 'critical';
  
  let message = `AlertCare Update: ${patient.name}\n\n`;
  
  if (status === 'critical') {
    message += `⚠️ CRITICAL: Patient requires immediate attention.\n`;
    message += `Stability Index: ${patient.stabilityIndex}\n`;
    message += `NEWS2 Score: ${patient.news2Score}\n\n`;
  } else if (status === 'monitoring') {
    message += `📊 Monitoring: Patient condition needs attention.\n`;
    message += `Stability Index: ${patient.stabilityIndex}\n\n`;
  } else {
    message += `✅ Stable: Patient is doing well.\n`;
    message += `Stability Index: ${patient.stabilityIndex}\n\n`;
  }
  
  if (vitals) {
    message += `Latest Vitals:\n`;
    message += `Heart Rate: ${vitals.heartRate} bpm\n`;
    message += `SpO2: ${vitals.spo2}%\n`;
    message += `BP: ${vitals.systolicBP} mmHg\n`;
    message += `Temp: ${vitals.temperature}°C\n\n`;
  }
  
  message += `Next update: ${getNextUpdateTime(patient.stabilityIndex)}\n`;
  message += `Reply STOP to unsubscribe`;
  
  return message;
};

/**
 * Gets the next update time based on stability index
 */
const getNextUpdateTime = (stabilityIndex) => {
  if (stabilityIndex < 40) return '1 hour';
  if (stabilityIndex < 70) return '6 hours';
  return '24 hours';
};

/**
 * Schedules periodic SMS notifications based on patient status
 */
export const schedulePeriodicSMS = async (patient, vitals = null) => {
  const phoneData = getPhoneNumber(patient.id);
  if (!phoneData) {
    console.log('No phone number registered for patient:', patient.id);
    return { success: false, reason: 'No phone number registered' };
  }
  
  const preferences = getSMSPreferences(patient.id);
  if (!preferences.enabled) {
    console.log('SMS notifications disabled for patient:', patient.id);
    return { success: false, reason: 'SMS notifications disabled' };
  }
  
  // Check if we should send based on preferences
  const shouldSend = shouldSendSMS(patient, preferences);
  if (!shouldSend) {
    return { success: false, reason: 'Notification not needed based on preferences' };
  }
  
  const message = generateHealthUpdateMessage(patient, vitals);
  const result = await sendSMS(phoneData.phone, message);
  
  // Log the SMS for tracking
  logSMSNotification(patient.id, result);
  
  return result;
};

/**
 * Determines if SMS should be sent based on preferences
 */
const shouldSendSMS = (patient, preferences) => {
  // Always send critical alerts if enabled
  if (patient.stabilityIndex < 40 && preferences.alertOnCritical) {
    return true;
  }
  
  // Send warning alerts if enabled
  if (patient.stabilityIndex < 70 && preferences.alertOnWarning) {
    return true;
  }
  
  // Check frequency
  if (preferences.frequency === 'realtime') {
    return true; // Send for all updates
  }
  
  if (preferences.frequency === 'daily') {
    // Check if last SMS was sent more than 24 hours ago
    const lastSMS = getLastSMSTime(patient.id);
    if (!lastSMS) return true; // First time
    const hoursSince = (Date.now() - new Date(lastSMS).getTime()) / (1000 * 60 * 60);
    return hoursSince >= 24;
  }
  
  if (preferences.frequency === 'weekly') {
    const lastSMS = getLastSMSTime(patient.id);
    if (!lastSMS) return true;
    const daysSince = (Date.now() - new Date(lastSMS).getTime()) / (1000 * 60 * 60 * 24);
    return daysSince >= 7;
  }
  
  return false;
};

/**
 * Logs SMS notification for tracking
 */
const SMS_LOG_KEY = 'alertcare_sms_log';
const logSMSNotification = (patientId, result) => {
  try {
    const logs = JSON.parse(localStorage.getItem(SMS_LOG_KEY) || '[]');
    logs.push({
      patientId,
      ...result,
    });
    // Keep only last 50 logs
    const recentLogs = logs.slice(-50);
    localStorage.setItem(SMS_LOG_KEY, JSON.stringify(recentLogs));
  } catch (error) {
    console.error('Error logging SMS:', error);
  }
};

/**
 * Gets the last SMS time for a patient
 */
const getLastSMSTime = (patientId) => {
  try {
    const logs = JSON.parse(localStorage.getItem(SMS_LOG_KEY) || '[]');
    const patientLogs = logs.filter(log => log.patientId === patientId);
    if (patientLogs.length === 0) return null;
    return patientLogs[patientLogs.length - 1].sentAt;
  } catch {
    return null;
  }
};

/**
 * Gets SMS history for a patient
 */
export const getSMSHistory = (patientId, limit = 10) => {
  try {
    const logs = JSON.parse(localStorage.getItem(SMS_LOG_KEY) || '[]');
    const patientLogs = logs
      .filter(log => log.patientId === patientId)
      .sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt))
      .slice(0, limit);
    return patientLogs;
  } catch {
    return [];
  }
};
