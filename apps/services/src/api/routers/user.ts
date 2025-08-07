import { initTRPC } from '@trpc/server';
import { Context } from '../context.js';
import { logger } from '../../utils/logger.js';
import { z } from 'zod';
import { protectedProcedure, publicProcedure } from '../middleware/auth.js';

const t = initTRPC.context<Context>().create();

export const userRouter = t.router({
  upsertValueCompass: t.procedure
    .input(z.object({
      user_id: z.string(),
      core_values: z.array(z.string()),
      anti_values: z.array(z.string()).optional(),
      narrative: z.string().optional(),
      last_reflected_at: z.string().optional()
    }))
    .mutation(async ({ input }) => {
      try {
        // TODO: Implement with actual database
        logger.info('Upserting value compass', { userId: input.user_id });
        return { success: true, message: 'Value compass updated' };
      } catch (error) {
        logger.error('Error upserting value compass', { userId: input.user_id, error });
        throw new Error('Failed to upsert value compass');
      }
    }),

  upsertUserPreferences: t.procedure
    .input(z.object({
      user_id: z.string(),
      show_text_response: z.boolean().optional(),
      play_audio_response: z.boolean().optional(),
      preferred_therapist_name: z.string().optional(),
      daily_reminder_time: z.string().nullable().optional(),
      timezone: z.string().optional()
    }))
    .mutation(async ({ input }) => {
      try {
        // TODO: Implement with actual database
        logger.info('Upserting user preferences', { userId: input.user_id });
        return { success: true, message: 'User preferences updated' };
      } catch (error) {
        logger.error('Error upserting user preferences', { userId: input.user_id, error });
        throw new Error('Failed to upsert user preferences');
      }
    }),

  createEmotionalTrend: protectedProcedure
    .input(z.object({
      user_id: z.string(),
      mood_score: z.number(),
      emotional_states: z.array(z.string()),
      suicidal_thoughts: z.string().optional(),
      notes: z.string().optional()
    }))
    .mutation(async ({ input }) => {
      try {
        // TODO: Implement with actual database
        logger.info('Creating emotional trend', { userId: input.user_id });
        return { success: true, message: 'Emotional trend created' };
      } catch (error) {
        logger.error('Error creating emotional trend', { userId: input.user_id, error });
        throw new Error('Failed to create emotional trend');
      }
    }),

  deleteUserData: t.procedure
    .input(z.object({
      user_id: z.string()
    }))
    .mutation(async ({ input }) => {
      try {
        // TODO: Implement with actual database
        logger.info('Deleting user data', { userId: input.user_id });
        return { success: true, message: 'User data deleted' };
      } catch (error) {
        logger.error('Error deleting user data', { userId: input.user_id, error });
        throw new Error('Failed to delete user data');
      }
    }),
}); 