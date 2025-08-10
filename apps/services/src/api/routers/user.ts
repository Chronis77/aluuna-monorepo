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
    .mutation(async ({ input, ctx }) => {
      try {
        logger.info('Upserting value compass', { userId: input.user_id });
        
        const valueCompass = await ctx.prisma.user_value_compass.upsert({
          where: { user_id: input.user_id },
          update: {
            core_values: input.core_values,
            anti_values: input.anti_values || [],
            narrative: input.narrative,
            last_reflected_at: input.last_reflected_at ? new Date(input.last_reflected_at) : new Date()
          },
          create: {
            user_id: input.user_id,
            core_values: input.core_values,
            anti_values: input.anti_values || [],
            narrative: input.narrative,
            last_reflected_at: input.last_reflected_at ? new Date(input.last_reflected_at) : new Date()
          }
        });
        
        logger.info('Value compass upserted successfully', { userId: input.user_id });
        return { success: true, message: 'Value compass updated', data: valueCompass };
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
      timezone: z.string().optional(),
      user_voice_id: z.string().optional(),
      ai_voice_id: z.string().optional()
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        logger.info('Upserting user preferences', { userId: input.user_id });
        
        const userPreferences = await ctx.prisma.user_preferences.upsert({
          where: { user_id: input.user_id },
          update: {
            show_text_response: input.show_text_response,
            play_audio_response: input.play_audio_response,
            preferred_therapist_name: input.preferred_therapist_name,
            daily_reminder_time: input.daily_reminder_time ? new Date(input.daily_reminder_time) : null,
            timezone: input.timezone,
            user_voice_id: input.user_voice_id,
            ai_voice_id: input.ai_voice_id
          },
          create: {
            user_id: input.user_id,
            show_text_response: input.show_text_response ?? true,
            play_audio_response: input.play_audio_response ?? true,
            preferred_therapist_name: input.preferred_therapist_name,
            daily_reminder_time: input.daily_reminder_time ? new Date(input.daily_reminder_time) : null,
            timezone: input.timezone,
            user_voice_id: input.user_voice_id ?? 'alloy',
            ai_voice_id: input.ai_voice_id ?? 'shimmer'
          }
        });
        
        logger.info('User preferences upserted successfully', { userId: input.user_id });
        return { success: true, message: 'User preferences updated', data: userPreferences };
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
    .mutation(async ({ input, ctx }) => {
      try {
        logger.info('Creating emotional trend', { userId: input.user_id });
        
        // Create mood trend entry
        const moodTrend = await ctx.prisma.user_mood_trends.create({
          data: {
            user_id: input.user_id,
            recorded_date: new Date(),
            mood_score: input.mood_score,
            notes: input.notes
          }
        });
        
        // Create emotional states entries
        const emotionalStates = await Promise.all(
          input.emotional_states.map(state =>
            ctx.prisma.user_emotional_states.create({
              data: {
                user_id: input.user_id,
                state_name: state,
                state_description: state,
                physical_sensations: [],
                thoughts_patterns: [],
                behaviors: [],
                intensity_level: 5
              }
            })
          )
        );
        
        // Create suicidal thoughts entry if provided
        let suicidalThoughts = null;
        if (input.suicidal_thoughts) {
          suicidalThoughts = await ctx.prisma.user_suicidal_thoughts.create({
            data: {
              user_id: input.user_id,
              thought_date: new Date(),
              thought_content: input.suicidal_thoughts,
              intensity_level: 5,
              risk_level: 5,
              protective_factors: []
            }
          });
        }
        
        logger.info('Emotional trend created successfully', { 
          userId: input.user_id,
          moodTrendId: moodTrend.id,
          emotionalStatesCount: emotionalStates.length
        });
        
        return { 
          success: true, 
          message: 'Emotional trend created',
          data: {
            mood_trend: moodTrend,
            emotional_states: emotionalStates,
            suicidal_thoughts: suicidalThoughts
          }
        };
      } catch (error) {
        logger.error('Error creating emotional trend', { userId: input.user_id, error });
        throw new Error('Failed to create emotional trend');
      }
    }),

  deleteUserData: t.procedure
    .input(z.object({
      user_id: z.string()
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        logger.info('Deleting user data', { userId: input.user_id });
        
        // Delete all user-related data (cascade will handle most of this)
        await ctx.prisma.users.delete({
          where: { id: input.user_id }
        });
        
        logger.info('User data deleted successfully', { userId: input.user_id });
        return { success: true, message: 'User data deleted' };
      } catch (error) {
        logger.error('Error deleting user data', { userId: input.user_id, error });
        throw new Error('Failed to delete user data');
      }
    }),

  // Get user data
  getUserData: t.procedure
    .input(z.object({
      user_id: z.string()
    }))
    .query(async ({ input, ctx }) => {
      try {
        logger.info('Getting user data', { userId: input.user_id });
        
        const user = await ctx.prisma.users.findUnique({
          where: { id: input.user_id },
          include: {
            user_profile_summary: true,
            user_ai_preferences: true,
            user_preferences: true,
            user_value_compass: true
          }
        });
        
        if (!user) {
          throw new Error('User not found');
        }
        
        logger.info('User data retrieved successfully', { userId: input.user_id });
        return { success: true, data: user };
      } catch (error) {
        logger.error('Error getting user data', { userId: input.user_id, error });
        throw new Error('Failed to get user data');
      }
    }),

  // Update user profile
  updateUserProfile: t.procedure
    .input(z.object({
      user_id: z.string(),
      name: z.string().optional(),
      email: z.string().optional()
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        logger.info('Updating user profile', { userId: input.user_id });
        
        const user = await ctx.prisma.users.update({
          where: { id: input.user_id },
          data: {
            name: input.name,
            email: input.email
          }
        });
        
        logger.info('User profile updated successfully', { userId: input.user_id });
        return { success: true, message: 'User profile updated', data: user };
      } catch (error) {
        logger.error('Error updating user profile', { userId: input.user_id, error });
        throw new Error('Failed to update user profile');
      }
    }),

  // Get user AI preferences
  getUserAIPreferences: t.procedure
    .input(z.object({
      user_id: z.string()
    }))
    .query(async ({ input, ctx }) => {
      try {
        logger.info('Getting user AI preferences', { userId: input.user_id });
        
        const aiPreferences = await ctx.prisma.user_ai_preferences.findUnique({
          where: { user_id: input.user_id }
        });
        
        logger.info('User AI preferences retrieved successfully', { userId: input.user_id });
        return { success: true, data: aiPreferences };
      } catch (error) {
        logger.error('Error getting user AI preferences', { userId: input.user_id, error });
        throw new Error('Failed to get user AI preferences');
      }
    }),

  // Update user AI preferences
  updateUserAIPreferences: t.procedure
    .input(z.object({
      user_id: z.string(),
      ai_voice_style: z.string().optional(),
      growth_vs_support: z.string().optional(),
      pushback_level: z.number().min(1).max(10).optional(),
      self_awareness_level: z.number().min(1).max(10).optional(),
      goal_modeling_level: z.number().min(1).max(10).optional(),
      therapeutic_approach: z.string().optional(),
      validation_vs_challenge: z.number().min(1).max(10).optional(),
      directness_level: z.number().min(1).max(10).optional(),
      emotional_tone: z.string().optional(),
      reflection_depth: z.number().min(1).max(10).optional(),
      memory_recall_frequency: z.number().min(1).max(10).optional(),
      goal_focus_level: z.number().min(1).max(10).optional(),
      session_length_preference: z.string().optional(),
      voice_output_style: z.string().optional(),
      check_in_frequency: z.string().optional(),
      crisis_sensitivity_level: z.number().min(1).max(10).optional(),
      preferred_language: z.string().optional(),
      notes: z.string().optional()
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        logger.info('Updating user AI preferences', { userId: input.user_id });
        
        const { user_id, ...preferences } = input;
        
        const aiPreferences = await ctx.prisma.user_ai_preferences.upsert({
          where: { user_id },
          update: preferences,
          create: {
            user_id,
            ...preferences
          }
        });
        
        logger.info('User AI preferences updated successfully', { userId: input.user_id });
        return { success: true, message: 'User AI preferences updated', data: aiPreferences };
      } catch (error) {
        logger.error('Error updating user AI preferences', { userId: input.user_id, error });
        throw new Error('Failed to update user AI preferences');
      }
    })
}); 