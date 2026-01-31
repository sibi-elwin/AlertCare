// AlertCare - Patient-Centric Data Model
// Stores patient registrations, doctor selections, caregiver assignments, and permissions

// In-memory storage (in production, this would be a database)
// Using localStorage for persistence across page refreshes
const STORAGE_KEYS = {
  PATIENTS: 'alertcare_patient_registrations',
  DOCTOR_ASSIGNMENTS: 'alertcare_doctor_assignments',
  CAREGIVER_ASSIGNMENTS: 'alertcare_caregiver_assignments',
  PERMISSIONS: 'alertcare_patient_permissions',
  LOCATIONS: 'alertcare_patient_locations',
  NOTIFICATIONS: 'alertcare_patient_notifications',
  REPORTS: 'alertcare_patient_reports',
};

// Load from localStorage on initialization
const loadFromStorage = (key, defaultValue = {}) => {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch {
    return defaultValue;
  }
};

// Save to localStorage
const saveToStorage = (key, data) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
};

let patientRegistrations = loadFromStorage(STORAGE_KEYS.PATIENTS);
let doctorAssignments = loadFromStorage(STORAGE_KEYS.DOCTOR_ASSIGNMENTS);
let caregiverAssignments = loadFromStorage(STORAGE_KEYS.CAREGIVER_ASSIGNMENTS);
let patientPermissions = loadFromStorage(STORAGE_KEYS.PERMISSIONS);
let patientLocations = loadFromStorage(STORAGE_KEYS.LOCATIONS);
let patientNotifications = loadFromStorage(STORAGE_KEYS.NOTIFICATIONS);
let patientReports = loadFromStorage(STORAGE_KEYS.REPORTS);

// Mock Doctors - 10 Most Common Elder Health Issues with 5+ doctors each
// 1. Hypertension (High Blood Pressure)
// 2. Diabetes
// 3. Arthritis
// 4. Heart Disease
// 5. Dementia/Alzheimer's
// 6. Osteoporosis
// 7. Chronic Obstructive Pulmonary Disease (COPD)
// 8. Depression
// 9. Falls/Fractures
// 10. Vision/Hearing Loss

