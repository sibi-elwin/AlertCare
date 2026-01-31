// Health Connect Integration Service (Mock Implementation)
// Simulates Android Health Connect API for wearable device data
// In production, this would connect to real Health Connect API via Android WebView bridge

const STORAGE_KEY = 'alertcare_health_connect';
const MOCK_UPDATE_INTERVAL = 30000; // 30 seconds

/**
 * Check if Health Connect is available
 * In production: checks for window.HealthConnect (Android WebView bridge)
 * For demo: always returns true (mock mode)
 */
export function isHealthConnectAvailable() {
  // In production: return typeof window !== 'undefined' && window.HealthConnect !== undefined;
  return true; // Always available in mock mode
}

/**
 * Request Health Connect permissions
 * In production: calls Health Connect API to request permissions
 * For demo: simulates permission grant
 */
export async function requestHealthConnectPermissions() {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // In production: return await window.HealthConnect.requestPermissions(['heart_rate', 'blood_pressure', 'blood_glucose', 'activity']);
  
  // Store permission status
  const status = {
    granted: true,
    timestamp: new Date().toISOString(),
  };
  localStorage.setItem(`${STORAGE_KEY}_permissions`, JSON.stringify(status));
  
  return status;
}

/**
 * Get Health Connect connection status
 */
export function getHealthConnectStatus() {
  const stored = localStorage.getItem(`${STORAGE_KEY}_permissions`);
  if (!stored) {
    return { connected: false, granted: false };
  }
  
  const status = JSON.parse(stored);
  return {
    connected: status.granted,
    granted: status.granted,
    lastConnected: status.timestamp,
  };
}

/**
 * Generate realistic mock vital data based on patient ID
 * In production: fetches real data from Health Connect API
 */
function generateMockVitals(patientId) {
  // Use patient ID as seed for consistent data
  const seed = patientId ? patientId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) : Date.now();
  const random = (min, max) => {
    const x = Math.sin(seed + Date.now() / 1000) * 10000;
    return Math.floor((x - Math.floor(x)) * (max - min + 1)) + min;
  };
  
  // Generate realistic vital ranges
  const baseHeartRate = 65 + random(0, 30); // 65-95 bpm
  const baseBP = 110 + random(0, 30); // 110-140 mmHg
  const baseGlucose = 85 + random(0, 25); // 85-110 mg/dL
  const baseActivity = 50 + random(0, 100); // 50-150 steps/hr
  
  return {
    heartRate: baseHeartRate,
    bloodPressure: baseBP,
    bloodGlucose: baseGlucose,
    activity: baseActivity,
    timestamp: new Date().toISOString(),
    source: 'wearable',
    deviceName: 'Smart Watch',
  };
}

/**
 * Fetch vital readings from Health Connect
 * In production: calls Health Connect API
 * For demo: returns mock data
 */
export async function fetchHealthConnectVitals(patientId) {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // In production:
  // const readings = await window.HealthConnect.readRecords({
  //   recordTypes: ['HeartRate', 'BloodPressure', 'BloodGlucose', 'Steps'],
  //   timeRangeFilter: {
  //     startTime: new Date(Date.now() - 3600000), // Last hour
  //     endTime: new Date(),
  //   },
  // });
  // return formatHealthConnectReadings(readings);
  
  // Mock implementation
  const vitals = generateMockVitals(patientId);
  
  // Store latest reading
  const stored = JSON.parse(localStorage.getItem(`${STORAGE_KEY}_readings`) || '{}');
  stored[patientId] = vitals;
  localStorage.setItem(`${STORAGE_KEY}_readings`, JSON.stringify(stored));
  
  return vitals;
}

/**
 * Subscribe to Health Connect data updates
 * In production: sets up real-time listener
 * For demo: simulates periodic updates
 */
export function subscribeToHealthConnectUpdates(patientId, callback) {
  // In production:
  // return window.HealthConnect.subscribe((data) => {
  //   callback(formatHealthConnectReadings(data));
  // });
  
  // Mock implementation: simulate updates every 30 seconds
  const interval = setInterval(async () => {
    const vitals = await fetchHealthConnectVitals(patientId);
    callback(vitals);
  }, MOCK_UPDATE_INTERVAL);
  
  // Also fetch immediately
  fetchHealthConnectVitals(patientId).then(callback);
  
  // Return unsubscribe function
  return () => clearInterval(interval);
}

/**
 * Get cached Health Connect readings for a patient
 */
export function getCachedHealthConnectVitals(patientId) {
  const stored = JSON.parse(localStorage.getItem(`${STORAGE_KEY}_readings`) || '{}');
  return stored[patientId] || null;
}

/**
 * Format Health Connect readings to match our vital format
 * Maps Health Connect data structure to our internal format
 */
function formatHealthConnectReadings(readings) {
  // In production, this would map Health Connect's data structure
  // For now, mock data is already in the correct format
  return {
    heartRate: readings.heartRate,
    systolicBP: readings.bloodPressure,
    glucose: readings.bloodGlucose,
    activity: readings.activity,
    timestamp: readings.timestamp,
    source: 'wearable',
  };
}

