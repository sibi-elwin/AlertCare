# Dashboard Backend Requirements

This document outlines what backend endpoints need to be implemented to make the frontend dashboards functional.

## Current Status

The dashboards (`frontend/src/app/patient/dashboard/page.tsx` and `frontend/src/app/caregiver/page.tsx`) are currently using **hardcoded data**. They need backend API endpoints to fetch real data.

---

## Patient Dashboard Requirements

### Data Needed:
1. **Current Stability Score** - Latest health stability score
2. **30-Day Stability Trajectory** - Chart data for trend graph
3. **Patient Info** - Name, welcome message
4. **Care Team Guidance** - Recommendations/guidance messages
5. **Recent Changes** - What changed recently in health patterns
6. **Score Trend** - Improvement/decline percentage

### Required Backend Endpoints:

#### 1. `GET /api/patients/:patientId/dashboard`
**Purpose**: Get complete dashboard data for a patient

**Response:**
```json
{
  "success": true,
  "data": {
    "patient": {
      "id": "uuid",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com"
    },
    "currentScore": {
      "healthStabilityScore": 84.2,
      "riskCategory": "Early Instability",
      "timestamp": "2026-01-30T15:50:56.276Z",
      "trend": "up", // "up", "down", "stable"
      "changePercent": 6.0 // Percentage change over last 5 days
    },
    "trajectory": [
      { "day": "01", "score": 92.0, "date": "2026-01-01" },
      { "day": "05", "score": 94.0, "date": "2026-01-05" },
      // ... 30 days of data
    ],
    "guidance": [
      {
        "id": "uuid",
        "message": "Increase evening rest consistency",
        "author": "Dr. Aris",
        "authorType": "doctor",
        "timestamp": "2026-01-29T10:00:00Z",
        "acknowledged": false
      }
    ],
    "recentChanges": {
      "message": "Your sleep onset variability decreased by 14 minutes, contributing to a more stable circadian rhythm.",
      "timestamp": "2026-01-30T12:00:00Z"
    }
  }
}
```

#### 2. `GET /api/patients/:patientId/predictions/trajectory`
**Purpose**: Get stability scores over time for chart

**Query Parameters:**
- `days` (optional): Number of days (default: 30)
- `granularity` (optional): "daily" or "weekly" (default: "daily")

**Response:**
```json
{
  "success": true,
  "data": {
    "trajectory": [
      {
        "date": "2026-01-01",
        "day": "01",
        "score": 92.0,
        "riskCategory": "Stable"
      },
      // ... more data points
    ]
  }
}
```

#### 3. `POST /api/patients/:patientId/sync-wearable`
**Purpose**: Trigger manual sync of wearable device data

**Response:**
```json
{
  "success": true,
  "message": "Wearable sync initiated",
  "data": {
    "syncId": "uuid",
    "status": "pending"
  }
}
```

---

## Caregiver Dashboard Requirements

### Data Needed:
1. **Patient List** - All patients assigned to caregiver
2. **Patient Details** - Selected patient's full information
3. **Stability Trajectory** - Chart data for selected patient
4. **Risk Identification** - Current risk status and recommendations
5. **Caregiver Notes** - Notes added by caregiver
6. **Decomposition Metrics** - Sleep, Cardio, Activity scores

### Required Backend Endpoints:

#### 1. `GET /api/caregivers/:caregiverId/patients`
**Purpose**: Get all patients assigned to a caregiver

**Query Parameters:**
- `search` (optional): Search by name
- `status` (optional): Filter by status ("Stable", "Declining", "Watch")
- `limit` (optional): Pagination limit
- `offset` (optional): Pagination offset

**Response:**
```json
{
  "success": true,
  "data": {
    "patients": [
      {
        "id": "uuid",
        "name": "John Doe",
        "firstName": "John",
        "lastName": "Doe",
        "age": 72,
        "currentScore": {
          "healthStabilityScore": 84.2,
          "riskCategory": "Stable",
          "trend": "up" // "up", "down", "stable"
        },
        "lastSynced": "2026-01-30T15:36:00Z"
      }
    ],
    "pagination": {
      "total": 10,
      "limit": 20,
      "offset": 0
    }
  }
}
```