export const mockDoctors = [
  // Hypertension Specialists (5 doctors)
  {
    id: 'doc-001',
    name: 'Dr. Sarah Johnson',
    specialty: 'Hypertension & General Medicine',
    experience: '15 years',
    patientsCount: 120,
    available: true,
    commonIssues: ['Hypertension', 'General Medicine'],
  },
  {
    id: 'doc-002',
    name: 'Dr. Rajesh Kumar',
    specialty: 'Cardiology & Hypertension',
    experience: '12 years',
    patientsCount: 95,
    available: true,
    commonIssues: ['Hypertension', 'Heart Disease'],
  },
  {
    id: 'doc-005',
    name: 'Dr. Ananya Mehta',
    specialty: 'Hypertension Management',
    experience: '18 years',
    patientsCount: 150,
    available: true,
    commonIssues: ['Hypertension'],
  },
  {
    id: 'doc-006',
    name: 'Dr. Vikram Singh',
    specialty: 'Internal Medicine & Hypertension',
    experience: '14 years',
    patientsCount: 110,
    available: true,
    commonIssues: ['Hypertension', 'General Medicine'],
  },
  {
    id: 'doc-007',
    name: 'Dr. Meera Patel',
    specialty: 'Geriatric Medicine & Hypertension',
    experience: '20 years',
    patientsCount: 180,
    available: true,
    commonIssues: ['Hypertension', 'General Medicine'],
  },
  
  // Diabetes Specialists (5 doctors)
  {
    id: 'doc-008',
    name: 'Dr. James Wilson',
    specialty: 'Endocrinology & Diabetes',
    experience: '16 years',
    patientsCount: 200,
    available: true,
    commonIssues: ['Diabetes'],
  },
  {
    id: 'doc-009',
    name: 'Dr. Kavita Reddy',
    specialty: 'Diabetes Management',
    experience: '13 years',
    patientsCount: 165,
    available: true,
    commonIssues: ['Diabetes'],
  },
  {
    id: 'doc-010',
    name: 'Dr. Robert Martinez',
    specialty: 'Endocrinology',
    experience: '11 years',
    patientsCount: 140,
    available: true,
    commonIssues: ['Diabetes'],
  },
  {
    id: 'doc-011',
    name: 'Dr. Sunita Nair',
    specialty: 'Diabetes & Metabolic Disorders',
    experience: '17 years',
    patientsCount: 175,
    available: true,
    commonIssues: ['Diabetes'],
  },
  {
    id: 'doc-012',
    name: 'Dr. David Lee',
    specialty: 'Endocrinology & Geriatrics',
    experience: '19 years',
    patientsCount: 190,
    available: true,
    commonIssues: ['Diabetes', 'General Medicine'],
  },
  
  // Arthritis Specialists (5 doctors)
  {
    id: 'doc-013',
    name: 'Dr. Priya Sharma',
    specialty: 'Rheumatology & Arthritis',
    experience: '10 years',
    patientsCount: 80,
    available: true,
    commonIssues: ['Arthritis'],
  },
  {
    id: 'doc-014',
    name: 'Dr. Michael Chen',
    specialty: 'Orthopedics & Arthritis',
    experience: '8 years',
    patientsCount: 150,
    available: true,
    commonIssues: ['Arthritis', 'Falls/Fractures'],
  },
  {
    id: 'doc-015',
    name: 'Dr. Anjali Desai',
    specialty: 'Rheumatology',
    experience: '15 years',
    patientsCount: 130,
    available: true,
    commonIssues: ['Arthritis'],
  },
  {
    id: 'doc-016',
    name: 'Dr. Thomas Anderson',
    specialty: 'Orthopedic Medicine',
    experience: '12 years',
    patientsCount: 105,
    available: true,
    commonIssues: ['Arthritis', 'Falls/Fractures'],
  },
  {
    id: 'doc-017',
    name: 'Dr. Radha Iyer',
    specialty: 'Geriatric Rheumatology',
    experience: '22 years',
    patientsCount: 160,
    available: true,
    commonIssues: ['Arthritis', 'General Medicine'],
  },
  
  // Heart Disease Specialists (5 doctors)
  {
    id: 'doc-018',
    name: 'Dr. Sanjay Gupta',
    specialty: 'Cardiology',
    experience: '18 years',
    patientsCount: 220,
    available: true,
    commonIssues: ['Heart Disease', 'Hypertension'],
  },
  {
    id: 'doc-019',
    name: 'Dr. Jennifer Brown',
    specialty: 'Cardiac Care',
    experience: '14 years',
    patientsCount: 145,
    available: true,
    commonIssues: ['Heart Disease'],
  },
  {
    id: 'doc-020',
    name: 'Dr. Arjun Menon',
    specialty: 'Interventional Cardiology',
    experience: '16 years',
    patientsCount: 180,
    available: true,
    commonIssues: ['Heart Disease'],
  },
  {
    id: 'doc-021',
    name: 'Dr. Lisa Wang',
    specialty: 'Cardiology & Geriatrics',
    experience: '20 years',
    patientsCount: 195,
    available: true,
    commonIssues: ['Heart Disease', 'General Medicine'],
  },
  {
    id: 'doc-022',
    name: 'Dr. Ramesh Nair',
    specialty: 'Cardiac Rehabilitation',
    experience: '11 years',
    patientsCount: 125,
    available: true,
    commonIssues: ['Heart Disease'],
  },
  
  // Dementia/Alzheimer's Specialists (5 doctors)
  {
    id: 'doc-023',
    name: 'Dr. Emily Davis',
    specialty: 'Neurology & Dementia Care',
    experience: '17 years',
    patientsCount: 90,
    available: true,
    commonIssues: ['Dementia/Alzheimer\'s'],
  },
  {
    id: 'doc-024',
    name: 'Dr. Mohan Krishnan',
    specialty: 'Geriatric Neurology',
    experience: '19 years',
    patientsCount: 110,
    available: true,
    commonIssues: ['Dementia/Alzheimer\'s', 'General Medicine'],
  },
  {
    id: 'doc-025',
    name: 'Dr. Patricia White',
    specialty: 'Memory Disorders',
    experience: '13 years',
    patientsCount: 75,
    available: true,
    commonIssues: ['Dementia/Alzheimer\'s'],
  },
  {
    id: 'doc-026',
    name: 'Dr. Suresh Pillai',
    specialty: 'Neurology',
    experience: '15 years',
    patientsCount: 100,
    available: true,
    commonIssues: ['Dementia/Alzheimer\'s'],
  },
  {
    id: 'doc-027',
    name: 'Dr. Maria Garcia',
    specialty: 'Cognitive Medicine',
    experience: '21 years',
    patientsCount: 115,
    available: true,
    commonIssues: ['Dementia/Alzheimer\'s', 'Depression'],
  },
  
  // Osteoporosis Specialists (5 doctors)
  {
    id: 'doc-028',
    name: 'Dr. Deepak Joshi',
    specialty: 'Endocrinology & Osteoporosis',
    experience: '14 years',
    patientsCount: 95,
    available: true,
    commonIssues: ['Osteoporosis'],
  },
  {
    id: 'doc-029',
    name: 'Dr. Susan Taylor',
    specialty: 'Bone Health & Osteoporosis',
    experience: '16 years',
    patientsCount: 120,
    available: true,
    commonIssues: ['Osteoporosis', 'Falls/Fractures'],
  },
  {
    id: 'doc-030',
    name: 'Dr. Naveen Rao',
    specialty: 'Geriatric Orthopedics',
    experience: '12 years',
    patientsCount: 85,
    available: true,
    commonIssues: ['Osteoporosis', 'Falls/Fractures'],
  },
  {
    id: 'doc-031',
    name: 'Dr. Catherine Moore',
    specialty: 'Metabolic Bone Disease',
    experience: '18 years',
    patientsCount: 105,
    available: true,
    commonIssues: ['Osteoporosis'],
  },
  {
    id: 'doc-032',
    name: 'Dr. Ashok Malhotra',
    specialty: 'Endocrinology & Bone Health',
    experience: '15 years',
    patientsCount: 100,
    available: true,
    commonIssues: ['Osteoporosis'],
  },
  
  // COPD Specialists (5 doctors)
  {
    id: 'doc-033',
    name: 'Dr. Lakshmi Venkatesh',
    specialty: 'Pulmonology & COPD',
    experience: '13 years',
    patientsCount: 140,
    available: true,
    commonIssues: ['COPD'],
  },
  {
    id: 'doc-034',
    name: 'Dr. Richard Thompson',
    specialty: 'Respiratory Medicine',
    experience: '17 years',
    patientsCount: 160,
    available: true,
    commonIssues: ['COPD'],
  },
  {
    id: 'doc-035',
    name: 'Dr. Geeta Sharma',
    specialty: 'Pulmonology',
    experience: '11 years',
    patientsCount: 125,
    available: true,
    commonIssues: ['COPD'],
  },
  {
    id: 'doc-036',
    name: 'Dr. William Johnson',
    specialty: 'Lung Disease & COPD',
    experience: '19 years',
    patientsCount: 175,
    available: true,
    commonIssues: ['COPD'],
  },
  {
    id: 'doc-037',
    name: 'Dr. Shanti Devi',
    specialty: 'Geriatric Pulmonology',
    experience: '14 years',
    patientsCount: 135,
    available: true,
    commonIssues: ['COPD', 'General Medicine'],
  },
  
  // Depression Specialists (5 doctors)
  {
    id: 'doc-038',
    name: 'Dr. Ravi Menon',
    specialty: 'Geriatric Psychiatry',
    experience: '16 years',
    patientsCount: 70,
    available: true,
    commonIssues: ['Depression'],
  },
  {
    id: 'doc-039',
    name: 'Dr. Nancy Clark',
    specialty: 'Mental Health & Depression',
    experience: '12 years',
    patientsCount: 85,
    available: true,
    commonIssues: ['Depression'],
  },
  {
    id: 'doc-040',
    name: 'Dr. Karthik Iyer',
    specialty: 'Psychiatry & Geriatrics',
    experience: '18 years',
    patientsCount: 95,
    available: true,
    commonIssues: ['Depression', 'Dementia/Alzheimer\'s'],
  },
  {
    id: 'doc-041',
    name: 'Dr. Helen Mitchell',
    specialty: 'Mental Health',
    experience: '14 years',
    patientsCount: 80,
    available: true,
    commonIssues: ['Depression'],
  },
  {
    id: 'doc-042',
    name: 'Dr. Manoj Kumar',
    specialty: 'Geriatric Psychology',
    experience: '20 years',
    patientsCount: 100,
    available: true,
    commonIssues: ['Depression', 'General Medicine'],
  },
  
  // Falls/Fractures Specialists (5 doctors)
  {
    id: 'doc-043',
    name: 'Dr. Pradeep Nair',
    specialty: 'Orthopedics & Fracture Care',
    experience: '15 years',
    patientsCount: 180,
    available: true,
    commonIssues: ['Falls/Fractures', 'Arthritis'],
  },
  {
    id: 'doc-044',
    name: 'Dr. Linda Martinez',
    specialty: 'Geriatric Orthopedics',
    experience: '13 years',
    patientsCount: 155,
    available: true,
    commonIssues: ['Falls/Fractures', 'Osteoporosis'],
  },
  {
    id: 'doc-045',
    name: 'Dr. Rajesh Patel',
    specialty: 'Trauma & Orthopedics',
    experience: '11 years',
    patientsCount: 145,
    available: true,
    commonIssues: ['Falls/Fractures'],
  },
  {
    id: 'doc-046',
    name: 'Dr. Sarah Williams',
    specialty: 'Orthopedic Surgery',
    experience: '17 years',
    patientsCount: 165,
    available: true,
    commonIssues: ['Falls/Fractures'],
  },
  {
    id: 'doc-047',
    name: 'Dr. Venkatesh Reddy',
    specialty: 'Fracture Management',
    experience: '14 years',
    patientsCount: 150,
    available: true,
    commonIssues: ['Falls/Fractures', 'Osteoporosis'],
  },
  
  // Vision/Hearing Loss Specialists (5 doctors)
  {
    id: 'doc-048',
    name: 'Dr. Anita Desai',
    specialty: 'Ophthalmology & Geriatrics',
    experience: '16 years',
    patientsCount: 200,
    available: true,
    commonIssues: ['Vision/Hearing Loss'],
  },
  {
    id: 'doc-049',
    name: 'Dr. Mark Stevens',
    specialty: 'Otolaryngology',
    experience: '12 years',
    patientsCount: 175,
    available: true,
    commonIssues: ['Vision/Hearing Loss'],
  },
  {
    id: 'doc-050',
    name: 'Dr. Preeti Menon',
    specialty: 'Eye Care & Vision',
    experience: '14 years',
    patientsCount: 190,
    available: true,
    commonIssues: ['Vision/Hearing Loss'],
  },
  {
    id: 'doc-051',
    name: 'Dr. John Anderson',
    specialty: 'Audiology & Hearing',
    experience: '18 years',
    patientsCount: 185,
    available: true,
    commonIssues: ['Vision/Hearing Loss'],
  },
  {
    id: 'doc-052',
    name: 'Dr. Meera Iyer',
    specialty: 'Geriatric Ophthalmology',
    experience: '20 years',
    patientsCount: 210,
    available: true,
    commonIssues: ['Vision/Hearing Loss', 'General Medicine'],
  },
];

