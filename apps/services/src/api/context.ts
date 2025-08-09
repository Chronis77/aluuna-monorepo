import { inferAsyncReturnType } from '@trpc/server';
import { CreateExpressContextOptions } from '@trpc/server/adapters/express';
import { prisma } from '../db/client.js';
import { redis } from '../cache/redis.js';
import { verifyToken, extractTokenFromHeader } from '../utils/authUtils.js';
import { logger } from '../utils/logger.js';

export async function createContext({ req, res }: CreateExpressContextOptions) {
  let user = null;
  
  try {
    logger.debug('🔐 Context: Authorization header check', { present: Boolean(req.headers.authorization) });
    const token = extractTokenFromHeader(req.headers.authorization);
    logger.debug('🔐 Context: Token extracted', { present: Boolean(token) });
    
    if (token) {
      const decoded = verifyToken(token);
      logger.debug('🔐 Context: Token verified', { verified: Boolean(decoded) });
      if (decoded) {
        logger.debug('🔐 Context: User ID from token', { userId: decoded.userId });
        user = await prisma.users.findUnique({
          where: { id: decoded.userId },
          select: {
            id: true,
            email: true,
            name: true,
            created_at: true,
            onboarding_skipped: true,
            updated_at: true,
          },
        });
        logger.debug('🔐 Context: User found in DB', { found: Boolean(user) });
      }
    }
  } catch (error) {
    logger.error('Error extracting user from token', { error });
    // Don't throw error, just continue without user
  }

  return {
    req,
    res,
    prisma,
    redis,
    user,
  };
}

export type Context = inferAsyncReturnType<typeof createContext>; 