/**
 * Database Seed Script for Doctors
 * Creates sample doctor accounts with user accounts
 * 
 * Usage:
 *   node src/scripts/seed-doctors.js [options]
 * 
 * Options:
 *   --count <number>    Number of doctors to create (default: 10)
 */

const bcrypt = require('bcryptjs');
const { prisma } = require('../prisma/client');

// Parse command line arguments
const args = process.argv.slice(2);
const getArg = (name, defaultValue = null) => {
  const index = args.indexOf(`--${name}`);
  return index !== -1 && args[index + 1] ? args[index + 1] : defaultValue;
};

const count = parseInt(getArg('count', '10'));

// Sample doctor data
const doctorSpecializations = [
  'Cardiology',
  'General Medicine',
  'Diabetes & Endocrinology',
  'Arthritis & Rheumatology',
  'Neurology',
  'Dementia & Alzheimer\'s Care',
  'Osteoporosis',
  'COPD & Respiratory',
  'Mental Health & Depression',
  'Geriatrics',
  'Hypertension',
  'Heart Disease',
  'Falls & Fractures',
  'Vision & Hearing',
  'Internal Medicine',
];

const firstNames = [
  'Rajesh', 'Priya', 'Amit', 'Sneha', 'Vikram', 'Anjali', 'Rohit', 'Kavita',
  'Arjun', 'Meera', 'Suresh', 'Deepika', 'Nikhil', 'Pooja', 'Karan',
  'Divya', 'Rahul', 'Shreya', 'Aditya', 'Neha'
];

const lastNames = [
  'Kumar', 'Sharma', 'Patel', 'Singh', 'Reddy', 'Gupta', 'Verma', 'Joshi',
  'Mehta', 'Shah', 'Iyer', 'Nair', 'Rao', 'Desai', 'Malhotra',
  'Chopra', 'Kapoor', 'Agarwal', 'Bansal', 'Goyal'
];

function generateRandomLicense() {
  const prefix = 'LIC';
  const numbers = Math.floor(100000 + Math.random() * 900000);
  return `${prefix}${numbers}`;
}

function generatePhoneNumber() {
  return `+91 ${Math.floor(9000000000 + Math.random() * 1000000000)}`;
}

async function seedDoctors() {
  console.log(`🌱 Starting to seed ${count} doctors...\n`);

  const createdDoctors = [];
  const defaultPassword = 'password123'; // Default password for all seeded doctors
  const hashedPassword = await bcrypt.hash(defaultPassword, 10);

  for (let i = 0; i < count; i++) {
    try {
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const specialization = doctorSpecializations[Math.floor(Math.random() * doctorSpecializations.length)];
      const email = `doctor${i + 1}@alertcare.com`;
      const phone = generatePhoneNumber();
      const licenseNumber = generateRandomLicense();

      // Create user and doctor in a transaction
      const result = await prisma.$transaction(async (tx) => {
        // Create user
        const user = await tx.user.create({
          data: {
            email,
            password: hashedPassword,
            role: 'DOCTOR',
          },
        });

        // Create doctor profile
        const doctor = await tx.doctor.create({
          data: {
            userId: user.id,
            firstName,
            lastName,
            phone,
            licenseNumber,
            specialization,
          },
        });

        return { user, doctor };
      });

      createdDoctors.push({
        id: result.doctor.id,
        name: `${firstName} ${lastName}`,
        email: result.user.email,
        specialization,
        licenseNumber,
        phone,
      });

      console.log(`✅ Created doctor ${i + 1}/${count}: ${firstName} ${lastName} (${specialization})`);
    } catch (error) {
      console.error(`❌ Error creating doctor ${i + 1}:`, error.message);
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Created: ${createdDoctors.length} doctors`);
  console.log(`   Default password for all: ${defaultPassword}`);
  console.log(`\n📋 Created Doctors:`);
  createdDoctors.forEach((doc, index) => {
    console.log(`   ${index + 1}. ${doc.name} - ${doc.specialization}`);
    console.log(`      Email: ${doc.email}`);
    console.log(`      License: ${doc.licenseNumber}`);
    console.log(`      Phone: ${doc.phone}`);
    console.log('');
  });

  console.log(`\n✅ Doctor seeding completed!`);
}

// Run the seed
seedDoctors()
  .catch((error) => {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

