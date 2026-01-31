# Testing Guide: Adding Vitals and ML Predictions

## Overview

This guide shows you how to test the complete flow:
1. Add a new vital (sensor reading) for a patient
2. Automatically trigger ML prediction
3. View the prediction results

---

## Prerequisites

1. **Database seeded** with historical data (at least 168 hours = 7 days)
2. **ML models trained**: `docker compose run --rm ml python train.py`
3. **ML API running**: `docker compose up -d ml`
4. **Backend running**: `npm run dev`

---

## Step 1: Check ML API Health

```powershell
# Check if ML API is running and models are loaded
curl http://localhost:8000/api/ml/health

# Or via Node backend
curl http://localhost:3001/api/ml/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "models_loaded": true,
  "service": "AlertCare ML API"
}
```

---

## Step 2: Get a Patient ID

```powershell
# Option 1: Use Prisma Studio
npx prisma studio
# Navigate to patients table and copy an ID

# Option 2: Query database
docker compose exec -T postgres psql -U alertcare -d alertcare_db -c "SELECT id FROM patients LIMIT 1;"
```

---

## Step 3: Add a New Vital (Sensor Reading)

### Using cURL:

```powershell
curl -X POST http://localhost:3001/api/sensor-readings `
  -H "Content-Type: application/json" `
  -d '{
    "patientId": "YOUR_PATIENT_ID",
    "bloodPressure": 125.0,
    "bloodGlucose": 98.0,
    "heartRate": 72.0,
    "activity": 105.0,
    "autoPredict": true
  }'
```

### Using PowerShell (Invoke-RestMethod):

```powershell
$body = @{
    patientId = "YOUR_PATIENT_ID"
    bloodPressure = 125.0
    bloodGlucose = 98.0
    heartRate = 72.0
    activity = 105.0
    autoPredict = $true
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3001/api/sensor-readings" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body
```

### Expected Response:

```json
{
  "success": true,
  "message": "Sensor reading created successfully",
  "data": {
    "reading": {
      "id": "uuid",
      "patientId": "uuid",
      "timestamp": "2024-01-30T12:00:00.000Z",
      "bloodPressure": 125.0,
      "bloodGlucose": 98.0,
      "heartRate": 72.0,
      "activity": 105.0,
      "createdAt": "2024-01-30T12:00:00.000Z"
    },
    "prediction": {
      "id": "uuid",
      "sensorReadingId": "uuid",
      "healthStabilityScore": 85.3,
      "isolationScore": 82.1,
      "lstmScore": 87.5,
      "reconstructionError": 0.0012,
      "riskCategory": "Early Instability",
      "timestamp": "2024-01-30T12:00:00.000Z"
    },
    "predictionError": null,
    "autoPredicted": true
  }
}
```

---

## Step 4: Test Without Auto-Prediction

If you want to add a reading without triggering prediction:

```powershell
curl -X POST http://localhost:3001/api/sensor-readings `
  -H "Content-Type: application/json" `
  -d '{
    "patientId": "YOUR_PATIENT_ID",
    "bloodPressure": 120.0,
    "bloodGlucose": 95.0,
    "heartRate": 70.0,
    "activity": 100.0,
    "autoPredict": false
  }'
```

Then manually trigger prediction:

```powershell
curl -X POST http://localhost:3001/api/ml/predict `
  -H "Content-Type: application/json" `
  -d '{
    "readingId": "READING_ID_FROM_ABOVE"
  }'
```

---

## Step 5: View Patient Readings

```powershell
# Get all readings for a patient
curl http://localhost:3001/api/sensor-readings/patient/YOUR_PATIENT_ID

# With pagination
curl "http://localhost:3001/api/sensor-readings/patient/YOUR_PATIENT_ID?limit=10&offset=0"

# With date range
curl "http://localhost:3001/api/sensor-readings/patient/YOUR_PATIENT_ID?startDate=2024-01-01&endDate=2024-01-30"
```

---

## Step 6: View Predictions

```powershell
# Get all predictions for a patient
curl http://localhost:3001/api/ml/predictions/YOUR_PATIENT_ID
```

---

## Complete Test Flow Example

```powershell
# 1. Get patient ID (replace with actual ID)
$patientId = "b52062dc-c4a5-410f-8e74-e9d9d9073584"

# 2. Add a new vital with auto-prediction
$body = @{
    patientId = $patientId
    bloodPressure = 130.0
    bloodGlucose = 102.0
    heartRate = 75.0
    activity = 110.0
    autoPredict = $true
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:3001/api/sensor-readings" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body

# 3. Check if prediction was created
Write-Host "Reading ID: $($response.data.reading.id)"
Write-Host "Prediction Score: $($response.data.prediction.healthStabilityScore)"
Write-Host "Risk Category: $($response.data.prediction.riskCategory)"

# 4. View all predictions for patient
$predictions = Invoke-RestMethod -Uri "http://localhost:3001/api/ml/predictions/$patientId"
Write-Host "Total Predictions: $($predictions.data.count)"
```

---

## Troubleshooting

### Error: "Insufficient historical data"

**Problem**: Patient doesn't have enough historical readings (need 168+ hours).

**Solution**: 
- Seed more data: `node src/scripts/seed-sensor-data.js --patient-id <id> --days 30`
- Or disable auto-prediction: `"autoPredict": false`

### Error: "ML API error"

**Problem**: ML API is not running or models not loaded.

**Solution**:
```powershell
# Check ML container
docker compose ps ml

# Start ML container
docker compose up -d ml

# Check ML API health
curl http://localhost:8000/api/ml/health
```

### Error: "Patient not found"

**Problem**: Invalid patient ID.

**Solution**: Get correct patient ID from database or Prisma Studio.

---

## API Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/sensor-readings` | Create new vital (auto-predicts by default) |
| GET | `/api/sensor-readings/patient/:patientId` | Get all readings for patient |
| GET | `/api/sensor-readings/:id` | Get single reading |
| PUT | `/api/sensor-readings/:id` | Update reading |
| DELETE | `/api/sensor-readings/:id` | Delete reading |
| POST | `/api/ml/predict` | Manually trigger prediction |
| GET | `/api/ml/predictions/:patientId` | Get all predictions for patient |

---

## Next Steps

After testing:
1. ✅ Add authentication middleware to secure endpoints
2. ✅ Add rate limiting
3. ✅ Add validation for patient ownership
4. ✅ Implement real-time notifications for high-risk predictions
5. ✅ Add batch reading upload endpoint