// Mock Caregivers
export const mockCaregivers = [
  {
    id: 'cg-001',
    name: 'Priya Sharma',
    phone: '+91 98765 43210',
    experience: '5 years',
    patientsCount: 8,
    available: true,
  },
  {
    id: 'cg-002',
    name: 'Amit Patel',
    phone: '+91 98765 43211',
    experience: '3 years',
    patientsCount: 5,
    available: true,
  },
  {
    id: 'cg-003',
    name: 'Sunita Devi',
    phone: '+91 98765 43212',
    experience: '7 years',
    patientsCount: 12,
    available: true,
  },
  {
    id: 'cg-004',
    name: 'Ravi Kumar',
    phone: '+91 98765 43213',
    experience: '4 years',
    patientsCount: 6,
    available: true,
  },
];

/**
 * Register a patient and select a doctor
 */
export const registerPatient = (patientData) => {
  const patientId = patientData.id || `patient-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  patientRegistrations[patientId] = {
    ...patientData,
    id: patientId,
    registeredAt: new Date().toISOString(),
    status: 'registered', // registered, waiting_doctor_approval, active, rejected
  };
  
  saveToStorage(STORAGE_KEYS.PATIENTS, patientRegistrations);
  
  return patientRegistrations[patientId];
};

/**
 * Patient selects a doctor
 */
export const selectDoctor = (patientId, doctorId) => {
  // Reload from storage first to ensure we have latest data
  reloadFromStorage();
  
  if (!patientRegistrations[patientId]) {
    throw new Error('Patient not registered');
  }
  
  // Create new assignment
  const newAssignment = {
    patientId,
    doctorId,
    selectedAt: new Date().toISOString(),
    status: 'pending', // pending, approved, rejected
  };
  
  doctorAssignments[patientId] = newAssignment;
  patientRegistrations[patientId].status = 'waiting_doctor_approval';
  
  // Save to localStorage immediately
  saveToStorage(STORAGE_KEYS.DOCTOR_ASSIGNMENTS, doctorAssignments);
  saveToStorage(STORAGE_KEYS.PATIENTS, patientRegistrations);
  
  // Verify the save worked
  const verify = loadFromStorage(STORAGE_KEYS.DOCTOR_ASSIGNMENTS);
  if (!verify[patientId] || verify[patientId].doctorId !== doctorId) {
    console.error('Failed to save doctor assignment to localStorage');
  }
  
  // Add notification to patient
  addPatientNotification(patientId, {
    title: 'Consultation Request Sent',
    message: `Your consultation request has been sent to your selected doctor. You'll be notified when they respond.`,
    type: 'info',
  });
  
  return doctorAssignments[patientId];
};

