// AlertCare - Authentication System
// Simple authentication for doctors (for demo purposes)

// In production, this would use proper authentication (JWT, OAuth, etc.)
let doctorSessions = {};
let doctorCredentials = {};

// Initialize with demo doctors
// For demo, all doctors use 'password123'
// We'll initialize lazily to avoid circular dependency
let initialized = false;

const initializeDoctors = () => {
  if (initialized) return;
  
  try {
    // Try to get mockDoctors - works in both server and client
    const { mockDoctors } = require('./patient-data');
    doctorCredentials = {};
    mockDoctors.forEach(doctor => {
      doctorCredentials[doctor.id] = {
        password: 'password123',
        name: doctor.name,
      };
    });
    initialized = true;
  } catch (e) {
    // Fallback: initialize with a few doctors
    doctorCredentials = {
      'doc-001': { password: 'password123', name: 'Dr. Sarah Johnson' },
      'doc-002': { password: 'password123', name: 'Dr. Rajesh Kumar' },
      'doc-003': { password: 'password123', name: 'Dr. Priya Sharma' },
      'doc-004': { password: 'password123', name: 'Dr. Michael Chen' },
      'doc-005': { password: 'password123', name: 'Dr. Ananya Mehta' },
    };
    initialized = true;
  }
};

// Initialize on module load
initializeDoctors();

/**
 * Doctor sign in
 */
export const signInDoctor = (doctorId, password) => {
  // Ensure doctors are initialized
  if (!initialized || Object.keys(doctorCredentials).length < 10) {
    initializeDoctors();
  }
  
  const doctor = doctorCredentials[doctorId];
  
  if (!doctor || doctor.password !== password) {
    return { success: false, error: 'Invalid credentials' };
  }
  
  // Create session
  const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  doctorSessions[sessionId] = {
    doctorId,
    name: doctor.name,
    signedInAt: new Date().toISOString(),
  };
  
  // Store in localStorage for demo
  if (typeof window !== 'undefined') {
    localStorage.setItem('doctor_session', sessionId);
    localStorage.setItem('doctor_id', doctorId);
  }
  
  return {
    success: true,
    sessionId,
    doctorId,
    name: doctor.name,
  };
};

/**
 * Get current doctor session
 */
export const getCurrentDoctor = () => {
  if (typeof window === 'undefined') return null;
  
  const sessionId = localStorage.getItem('doctor_session');
  const doctorId = localStorage.getItem('doctor_id');
  
  if (!sessionId || !doctorId) return null;
  
  const session = doctorSessions[sessionId];
  if (!session) return null;
  
  return {
    ...session,
    doctorId,
  };
};

/**
 * Sign out doctor
 */
export const signOutDoctor = () => {
  if (typeof window === 'undefined') return;
  
  const sessionId = localStorage.getItem('doctor_session');
  if (sessionId) {
    delete doctorSessions[sessionId];
  }
  
  localStorage.removeItem('doctor_session');
  localStorage.removeItem('doctor_id');
};

/**
 * Register a new doctor (for admin use)
 */
export const registerDoctor = (doctorId, password, name) => {
  doctorCredentials[doctorId] = { password, name };
  return { success: true };
};
