const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const { prisma } = require('../prisma/client');

// Validation schemas
const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['PATIENT', 'CAREGIVER']),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  address: z.string().optional(),
  licenseNumber: z.string().optional(),
});

const signinSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// Generate JWT token
const generateToken = (userId, role) => {
  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET || 'fallback-secret-key',
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    }
  );
};

const signup = async (req, res) => {
  try {
    // Validate request body
    const validatedData = signupSchema.parse(req.body);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists',
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 10);

    // Create user and role-specific profile in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          email: validatedData.email,
          password: hashedPassword,
          role: validatedData.role,
        },
      });

      // Create role-specific profile
      if (validatedData.role === 'PATIENT') {
        await tx.patient.create({
          data: {
            userId: user.id,
            firstName: validatedData.firstName,
            lastName: validatedData.lastName,
            phone: validatedData.phone,
            dateOfBirth: validatedData.dateOfBirth
              ? new Date(validatedData.dateOfBirth)
              : null,
            address: validatedData.address,
          },
        });
      } else if (validatedData.role === 'CAREGIVER') {
        await tx.caregiver.create({
          data: {
            userId: user.id,
            firstName: validatedData.firstName,
            lastName: validatedData.lastName,
            phone: validatedData.phone,
            licenseNumber: validatedData.licenseNumber,
          },
        });
      }

      return user;
    });

    // Generate token
    const token = generateToken(result.id, result.role);

    // Return success response
    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        user: {
          id: result.id,
          email: result.email,
          role: result.role,
        },
        token,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors,
      });
    }

    console.error('Signup error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

const signin = async (req, res) => {
  try {
    // Validate request body
    const validatedData = signinSchema.parse(req.body);

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: validatedData.email },
      include: {
        patient: true,
        caregiver: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(
      validatedData.password,
      user.password
    );

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Generate token
    const token = generateToken(user.id, user.role);

    // Prepare user data (exclude password)
    const userData = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    if (user.role === 'PATIENT' && user.patient) {
      userData.profile = user.patient;
    } else if (user.role === 'CAREGIVER' && user.caregiver) {
      userData.profile = user.caregiver;
    }

    // Return success response
    res.json({
      success: true,
      message: 'Sign in successful',
      data: {
        user: userData,
        token,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors,
      });
    }

    console.error('Signin error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

module.exports = {
  signup,
  signin,
};

