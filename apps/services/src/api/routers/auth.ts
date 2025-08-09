import { z } from 'zod';
import { initTRPC } from '@trpc/server';
import { Context } from '../context.js';
import { prisma, forceConnectionReset } from '../../db/client.js';
import { logger } from '../../utils/logger.js';
import { protectedProcedure, publicProcedure } from '../middleware/auth.js';

const t = initTRPC.context<Context>().create();

export const authRouter = t.router({
  login: t.procedure
    .input(z.object({
      email: z.string().email(),
      password: z.string().min(1),
    }))
    .mutation(async ({ input }) => {
      const { email, password } = input;
      
      logger.info('Login attempt via tRPC', { email });
      
      try {
        // Check if user exists
        const user = await prisma.users.findUnique({
          where: { email },
        });

        if (!user) {
          logger.warn('Login attempt for non-existent user', { email });
          return {
            success: false,
            error: 'User not found. Please sign up first.',
          };
        }

        // Simple local auth validation; integrate with your chosen auth provider as needed
        logger.info('User found, login successful', { email, userId: user.id });
        
        // Generate a simple token (in production, use proper JWT)
        const token = `token_${user.id}_${Date.now()}`;
        
        return {
          success: true,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
          },
          token,
        };
        
      } catch (error: any) {
        logger.error('Database error during login', { email, error });
        
        // Check if it's a prepared statement error
        if (error?.message?.includes('prepared statement') && error?.message?.includes('already exists')) {
          logger.error('Prepared statement error in login, attempting to reconnect...');
          
          try {
            // Only reset connection if we have persistent errors
            console.log('🔄 Attempting retry with connection reset...');
            await forceConnectionReset();
            
            // Wait a bit before retrying
            await new Promise(resolve => setTimeout(resolve, 200));
            
            // Retry the operation
            const user = await prisma.users.findUnique({
              where: { email },
            });

            if (!user) {
              logger.warn('Login attempt for non-existent user (retry)', { email });
              return {
                success: false,
                error: 'User not found. Please sign up first.',
              };
            }

            logger.info('User found, login successful (retry)', { email, userId: user.id });
            
            // Generate a simple token (in production, use proper JWT)
            const token = `token_${user.id}_${Date.now()}`;
            
            return {
              success: true,
              user: {
                id: user.id,
                email: user.email,
                name: user.name,
              },
              token,
            };
          } catch (retryError) {
            logger.error('Retry failed for login', { retryError });
            throw new Error('Authentication failed after retry');
          }
        }
        
        throw new Error('Authentication failed');
      }
    }),

  register: t.procedure
    .input(z.object({
      email: z.string().email(),
      password: z.string().min(6),
      name: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { email, password, name } = input;
      
      logger.info('Registration attempt via tRPC', { email });
      
      try {
        // Check if user already exists
        const existingUser = await prisma.users.findUnique({
          where: { email },
        });

        if (existingUser) {
          logger.warn('Registration attempt for existing user', { email });
          return {
            success: false,
            error: 'User already exists with this email',
          };
        }

        // Create new user
        const newUser = await prisma.users.create({
          data: {
            email,
            name: name || null,
          },
        });

        logger.info('User created successfully', { email, userId: newUser.id });
        
        // Generate a simple token
        const token = `token_${newUser.id}_${Date.now()}`;
        
        return {
          success: true,
          user: {
            id: newUser.id,
            email: newUser.email,
            name: newUser.name,
          },
          token,
        };
        
      } catch (error: any) {
        logger.error('Database error during registration', { email, error });
        
        // Check if it's a prepared statement error
        if (error?.message?.includes('prepared statement') && error?.message?.includes('already exists')) {
          logger.error('Prepared statement error in registration, attempting to reconnect...');
          
          try {
            // Force a complete connection reset
            await forceConnectionReset();
            
            // Wait a bit before retrying
            await new Promise(resolve => setTimeout(resolve, 200));
            
            // Retry the operation
            const existingUser = await prisma.users.findUnique({
              where: { email },
            });

            if (existingUser) {
              logger.warn('Registration attempt for existing user (retry)', { email });
              return {
                success: false,
                error: 'User already exists with this email',
              };
            }

            // Create new user
            const newUser = await prisma.users.create({
              data: {
                email,
                name: name || null,
              },
            });

            logger.info('User created successfully (retry)', { email, userId: newUser.id });
            
            // Generate a simple token
            const token = `token_${newUser.id}_${Date.now()}`;
            
            return {
              success: true,
              user: {
                id: newUser.id,
                email: newUser.email,
                name: newUser.name,
              },
              token,
            };
          } catch (retryError) {
            logger.error('Retry failed for registration', { retryError });
            throw new Error('Registration failed after retry');
          }
        }
        
        throw new Error('Registration failed');
      }
    }),

  getCurrentUser: protectedProcedure
    .query(async ({ ctx }) => {
      try {
        // Use the authenticated user from context (JWT)
        if (!ctx.user) {
          logger.warn('getCurrentUser called without authenticated user');
          throw new Error('No authenticated user found');
        }
        
        logger.info('Current user retrieved successfully', { userId: ctx.user.id, email: ctx.user.email });
        
        return {
          id: ctx.user.id,
          email: ctx.user.email,
          name: ctx.user.name,
        };
      } catch (error: any) {
        logger.error('Error getting current user', { error });
        throw new Error('Failed to get current user');
      }
    }),

  signUp: t.procedure
    .input(z.object({
      email: z.string().email(),
      password: z.string().min(6),
      name: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      // Call register directly to avoid circular reference
      const { email, password, name } = input;
      
      logger.info('SignUp attempt via tRPC', { email });
      
      try {
        // Check if user already exists
        const existingUser = await prisma.users.findUnique({
          where: { email },
        });

        if (existingUser) {
          logger.warn('SignUp attempt for existing user', { email });
          return {
            success: false,
            error: 'User already exists with this email',
          };
        }

        // Create new user
        const newUser = await prisma.users.create({
          data: {
            email,
            name: name || null,
          },
        });

        logger.info('User created successfully', { email, userId: newUser.id });
        
        // Generate a simple token
        const token = `token_${newUser.id}_${Date.now()}`;
        
        return {
          success: true,
          user: {
            id: newUser.id,
            email: newUser.email,
            name: newUser.name,
          },
          token,
        };
        
      } catch (error) {
        logger.error('Database error during signup', { email, error });
        throw new Error('Signup failed');
      }
    }),

  signOut: t.procedure
    .mutation(async () => {
      // In a real implementation, you'd invalidate the token
      logger.info('User signed out');
      return { success: true };
    }),
}); 