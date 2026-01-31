const express = require('express');
const { health, predict, getPredictions } = require('../controllers/ml.controller');

const router = express.Router();

// Health check
router.get('/health', health);

// Predictions
router.post('/predict', predict);
router.get('/predictions/:patientId', getPredictions);

module.exports = router;