/**
 * Reload data from localStorage (call this before reading to get latest data)
 */
export const reloadFromStorage = () => {
  patientRegistrations = loadFromStorage(STORAGE_KEYS.PATIENTS);
  doctorAssignments = loadFromStorage(STORAGE_KEYS.DOCTOR_ASSIGNMENTS);
  caregiverAssignments = loadFromStorage(STORAGE_KEYS.CAREGIVER_ASSIGNMENTS);
  patientPermissions = loadFromStorage(STORAGE_KEYS.PERMISSIONS);
  patientLocations = loadFromStorage(STORAGE_KEYS.LOCATIONS);
  patientNotifications = loadFromStorage(STORAGE_KEYS.NOTIFICATIONS);
  patientReports = loadFromStorage(STORAGE_KEYS.REPORTS);
};

/**
 * Get pending consultation requests for a doctor
 */
export const getPendingConsultations = (doctorId) => {
  // Reload from localStorage to get latest data
  reloadFromStorage();
  
  const pending = [];
  
  // Debug logging
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    console.log('[getPendingConsultations] Doctor ID:', doctorId);
    console.log('[getPendingConsultations] Total assignments:', Object.keys(doctorAssignments).length);
  }
  
  Object.entries(doctorAssignments).forEach(([patientId, assignment]) => {
    // Check if this assignment matches the doctor and is pending
    if (assignment && assignment.doctorId === doctorId && assignment.status === 'pending') {
      const patient = patientRegistrations[patientId];
      if (patient) {
        pending.push({
          ...assignment,
          patient,
        });
      } else {
        console.warn('[getPendingConsultations] Patient not found:', patientId);
      }
    }
  });
  
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    console.log('[getPendingConsultations] Found pending:', pending.length);
  }
  
  return pending;
};

