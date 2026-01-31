/**
 * Database Seed Script for Sensor Readings
 * Uses the same synthetic data generator as ML training
 * 
 * Usage:
 *   node src/scripts/seed-sensor-data.js [options]
 * 
 * Options:
 *   --patient-id <uuid>    Patient ID to seed data for (required)
 *   --days <number>        Number of days to generate (default: 90)
 *   --deterioration        Include deterioration pattern (default: false)
 *   --start-day <number>   Day to start deterioration (default: 60)
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
// Use the configured Prisma client with adapter
const { prisma } = require('../prisma/client');

// Parse command line arguments
const args = process.argv.slice(2);
const getArg = (name, defaultValue = null) => {
  const index = args.indexOf(`--${name}`);
  return index !== -1 && args[index + 1] ? args[index + 1] : defaultValue;
};

const patientId = getArg('patient-id');
const days = parseInt(getArg('days', '90'));
const includeDeterioration = args.includes('--deterioration');
const startDay = parseInt(getArg('start-day', '60'));

if (!patientId) {
  console.error('❌ Error: --patient-id is required');
  console.log('\nUsage:');
  console.log('  node src/scripts/seed-sensor-data.js --patient-id <uuid> [options]');
  console.log('\nOptions:');
  console.log('  --patient-id <uuid>     Patient ID (required)');
  console.log('  --days <number>        Number of days (default: 90)');
  console.log('  --deterioration        Include deterioration pattern');
  console.log('  --start-day <number>   Day to start deterioration (default: 60)');
  process.exit(1);
}

/**
 * Generate synthetic sensor data using Python simulator
 * This uses the same WearableDataSimulator as training
 */
