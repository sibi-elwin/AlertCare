# ML Integration Guide

## Overview

The Silent Deterioration Detector (SDD) ML system has been integrated into the AlertCare backend. This document explains the changes made and how the system works.

## ML System Architecture

### Components:
1. **Data Simulator** (`data/simulator.py`) - Generates synthetic wearable sensor data
2. **Feature Engineering** (`features/temporal_features.py`) - Extracts temporal stability features
3. **Models**:
   - **Isolation Forest** (`models/isolation_forest.py`) - Edge-layer anomaly detection
   - **LSTM Autoencoder** (`models/lstm_autoencoder.py`) - Long-term pattern detection
4. **Scoring** (`scoring/stability_scorer.py`) - Fuses model outputs into Health Stability Score
5. **System** (`system/sdd_system.py`) - Orchestrates all components

### Input Data Format:
```python
{
  'timestamp': DateTime,
  'blood_pressure': Float,  # Systolic BP (mmHg)
  'blood_glucose': Float,   # Blood glucose (mg/dL)
  'heart_rate': Float,      # Heart rate (bpm)
  'activity': Float         # Activity level (steps/hour)
}
```

### Output Format:
```python
{
  'health_stability_score': Float,  # 0-100 (main score)
  'isolation_score': Float,         # 0-100
  'lstm_score': Float,              # 0-100
  'reconstruction_error': Float,    # MSE
  'risk_category': String           # Stable, Early Instability, etc.
}
```

## Changes Made

### 1. Docker Compose (`backend/docker-compose.yml`)

**Added ML Service:**
- Builds from `../ml` directory
- Exposes port 8000 for ML API
- Connects to PostgreSQL database
- Persistent volumes for models and output files
- Health check endpoint
- Depends on PostgreSQL being healthy

**Key Configuration:**
- `DATABASE_URL`: PostgreSQL connection string
- `ML_API_PORT`: API port (8000)
- `ML_MODEL_PATH`: Path for trained models
- `ML_OUTPUT_PATH`: Path for output files

### 2. Prisma Schema (`backend/prisma/schema.prisma`)

**New Models Added:**

#### `SensorReading`
Stores raw wearable sensor data:
- `bloodPressure`, `bloodGlucose`, `heartRate`, `activity`
- Linked to `Patient`
- Indexed on `patientId` and `timestamp` for efficient queries

#### `HealthPrediction`
Stores ML model predictions:
- All model scores (health stability, isolation, LSTM)
- Reconstruction errors
- Risk category (Stable, Early Instability, Sustained Deterioration, High-Risk Decline)
- Linked to `SensorReading` and `Patient`
- Indexed for efficient filtering and queries

#### `ModelTraining`
Tracks ML model training sessions:
- Training metadata (epochs, batch size, duration)
- Model version tracking
- Training status

**Relationships:**
- `Patient` → `SensorReading[]` (one-to-many)
- `Patient` → `HealthPrediction[]` (one-to-many)
- `SensorReading` → `HealthPrediction` (one-to-one)

### 3. Dockerfile (`ml/Dockerfile`)

**Updated to:**
- Copy all ML module directories (data, features, models, scoring, system)
- Copy `train.py` and `predict.py` scripts
- Create `/app/models` directory for persistent model storage
- Default command keeps container running (for API service)

## Database Schema Details

### SensorReading Fields:
- `id`: UUID primary key
- `patientId`: Foreign key to Patient
- `timestamp`: When the reading was taken
- `bloodPressure`: Systolic BP (mmHg)
- `bloodGlucose`: Blood glucose (mg/dL)
- `heartRate`: Heart rate (bpm)
- `activity`: Activity level

### HealthPrediction Fields:
- `id`: UUID primary key
- `sensorReadingId`: Foreign key to SensorReading (unique)
- `patientId`: Foreign key to Patient
- `timestamp`: When prediction was made
- `healthStabilityScore`: Main score (0-100)
- `isolationScore`: Isolation Forest score (0-100)
- `lstmScore`: LSTM Autoencoder score (0-100)
- `reconstructionError`: LSTM reconstruction error
- `riskCategory`: Categorized risk level
- `modelVersion`: Version of model used

### Risk Categories:
- **Stable** (≥90): Normal health patterns
- **Early Instability** (70-89): Early warning signs
- **Sustained Deterioration** (50-69): Ongoing decline
- **High-Risk Decline** (<50): Critical condition

## Next Steps

### 1. Create ML API Service
Create a Flask/FastAPI service in the ML container to expose endpoints:
- `POST /api/ml/predict` - Run prediction on sensor data
- `POST /api/ml/train` - Train models on patient data
- `GET /api/ml/health` - Health check
- `GET /api/ml/predictions/:patientId` - Get predictions for patient

### 2. Update Backend API
Add routes in backend to:
- Store sensor readings from wearable devices
- Trigger ML predictions
- Retrieve health predictions for patients
- Display health stability trends

### 3. Run Migrations
```bash
cd backend
npx prisma migrate dev --name add_ml_models
npx prisma generate
```

### 4. Start Services
```bash
cd backend
docker compose up -d
```

## Usage Example

### Storing Sensor Reading:
```javascript
// Backend API endpoint
POST /api/sensor-readings
{
  "patientId": "uuid",
  "bloodPressure": 120,
  "bloodGlucose": 95,
  "heartRate": 70,
  "activity": 100
}
```

### Triggering ML Prediction:
```javascript
// Backend calls ML service
POST http://ml:8000/api/ml/predict
{
  "patientId": "uuid",
  "sensorReadingId": "uuid"
}
```

### Retrieving Predictions:
```javascript
// Backend API endpoint
GET /api/patients/:patientId/predictions
// Returns array of HealthPrediction records
```

## Environment Variables

### ML Service:
- `DATABASE_URL`: PostgreSQL connection string
- `ML_API_PORT`: API port (default: 8000)
- `ML_MODEL_PATH`: Model storage path
- `ML_OUTPUT_PATH`: Output file path

## Notes

- ML service runs as a separate container for scalability
- Models are persisted in Docker volume `ml_models`
- Health predictions are stored in PostgreSQL for historical analysis
- The system supports real-time predictions as sensor data arrives
- Model training can be triggered periodically or on-demand