/**
 * Doctor approves/rejects a patient consultation request
 */
export const respondToConsultation = (patientId, doctorId, approved) => {
  const assignment = doctorAssignments[patientId];
  if (!assignment || assignment.doctorId !== doctorId) {
    throw new Error('Invalid assignment');
  }
  
  assignment.status = approved ? 'approved' : 'rejected';
  assignment.respondedAt = new Date().toISOString();
  
  if (approved) {
    patientRegistrations[patientId].status = 'active';
    // Initialize permissions - patient controls access
    patientPermissions[patientId] = {
      doctor: true, // Doctor has access by default when approved
      caregiver: false, // Caregiver access pending assignment
      hospital: false, // Hospital only on emergency
    };
    
    // Add notification to patient
    const doctor = mockDoctors.find(d => d.id === doctorId);
    addPatientNotification(patientId, {
      title: 'Consultation Approved!',
      message: `${doctor?.name || 'Your doctor'} has approved your consultation request. You can now view your health insights and reports.`,
      type: 'success',
    });
  } else {
    patientRegistrations[patientId].status = 'rejected';
    
    // Add notification to patient
    const doctor = mockDoctors.find(d => d.id === doctorId);
    addPatientNotification(patientId, {
      title: 'Consultation Request Rejected',
      message: `${doctor?.name || 'Your doctor'} was unable to accept your consultation request. Please select another doctor.`,
      type: 'alert',
    });
  }
  
  saveToStorage(STORAGE_KEYS.DOCTOR_ASSIGNMENTS, doctorAssignments);
  saveToStorage(STORAGE_KEYS.PATIENTS, patientRegistrations);
  saveToStorage(STORAGE_KEYS.PERMISSIONS, patientPermissions);
  
  return assignment;
};

