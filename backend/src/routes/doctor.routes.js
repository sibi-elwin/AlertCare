const express = require('express');
const {
  getProfileByUserId,
  getPatients,
  getPatientDetails,
  getAvailableCaregivers,
  assignCaregiver,
  sendGuidance,
  getAlerts,
} = require('../controllers/doctor.controller');

const router = express.Router();

router.get('/profile/:userId', getProfileByUserId);
router.get('/caregivers/available', getAvailableCaregivers);
router.get('/:doctorId/alerts', getAlerts);
router.get('/:doctorId/patients', getPatients);
router.get('/:doctorId/patients/:patientId', getPatientDetails);
router.post('/:doctorId/patients/:patientId/caregivers/:caregiverId/assign', assignCaregiver);
router.post('/:doctorId/patients/:patientId/guidance', sendGuidance);

module.exports = router;

