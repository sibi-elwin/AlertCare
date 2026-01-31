/**
 * ML API Service
 * HTTP client for communicating with ML prediction service
 */

const axios = require('axios');

const ML_API_URL = process.env.ML_API_URL || 'http://ml:8000';

/**
 * Get rolling window of sensor readings for a patient
 * @param {string} patientId - Patient ID
 * @param {Date} currentTimestamp - Current timestamp (usually now)
 * @param {number} hours - Number of hours to fetch (default: 720 = 30 days)
 * @returns {Promise<Array>} Array of sensor readings
 */
async function getRollingWindow(patientId, currentTimestamp, hours = 720) {
  const { prisma } = require('../prisma/client');
  
  const startTime = new Date(currentTimestamp);
  startTime.setHours(startTime.getHours() - hours);

  const readings = await prisma.sensorReading.findMany({
    where: {
      patientId: patientId,
      timestamp: {
        gte: startTime,
        lte: currentTimestamp,
      },
    },
    orderBy: {
      timestamp: 'asc', // Important: chronological order
    },
  });

  return readings;
}

/**
 * Convert Prisma sensor readings to ML API format
 * @param {Array} readings - Array of sensor reading objects
 * @returns {Array} Formatted readings for ML API
 */
function formatReadingsForML(readings) {
  return readings.map(reading => ({
    timestamp: reading.timestamp.toISOString(),
    bloodPressure: reading.bloodPressure,
    bloodGlucose: reading.bloodGlucose,
    heartRate: reading.heartRate,
    activity: reading.activity,
  }));
}

/**
 * Predict anomaly score using ML API
 * @param {string} patientId - Patient ID
 * @param {string} currentReadingId - ID of the current reading to predict for
 * @returns {Promise<Object>} Prediction results
 */
async function predictAnomalyScore(patientId, currentReadingId) {
  const { prisma } = require('../prisma/client');
  
  // Get current reading
  const currentReading = await prisma.sensorReading.findUnique({
    where: { id: currentReadingId },
  });

  if (!currentReading) {
    throw new Error('Sensor reading not found');
  }

  // Fetch rolling window (720 hours = 30 days)
  const rollingWindow = await getRollingWindow(
    patientId,
    currentReading.timestamp,
    720 // 30 days for better feature extraction
  );

  // Check if we have minimum required data (168 hours = 7 days)
  if (rollingWindow.length < 168) {
    throw new Error(
      `Insufficient data: Need at least 168 hours (7 days) of readings. Got ${rollingWindow.length} readings.`
    );
  }

  // Format for ML API
  const formattedReadings = formatReadingsForML(rollingWindow);

  // Call ML API
  try {
    const response = await axios.post(
      `${ML_API_URL}/api/ml/predict`,
      {
        readings: formattedReadings,
      },
      {
        timeout: 300000, // 5 minutes timeout - ML prediction can take time
      }
    );

    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(`ML API error: ${error.response.data.detail || error.message}`);
    }
    throw error;
  }
}

/**
 * Check ML API health
 * @returns {Promise<Object>} Health status
 */
async function checkMLHealth() {
  try {
    const response = await axios.get(`${ML_API_URL}/api/ml/health`, {
      timeout: 5000,
    });
    return response.data;
  } catch (error) {
    return {
      status: 'unhealthy',
      models_loaded: false,
      error: error.message,
    };
  }
}

module.exports = {
  getRollingWindow,
  formatReadingsForML,
  predictAnomalyScore,
  checkMLHealth,
};

