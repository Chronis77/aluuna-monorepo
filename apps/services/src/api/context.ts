import { inferAsyncReturnType } from '@trpc/server';
import { CreateExpressContextOptions } from '@trpc/server/adapters/express';
import { prisma } from '../db/client.js';
import { redis } from '../cache/redis.js';
import { verifyToken, extractTokenFromHeader } from '../utils/authUtils.js';

export async function createContext({ req, res }: CreateExpressContextOptions) {
  let user = null;
  
  try {
    console.log('🔐 Context: Authorization header:', req.headers.authorization ? 'Present' : 'Missing');
    const token = extractTokenFromHeader(req.headers.authorization);
    console.log('🔐 Context: Token extracted:', token ? 'Yes' : 'No');
    
    if (token) {
      const decoded = verifyToken(token);
      console.log('🔐 Context: Token verified:', decoded ? 'Yes' : 'No');
      if (decoded) {
        console.log('🔐 Context: User ID from token:', decoded.userId);
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
        console.log('🔐 Context: User found in DB:', user ? 'Yes' : 'No');
      }
    }
  } catch (error) {
    console.error('Error extracting user from token:', error);
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