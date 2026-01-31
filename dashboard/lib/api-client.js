/**
 * API Client for AlertCare Backend
 * Centralized API communication utility
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * Make an API request with error handling
 */
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  // Add auth token if available
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `API error: ${response.status}`);
    }

    return data;
  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Unable to connect to backend API. Please ensure the backend server is running.');
    }
    throw error;
  }
}

/**
 * Authentication API
 */
export const authAPI = {
  /**
   * Sign in with email and password
   * @param {string} email 
   * @param {string} password 
   * @returns {Promise<{success: boolean, data?: {user: object, token: string}, message?: string}>}
   */
  async signin(email, password) {
    const response = await apiRequest('/api/auth/signin', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (response.success && response.data.token) {
      // Store token for future requests
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
    }

    return response;
  },

  /**
   * Sign up new user
   * @param {object} userData 
   * @returns {Promise<{success: boolean, data?: {user: object, token: string}, message?: string}>}
   */
  async signup(userData) {
    const response = await apiRequest('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    if (response.success && response.data.token) {
      // Store token for future requests
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
    }

    return response;
  },

  /**
   * Sign out - clear stored auth data
   */
  signout() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
    }
  },

  /**
   * Get current user from localStorage
   */
  getCurrentUser() {
    if (typeof window === 'undefined') return null;
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem('auth_token');
  },
};

/**
 * Sensor Readings API
 * Note: These endpoints may not be implemented yet in the backend
 */
export const sensorReadingsAPI = {
  /**
   * Create a new sensor reading
   * @param {object} readingData 
   * @returns {Promise<{success: boolean, data?: object}>}
   */
  async create(readingData) {
    return apiRequest('/api/sensor-readings', {
      method: 'POST',
      body: JSON.stringify(readingData),
    });
  },

  /**
   * Get all readings for a patient
   * @param {string} patientId 
   * @param {object} options - {limit, offset, startDate, endDate}
   * @returns {Promise<{success: boolean, data?: Array}>}
   */
  async getByPatient(patientId, options = {}) {
    const params = new URLSearchParams();
    if (options.limit) params.append('limit', options.limit);
    if (options.offset) params.append('offset', options.offset);
    if (options.startDate) params.append('startDate', options.startDate);
    if (options.endDate) params.append('endDate', options.endDate);

    const queryString = params.toString();
    const endpoint = `/api/sensor-readings/patient/${patientId}${queryString ? `?${queryString}` : ''}`;
    
    return apiRequest(endpoint, {
      method: 'GET',
    });
  },

  /**
   * Get a single reading by ID
   * @param {string} readingId 
   * @returns {Promise<{success: boolean, data?: object}>}
   */
  async getById(readingId) {
    return apiRequest(`/api/sensor-readings/${readingId}`, {
      method: 'GET',
    });
  },
};

/**
 * ML Predictions API
 * Note: These endpoints may not be implemented yet in the backend
 */
export const mlAPI = {
  /**
   * Get all predictions for a patient
   * @param {string} patientId 
   * @returns {Promise<{success: boolean, data?: Array}>}
   */
  async getPredictions(patientId) {
    return apiRequest(`/api/ml/predictions/${patientId}`, {
      method: 'GET',
    });
  },

  /**
   * Manually trigger a prediction
   * @param {string} readingId 
   * @returns {Promise<{success: boolean, data?: object}>}
   */
  async predict(readingId) {
    return apiRequest('/api/ml/predict', {
      method: 'POST',
      body: JSON.stringify({ readingId }),
    });
  },
};

/**
 * Patient Dashboard API
 */