#### 2. `GET /api/caregivers/:caregiverId/patients/:patientId`
**Purpose**: Get detailed view of a specific patient

**Response:**
```json
{
  "success": true,
  "data": {
    "patient": {
      "id": "uuid",
      "firstName": "Sarah",
      "lastName": "Miller",
      "age": 78,
      "caseId": "SDD-2026-02"
    },
    "currentScore": {
      "healthStabilityScore": 62.5,
      "riskCategory": "Declining",
      "confidence": 94.0,
      "timestamp": "2026-01-30T15:50:56.276Z"
    },
    "trajectory": [
      { "time": "Mon", "sleep": 80, "cardio": 85, "activity": 70 },
      // ... 7 days of data
    ],
    "decomposition": {
      "sleepRhythm": 42.0,
      "cardioVariability": 62.0,
      "activityConsistency": 40.0
    },
    "riskIdentification": {
      "level": "medium", // "low", "medium", "high"
      "message": "Early signs of circadian disruption. Recommended intervention: Review evening medication timing.",
      "recommendations": ["Review evening medication timing"]
    },
    "lastSynced": "2026-01-30T15:36:00Z"
  }
}
```

#### 3. `GET /api/caregivers/:caregiverId/patients/:patientId/notes`
**Purpose**: Get caregiver notes for a patient

**Response:**
```json
{
  "success": true,
  "data": {
    "notes": [
      {
        "id": "uuid",
        "content": "Patient reported feeling tired in the morning",
        "caregiverId": "uuid",
        "caregiverName": "Jane Smith",
        "timestamp": "2026-01-29T10:00:00Z"
      }
    ]
  }
}
```

#### 4. `POST /api/caregivers/:caregiverId/patients/:patientId/notes`
**Purpose**: Add a caregiver note

**Request Body:**
```json
{
  "content": "Add clinical observation..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Note added successfully",
  "data": {
    "note": {
      "id": "uuid",
      "content": "Add clinical observation...",
      "timestamp": "2026-01-30T15:50:56.276Z"
    }
  }
}
```

#### 5. `POST /api/caregivers/:caregiverId/patients/:patientId/guidance`
**Purpose**: Send guidance message to patient

**Request Body:**
```json
{
  "message": "Increase evening rest consistency",
  "priority": "normal" // "low", "normal", "high"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Guidance sent successfully",
  "data": {
    "guidance": {
      "id": "uuid",
      "message": "Increase evening rest consistency",
      "timestamp": "2026-01-30T15:50:56.276Z"
    }
  }
}
```

#### 6. `POST /api/caregivers/:caregiverId/patients/:patientId/flag`
**Purpose**: Flag patient for clinical review

**Request Body:**
```json
{
  "reason": "Early signs of circadian disruption",
  "priority": "medium" // "low", "medium", "high", "urgent"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Patient flagged for clinical review",
  "data": {
    "flag": {
      "id": "uuid",
      "reason": "Early signs of circadian disruption",
      "priority": "medium",
      "timestamp": "2026-01-30T15:50:56.276Z"
    }
  }
}
```

---

## Database Schema Changes Needed

### 1. Add Caregiver-Patient Relationship

```prisma
model Patient {
  // ... existing fields
  caregiverId String?  // Add this
  caregiver   Caregiver? @relation(fields: [caregiverId], references: [id])
}

model Caregiver {
  // ... existing fields
  patients    Patient[]  // Add this
}
```

### 2. Add Guidance/Notes Models

