const express = require('express');
const {
  create,
  getByPatient,
  getById,
  update,
  remove,
} = require('../controllers/sensor-reading.controller');

const router = express.Router();

// Create sensor reading
router.post('/', create);

// Get readings by patient
router.get('/patient/:patientId', getByPatient);

// Get, update, delete single reading
router.get('/:id', getById);
router.put('/:id', update);
router.delete('/:id', remove);

module.exports = router;