export const patientDashboardAPI = {
  /**
   * Get patient profile by userId
   * @param {string} userId 
   * @returns {Promise<{success: boolean, data?: object}>}
   */
  async getProfileByUserId(userId) {
    return apiRequest(`/api/patients/profile/${userId}`, {
      method: 'GET',
    });
  },

  /**
   * Get patient dashboard data
   * @param {string} patientId 
   * @returns {Promise<{success: boolean, data?: object}>}
   */
  async getDashboard(patientId) {
    return apiRequest(`/api/patients/${patientId}/dashboard`, {
      method: 'GET',
    });
  },

  /**
   * Get patient trajectory data
   * @param {string} patientId 
   * @param {number} days 
   * @param {string} granularity 
   * @returns {Promise<{success: boolean, data?: object}>}
   */
  async getTrajectory(patientId, days = 30, granularity = 'daily') {
    return apiRequest(`/api/patients/${patientId}/predictions/trajectory?days=${days}&granularity=${granularity}`, {
      method: 'GET',
    });
  },

  /**
   * Sync wearable device
   * @param {string} patientId 
   * @returns {Promise<{success: boolean, data?: object}>}
   */
  async syncWearable(patientId) {
    return apiRequest(`/api/patients/${patientId}/sync-wearable`, {
      method: 'POST',
    });
  },

  /**
   * Acknowledge guidance
   * @param {string} patientId 
   * @param {string} guidanceId 
   * @returns {Promise<{success: boolean, data?: object}>}
   */
  async acknowledgeGuidance(patientId, guidanceId) {
    return apiRequest(`/api/patients/${patientId}/guidance/${guidanceId}/acknowledge`, {
      method: 'POST',
    });
  },

  /**
   * Get available doctors for patient selection
   * @param {object} options - { specialization?, search? }
   * @returns {Promise<{success: boolean, data?: {doctors: array, total: number}}>}
   */
  async getAvailableDoctors(options = {}) {
    const params = new URLSearchParams();
    if (options.specialization) params.append('specialization', options.specialization);
    if (options.search) params.append('search', options.search);

    const query = params.toString();
    return apiRequest(`/api/patients/doctors/available${query ? `?${query}` : ''}`, {
      method: 'GET',
    });
  },

  /**
   * Assign a doctor to a patient
   * @param {string} patientId 
   * @param {string} doctorId 
   * @param {string} notes - Optional notes
   * @returns {Promise<{success: boolean, data?: object}>}
   */
  async assignDoctor(patientId, doctorId, notes = null) {
    return apiRequest(`/api/patients/${patientId}/doctors/${doctorId}/assign`, {
      method: 'POST',
      body: notes ? JSON.stringify({ notes }) : undefined,
    });
  },
};

/**
 * Doctor API
 */
export const doctorAPI = {
  /**
   * Get doctor profile by userId
   * @param {string} userId 
   * @returns {Promise<{success: boolean, data?: object}>}
   */
  async getProfileByUserId(userId) {
    return apiRequest(`/api/doctors/profile/${userId}`, {
      method: 'GET',
    });
  },
};

/**
 * Doctor Dashboard API
 */
export const doctorDashboardAPI = {
  /**
   * Get all patients assigned to a doctor
   * @param {string} doctorId 
   * @param {object} options 
   * @returns {Promise<{success: boolean, data?: {patients: array, total: number}}>}
   */
  async getPatients(doctorId, options = {}) {
    const params = new URLSearchParams();
    if (options.search) params.append('search', options.search);
    if (options.status) params.append('status', options.status);
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.offset) params.append('offset', options.offset.toString());

    const query = params.toString();
    return apiRequest(`/api/doctors/${doctorId}/patients${query ? `?${query}` : ''}`, {
      method: 'GET',
    });
  },

  /**
   * Get detailed patient view
   * @param {string} doctorId 
   * @param {string} patientId 
   * @returns {Promise<{success: boolean, data?: object}>}
   */
  async getPatientDetails(doctorId, patientId) {
    return apiRequest(`/api/doctors/${doctorId}/patients/${patientId}`, {
      method: 'GET',
    });
  },

  /**
   * Get available caregivers for assignment
   * @param {object} options - { search? }
   * @returns {Promise<{success: boolean, data?: {caregivers: array, total: number}}>}
   */
  async getAvailableCaregivers(options = {}) {
    const params = new URLSearchParams();
    if (options.search) params.append('search', options.search);

    const query = params.toString();
    return apiRequest(`/api/doctors/caregivers/available${query ? `?${query}` : ''}`, {
      method: 'GET',
    });
  },

  /**
   * Assign a caregiver to a patient
   * @param {string} doctorId 
   * @param {string} patientId 
   * @param {string} caregiverId 
   * @param {string} notes - Optional notes
   * @returns {Promise<{success: boolean, data?: object}>}
   */
  async assignCaregiver(doctorId, patientId, caregiverId, notes = null) {
    return apiRequest(`/api/doctors/${doctorId}/patients/${patientId}/caregivers/${caregiverId}/assign`, {
      method: 'POST',
      body: notes ? JSON.stringify({ notes }) : undefined,
    });
  },

  /**
   * Send guidance/prescription/comment to patient
   * @param {string} doctorId 
   * @param {string} patientId 
   * @param {string} message 
   * @param {string} priority - "low", "normal", "high"
   * @returns {Promise<{success: boolean, data?: object}>}
   */
  async sendGuidance(doctorId, patientId, message, priority = 'normal') {
    return apiRequest(`/api/doctors/${doctorId}/patients/${patientId}/guidance`, {
      method: 'POST',
      body: JSON.stringify({ message, priority }),
    });
  },

  /**
   * Get alerts for a doctor
   * @param {string} doctorId 
   * @param {object} options - { limit?, offset?, acknowledged? }
   * @returns {Promise<{success: boolean, data?: {alerts: array, total: number}}>}
   */
  async getAlerts(doctorId, options = {}) {
    const params = new URLSearchParams();
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.offset) params.append('offset', options.offset.toString());
    if (options.acknowledged !== undefined) params.append('acknowledged', options.acknowledged.toString());

    const query = params.toString();
    return apiRequest(`/api/doctors/${doctorId}/alerts${query ? `?${query}` : ''}`, {
      method: 'GET',
    });
  },
};

