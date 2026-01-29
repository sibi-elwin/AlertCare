# AlertCare Backend API

Backend API for AlertCare application built with Node.js, Express.js, Prisma ORM, and PostgreSQL.

## Features

- User authentication (signup/signin) for Patients and Caregivers
- JWT-based authentication
- PostgreSQL database with Prisma ORM
- Docker setup for PostgreSQL

## Prerequisites

- Node.js (v18 or higher)
- Docker and Docker Compose
- npm or yarn

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Set Up Environment Variables

Create a `.env` file in the backend directory:

```env
# Database
DATABASE_URL="postgresql://alertcare:alertcare_password@localhost:5432/alertcare_db?schema=public"

# JWT Secret
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_EXPIRES_IN="7d"

# Server
PORT=3001
NODE_ENV=development
```

### 3. Start PostgreSQL with Docker

```bash
docker-compose up -d
```

This will start PostgreSQL on port 5432.

### 4. Set Up Prisma

Generate Prisma Client:

```bash
npm run prisma:generate
```

Run database migrations:

```bash
npm run prisma:migrate
```

### 5. Start the Development Server

```bash
npm run dev
```

The server will start on `http://localhost:3001`

## API Endpoints

### Authentication

#### Sign Up
- **POST** `/api/auth/signup`
- **Body:**
  ```json
  {
    "email": "patient@example.com",
    "password": "password123",
    "role": "PATIENT",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "1234567890",
    "dateOfBirth": "1990-01-01",
    "address": "123 Main St"
  }
  ```
  Or for Caregiver:
  ```json
  {
    "email": "caregiver@example.com",
    "password": "password123",
    "role": "CAREGIVER",
    "firstName": "Jane",
    "lastName": "Smith",
    "phone": "1234567890",
    "licenseNumber": "LIC123456"
  }
  ```

#### Sign In
- **POST** `/api/auth/signin`
- **Body:**
  ```json
  {
    "email": "patient@example.com",
    "password": "password123"
  }
  ```

### Health Check

- **GET** `/health`
- Returns server status

## Available Scripts

- `npm run dev` - Start development server with hot reload (Node.js watch mode)
- `npm start` - Start production server
- `npm run prisma:generate` - Generate Prisma Client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio (database GUI)

## Database Schema

The database includes:
- **User** - Base user model with email, password, and role
- **Patient** - Patient-specific information
- **Caregiver** - Caregiver-specific information

## Project Structure

```
backend/
├── src/
│   ├── controllers/     # Request handlers
│   ├── middleware/      # Express middleware
│   ├── routes/          # API routes
│   ├── prisma/          # Prisma client setup
│   └── server.js        # Express app entry point
├── prisma/
│   └── schema.prisma    # Database schema
├── docker-compose.yml   # PostgreSQL Docker setup
└── package.json
```

