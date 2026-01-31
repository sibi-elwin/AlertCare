const express = require('express');
const {
  getProfileByUserId,
  getDashboard,
  getTrajectory,
  syncWearable,
  acknowledgeGuidance,
  getAvailableDoctors,
  assignDoctor,
} = require('../controllers/patient.controller');

const router = express.Router();

router.get('/profile/:userId', getProfileByUserId);
router.get('/doctors/available', getAvailableDoctors);
router.post('/:patientId/doctors/:doctorId/assign', assignDoctor);
router.get('/:patientId/dashboard', getDashboard);
router.get('/:patientId/predictions/trajectory', getTrajectory);
router.post('/:patientId/sync-wearable', syncWearable);
router.post('/:patientId/guidance/:guidanceId/acknowledge', acknowledgeGuidance);

module.exports = router;