/**
 * Doctor assigns a caregiver to a patient
 */
export const assignCaregiver = (patientId, doctorId, caregiverId) => {
  const assignment = doctorAssignments[patientId];
  if (!assignment || assignment.doctorId !== doctorId || assignment.status !== 'approved') {
    throw new Error('Invalid assignment or not approved');
  }
  
  caregiverAssignments[patientId] = {
    patientId,
    caregiverId,
    assignedBy: doctorId,
    assignedAt: new Date().toISOString(),
  };
  
  // Grant caregiver access to ML insights (if patient allows)
  if (patientPermissions[patientId]) {
    patientPermissions[patientId].caregiver = true;
  }
  
  saveToStorage(STORAGE_KEYS.CAREGIVER_ASSIGNMENTS, caregiverAssignments);
  saveToStorage(STORAGE_KEYS.PERMISSIONS, patientPermissions);
  
  // Add notification to patient
  const caregiver = mockCaregivers.find(cg => cg.id === caregiverId);
  addPatientNotification(patientId, {
    title: 'Caregiver Assigned',
    message: `${caregiver?.name || 'A caregiver'} has been assigned to you by your doctor. They can now view your health insights.`,
    type: 'info',
  });
  
  return caregiverAssignments[patientId];
};

/**
 * Get patient's assigned caregiver
 */
export const getPatientCaregiver = (patientId) => {
  // Reload from localStorage to get latest data
  reloadFromStorage();
  const assignment = caregiverAssignments[patientId];
  if (!assignment) return null;
  
  const caregiver = mockCaregivers.find(cg => cg.id === assignment.caregiverId);
  return caregiver ? { ...caregiver, assignment } : null;
};

/**
 * Get patient's assigned doctor
 */
export const getPatientDoctor = (patientId) => {
  // Reload from localStorage to get latest data
  reloadFromStorage();
  const assignment = doctorAssignments[patientId];
  if (!assignment || assignment.status !== 'approved') return null;
  
  const doctor = mockDoctors.find(doc => doc.id === assignment.doctorId);
  return doctor ? { ...doctor, assignment } : null;
};

/**
 * Update patient permissions (patient controls access)
 */
export const updatePatientPermissions = (patientId, permissions) => {
  if (!patientPermissions[patientId]) {
    patientPermissions[patientId] = {
      doctor: false,
      caregiver: false,
      hospital: false,
    };
  }
  
  patientPermissions[patientId] = {
    ...patientPermissions[patientId],
    ...permissions,
  };
  
  return patientPermissions[patientId];
};

/**
 * Get patient permissions
 */
export const getPatientPermissions = (patientId) => {
  return patientPermissions[patientId] || {
    doctor: false,
    caregiver: false,
    hospital: false,
  };
};

/**
 * Check if a user has access to patient's ML insights
 */
export const hasAccessToInsights = (patientId, userType, userId) => {
  const permissions = getPatientPermissions(patientId);
  const assignment = doctorAssignments[patientId];
  const caregiverAssignment = caregiverAssignments[patientId];
  
  if (userType === 'doctor') {
    return permissions.doctor && assignment?.doctorId === userId && assignment?.status === 'approved';
  }
  
  if (userType === 'caregiver') {
    return permissions.caregiver && caregiverAssignment?.caregiverId === userId;
  }
  
  if (userType === 'hospital') {
    return permissions.hospital; // Only in emergencies
  }
  
  return false;
};

