/**
 * Database Seed Script for Caregivers
 * Creates sample caregiver accounts with user accounts
 * 
 * Usage:
 *   node src/scripts/seed-caregivers.js [options]
 * 
 * Options:
 *   --count <number>    Number of caregivers to create (default: 10)
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

// Sample caregiver data
const firstNames = [
  'Priya', 'Rajesh', 'Anjali', 'Vikram', 'Sneha', 'Amit', 'Kavita', 'Rohit',
  'Meera', 'Arjun', 'Pooja', 'Nikhil', 'Deepika', 'Suresh', 'Divya',
  'Karan', 'Shreya', 'Rahul', 'Neha', 'Aditya'
];

const lastNames = [
  'Sharma', 'Kumar', 'Patel', 'Singh', 'Reddy', 'Gupta', 'Verma', 'Joshi',
  'Mehta', 'Shah', 'Iyer', 'Nair', 'Rao', 'Desai', 'Malhotra',
  'Chopra', 'Kapoor', 'Agarwal', 'Bansal', 'Goyal'
];

function generateRandomLicense() {
  const prefix = 'CG';
  const numbers = Math.floor(100000 + Math.random() * 900000);
  return `${prefix}${numbers}`;
}

function generatePhoneNumber() {
  return `+91 ${Math.floor(9000000000 + Math.random() * 1000000000)}`;
}

async function seedCaregivers() {
  console.log(`🌱 Starting to seed ${count} caregivers...\n`);

  const createdCaregivers = [];
  const defaultPassword = 'password123'; // Default password for all seeded caregivers
  const hashedPassword = await bcrypt.hash(defaultPassword, 10);

  for (let i = 0; i < count; i++) {
    try {
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const email = `caregiver${i + 1}@alertcare.com`;
      const phone = generatePhoneNumber();
      const licenseNumber = generateRandomLicense();

      // Create user and caregiver in a transaction
      const result = await prisma.$transaction(async (tx) => {
        // Create user
        const user = await tx.user.create({
          data: {
            email,
            password: hashedPassword,
            role: 'CAREGIVER',
          },
        });

        // Create caregiver profile
        const caregiver = await tx.caregiver.create({
          data: {
            userId: user.id,
            firstName,
            lastName,
            phone,
            licenseNumber,
          },
        });

        return { user, caregiver };
      });

      createdCaregivers.push({
        id: result.caregiver.id,
        name: `${firstName} ${lastName}`,
        email: result.user.email,
        licenseNumber,
        phone,
      });

      console.log(`✅ Created caregiver ${i + 1}/${count}: ${firstName} ${lastName}`);
    } catch (error) {
      console.error(`❌ Error creating caregiver ${i + 1}:`, error.message);
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Created: ${createdCaregivers.length} caregivers`);
  console.log(`   Default password for all: ${defaultPassword}`);
  console.log(`\n📋 Created Caregivers:`);
  createdCaregivers.forEach((cg, index) => {
    console.log(`   ${index + 1}. ${cg.name}`);
    console.log(`      Email: ${cg.email}`);
    console.log(`      License: ${cg.licenseNumber}`);
    console.log(`      Phone: ${cg.phone}`);
    console.log('');
  });

  console.log(`\n✅ Caregiver seeding completed!`);
}

// Run the seed
seedCaregivers()
  .catch((error) => {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