/**
 * Caregiver Dashboard API
 */
export const caregiverDashboardAPI = {
  /**
   * Get caregiver profile by userId
   * @param {string} userId 
   * @returns {Promise<{success: boolean, data?: object}>}
   */
  async getProfileByUserId(userId) {
    return apiRequest(`/api/caregivers/profile/${userId}`, {
      method: 'GET',
    });
  },

  /**
   * Get all patients for a caregiver
   * @param {string} caregiverId 
   * @param {object} options 
   * @returns {Promise<{success: boolean, data?: object}>}
   */
  async getPatients(caregiverId, options = {}) {
    const params = new URLSearchParams();
    if (options.search) params.append('search', options.search);
    if (options.status) params.append('status', options.status);
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.offset) params.append('offset', options.offset.toString());

    const query = params.toString();
    return apiRequest(`/api/caregivers/${caregiverId}/patients${query ? `?${query}` : ''}`, {
      method: 'GET',
    });
  },

  /**
   * Get detailed patient view
   * @param {string} caregiverId 
   * @param {string} patientId 
   * @returns {Promise<{success: boolean, data?: object}>}
   */
  async getPatientDetails(caregiverId, patientId) {
    return apiRequest(`/api/caregivers/${caregiverId}/patients/${patientId}`, {
      method: 'GET',
    });
  },

  /**
   * Get caregiver notes
   * @param {string} caregiverId 
   * @param {string} patientId 
   * @returns {Promise<{success: boolean, data?: object}>}
   */
  async getNotes(caregiverId, patientId) {
    return apiRequest(`/api/caregivers/${caregiverId}/patients/${patientId}/notes`, {
      method: 'GET',
    });
  },

  /**
   * Add caregiver note
   * @param {string} caregiverId 
   * @param {string} patientId 
   * @param {string} content 
   * @returns {Promise<{success: boolean, data?: object}>}
   */
  async addNote(caregiverId, patientId, content) {
    return apiRequest(`/api/caregivers/${caregiverId}/patients/${patientId}/notes`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  },

  /**
   * Send guidance to patient
   * @param {string} caregiverId 
   * @param {string} patientId 
   * @param {string} message 
   * @param {string} priority 
   * @returns {Promise<{success: boolean, data?: object}>}
   */
  async sendGuidance(caregiverId, patientId, message, priority = 'normal') {
    return apiRequest(`/api/caregivers/${caregiverId}/patients/${patientId}/guidance`, {
      method: 'POST',
      body: JSON.stringify({ message, priority }),
    });
  },

  /**
   * Flag patient for clinical review
   * @param {string} caregiverId 
   * @param {string} patientId 
   * @param {string} reason 
   * @param {string} priority 
   * @returns {Promise<{success: boolean, data?: object}>}
   */
  async flagPatient(caregiverId, patientId, reason, priority = 'medium') {
    return apiRequest(`/api/caregivers/${caregiverId}/patients/${patientId}/flag`, {
      method: 'POST',
      body: JSON.stringify({ reason, priority }),
    });
  },

  /**
   * Get alerts for a caregiver
   * @param {string} caregiverId 
   * @param {object} options - { limit?, offset?, acknowledged? }
   * @returns {Promise<{success: boolean, data?: {alerts: array, total: number}}>}
   */
  async getAlerts(caregiverId, options = {}) {
    const params = new URLSearchParams();
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.offset) params.append('offset', options.offset.toString());
    if (options.acknowledged !== undefined) params.append('acknowledged', options.acknowledged.toString());

    const query = params.toString();
    return apiRequest(`/api/caregivers/${caregiverId}/alerts${query ? `?${query}` : ''}`, {
      method: 'GET',
    });
  },
};

export default {
  auth: authAPI,
  sensorReadings: sensorReadingsAPI,
  ml: mlAPI,
  patientDashboard: patientDashboardAPI,
  caregiverDashboard: caregiverDashboardAPI,
  doctor: doctorAPI,
};