/**
 * Store patient GPS location
 */
export const updatePatientLocation = (patientId, location) => {
  patientLocations[patientId] = {
    ...location,
    updatedAt: new Date().toISOString(),
  };
  
  saveToStorage(STORAGE_KEYS.LOCATIONS, patientLocations);
  
  return patientLocations[patientId];
};

/**
 * Get patient location
 */
export const getPatientLocation = (patientId) => {
  return patientLocations[patientId] || null;
};

/**
 * Get all patients for a doctor
 */
export const getDoctorPatients = (doctorId) => {
  // Reload from localStorage to get latest data
  reloadFromStorage();
  
  const patients = [];
  
  Object.entries(doctorAssignments).forEach(([patientId, assignment]) => {
    if (assignment.doctorId === doctorId && assignment.status === 'approved') {
      const patient = patientRegistrations[patientId];
      if (patient) {
        patients.push({
          ...patient,
          assignment,
          caregiver: getPatientCaregiver(patientId),
        });
      }
    }
  });
  
  return patients;
};

/**
 * Get all patients for a caregiver
 */
export const getCaregiverPatients = (caregiverId) => {
  const patients = [];
  
  Object.entries(caregiverAssignments).forEach(([patientId, assignment]) => {
    if (assignment.caregiverId === caregiverId) {
      const patient = patientRegistrations[patientId];
      if (patient) {
        patients.push({
          ...patient,
          assignment,
          doctor: getPatientDoctor(patientId),
        });
      }
    }
  });
  
  return patients;
};

// Export all data for debugging
export const getAllData = () => ({
  patients: patientRegistrations,
  doctorAssignments,
  caregiverAssignments,
  permissions: patientPermissions,
  locations: patientLocations,
});

/**
 * Seed demo data for presentation
 * Creates some patient-doctor assignments and caregiver assignments
 */
/**
 * Get patient details
 */
export const getPatientDetails = (patientId) => {
  // Reload from localStorage to get latest data
  reloadFromStorage();
  return patientRegistrations[patientId] || null;
};

/**
 * Add notification to patient
 */
export const addPatientNotification = (patientId, notification) => {
  if (!patientNotifications[patientId]) {
    patientNotifications[patientId] = [];
  }
  
  const notificationId = `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  patientNotifications[patientId].push({
    id: notificationId,
    ...notification,
    timestamp: new Date().toISOString(),
    read: false,
  });
  
  saveToStorage(STORAGE_KEYS.NOTIFICATIONS, patientNotifications);
  
  return notificationId;
};

/**
 * Get patient notifications
 */
export const getPatientNotifications = (patientId, limit = 50) => {
  // Reload from localStorage to get latest data
  reloadFromStorage();
  const notifications = patientNotifications[patientId] || [];
  return notifications
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, limit);
};

/**
 * Mark notification as read
 */
export const markNotificationRead = (patientId, notificationId) => {
  if (!patientNotifications[patientId]) return;
  
  const notification = patientNotifications[patientId].find(n => n.id === notificationId);
  if (notification) {
    notification.read = true;
    saveToStorage(STORAGE_KEYS.NOTIFICATIONS, patientNotifications);
  }
};

/**
 * Create a report for patient
 */
export const createPatientReport = (patientId, reportData) => {
  if (!patientReports[patientId]) {
    patientReports[patientId] = [];
  }
  
  const reportId = `report-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  patientReports[patientId].push({
    id: reportId,
    ...reportData,
    generatedAt: new Date().toISOString(),
  });
  
  saveToStorage(STORAGE_KEYS.REPORTS, patientReports);
  
  // Add notification
  addPatientNotification(patientId, {
    title: 'New Report Available',
    message: `A new ${reportData.type || 'medical'} report has been generated. You can download it from the Reports section.`,
    type: 'info',
  });
  
  return reportId;
};

/**
 * Get patient reports
 */
export const getPatientReports = (patientId) => {
  // Reload from localStorage to get latest data
  reloadFromStorage();
  return patientReports[patientId] || [];
};

/**
 * Doctor sends a message/notification to patient
 */
