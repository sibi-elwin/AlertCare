const pg = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

// 1. Setup the standard PostgreSQL driver
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

// 2. Connect the driver to the Prisma Adapter
const adapter = new PrismaPg(pool);

// 3. Instantiate the Client
const prisma = new PrismaClient({ adapter });

module.exports = { prisma };

