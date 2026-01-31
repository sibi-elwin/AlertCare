# Alert Mechanism Implementation Guide

## Overview

The alert mechanism automatically creates alerts based on ML prediction risk categories when new sensor readings are processed. Alerts are routed to caregivers and doctors based on severity.

## Alert Routing Logic

### Risk Categories → Alert Recipients

1. **Early Instability** (Health Score: 70-89)
   - **Recipient**: Caregiver only
   - **Priority**: Normal
   - **Severity**: Low
   - **Message**: "Early Instability Detected: [Patient Name] shows early warning signs (Health Score: [score]). Please monitor closely."

2. **Sustained Deterioration** (Health Score: 50-69)
   - **Recipients**: Both Caregiver and Doctor
   - **Priority**: High
   - **Severity**: Medium
   - **Message**: "Sustained Deterioration Alert: [Patient Name] shows ongoing health decline (Health Score: [score]). Clinical review recommended."

3. **High-Risk Decline** (Health Score: <50)
   - **Recipients**: Both Caregiver and Doctor
   - **Priority**: High
   - **Severity**: Critical
   - **Message**: "CRITICAL ALERT: [Patient Name] shows high-risk decline (Health Score: [score]). Immediate medical attention required."

4. **Stable** (Health Score: ≥90)
   - **No alerts created**

## Implementation Details

### Backend Files

#### 1. `backend/src/services/alert.service.js`
- `determineAlertConfig(riskCategory, healthStabilityScore)` - Determines who to alert and priority
- `createAlertsFromPrediction(patientId, predictionId, riskCategory, healthStabilityScore)` - Creates alerts using `CareTeamGuidance` model
- `getCaregiverAlerts(caregiverId, options)` - Retrieves alerts for a caregiver
- `getDoctorAlerts(doctorId, options)` - Retrieves alerts for a doctor

#### 2. `backend/src/controllers/sensor-reading.controller.js`
- Modified `createReading` to automatically create alerts after ML prediction
- Alerts are created asynchronously and don't block the prediction response

#### 3. `backend/src/controllers/caregiver.controller.js`
- Added `getAlerts` endpoint: `GET /api/caregivers/:caregiverId/alerts`
- Query parameters: `limit`, `offset`, `acknowledged` (true/false)

#### 4. `backend/src/controllers/doctor.controller.js`
- Added `getAlerts` endpoint: `GET /api/doctors/:doctorId/alerts`
- Query parameters: `limit`, `offset`, `acknowledged` (true/false)

### Database Schema

**Reuses existing `CareTeamGuidance` model:**
- `patientId` - Patient who triggered the alert
- `caregiverId` - Caregiver to receive alert (optional)
- `doctorId` - Doctor to receive alert (optional)
- `message` - Alert message with patient name and health score
- `priority` - "low", "normal", "high"
- `acknowledged` - Whether alert has been acknowledged
- `acknowledgedAt` - When alert was acknowledged
- `createdAt` - When alert was created

### API Endpoints

#### Get Caregiver Alerts
```
GET /api/caregivers/:caregiverId/alerts?limit=20&offset=0&acknowledged=false
```

**Response:**
```json
{
  "success": true,
  "data": {
    "alerts": [
      {
        "id": "uuid",
        "patientId": "uuid",
        "caregiverId": "uuid",
        "message": "Early Instability Detected: John Doe shows early warning signs...",
        "priority": "normal",
        "acknowledged": false,
        "createdAt": "2026-01-30T15:50:56.276Z",
        "patient": {
          "id": "uuid",
          "firstName": "John",
          "lastName": "Doe",
          "phone": "+1234567890"
        }
      }
    ],
    "total": 5
  }
}
```

#### Get Doctor Alerts
```
GET /api/doctors/:doctorId/alerts?limit=20&offset=0&acknowledged=false
```

**Response:** Same structure as caregiver alerts

### Frontend Integration

#### 1. `dashboard/lib/api-client.js`
- Added `caregiverDashboardAPI.getAlerts(caregiverId, options)`
- Added `doctorDashboardAPI.getAlerts(doctorId, options)`

#### 2. `dashboard/components/caretaker/alerts-view.jsx`
- Updated to use backend API instead of mock data
- Fetches alerts every 30 seconds
- Displays alerts with patient name, message, priority, and timestamp

#### 3. `dashboard/app/doctor/page.jsx`
- Updated to fetch and display active alerts count in dashboard stats

## How It Works

1. **Sensor Reading Created**: When a caregiver adds a new vital reading via the API
2. **ML Prediction Triggered**: Backend automatically runs ML prediction
3. **Risk Category Determined**: Based on health stability score (0-100)
4. **Alert Creation**: If risk category is not "Stable", alerts are created:
   - System checks for active caregiver and doctor assignments
   - Creates `CareTeamGuidance` records with appropriate `caregiverId` or `doctorId`
   - Sets priority and message based on risk category
5. **Alert Display**: Caregivers and doctors can view alerts in their dashboards

## Testing

### Test Alert Creation

1. **Seed recent data** for a patient:
   ```powershell
   cd backend
   node src/scripts/seed-recent-data.js --patientId <patient-id>
   ```

2. **Add a new sensor reading** with values that will trigger a low health score:
   ```powershell
   # Example: Low health score values
   curl -X POST http://localhost:3001/api/sensor-readings \
     -H "Content-Type: application/json" \
     -d '{
       "patientId": "<patient-id>",
       "bloodPressure": 180,
       "bloodGlucose": 250,
       "heartRate": 110,
       "activity": 20,
       "autoPredict": true
     }'
   ```

3. **Check alerts**:
   ```powershell
   # Get caregiver alerts
   curl http://localhost:3001/api/caregivers/<caregiver-id>/alerts?acknowledged=false
   
   # Get doctor alerts
   curl http://localhost:3001/api/doctors/<doctor-id>/alerts?acknowledged=false
   ```

### Expected Behavior

- **Early Instability** (70-89): Only caregiver receives alert
- **Sustained Deterioration** (50-69): Both caregiver and doctor receive alerts
- **High-Risk Decline** (<50): Both caregiver and doctor receive alerts with high priority
- **Stable** (≥90): No alerts created

## Future Enhancements

1. **Email/SMS Notifications**: Integrate with notification service to send alerts via email/SMS
2. **Alert Acknowledgment**: Add endpoint to acknowledge alerts
3. **Alert History**: Track alert resolution and response times
4. **Alert Escalation**: Auto-escalate unacknowledged critical alerts
5. **Alert Preferences**: Allow users to configure alert thresholds and notification preferences

