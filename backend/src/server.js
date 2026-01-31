const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth.routes');
const mlRoutes = require('./routes/ml.routes');
const sensorReadingsRoutes = require('./routes/sensor-readings.routes');
const patientRoutes = require('./routes/patient.routes');
const caregiverRoutes = require('./routes/caregiver.routes');
const doctorRoutes = require('./routes/doctor.routes');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/ml', mlRoutes);
app.use('/api/sensor-readings', sensorReadingsRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/caregivers', caregiverRoutes);
app.use('/api/doctors', doctorRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'AlertCare API is running' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});

