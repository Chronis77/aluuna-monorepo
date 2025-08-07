import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../db/client.js';
import { 
  hashPassword, 
  verifyPassword, 
  generateToken, 
  generateRefreshToken,
  isValidEmail,
  validatePassword,
  sanitizeUser,
  AuthResult
} from '../utils/authUtils.js';
import { authenticateToken, authRateLimit } from '../middleware/authMiddleware.js';
import { logger } from '../utils/logger.js';

const router = Router();

// Validation schemas
const signupSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

/**
 * POST /api/auth/signup
 * Register a new user
 */
router.post('/signup', authRateLimit, async (req: Request, res: Response) => {
  try {
    // Validate input
    const validation = signupSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid input data',
        details: validation.error.errors
      });
    }

    const { email, password, name } = validation.data;

    // Check if user already exists
    const existingUser = await prisma.users.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'User with this email already exists',
        code: 'USER_EXISTS'
      });
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        success: false,
        error: 'Password does not meet requirements',
        details: passwordValidation.errors
      });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await prisma.users.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        name: name || null,
        created_at: new Date(),
        updated_at: new Date()
      }
    });

    // Generate tokens
    const token = generateToken({ userId: user.id, email: user.email });
    const refreshToken = generateRefreshToken({ userId: user.id, email: user.email });

    // Log successful signup
    logger.info('User signed up successfully', { userId: user.id, email: user.email });

    // Return success response
    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        user: sanitizeUser(user),
        token,
        refreshToken
      }
    });

  } catch (error) {
    logger.error('Signup error', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to create user'
    });
  }
});

/**
 * POST /api/auth/login
 * Authenticate user and return tokens
 */
router.post('/login', authRateLimit, async (req: Request, res: Response) => {
  try {
    // Validate input
    const validation = loginSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid input data',
        details: validation.error.errors
      });
    }

    const { email, password } = validation.data;

    // Find user
    const user = await prisma.users.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password);
    if (!isValidPassword) {
      logger.warn('Failed login attempt', { email: email.toLowerCase() });
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Generate tokens
    const token = generateToken({ userId: user.id, email: user.email });
    const refreshToken = generateRefreshToken({ userId: user.id, email: user.email });

    // Update last login
    await prisma.users.update({
      where: { id: user.id },
      data: { updated_at: new Date() }
    });

    // Log successful login
    logger.info('User logged in successfully', { userId: user.id, email: user.email });

    // Return success response
    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: sanitizeUser(user),
        token,
        refreshToken
      }
    });

  } catch (error) {
    logger.error('Login error', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to authenticate user'
    });
  }
});

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    // Validate input
    const validation = refreshTokenSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid input data',
        details: validation.error.errors
      });
    }

    const { refreshToken } = validation.data;

    // Verify refresh token
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production') as any;

    if (!decoded || !decoded.userId || !decoded.email) {
      return res.status(401).json({
        success: false,
        error: 'Invalid refresh token',
        code: 'INVALID_REFRESH_TOKEN'
      });
    }

    // Check if user still exists
    const user = await prisma.users.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // Generate new tokens
    const newToken = generateToken({ userId: user.id, email: user.email });
    const newRefreshToken = generateRefreshToken({ userId: user.id, email: user.email });

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        token: newToken,
        refreshToken: newRefreshToken
      }
    });

  } catch (error) {
    logger.error('Token refresh error', { error });
    res.status(401).json({
      success: false,
      error: 'Invalid refresh token'
    });
  }
});

/**
 * POST /api/auth/logout
 * Logout user (client should discard tokens)
 */
router.post('/logout', authenticateToken, async (req: Request, res: Response) => {
  try {
    // In a more advanced setup, you might want to blacklist the token
    // For now, we'll just return success and let the client discard the token

    logger.info('User logged out', { userId: req.user?.userId });

    res.json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    logger.error('Logout error', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to logout'
    });
  }
});

/**
 * GET /api/auth/me
 * Get current user information
 */
router.get('/me', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = await prisma.users.findUnique({
      where: { id: req.user!.userId }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        user: sanitizeUser(user)
      }
    });

  } catch (error) {
    logger.error('Get user error', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get user information'
    });
  }
});

/**
 * PUT /api/auth/profile
 * Update user profile
 */
router.put('/profile', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { name, email } = req.body;

    // Validate email if provided
    if (email && !isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format'
      });
    }

    // Check if email is already taken by another user
    if (email) {
      const existingUser = await prisma.users.findFirst({
        where: {
          email: email.toLowerCase(),
          id: { not: req.user!.userId }
        }
      });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          error: 'Email is already taken'
        });
      }
    }

    // Update user
    const updatedUser = await prisma.users.update({
      where: { id: req.user!.userId },
      data: {
        ...(name && { name }),
        ...(email && { email: email.toLowerCase() }),
        updated_at: new Date()
      }
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: sanitizeUser(updatedUser)
      }
    });

  } catch (error) {
    logger.error('Update profile error', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to update profile'
    });
  }
});

/**
 * POST /api/auth/change-password
 * Change user password
 */
router.post('/change-password', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Current password and new password are required'
      });
    }

    // Get user with password
    const user = await prisma.users.findUnique({
      where: { id: req.user!.userId }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Verify current password
    const isValidCurrentPassword = await verifyPassword(currentPassword, user.password);
    if (!isValidCurrentPassword) {
      return res.status(401).json({
        success: false,
        error: 'Current password is incorrect'
      });
    }

    // Validate new password
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        success: false,
        error: 'New password does not meet requirements',
        details: passwordValidation.errors
      });
    }

    // Hash new password
    const hashedNewPassword = await hashPassword(newPassword);

    // Update password
    await prisma.users.update({
      where: { id: req.user!.userId },
      data: {
        password: hashedNewPassword,
        updated_at: new Date()
      }
    });

    logger.info('User changed password', { userId: req.user!.userId });

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    logger.error('Change password error', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to change password'
    });
  }
});

export default router; 