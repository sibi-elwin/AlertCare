const { prisma } = require('../prisma/client');
const { predictAnomalyScore } = require('../services/ml.service');
const { createAlertsFromPrediction } = require('../services/alert.service');

/**
 * Create a new sensor reading
 * POST /api/sensor-readings
 * Body: { patientId, bloodPressure?, bloodGlucose?, heartRate?, activity?, autoPredict? }
 */
const create = async (req, res) => {
  try {
    const { patientId, bloodPressure, bloodGlucose, heartRate, activity, autoPredict = true } = req.body;

    if (!patientId) {
      return res.status(400).json({
        success: false,
        message: 'patientId is required',
      });
    }

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

    // Create sensor reading
    const reading = await prisma.sensorReading.create({
      data: {
        patientId,
        bloodPressure: bloodPressure || null,
        bloodGlucose: bloodGlucose || null,
        heartRate: heartRate || null,
        activity: activity || null,
        timestamp: new Date(),
      },
    });

    let prediction = null;
    let predictionError = null;

    // Auto-predict if requested
    if (autoPredict) {
      try {
        const predictionResult = await predictAnomalyScore(patientId, reading.id);

        // Calculate risk category
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

        // Store prediction
        prediction = await prisma.healthPrediction.upsert({
          where: { sensorReadingId: reading.id },
          update: {
            healthStabilityScore: score,
            isolationScore: predictionResult.isolationScore || predictionResult.isolation_forest_score || 0,
            lstmScore: predictionResult.lstmScore || predictionResult.lstm_score || 0,
            reconstructionError: predictionResult.reconstructionError || predictionResult.reconstruction_error || null,
            riskCategory,
            timestamp: new Date(),
          },
          create: {
            sensorReadingId: reading.id,
            patientId,
            healthStabilityScore: score,
            isolationScore: predictionResult.isolationScore || predictionResult.isolation_forest_score || 0,
            lstmScore: predictionResult.lstmScore || predictionResult.lstm_score || 0,
            reconstructionError: predictionResult.reconstructionError || predictionResult.reconstruction_error || null,
            riskCategory,
            timestamp: new Date(),
          },
        });

        // Create automated alerts based on risk category
        try {
          await createAlertsFromPrediction(
            patientId,
            prediction.id,
            riskCategory,
            score
          );
        } catch (alertError) {
          // Log but don't fail the prediction
          console.error('Failed to create alerts:', alertError);
        }
      } catch (error) {
        // Prediction failed, but reading was created
        predictionError = error.message;
        
        // Log as warning if it's insufficient data (expected for new patients)
        if (error.message.includes('Insufficient data')) {
          console.warn(`⚠️  ML prediction skipped: ${error.message}. This is normal for new patients. Continue adding readings to enable predictions.`);
        } else {
          console.error('❌ Auto-prediction failed:', error);
        }
      }
    }

    res.status(201).json({
      success: true,
      message: 'Sensor reading created successfully',
      data: {
        reading,
        prediction,
        predictionError,
        autoPredicted: autoPredict && !predictionError,
      },
    });
  } catch (error) {
    console.error('Create sensor reading error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create sensor reading',
    });
  }
};

/**
 * Get all readings for a patient
 * GET /api/sensor-readings/patient/:patientId
 */
const getByPatient = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { limit, offset, startDate, endDate } = req.query;

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

    // Build where clause
    const where = { patientId };
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = new Date(startDate);
      if (endDate) where.timestamp.lte = new Date(endDate);
    }

    // Get readings
    const readings = await prisma.sensorReading.findMany({
      where,
      orderBy: {
        timestamp: 'desc',
      },
      take: limit ? parseInt(limit) : undefined,
      skip: offset ? parseInt(offset) : undefined,
      include: {
        prediction: true,
      },
    });

    res.json({
      success: true,
      data: readings,
    });
  } catch (error) {
    console.error('Get readings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sensor readings',
    });
  }
};

/**
 * Get a single reading by ID
 * GET /api/sensor-readings/:id
 */
const getById = async (req, res) => {
  try {
    const { id } = req.params;

    const reading = await prisma.sensorReading.findUnique({
      where: { id },
      include: {
        prediction: true,
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!reading) {
      return res.status(404).json({
        success: false,
        message: 'Sensor reading not found',
      });
    }

    res.json({
      success: true,
      data: reading,
    });
  } catch (error) {
    console.error('Get reading error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sensor reading',
    });
  }
};

/**
 * Update a sensor reading
 * PUT /api/sensor-readings/:id
 */
const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { bloodPressure, bloodGlucose, heartRate, activity } = req.body;

    const reading = await prisma.sensorReading.findUnique({
      where: { id },
    });

    if (!reading) {
      return res.status(404).json({
        success: false,
        message: 'Sensor reading not found',
      });
    }

    const updated = await prisma.sensorReading.update({
      where: { id },
      data: {
        ...(bloodPressure !== undefined && { bloodPressure }),
        ...(bloodGlucose !== undefined && { bloodGlucose }),
        ...(heartRate !== undefined && { heartRate }),
        ...(activity !== undefined && { activity }),
      },
    });

    res.json({
      success: true,
      message: 'Sensor reading updated successfully',
      data: updated,
    });
  } catch (error) {
    console.error('Update reading error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update sensor reading',
    });
  }
};

/**
 * Delete a sensor reading
 * DELETE /api/sensor-readings/:id
 */
const remove = async (req, res) => {
  try {
    const { id } = req.params;

    const reading = await prisma.sensorReading.findUnique({
      where: { id },
    });

    if (!reading) {
      return res.status(404).json({
        success: false,
        message: 'Sensor reading not found',
      });
    }

    await prisma.sensorReading.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Sensor reading deleted successfully',
    });
  } catch (error) {
    console.error('Delete reading error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete sensor reading',
    });
  }
};

module.exports = {
  create,
  getByPatient,
  getById,
  update,
  remove,
};

