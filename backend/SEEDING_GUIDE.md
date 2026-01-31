# Database Seeding Guide

This guide explains how to seed your database with synthetic sensor readings for testing.

## Prerequisites

1. **PostgreSQL running** (via Docker Compose)
2. **ML container running** (for Python simulator)
3. **A patient created** in the database

---

## Step-by-Step Instructions

### Step 1: Start Services

```powershell
cd backend
docker compose up -d
```

This starts:
- PostgreSQL database
- ML container (needed for Python simulator)

---

### Step 2: Create a Test Patient

You need a patient in the database before seeding sensor data. Choose one method:

#### Option A: Using API (Recommended)

```powershell
# Start backend server (if not running)
npm run dev

# In another terminal, create a patient
curl -X POST http://localhost:3001/api/auth/signup `
  -H "Content-Type: application/json" `
  -d '{
    "email": "test.patient@example.com",
    "password": "test123",
    "role": "PATIENT",
    "firstName": "Test",
    "lastName": "Patient"
  }'
```

**Save the response** - it contains the patient ID in the `user.id` field.

#### Option B: Using Prisma Studio (Visual)

```powershell
npx prisma studio
```

1. Open browser to `http://localhost:5555`
2. Go to "users" table
3. Click "Add record"
4. Fill in:
   - `email`: test@example.com
   - `password`: (hashed - use API instead)
   - `role`: PATIENT
5. Go to "patients" table
6. Click "Add record"
7. Fill in `userId` (from users table)
8. **Copy the patient `id`** (UUID)

#### Option C: Using SQL Query

```sql
-- Connect to database
docker compose exec postgres psql -U alertcare -d alertcare_db

-- Create user and patient
INSERT INTO users (id, email, password, role, "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'test@example.com',
  '$2a$10$hashedpassword',  -- Use bcrypt hash
  'PATIENT',
  NOW(),
  NOW()
);

-- Get the user ID, then create patient
INSERT INTO patients (id, "userId", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  '<user-id-from-above>',
  NOW(),
  NOW()
);

-- Get patient ID
SELECT id FROM patients WHERE "userId" = '<user-id>';
```

---

### Step 3: Get Patient ID

After creating a patient, you need the **patient ID** (not user ID).

**From API response:**
```json
{
  "data": {
    "user": {
      "id": "user-uuid",  // This is USER ID
      ...
    }
  }
}
```

To get **patient ID**, query the database:
```sql
SELECT id FROM patients WHERE "userId" = '<user-uuid>';
```

Or use Prisma Studio to view the patients table and copy the `id` field.

---

### Step 4: Run Seed Script

```powershell
cd backend

# Basic: Seed 90 days of healthy baseline data
node src/scripts/seed-sensor-data.js --patient-id <patient-uuid> --days 90

# With deterioration pattern (for testing detection)
node src/scripts/seed-sensor-data.js --patient-id <patient-uuid> --days 90 --deterioration --start-day 60

# Custom number of days
node src/scripts/seed-sensor-data.js --patient-id <patient-uuid> --days 30
```

**Example:**
```powershell
node src/scripts/seed-sensor-data.js --patient-id 550e8400-e29b-41d4-a716-446655440000 --days 90
```

---

### Step 5: Verify Data

#### Check Reading Count

```sql
-- Connect to database
docker compose exec postgres psql -U alertcare -d alertcare_db

-- Count readings for patient
SELECT COUNT(*) FROM sensor_readings WHERE "patientId" = '<patient-id>';

-- Should show ~2160 readings for 90 days (90 * 24 hours)
```

#### View Sample Readings

```sql
SELECT 
  timestamp,
  "bloodPressure",
  "bloodGlucose",
  "heartRate",
  activity
FROM sensor_readings
WHERE "patientId" = '<patient-id>'
ORDER BY timestamp DESC
LIMIT 10;
```

#### Using Prisma Studio

```powershell
npx prisma studio
```

Navigate to `sensor_readings` table and filter by `patientId`.

---

