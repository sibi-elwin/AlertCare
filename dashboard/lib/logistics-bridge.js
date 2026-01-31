// AlertCare - Closed-Loop Dispatcher: Logistics Orchestration Engine
// Simulates automated integration with Hospital ADT systems, IoT sensors, and RFID tracking

/**
 * Mocks the pull from a Hospital's internal HL7 FHIR server.
 * In a real-world scenario, this would be a GET request to:
 * https://hospital-api.com/fhir/Location?type=ICU
 * 
 * ADT (Admission, Discharge, Transfer) systems automatically update bed status
 * when patients are discharged. This function simulates that automated feed.
 */
async function queryADTSystem(hospitalId) {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // In production, this would be:
  // const response = await fetch(`https://${hospitalId}.hospital.com/fhir/Location?type=ICU&status=available`);
  // const data = await response.json();
  // return data.total;
  
  // Mock: Simulate real-time bed availability with some variance
  const baseBeds = {
    'hosp-001': 8,  // Main Hospital
    'hosp-002': 4,  // Rural Clinic A
    'hosp-003': 6,  // Rural Clinic B
    'hosp-004': 3,  // Emergency Center
  };
  
  const base = baseBeds[hospitalId] || 5;
  // Simulate real-time changes (beds becoming available/unavailable)
  const variance = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
  return Math.max(0, base + variance);
}

/**
 * Mocks reading from IoT Pressure Transducers on the central oxygen manifold.
 * Modern hospitals use IoT sensors that automatically report PSI levels.
 * This function simulates that automated sensor feed.
 */
async function readOxygenSensor(hospitalId) {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // In production, this would be:
  // const response = await fetch(`https://iot-gateway.${hospitalId}.hospital.com/sensors/oxygen-manifold`);
  // const data = await response.json();
  // return data.psi;
  
  // Mock: Simulate real-time oxygen pressure (PSI)
  // Normal operating range: 400-600 PSI
  const basePSI = {
    'hosp-001': 520,
    'hosp-002': 480,
    'hosp-003': 510,
    'hosp-004': 450,
  };
  
  const base = basePSI[hospitalId] || 500;
  // Simulate sensor variance (±20 PSI)
  const variance = Math.floor(Math.random() * 40) - 20;
  return Math.max(300, Math.min(600, base + variance));
}

/**
 * Mocks RFID/Bluetooth asset tracking for ambulances.
 * In urban hospitals, ambulances are tracked via RFID tags.
 * This function simulates that automated tracking feed.
 */
async function queryAmbulanceAvailability(hospitalId, sector) {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // In production, this would be:
  // const response = await fetch(`https://asset-tracker.${hospitalId}.hospital.com/rfid/ambulances?status=available&sector=${sector}`);
  // const data = await response.json();
  // return data.vehicles;
  
  // Mock: Simulate ambulance availability by sector
  const ambulanceStatus = {
    'hosp-001': {
      'Sector A': { available: 2, total: 3, nearestETA: 5 },
      'Sector B': { available: 1, total: 2, nearestETA: 8 },
      'Sector C': { available: 2, total: 3, nearestETA: 6 },
      'Sector D': { available: 1, total: 2, nearestETA: 10 },
    },
  };
  
  const hospitalData = ambulanceStatus[hospitalId] || {
    'Sector A': { available: 1, total: 2, nearestETA: 7 },
    'Sector B': { available: 1, total: 2, nearestETA: 9 },
    'Sector C': { available: 1, total: 2, nearestETA: 8 },
    'Sector D': { available: 1, total: 2, nearestETA: 11 },
  };
  
  return hospitalData[sector] || { available: 0, total: 1, nearestETA: 15 };
}

/**
 * Fetches live resource data from automated systems.
 * This is the "Passive Intelligence" core - no manual entry required.
 */
