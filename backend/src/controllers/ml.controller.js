const { prisma } = require('../prisma/client');
const { predictAnomalyScore, checkMLHealth } = require('../services/ml.service');

/**
 * Check ML API health
 */
const health = async (req, res) => {
  try {
    const healthStatus = await checkMLHealth();
    res.json(healthStatus);
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      models_loaded: false,
      error: error.message,
    });
  }
};

/**
 * Manually trigger ML prediction for a sensor reading
 * POST /api/ml/predict
 * Body: { readingId: string }
 */
const predict = async (req, res) => {
  try {
    const { readingId } = req.body;

    if (!readingId) {
      return res.status(400).json({
        success: false,
        message: 'readingId is required',
      });
    }

    // Get the sensor reading
    const reading = await prisma.sensorReading.findUnique({
      where: { id: readingId },
      include: { patient: true },
    });

    if (!reading) {
      return res.status(404).json({
        success: false,
        message: 'Sensor reading not found',
      });
    }

    // Run prediction
    const predictionResult = await predictAnomalyScore(reading.patientId, readingId);

    // Calculate risk category based on health stability score
    // ML API returns camelCase: healthStabilityScore, isolationScore, lstmScore
    const score = predictionResult.healthStabilityScore || predictionResult.health_stability_score || 0;
    let riskCategory;
    if (score >= 90) {
      riskCategory = 'Stable';
    } else if (score >= 70) {
      riskCategory = 'Early Instability';
    } else if (score >= 50) {
      riskCategory = 'Sustained Deterioration';
    } else {
      riskCategory = 'High-Risk Decline';
    }

    // Store prediction in database
    const prediction = await prisma.healthPrediction.upsert({
      where: { sensorReadingId: readingId },
      update: {
        healthStabilityScore: score,
        isolationScore: predictionResult.isolationScore || predictionResult.isolation_forest_score || 0,
        lstmScore: predictionResult.lstmScore || predictionResult.lstm_score || 0,
        reconstructionError: predictionResult.reconstructionError || predictionResult.reconstruction_error || null,
        riskCategory,
        timestamp: new Date(),
      },
      create: {
        sensorReadingId: readingId,
        patientId: reading.patientId,
        healthStabilityScore: score,
        isolationScore: predictionResult.isolationScore || predictionResult.isolation_forest_score || 0,
        lstmScore: predictionResult.lstmScore || predictionResult.lstm_score || 0,
        reconstructionError: predictionResult.reconstructionError || predictionResult.reconstruction_error || null,
        riskCategory,
        timestamp: new Date(),
      },
    });

    res.json({
      success: true,
      message: 'Prediction completed successfully',
      data: {
        prediction,
        mlResult: predictionResult,
      },
    });
  } catch (error) {
    console.error('Prediction error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate prediction',
    });
  }
};

/**
 * Get all predictions for a patient
 * GET /api/ml/predictions/:patientId
 */
const getPredictions = async (req, res) => {
  try {
    const { patientId } = req.params;

    // Verify patient exists
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found',
      });
    }

    // Get predictions
    const predictions = await prisma.healthPrediction.findMany({
      where: { patientId },
      include: {
        sensorReading: {
          select: {
            id: true,
            timestamp: true,
            bloodPressure: true,
            bloodGlucose: true,
            heartRate: true,
            activity: true,
          },
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
    });

    res.json({
      success: true,
      data: predictions,
    });
  } catch (error) {
    console.error('Get predictions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch predictions',
    });
  }
};

module.exports = {
  health,
  predict,
  getPredictions,
};

