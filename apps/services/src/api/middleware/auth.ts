import { TRPCError, initTRPC } from '@trpc/server';
import { Context } from '../context.js';

const t = initTRPC.context<Context>().create();

// Middleware to check if user is authenticated
export const requireAuth = t.middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'You must be logged in to access this resource',
    });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

// Middleware for optional authentication (user can be null)
export const optionalAuth = t.middleware(({ ctx, next }) => {
  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

// Export procedures
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(requireAuth);
export const optionalProcedure = t.procedure.use(optionalAuth); 