async function generateSyntheticData(days, includeDeterioration, startDay) {
  const script = `
import sys
import os
import pandas as pd
sys.path.append('/app')

from data.simulator import WearableDataSimulator
import json
from datetime import datetime

# IMPORTANT: Uses same seed (42) as training data
# This ensures data patterns match the trained models
simulator = WearableDataSimulator(days=${days}, samples_per_day=24)
data = simulator.generate_healthy_baseline()

${includeDeterioration ? `
# Inject deterioration
data = simulator.inject_deterioration(data, start_day=${startDay}, deterioration_type='gradual')
` : ''}

# Convert to JSON format
result = []
for _, row in data.iterrows():
    result.append({
        'timestamp': row['timestamp'].isoformat(),
        'bloodPressure': float(row['blood_pressure']) if pd.notna(row['blood_pressure']) else None,
        'bloodGlucose': float(row['blood_glucose']) if pd.notna(row['blood_glucose']) else None,
        'heartRate': float(row['heart_rate']) if pd.notna(row['heart_rate']) else None,
        'activity': float(row['activity']) if pd.notna(row['activity']) else None,
    })

print(json.dumps(result))
`;

  try {
    // Write temporary Python script locally
    const tempScriptPath = path.join(__dirname, '../../temp_seed_generator.py');
    fs.writeFileSync(tempScriptPath, script);

    // Copy script into container and run it
    // First, copy the file into the container
    const copyCommand = `docker compose cp "${tempScriptPath.replace(/\\/g, '/')}" ml:/app/temp_seed_generator.py`;
    execSync(copyCommand, { 
      cwd: path.join(__dirname, '../..'),
      stdio: 'ignore'
    });

    // Then run it
    const output = execSync(
      `docker compose exec -T ml python /app/temp_seed_generator.py`,
      { 
        cwd: path.join(__dirname, '../..'),
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe']
      }
    );
    
    return JSON.parse(output.trim());
  } catch (error) {
    console.error('❌ Error generating synthetic data:', error.message);
    if (error.stderr) {
      console.error('   Error details:', error.stderr.toString());
    }
    throw error;
  } finally {
    // Clean up temp file locally
    const tempScriptPath = path.join(__dirname, '../../temp_seed_generator.py');
    if (fs.existsSync(tempScriptPath)) {
      try {
        fs.unlinkSync(tempScriptPath);
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  }
}

/**
 * Seed database with sensor readings
 */
async function seedSensorData() {
  try {
    console.log('\n🌱 Starting database seed...');
    console.log(`   Patient ID: ${patientId}`);
    console.log(`   Days: ${days}`);
    console.log(`   Deterioration: ${includeDeterioration ? `Yes (starts day ${startDay})` : 'No'}`);

    // Verify patient exists
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      console.error(`❌ Error: Patient with ID ${patientId} not found`);
      process.exit(1);
    }

    console.log(`✅ Patient found: ${patient.firstName || ''} ${patient.lastName || ''}`);

    // Check if data already exists
    const existingCount = await prisma.sensorReading.count({
      where: { patientId },
    });

    if (existingCount > 0) {
      console.log(`⚠️  Warning: Patient already has ${existingCount} sensor readings`);
      console.log('   Consider clearing existing data first or use a different patient');
    }

    // Generate synthetic data
    console.log('\n📡 Generating synthetic sensor data...');
    const readings = await generateSyntheticData(days, includeDeterioration, startDay);
    console.log(`   Generated ${readings.length} readings`);

    // Insert into database
    console.log('\n💾 Inserting readings into database...');
    let inserted = 0;
    let errors = 0;

    // Batch insert for performance
    const batchSize = 100;
    for (let i = 0; i < readings.length; i += batchSize) {
      const batch = readings.slice(i, i + batchSize);
      
      const createPromises = batch.map(reading => 
        prisma.sensorReading.create({
          data: {
            patientId,
            timestamp: new Date(reading.timestamp),
            bloodPressure: reading.bloodPressure,
            bloodGlucose: reading.bloodGlucose,
            heartRate: reading.heartRate,
            activity: reading.activity,
          },
        }).catch(err => {
          errors++;
          console.error(`   Error inserting reading at ${reading.timestamp}:`, err.message);
          return null;
        })
      );

      const results = await Promise.all(createPromises);
      inserted += results.filter(r => r !== null).length;

      if ((i + batchSize) % 500 === 0 || i + batchSize >= readings.length) {
        process.stdout.write(`   Progress: ${Math.min(i + batchSize, readings.length)}/${readings.length}\r`);
      }
    }

    console.log(`\n✅ Seed complete!`);
    console.log(`   Inserted: ${inserted} readings`);
    if (errors > 0) {
      console.log(`   Errors: ${errors} readings`);
    }

    // Summary
    const totalReadings = await prisma.sensorReading.count({
      where: { patientId },
    });

    const dateRange = await prisma.sensorReading.findMany({
      where: { patientId },
      select: { timestamp: true },
      orderBy: { timestamp: 'asc' },
      take: 1,
    });

    const firstReading = dateRange[0];
    const lastReading = await prisma.sensorReading.findFirst({
      where: { patientId },
      orderBy: { timestamp: 'desc' },
    });

    console.log('\n📊 Summary:');
    console.log(`   Total readings for patient: ${totalReadings}`);
    if (firstReading && lastReading) {
      const hours = (lastReading.timestamp - firstReading.timestamp) / (1000 * 60 * 60);
      console.log(`   Time span: ${hours.toFixed(1)} hours (${(hours / 24).toFixed(1)} days)`);
      console.log(`   First reading: ${firstReading.timestamp.toISOString()}`);
      console.log(`   Last reading: ${lastReading.timestamp.toISOString()}`);
    }

    console.log('\n💡 Next steps:');
    console.log('   1. Train ML models: docker compose run --rm ml python train.py');
    console.log('   2. Test prediction: POST /api/ml/predict with readingId');
    console.log('   3. View predictions: GET /api/ml/predictions/:patientId');

  } catch (error) {
    console.error('\n❌ Seed failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run seed
seedSensorData()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });

