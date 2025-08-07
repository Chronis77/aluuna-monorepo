import { initTRPC } from '@trpc/server';
import { Context } from '../context.js';
import { logger } from '../../utils/logger.js';
import { z } from 'zod';

const t = initTRPC.context<Context>().create();

export const onboardingRouter = t.router({
  getOnboardingProgress: t.procedure
    .input(z.object({
      user_id: z.string()
    }))
    .query(async ({ input }) => {
      try {
        // TODO: Implement with actual database
        logger.info('Getting onboarding progress', { userId: input.user_id });
        return { onboarding_data: {} };
      } catch (error) {
        logger.error('Error fetching onboarding progress', { userId: input.user_id, error });
        throw new Error('Failed to fetch onboarding progress');
      }
    }),

  upsertOnboardingProgress: t.procedure
    .input(z.object({
      user_id: z.string(),
      onboarding_data: z.any(),
      updated_at: z.string()
    }))
    .mutation(async ({ input }) => {
      try {
        // TODO: Implement with actual database
        logger.info('Upserting onboarding progress', { userId: input.user_id });
        return { success: true, message: 'Onboarding progress updated' };
      } catch (error) {
        logger.error('Error upserting onboarding progress', { userId: input.user_id, error });
        throw new Error('Failed to upsert onboarding progress');
      }
    }),

  deleteOnboardingProgress: t.procedure
    .input(z.object({
      user_id: z.string()
    }))
    .mutation(async ({ input }) => {
      try {
        // TODO: Implement with actual database
        logger.info('Deleting onboarding progress', { userId: input.user_id });
        return { success: true };
      } catch (error) {
        logger.error('Error deleting onboarding progress', { userId: input.user_id, error });
        throw new Error('Failed to delete onboarding progress');
      }
    }),
}); 