export const fetchLiveResourceData = async (hospitalId) => {
  try {
    // Parallel fetch from all automated systems
    const [icuBedsFree, oxygenPSI, lastSync] = await Promise.all([
      queryADTSystem(hospitalId),
      readOxygenSensor(hospitalId),
      Promise.resolve(new Date().toISOString()),
    ]);
    
    const automatedFeed = {
      hospital_id: hospitalId,
      hospital_name: getHospitalName(hospitalId),
      last_sync: lastSync,
      // This value comes from the ADT system, not a human
      icu_beds_free: icuBedsFree,
      icu_beds_total: getTotalBeds(hospitalId),
      // This value comes from the IoT Pressure Sensor on the O2 tank
      oxygen_psi: oxygenPSI,
      oxygen_status: getOxygenStatus(oxygenPSI),
      // Safety check: Can we safely dispatch to this hospital?
      is_safe_for_dispatch: icuBedsFree > 0 && oxygenPSI > 400,
    // Manual override flag (set by admin in emergency)
    manual_override: manualOverrides[hospitalId] || null,
    };
    
    // If manual override is active, respect it regardless of sensor data
    if (automatedFeed.manual_override?.active) {
      automatedFeed.is_safe_for_dispatch = automatedFeed.manual_override.allow_dispatch;
      automatedFeed.override_reason = automatedFeed.manual_override.reason;
    }
    
    return automatedFeed;
  } catch (error) {
    console.error('Error fetching resource data:', error);
    // Fallback to safe defaults if systems are down
    return {
      hospital_id: hospitalId,
      hospital_name: getHospitalName(hospitalId),
      last_sync: new Date().toISOString(),
      icu_beds_free: 0,
      icu_beds_total: getTotalBeds(hospitalId),
      oxygen_psi: 0,
      oxygen_status: 'unknown',
      is_safe_for_dispatch: false,
      error: 'System unavailable - manual verification required',
    };
  }
};

/**
 * Orchestrates dispatch by checking all hospitals and finding the best match.
 * Returns the optimal hospital for dispatch based on:
 * - Resource availability (beds + oxygen)
 * - Proximity to patient sector
 * - Ambulance availability
 */
export const orchestrateDispatch = async (patientSector, patientCondition) => {
  const hospitals = ['hosp-001', 'hosp-002', 'hosp-003', 'hosp-004'];
  
  // Fetch resource data from all hospitals in parallel
  const hospitalResources = await Promise.all(
    hospitals.map(hospitalId => fetchLiveResourceData(hospitalId))
  );
  
  // Get ambulance availability for each hospital
  const hospitalsWithAmbulances = await Promise.all(
    hospitalResources.map(async (resources) => {
      const ambulance = await queryAmbulanceAvailability(resources.hospital_id, patientSector);
      return {
        ...resources,
        ambulance_available: ambulance.available,
        ambulance_total: ambulance.total,
        ambulance_eta: ambulance.nearestETA,
      };
    })
  );
  
  // Score each hospital (higher = better)
  const scoredHospitals = hospitalsWithAmbulances.map(hospital => {
    let score = 0;
    
    // Resource availability (0-40 points)
    if (hospital.is_safe_for_dispatch) {
      score += 40;
      // Bonus for more beds
      score += Math.min(10, hospital.icu_beds_free * 2);
    }
    
    // Ambulance availability (0-30 points)
    if (hospital.ambulance_available > 0) {
      score += 30;
      // Bonus for multiple ambulances
      score += Math.min(10, hospital.ambulance_available * 5);
    }
    
    // Proximity (0-20 points) - Sector A/B closer to hosp-001, C/D closer to hosp-003
    const proximityScore = getProximityScore(hospital.hospital_id, patientSector);
    score += proximityScore;
    
    // Oxygen level bonus (0-10 points)
    if (hospital.oxygen_psi > 500) score += 10;
    else if (hospital.oxygen_psi > 450) score += 5;
    
    return {
      ...hospital,
      dispatch_score: score,
      recommended: false,
    };
  });
  
  // Sort by score (highest first)
  scoredHospitals.sort((a, b) => b.dispatch_score - a.dispatch_score);
  
  // Mark the best option as recommended
  if (scoredHospitals.length > 0 && scoredHospitals[0].dispatch_score > 0) {
    scoredHospitals[0].recommended = true;
  }
  
  return scoredHospitals;
};

/**
 * Executes the dispatch by selecting the best hospital and creating dispatch record.
 */
export const executeDispatch = async (patient, selectedHospitalId = null) => {
  const hospitals = await orchestrateDispatch(patient.sector, patient.condition);
  
  // Use selected hospital or auto-select the recommended one
  const targetHospital = selectedHospitalId
    ? hospitals.find(h => h.hospital_id === selectedHospitalId)
    : hospitals.find(h => h.recommended);
  
  if (!targetHospital || !targetHospital.is_safe_for_dispatch) {
    return {
      success: false,
      error: 'No suitable hospital available for dispatch',
      hospitals,
    };
  }
  
  // Simulate dispatch creation
  const dispatch = {
    id: `dispatch-${Date.now()}`,
    patient_id: patient.id,
    patient_name: patient.name,
    hospital_id: targetHospital.hospital_id,
    hospital_name: targetHospital.hospital_name,
    sector: patient.sector,
    timestamp: new Date().toISOString(),
    status: 'dispatched',
    eta: targetHospital.ambulance_eta,
    resources: {
      beds_available: targetHospital.icu_beds_free,
      oxygen_psi: targetHospital.oxygen_psi,
    },
  };
  
  return {
    success: true,
    dispatch,
    hospitals,
  };
};

