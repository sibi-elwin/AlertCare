// AlertCare - Core Data Engine & Mock Patient Store

// Calculate NEWS2 Score based on vitals
// Each parameter scores 0-3, total is capped at 0-3 for simplified triage
export function calculateNEWS2(vitals) {
  let totalScore = 0;
  
  // Respiration Rate scoring (0-3)
  const rr = vitals.respiratoryRate;
  if (rr <= 8) totalScore += 3;
  else if (rr >= 9 && rr <= 11) totalScore += 1;
  else if (rr >= 12 && rr <= 20) totalScore += 0;
  else if (rr >= 21 && rr <= 24) totalScore += 2;
  else if (rr >= 25) totalScore += 3;
  
  // SpO2 scoring (0-3)
  const spo2 = vitals.spo2;
  if (spo2 <= 91) totalScore += 3;
  else if (spo2 >= 92 && spo2 <= 93) totalScore += 2;
  else if (spo2 >= 94 && spo2 <= 95) totalScore += 1;
  else if (spo2 >= 96) totalScore += 0;
  
  // Heart Rate scoring (0-3)
  const hr = vitals.heartRate;
  if (hr <= 40) totalScore += 3;
  else if (hr >= 41 && hr <= 50) totalScore += 1;
  else if (hr >= 51 && hr <= 90) totalScore += 0;
  else if (hr >= 91 && hr <= 110) totalScore += 1;
  else if (hr >= 111 && hr <= 130) totalScore += 2;
  else if (hr >= 131) totalScore += 3;
  
  // Systolic BP scoring (0-3)
  const sbp = vitals.systolicBP;
  if (sbp <= 90) totalScore += 3;
  else if (sbp >= 91 && sbp <= 100) totalScore += 2;
  else if (sbp >= 101 && sbp <= 110) totalScore += 1;
  else if (sbp >= 111 && sbp <= 219) totalScore += 0;
  else if (sbp >= 220) totalScore += 3;
  
  // Temperature scoring (0-3)
  const temp = vitals.temperature;
  if (temp <= 35.0) totalScore += 3;
  else if (temp >= 35.1 && temp <= 36.0) totalScore += 1;
  else if (temp >= 36.1 && temp <= 38.0) totalScore += 0;
  else if (temp >= 38.1 && temp <= 39.0) totalScore += 1;
  else if (temp >= 39.1) totalScore += 2;
  
  // Normalize to 0-3 scale: 0-4 raw = 0, 5-8 raw = 1, 9-12 raw = 2, 13+ raw = 3
  if (totalScore <= 4) return 0;
  if (totalScore <= 8) return 1;
  if (totalScore <= 12) return 2;
  return 3;
}

// Calculate Stability Index
// Formula: (0.4 * Isolation Forest Score) + (0.6 * LSTM Score)
// Then apply NEWS2 penalty (NEWS2 is 0-3 scale)
export function calculateStabilityIndex(isolationForestScore, lstmScore, news2Score) {
  let index = (0.4 * isolationForestScore) + (0.6 * lstmScore);
  
  // Apply clinical penalty based on 0-3 NEWS2 scale
  if (news2Score === 3) {
    return 0; // CRITICAL
  } else if (news2Score === 2) {
    index -= 40;
  } else if (news2Score === 1) {
    index -= 15;
  }
  
  return Math.max(0, Math.min(100, Math.round(index)));
}

// Determine Smart-Burst Protocol status
export function getSmartBurstStatus(stabilityIndex) {
  if (stabilityIndex >= 70) {
    return {
      mode: 'power-save',
      label: 'Power Save Mode',
      interval: '30m sync',
      color: 'emerald'
    };
  } else {
    return {
      mode: 'emergency',
      label: 'EMERGENCY STREAM',
      interval: '1s real-time',
      color: 'rose'
    };
  }
}

// Get status category from stability index (NEWS2 is 0-3 scale)
export function getStatusCategory(stabilityIndex, news2Score) {
  if (news2Score === 3 || stabilityIndex === 0) {
    return { label: 'Critical', color: 'rose', priority: 1 };
  } else if (stabilityIndex < 70 || news2Score === 2) {
    return { label: 'Warning', color: 'amber', priority: 2 };
  } else {
    return { label: 'Stable', color: 'emerald', priority: 3 };
  }
}

// Generate vitals history for charts
function generateVitalsHistory(baseHR, baseSpo2, isDeterioring = false) {
  const history = [];
  const now = Date.now();
  
  for (let i = 23; i >= 0; i--) {
    const timestamp = new Date(now - i * 3600000);
    const variance = isDeterioring ? i * 0.5 : 0;
    const deteriorationFactor = isDeterioring ? Math.sin(i / 4) * 5 : 0;
    
    history.push({
      time: timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      heartRate: Math.round(baseHR + (Math.random() - 0.5) * 10 - variance + deteriorationFactor),
      spo2: Math.round(Math.min(100, baseSpo2 + (Math.random() - 0.5) * 3 + variance * 0.3)),
      lstmError: isDeterioring 
        ? Math.abs(Math.sin(i / 3) * 30 + Math.random() * 15) 
        : Math.random() * 8,
    });
  }
  
  return history;
}