## Complete Example Workflow

```powershell
# 1. Start services
cd backend
docker compose up -d

# 2. Create patient via API
curl -X POST http://localhost:3001/api/auth/signup `
  -H "Content-Type: application/json" `
  -d '{
    "email": "john.doe@example.com",
    "password": "password123",
    "role": "PATIENT",
    "firstName": "John",
    "lastName": "Doe"
  }'

# Response contains user.id - save it!
# Example: {"data":{"user":{"id":"abc-123-uuid",...}}}

# 3. Get patient ID from database
docker compose exec postgres psql -U alertcare -d alertcare_db -c "SELECT id FROM patients WHERE \"userId\" = 'abc-123-uuid';"

# 4. Seed sensor data (replace with actual patient ID)
node src/scripts/seed-sensor-data.js --patient-id <patient-id-from-step-3> --days 90

# 5. Verify
docker compose exec postgres psql -U alertcare -d alertcare_db -c "SELECT COUNT(*) FROM sensor_readings WHERE \"patientId\" = '<patient-id>';"
```

---

## Seed Script Options

```powershell
node src/scripts/seed-sensor-data.js [options]

Required:
  --patient-id <uuid>     Patient ID to seed data for

Optional:
  --days <number>         Number of days to generate (default: 90)
  --deterioration         Include deterioration pattern
  --start-day <number>    Day to start deterioration (default: 60)
```

**Examples:**

```powershell
# 90 days of healthy data (same as training)
node src/scripts/seed-sensor-data.js --patient-id <id> --days 90

# 90 days with deterioration starting at day 60
node src/scripts/seed-sensor-data.js --patient-id <id> --days 90 --deterioration --start-day 60

# 30 days (minimum for good predictions)
node src/scripts/seed-sensor-data.js --patient-id <id> --days 30
```

---

## Troubleshooting

### Error: "Patient with ID ... not found"

**Solution:** Make sure you're using the **patient ID**, not the user ID.

```sql
-- Find patient ID from user email
SELECT p.id as patient_id, u.email
FROM patients p
JOIN users u ON p."userId" = u.id
WHERE u.email = 'test@example.com';
```

### Error: "ML container not running"

**Solution:** Start ML container:
```powershell
docker compose up -d ml
```

### Error: "Insufficient data" when predicting

**Solution:** Seed at least 30 days (720 hours) of data:
```powershell
node src/scripts/seed-sensor-data.js --patient-id <id> --days 30
```

### Data already exists

**Solution:** The script will warn you but continue. To clear existing data:

```sql
DELETE FROM sensor_readings WHERE "patientId" = '<patient-id>';
```

---

## What Gets Seeded

The seed script generates:

- **Timestamp**: Hourly readings (24 per day)
- **Blood Pressure**: 120 ± 10 mmHg (circadian rhythm)
- **Blood Glucose**: 95 ± 15 mg/dL (meal patterns)
- **Heart Rate**: 70 ± 10 bpm (activity-based)
- **Activity**: 100-180 steps/hour (day/night cycle)

**For 90 days:**
- Total readings: 2,160 (90 × 24)
- Time span: 2,160 hours
- Data matches training patterns exactly (same Python simulator, same seed)

---

## Next Steps After Seeding

1. **Train ML models** (if not already trained):
   ```powershell
   docker compose run --rm ml python train.py
   ```

2. **Test prediction**:
   ```powershell
   # Get a reading ID
   # Then call prediction endpoint
   POST /api/ml/predict
   {
     "readingId": "<reading-uuid>"
   }
   ```

3. **View predictions**:
   ```powershell
   GET /api/ml/predictions/<patient-id>
   ```

---

## Quick Reference

```powershell
# Create patient
POST /api/auth/signup

# Get patient ID
SELECT id FROM patients WHERE "userId" = '<user-id>';

# Seed data
node src/scripts/seed-sensor-data.js --patient-id <id> --days 90

# Verify
SELECT COUNT(*) FROM sensor_readings WHERE "patientId" = '<id>';
```

