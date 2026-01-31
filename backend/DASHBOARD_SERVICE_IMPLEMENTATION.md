# Dashboard Service Implementation Analysis

## Error Found
**Location:** `backend/src/services/dashboard.service.js:85`
**Error:** `TypeError: Cannot read properties of undefined (reading 'findMany')`
**Issue:** `prisma.careTeamGuidance` is undefined

## Root Cause
The Prisma client needs to be regenerated after schema changes. The `CareTeamGuidance` model exists in the schema but the Prisma client hasn't been regenerated to include it.

## Implementation Details

### 1. **getPatientDashboard(patientId)** - Line 7
**Purpose:** Aggregates patient dashboard data

**What it does:**
- ✅ Fetches patient info with user email
- ✅ Gets latest health prediction (current score)
- ✅ Gets predictions for last 30 days
- ✅ Calculates trend (comparing last 5 days vs previous 5 days)
- ✅ Formats trajectory data (daily aggregation)
- ❌ **FAILS HERE:** Gets unacknowledged guidance (line 85)
- ✅ Formats guidance messages
- ✅ Calculates recent changes (last 7 days vs previous 7 days)

**Returns:**
```javascript
{
  patient: { id, firstName, lastName, email },
  currentScore: { healthStabilityScore, riskCategory, timestamp, trend, changePercent },
  trajectory: [{ day, date, score, riskCategory }],
  guidance: [{ id, message, author, authorType, timestamp, acknowledged }],
  recentChanges: { message, timestamp } | null
}
```

### 2. **getPatientTrajectory(patientId, days, granularity)** - Line 166
**Purpose:** Gets trajectory data for charts

**What it does:**
- ✅ Fetches predictions for specified days
- ✅ Supports 'daily' and 'weekly' granularity
- ✅ Aggregates scores by day/week
- ✅ Returns formatted trajectory data

**Returns:**
```javascript
[
  { day, date, score, riskCategory } // for daily
  // OR
  { date, score, riskCategory } // for weekly
]
```

## Issues to Fix

### Issue 1: Prisma Client Not Regenerated
**Problem:** `prisma.careTeamGuidance` is undefined
**Solution:** Run `npx prisma generate` to regenerate Prisma client

### Issue 2: Missing Error Handling
**Problem:** If `careTeamGuidance` is undefined, the entire function crashes
**Solution:** Add try-catch or check if model exists before using

### Issue 3: Missing Data Validation
**Problem:** No validation if patient has no predictions yet
**Solution:** Handle empty predictions array gracefully

## Required Actions

1. **Regenerate Prisma Client:**
   ```bash
   cd backend
   npx prisma generate
   ```

2. **Add Error Handling:**
   ```javascript
   // In dashboard.service.js line 85
   let guidance = [];
   try {
     guidance = await prisma.careTeamGuidance.findMany({...});
   } catch (error) {
     console.error('Error fetching guidance:', error);
     // Continue with empty array
   }
   ```

3. **Verify Database Migrations:**
   ```bash
   npx prisma migrate status
   # If needed:
   npx prisma migrate dev
   ```

## Current Implementation Status

| Feature | Status | Notes |
|---------|--------|-------|
| Patient Info Fetch | ✅ Working | Includes user email |
| Latest Prediction | ✅ Working | Returns null if none |
| 30-Day Predictions | ✅ Working | Empty array if none |
| Trend Calculation | ✅ Working | Requires 10+ predictions |
| Trajectory Formatting | ✅ Working | Daily aggregation |
| Guidance Fetch | ❌ **BROKEN** | Prisma client issue |
| Recent Changes | ✅ Working | Requires 14+ predictions |
| Trajectory Function | ✅ Working | Supports daily/weekly |

## Dependencies

- `prisma.patient` - ✅ Working
- `prisma.healthPrediction` - ✅ Working
- `prisma.careTeamGuidance` - ❌ **BROKEN** (needs Prisma client regeneration)
- `prisma.user` - ✅ Working (via patient include)