// Generate entry log
function generateEntryLog(patientId) {
  const logs = [];
  const now = Date.now();
  
  for (let i = 0; i < 5; i++) {
    const timestamp = new Date(now - i * 1800000 - Math.random() * 600000);
    logs.push({
      id: `${patientId}-log-${i}`,
      timestamp: timestamp.toISOString(),
      synced: i > 0 || Math.random() > 0.3,
      vitals: {
        heartRate: Math.round(70 + Math.random() * 30),
        spo2: Math.round(94 + Math.random() * 6),
        systolicBP: Math.round(110 + Math.random() * 30),
        temperature: (36.5 + Math.random() * 1.5).toFixed(1),
        respiratoryRate: Math.round(14 + Math.random() * 8),
        glucose: Math.round(90 + Math.random() * 40)
      }
    });
  }
  
  return logs;
}

// Mock Patients Data
export const mockPatients = [
  // 2 Critical Patients (NEWS2 = 3, Index 0)
  {
    id: 'p001',
    name: 'Margaret Wilson',
    age: 78,
    sector: 'Sector A',
    condition: 'Acute Respiratory Distress',
    vitals: {
      heartRate: 125,
      spo2: 88,
      systolicBP: 85,
      temperature: 39.2,
      respiratoryRate: 28,
      glucose: 145
    },
    news2Score: 3,
    isolationForestScore: 15,
    lstmScore: 10,
    stabilityIndex: 0,
    trend: 'down',
    caretaker: 'Priya Sharma',
    caretakerPhone: '+91 98765 43210',
    lastUpdate: new Date(Date.now() - 120000).toISOString(),
    vitalsHistory: generateVitalsHistory(120, 89, true),
    entryLog: generateEntryLog('p001')
  },
  {
    id: 'p002',
    name: 'Robert Chen',
    age: 82,
    sector: 'Sector B',
    condition: 'Septic Shock',
    vitals: {
      heartRate: 135,
      spo2: 86,
      systolicBP: 78,
      temperature: 39.8,
      respiratoryRate: 32,
      glucose: 210
    },
    news2Score: 3,
    isolationForestScore: 8,
    lstmScore: 5,
    stabilityIndex: 0,
    trend: 'down',
    caretaker: 'Amit Patel',
    caretakerPhone: '+91 98765 43211',
    lastUpdate: new Date(Date.now() - 60000).toISOString(),
    vitalsHistory: generateVitalsHistory(130, 87, true),
    entryLog: generateEntryLog('p002')
  },
  
  // 3 Warning Patients (NEWS2 = 2, Index 40-60)
  {
    id: 'p003',
    name: 'Linda Martinez',
    age: 65,
    sector: 'Sector B',
    condition: 'Pneumonia - Recovering',
    vitals: {
      heartRate: 98,
      spo2: 93,
      systolicBP: 105,
      temperature: 38.2,
      respiratoryRate: 22,
      glucose: 130
    },
    news2Score: 2,
    isolationForestScore: 55,
    lstmScore: 50,
    stabilityIndex: 12,
    trend: 'stable',
    caretaker: 'Sunita Devi',
    caretakerPhone: '+91 98765 43212',
    lastUpdate: new Date(Date.now() - 300000).toISOString(),
    vitalsHistory: generateVitalsHistory(95, 93, false),
    entryLog: generateEntryLog('p003')
  },
  {
    id: 'p004',
    name: 'James Thompson',
    age: 71,
    sector: 'Sector C',
    condition: 'CHF Exacerbation',
    vitals: {
      heartRate: 105,
      spo2: 92,
      systolicBP: 95,
      temperature: 37.5,
      respiratoryRate: 24,
      glucose: 125
    },
    news2Score: 2,
    isolationForestScore: 48,
    lstmScore: 45,
    stabilityIndex: 6,
    trend: 'down',
    caretaker: 'Ravi Kumar',
    caretakerPhone: '+91 98765 43213',
    lastUpdate: new Date(Date.now() - 180000).toISOString(),
    vitalsHistory: generateVitalsHistory(102, 92, true),
    entryLog: generateEntryLog('p004')
  },
  {
    id: 'p005',
    name: 'Patricia Brown',
    age: 68,
    sector: 'Sector A',
    condition: 'Post-operative Monitoring',
    vitals: {
      heartRate: 88,
      spo2: 94,
      systolicBP: 118,
      temperature: 37.8,
      respiratoryRate: 20,
      glucose: 140
    },
    news2Score: 1,
    isolationForestScore: 62,
    lstmScore: 58,
    stabilityIndex: 45,
    trend: 'up',
    caretaker: 'Meena Kumari',
    caretakerPhone: '+91 98765 43214',
    lastUpdate: new Date(Date.now() - 420000).toISOString(),
    vitalsHistory: generateVitalsHistory(88, 94, false),
    entryLog: generateEntryLog('p005')
  },
  
  // 5 Stable Patients (NEWS2 = 0-1, Index 80+)
  {
    id: 'p006',
    name: 'David Kim',
    age: 58,
    sector: 'Sector D',
    condition: 'Diabetes Management',
    vitals: {
      heartRate: 72,
      spo2: 98,
      systolicBP: 125,
      temperature: 36.8,
      respiratoryRate: 16,
      glucose: 115
    },
    news2Score: 0,
    isolationForestScore: 92,
    lstmScore: 95,
    stabilityIndex: 94,
    trend: 'stable',
    caretaker: 'Lakshmi Reddy',
    caretakerPhone: '+91 98765 43215',
    lastUpdate: new Date(Date.now() - 600000).toISOString(),
    vitalsHistory: generateVitalsHistory(72, 98, false),
    entryLog: generateEntryLog('p006')
  },
  {
    id: 'p007',
    name: 'Susan White',
    age: 62,
    sector: 'Sector A',
    condition: 'Hypertension - Controlled',
    vitals: {
      heartRate: 68,
      spo2: 99,
      systolicBP: 135,
      temperature: 36.6,
      respiratoryRate: 14,
      glucose: 95
    },
    news2Score: 0,
    isolationForestScore: 88,
    lstmScore: 90,
    stabilityIndex: 89,
    trend: 'up',
    caretaker: 'Anita Singh',
    caretakerPhone: '+91 98765 43216',
    lastUpdate: new Date(Date.now() - 900000).toISOString(),
    vitalsHistory: generateVitalsHistory(68, 99, false),
    entryLog: generateEntryLog('p007')
  },
  {
    id: 'p008',
    name: 'Michael Johnson',
    age: 55,
    sector: 'Sector C',
    condition: 'Asthma - Stable',
    vitals: {
      heartRate: 75,
      spo2: 97,
      systolicBP: 120,
      temperature: 36.5,
      respiratoryRate: 15,
      glucose: 100
    },
    news2Score: 0,
    isolationForestScore: 95,
    lstmScore: 92,
    stabilityIndex: 93,
    trend: 'stable',
    caretaker: 'Deepa Nair',
    caretakerPhone: '+91 98765 43217',
    lastUpdate: new Date(Date.now() - 1200000).toISOString(),
    vitalsHistory: generateVitalsHistory(75, 97, false),
    entryLog: generateEntryLog('p008')
  },
  {
    id: 'p009',
    name: 'Jennifer Lee',
    age: 60,
    sector: 'Sector B',
    condition: 'Routine Checkup',
    vitals: {
      heartRate: 70,
      spo2: 98,
      systolicBP: 118,
      temperature: 36.7,
      respiratoryRate: 16,
      glucose: 92
    },
    news2Score: 0,
    isolationForestScore: 90,
    lstmScore: 88,
    stabilityIndex: 89,
    trend: 'stable',
    caretaker: 'Kavita Rao',
    caretakerPhone: '+91 98765 43218',
    lastUpdate: new Date(Date.now() - 1500000).toISOString(),
    vitalsHistory: generateVitalsHistory(70, 98, false),
    entryLog: generateEntryLog('p009')
  },
  {
    id: 'p010',
    name: 'William Davis',
    age: 67,
    sector: 'Sector D',
    condition: 'COPD - Managed',
    vitals: {
      heartRate: 78,
      spo2: 96,
      systolicBP: 130,
      temperature: 36.9,
      respiratoryRate: 18,
      glucose: 108
    },
    news2Score: 1,
    isolationForestScore: 85,
    lstmScore: 82,
    stabilityIndex: 75,
    trend: 'stable',
    caretaker: 'Sanjay Gupta',
    caretakerPhone: '+91 98765 43219',
    lastUpdate: new Date(Date.now() - 1800000).toISOString(),
    vitalsHistory: generateVitalsHistory(78, 96, false),
    entryLog: generateEntryLog('p010')
  }
];

// Ambulance shortage prediction based on sectors with 3+ declining patients
export function predictAmbulanceShortages(patients) {
  const sectorCounts = {};
  
  patients.forEach(patient => {
    if (patient.trend === 'down' || patient.stabilityIndex < 60) {
      sectorCounts[patient.sector] = (sectorCounts[patient.sector] || 0) + 1;
    }
  });
  
  const shortages = [];
  Object.entries(sectorCounts).forEach(([sector, count]) => {
    if (count >= 2) {
      shortages.push({
        sector,
        patientsAtRisk: count,
        severity: count >= 3 ? 'high' : 'medium'
      });
    }
  });
  
  return shortages.sort((a, b) => b.patientsAtRisk - a.patientsAtRisk);
}

// Sort patients by stability index (lowest first for triage)
// NEWS2 is on 0-3 scale
export function sortPatientsByPriority(patients) {
  return [...patients].sort((a, b) => {
    // Critical patients first (NEWS2 = 3)
    if (a.news2Score === 3 && b.news2Score < 3) return -1;
    if (b.news2Score === 3 && a.news2Score < 3) return 1;
    // Then by stability index
    return a.stabilityIndex - b.stabilityIndex;
  });
}