export const sendDoctorMessage = (patientId, doctorId, message, title = 'Message from Doctor') => {
  const assignment = doctorAssignments[patientId];
  if (!assignment || assignment.doctorId !== doctorId || assignment.status !== 'approved') {
    throw new Error('Invalid assignment or not approved');
  }
  
  return addPatientNotification(patientId, {
    title,
    message,
    type: 'info',
    fromDoctor: doctorId,
  });
};

/**
 * Doctor creates a report for patient
 */
export const createDoctorReport = (patientId, doctorId, reportData) => {
  const assignment = doctorAssignments[patientId];
  if (!assignment || assignment.doctorId !== doctorId || assignment.status !== 'approved') {
    throw new Error('Invalid assignment or not approved');
  }
  
  return createPatientReport(patientId, reportData);
};

/**
 * Generate report content for download
 */
export const generatePatientReport = (patientId, reportId) => {
  const reports = patientReports[patientId] || [];
  const report = reports.find(r => r.id === reportId);
  if (!report) return '';
  
  const patient = patientRegistrations[patientId];
  const doctor = getPatientDoctor(patientId);
  
  let content = `MEDICAL REPORT\n`;
  content += `================\n\n`;
  content += `Patient Name: ${patient?.name || 'N/A'}\n`;
  content += `Patient ID: ${patientId}\n`;
  content += `Age: ${patient?.age || 'N/A'}\n`;
  content += `Condition: ${patient?.condition || 'N/A'}\n`;
  content += `Doctor: ${doctor?.name || 'N/A'}\n`;
  content += `Report Type: ${report.type || 'General'}\n`;
  content += `Generated: ${new Date(report.generatedAt).toLocaleString()}\n\n`;
  content += `Report Title: ${report.title}\n\n`;
  content += `Description:\n${report.description || 'No description provided.'}\n\n`;
  
  if (report.content) {
    content += `Report Content:\n${report.content}\n\n`;
  }
  
  content += `---\n`;
  content += `This report was generated by AlertCare Healthcare System.\n`;
  content += `Generated on: ${new Date().toLocaleString()}\n`;
  
  return content;
};

export const seedDemoData = () => {
  try {
    // Import mockPatients
    const healthcareData = require('./healthcare-data');
    const mockPatients = healthcareData.mockPatients || [];
    
    if (mockPatients.length === 0) return;
    
    // Seed some patients with doctor assignments
    mockPatients.slice(0, 5).forEach((patient, index) => {
      const doctorId = `doc-00${String(index + 1).padStart(1, '0')}`;
      
      // Register patient
      if (!patientRegistrations[patient.id]) {
        patientRegistrations[patient.id] = {
          ...patient,
          registeredAt: new Date(Date.now() - (index * 86400000)).toISOString(),
          status: 'active',
        };
      }
      
      // Assign to doctor (approved)
      if (!doctorAssignments[patient.id]) {
        doctorAssignments[patient.id] = {
          patientId: patient.id,
          doctorId,
          selectedAt: new Date(Date.now() - (index * 86400000)).toISOString(),
          status: 'approved',
          respondedAt: new Date(Date.now() - (index * 86400000)).toISOString(),
        };
      }
      
      // Set permissions
      if (!patientPermissions[patient.id]) {
        patientPermissions[patient.id] = {
          doctor: true,
          caregiver: index < 3, // First 3 have caregivers
          hospital: false,
        };
      }
      
      // Assign caregivers to first 3 patients
      if (index < 3 && !caregiverAssignments[patient.id]) {
        caregiverAssignments[patient.id] = {
          patientId: patient.id,
          caregiverId: `cg-00${String(index + 1).padStart(1, '0')}`,
          assignedBy: doctorId,
          assignedAt: new Date(Date.now() - (index * 86400000)).toISOString(),
        };
      }
      
      // Add GPS location
      const locations = [
        { latitude: 28.6139, longitude: 77.2090 }, // Delhi
        { latitude: 28.7041, longitude: 77.1025 },
        { latitude: 28.5355, longitude: 77.3910 },
        { latitude: 28.6139, longitude: 77.2090 },
        { latitude: 28.7041, longitude: 77.1025 },
      ];
      
      if (!patientLocations[patient.id]) {
        patientLocations[patient.id] = {
          ...locations[index],
          updatedAt: new Date().toISOString(),
        };
      }
    });
  } catch (e) {
    console.log('Demo data seeding error:', e);
  }
};
