const express = require('express');
const {
  getProfileByUserId,
  getAlerts,
  getPatients,
  getPatientDetails,
  getNotes,
  addNote,
  sendGuidance,
  flagPatient,
} = require('../controllers/caregiver.controller');

const router = express.Router();

router.get('/profile/:userId', getProfileByUserId);
router.get('/:caregiverId/alerts', getAlerts);
router.get('/:caregiverId/patients', getPatients);
router.get('/:caregiverId/patients/:patientId', getPatientDetails);
router.get('/:caregiverId/patients/:patientId/notes', getNotes);
router.post('/:caregiverId/patients/:patientId/notes', addNote);
router.post('/:caregiverId/patients/:patientId/guidance', sendGuidance);
router.post('/:caregiverId/patients/:patientId/flag', flagPatient);

module.exports = router;