```prisma
model CareTeamGuidance {
  id          String   @id @default(uuid())
  patientId   String
  caregiverId String?  // Optional - can be from doctor too
  doctorId    String?  // Optional
  message     String
  priority    String   @default("normal") // "low", "normal", "high"
  acknowledged Boolean @default(false)
  createdAt   DateTime @default(now())
  
  patient     Patient  @relation(fields: [patientId], references: [id], onDelete: Cascade)
  
  @@index([patientId, createdAt])
  @@map("care_team_guidance")
}

model CaregiverNote {
  id          String   @id @default(uuid())
  patientId   String
  caregiverId String
  content     String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  patient     Patient  @relation(fields: [patientId], references: [id], onDelete: Cascade)
  caregiver   Caregiver @relation(fields: [caregiverId], references: [id], onDelete: Cascade)
  
  @@index([patientId, createdAt])
  @@index([caregiverId])
  @@map("caregiver_notes")
}

model PatientFlag {
  id          String   @id @default(uuid())
  patientId   String
  caregiverId String?  // Who flagged it
  doctorId    String?  // Who flagged it
  reason      String
  priority    String   // "low", "medium", "high", "urgent"
  status      String   @default("pending") // "pending", "reviewed", "resolved"
  createdAt   DateTime @default(now())
  reviewedAt  DateTime?
  
  patient     Patient  @relation(fields: [patientId], references: [id], onDelete: Cascade)
  
  @@index([patientId, status])
  @@index([priority, status])
  @@map("patient_flags")
}
```

---

## Implementation Checklist

### Backend Files to Create:

1. **Controllers:**
   - `backend/src/controllers/patient.controller.js` - Patient dashboard endpoints
   - `backend/src/controllers/caregiver.controller.js` - Caregiver dashboard endpoints

2. **Services:**
   - `backend/src/services/dashboard.service.js` - Dashboard data aggregation logic
   - `backend/src/services/guidance.service.js` - Guidance/notes management

3. **Routes:**
   - `backend/src/routes/patient.routes.js` - Patient routes
   - `backend/src/routes/caregiver.routes.js` - Caregiver routes

4. **Database:**
   - Update `backend/prisma/schema.prisma` with new models
   - Run migration: `npx prisma migrate dev --name add_dashboard_models`

---

## Commands to Start Frontend

### Prerequisites:
```powershell
# Make sure you're in the frontend directory
cd frontend

# Install dependencies (if not already done)
npm install
# or
bun install
```

### Start Development Server:

```powershell
# Using npm
npm run dev

# Using bun (faster)
bun run dev

# Using yarn
yarn dev
```

**Frontend will run on:** `http://localhost:3000`

### Start Production Build:

```powershell
# Build the app
npm run build

# Start production server
npm start
```

---

## Complete Startup Sequence

### 1. Start Backend Services:

```powershell
# Terminal 1: Start PostgreSQL and ML
cd backend
docker compose up -d

# Terminal 2: Start Backend API
cd backend
npm run dev
# Backend runs on http://localhost:3001
```

### 2. Start Frontend:

```powershell
# Terminal 3: Start Frontend
cd frontend
npm run dev
# or
bun run dev
# Frontend runs on http://localhost:3000
```

### 3. Access Dashboards:

- **Patient Dashboard**: `http://localhost:3000/patient/dashboard`
- **Caregiver Dashboard**: `http://localhost:3000/caregiver`

---

## Environment Variables Needed

### Frontend `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Backend `.env` (already exists):
```env
DATABASE_URL=postgresql://alertcare:alertcare_password@localhost:5432/alertcare_db?schema=public
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
PORT=3001
NODE_ENV=development
ML_API_URL=http://localhost:8000
```

---

## Summary

### What's Missing:
1. ❌ Patient dashboard API endpoints
2. ❌ Caregiver dashboard API endpoints
3. ❌ Guidance/Notes database models
4. ❌ Caregiver-Patient relationship in database
5. ❌ Frontend API integration (currently hardcoded data)

### What Exists:
1. ✅ Patient model
2. ✅ Caregiver model
3. ✅ Sensor readings API
4. ✅ ML predictions API
5. ✅ Authentication system

### Next Steps:
1. Update Prisma schema with new models
2. Create dashboard controllers and routes
3. Implement data aggregation services
4. Connect frontend to backend APIs
5. Test end-to-end flow

