import { Request, Response, NextFunction } from 'express';
import { verifyToken, extractTokenFromHeader } from '../utils/authUtils.js';
import { logger } from '../utils/logger.js';

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
      };
    }
  }
}

/**
 * Authentication middleware to protect routes
 */
export function authenticateToken(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access token required',
        code: 'MISSING_TOKEN'
      });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token',
        code: 'INVALID_TOKEN'
      });
    }

    // Attach user info to request
    req.user = {
      userId: decoded.userId,
      email: decoded.email
    };

    next();
  } catch (error) {
    logger.error('Authentication middleware error', { error });
    return res.status(500).json({
      success: false,
      error: 'Authentication failed',
      code: 'AUTH_ERROR'
    });
  }
}

/**
 * Optional authentication middleware (doesn't fail if no token)
 */
export function optionalAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (token) {
      const decoded = verifyToken(token);
      if (decoded) {
        req.user = {
          userId: decoded.userId,
          email: decoded.email
        };
      }
    }

    next();
  } catch (error) {
    logger.error('Optional authentication middleware error', { error });
    next(); // Continue even if auth fails
  }
}

/**
 * Role-based authorization middleware
 */
export function requireRole(role: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    // You can extend this to check user roles from the database
    // For now, we'll just check if the user exists
    next();
  };
}

/**
 * Rate limiting for auth endpoints
 */
export function authRateLimit(req: Request, res: Response, next: NextFunction) {
  // Simple rate limiting - you might want to use a proper rate limiting library
  const clientIP = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  
  // This is a basic implementation - consider using express-rate-limit for production
  if (!req.app.locals.authAttempts) {
    req.app.locals.authAttempts = new Map();
  }

  const attempts = req.app.locals.authAttempts.get(clientIP) || { count: 0, resetTime: now + 15 * 60 * 1000 }; // 15 minutes

  if (now > attempts.resetTime) {
    attempts.count = 0;
    attempts.resetTime = now + 15 * 60 * 1000;
  }

  attempts.count++;

  if (attempts.count > 5) { // Max 5 attempts per 15 minutes
    return res.status(429).json({
      success: false,
      error: 'Too many authentication attempts. Please try again later.',
      code: 'RATE_LIMITED'
    });
  }

  req.app.locals.authAttempts.set(clientIP, attempts);
  next();
} 