// Helper functions

function getHospitalName(hospitalId) {
  const names = {
    'hosp-001': 'Main Regional Hospital',
    'hosp-002': 'Rural Clinic A',
    'hosp-003': 'Rural Clinic B',
    'hosp-004': 'Emergency Care Center',
  };
  return names[hospitalId] || 'Unknown Hospital';
}

function getTotalBeds(hospitalId) {
  const totals = {
    'hosp-001': 12,
    'hosp-002': 6,
    'hosp-003': 8,
    'hosp-004': 5,
  };
  return totals[hospitalId] || 5;
}

function getOxygenStatus(psi) {
  if (psi >= 500) return 'excellent';
  if (psi >= 450) return 'good';
  if (psi >= 400) return 'adequate';
  if (psi >= 350) return 'low';
  return 'critical';
}

function getProximityScore(hospitalId, sector) {
  // Sector A/B are closer to hosp-001, C/D closer to hosp-003
  const proximity = {
    'hosp-001': { 'Sector A': 20, 'Sector B': 15, 'Sector C': 10, 'Sector D': 5 },
    'hosp-002': { 'Sector A': 15, 'Sector B': 20, 'Sector C': 10, 'Sector D': 8 },
    'hosp-003': { 'Sector A': 10, 'Sector B': 8, 'Sector C': 20, 'Sector D': 15 },
    'hosp-004': { 'Sector A': 12, 'Sector B': 10, 'Sector C': 15, 'Sector D': 18 },
  };
  
  return proximity[hospitalId]?.[sector] || 5;
}

// Manual Override Storage (in production, this would be in a database)
let manualOverrides = {};

/**
 * Sets a manual override for a hospital (the "Red Phone" feature).
 * This allows admins to bypass automated systems in emergencies.
 */
export const setManualOverride = (hospitalId, override) => {
  manualOverrides[hospitalId] = {
    ...override,
    set_at: new Date().toISOString(),
    set_by: override.set_by || 'admin',
  };
};

/**
 * Gets the current manual override for a hospital.
 */
function getManualOverride(hospitalId) {
  return manualOverrides[hospitalId] || null;
}

/**
 * Clears a manual override.
 */
function clearManualOverride(hospitalId) {
  delete manualOverrides[hospitalId];
}

// Export for use in admin panel
export { getManualOverride, setManualOverride, clearManualOverride };

/**
 * Find nearest hospital based on GPS coordinates
 * Uses Haversine formula to calculate distance
 */
export const findNearestHospital = async (latitude, longitude) => {
  // Hospital coordinates (mock - in production would come from database)
  const hospitals = [
    {
      id: 'hosp-001',
      name: 'Main Regional Hospital',
      latitude: 28.6139, // Delhi coordinates (example)
      longitude: 77.2090,
    },
    {
      id: 'hosp-002',
      name: 'Rural Clinic A',
      latitude: 28.7041,
      longitude: 77.1025,
    },
    {
      id: 'hosp-003',
      name: 'Rural Clinic B',
      latitude: 28.5355,
      longitude: 77.3910,
    },
    {
      id: 'hosp-004',
      name: 'Emergency Care Center',
      latitude: 28.6139,
      longitude: 77.2090,
    },
  ];
  
  // Calculate distance to each hospital
  const hospitalsWithDistance = hospitals.map(hospital => {
    const distance = calculateDistance(
      latitude,
      longitude,
      hospital.latitude,
      hospital.longitude
    );
    
    return {
      ...hospital,
      distance, // in kilometers
      eta: Math.ceil(distance * 1.5), // Rough ETA in minutes (assuming 40km/h average)
    };
  });
  
  // Sort by distance and get resource availability
  hospitalsWithDistance.sort((a, b) => a.distance - b.distance);
  
  // Get resource data for nearest hospitals
  const hospitalsWithResources = await Promise.all(
    hospitalsWithDistance.slice(0, 3).map(async (hospital) => {
      const resources = await fetchLiveResourceData(hospital.id);
      return {
        ...hospital,
        ...resources,
      };
    })
  );
  
  // Return nearest hospital with available beds
  const availableHospital = hospitalsWithResources.find(h => h.is_safe_for_dispatch);
  
  return availableHospital || hospitalsWithResources[0];
};

/**
 * Calculate distance between two GPS coordinates using Haversine formula
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
}

function toRad(degrees) {
  return degrees * (Math.PI / 180);
}
