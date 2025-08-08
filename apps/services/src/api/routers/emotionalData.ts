import { initTRPC } from '@trpc/server';
import { Context } from '../context.js';
import { protectedProcedure } from '../middleware/auth.js';
import { z } from 'zod';

const t = initTRPC.context<Context>().create();

export const emotionalDataRouter = t.router({
  // ===== EMOTIONAL STATES =====
  
  // Get user's emotional states
  getUserEmotionalStates: protectedProcedure
    .input(z.object({
      userId: z.string(),
      isActive: z.boolean().optional()
    }))
    .query(async ({ ctx, input }) => {
      const where: any = { user_id: input.userId };
      if (input.isActive !== undefined) {
        where.is_active = input.isActive;
      }
      
      return await ctx.prisma.user_emotional_states.findMany({
        where,
        orderBy: { intensity_level: 'desc' }
      });
    }),

  // Create emotional state
  createEmotionalState: protectedProcedure
    .input(z.object({
      userId: z.string(),
      stateName: z.string(),
      stateDescription: z.string().optional(),
      physicalSensations: z.array(z.string()).optional(),
      thoughtsPatterns: z.array(z.string()).optional(),
      behaviors: z.array(z.string()).optional(),
      intensityLevel: z.number().min(1).max(10).optional()
    }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.user_emotional_states.create({
        data: {
          user_id: input.userId,
          state_name: input.stateName,
          state_description: input.stateDescription,
          physical_sensations: input.physicalSensations,
          thoughts_patterns: input.thoughtsPatterns,
          behaviors: input.behaviors,
          intensity_level: input.intensityLevel || 5
        }
      });
    }),

  // Update emotional state
  updateEmotionalState: protectedProcedure
    .input(z.object({
      stateId: z.string(),
      stateName: z.string().optional(),
      stateDescription: z.string().optional(),
      physicalSensations: z.array(z.string()).optional(),
      thoughtsPatterns: z.array(z.string()).optional(),
      behaviors: z.array(z.string()).optional(),
      intensityLevel: z.number().min(1).max(10).optional(),
      isActive: z.boolean().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const { stateId, ...updateData } = input;
      return await ctx.prisma.user_emotional_states.update({
        where: { id: stateId },
        data: updateData
      });
    }),

  // ===== EMOTIONAL PATTERNS =====
  
  // Get user's emotional patterns
  getUserEmotionalPatterns: protectedProcedure
    .input(z.object({
      userId: z.string(),
      isActive: z.boolean().optional()
    }))
    .query(async ({ ctx, input }) => {
      const where: any = { user_id: input.userId };
      if (input.isActive !== undefined) {
        where.is_active = input.isActive;
      }
      
      return await ctx.prisma.user_emotional_patterns.findMany({
        where,
        orderBy: { intensity_level: 'desc' }
      });
    }),

  // Create emotional pattern
  createEmotionalPattern: protectedProcedure
    .input(z.object({
      userId: z.string(),
      patternName: z.string(),
      emotionalState: z.string().optional(),
      triggers: z.array(z.string()).optional(),
      durationPattern: z.string().optional(),
      intensityLevel: z.number().min(1).max(10).optional(),
      copingStrategies: z.array(z.string()).optional()
    }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.user_emotional_patterns.create({
        data: {
          user_id: input.userId,
          pattern_name: input.patternName,
          emotional_state: input.emotionalState,
          triggers: input.triggers,
          duration_pattern: input.durationPattern,
          intensity_level: input.intensityLevel || 5,
          coping_strategies: input.copingStrategies
        }
      });
    }),

  // ===== MOOD TRENDS =====
  
  // Get user's mood trends
  getUserMoodTrends: protectedProcedure
    .input(z.object({
      userId: z.string(),
      startDate: z.string().optional(), // ISO date string
      endDate: z.string().optional(), // ISO date string
      limit: z.number().optional()
    }))
    .query(async ({ ctx, input }) => {
      const where: any = { user_id: input.userId };
      
      if (input.startDate || input.endDate) {
        where.recorded_date = {};
        if (input.startDate) {
          where.recorded_date.gte = new Date(input.startDate);
        }
        if (input.endDate) {
          where.recorded_date.lte = new Date(input.endDate);
        }
      }
      
      return await ctx.prisma.user_mood_trends.findMany({
        where,
        orderBy: { recorded_date: 'desc' },
        take: input.limit || 30
      });
    }),

  // Create mood trend entry
  createMoodTrend: protectedProcedure
    .input(z.object({
      userId: z.string(),
      recordedDate: z.string(), // ISO date string
      moodScore: z.number().min(1).max(10),
      moodLabel: z.string().optional(),
      contributingFactors: z.array(z.string()).optional(),
      notes: z.string().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.user_mood_trends.create({
        data: {
          user_id: input.userId,
          recorded_date: new Date(input.recordedDate),
          mood_score: input.moodScore,
          mood_label: input.moodLabel,
          contributing_factors: input.contributingFactors,
          notes: input.notes
        }
      });
    }),

  // ===== EMOTIONAL TRENDS =====
  
  // Get user's emotional trends
  getUserEmotionalTrends: protectedProcedure
    .input(z.object({
      userId: z.string(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      limit: z.number().optional()
    }))
    .query(async ({ ctx, input }) => {
      const where: any = { user_id: input.userId };
      
      if (input.startDate || input.endDate) {
        where.recorded_at = {};
        if (input.startDate) {
          where.recorded_at.gte = new Date(input.startDate);
        }
        if (input.endDate) {
          where.recorded_at.lte = new Date(input.endDate);
        }
      }
      
      return await ctx.prisma.user_emotional_trends.findMany({
        where,
        orderBy: { recorded_at: 'desc' },
        take: input.limit || 30
      });
    }),

  // Create emotional trend entry
  createEmotionalTrend: protectedProcedure
    .input(z.object({
      userId: z.string(),
      moodScore: z.number().min(1).max(10),
      moodLabel: z.string().optional(),
      notes: z.string().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.user_emotional_trends.create({
        data: {
          user_id: input.userId,
          mood_score: input.moodScore,
          mood_label: input.moodLabel,
          notes: input.notes
        }
      });
    }),

  // ===== ANALYTICS =====
  
  // Get emotional data statistics
  getEmotionalStats: protectedProcedure
    .input(z.object({
      userId: z.string(),
      days: z.number().optional()
    }))
    .query(async ({ ctx, input }) => {
      const days = input.days || 30;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const [moodTrends, emotionalTrends, emotionalStates, emotionalPatterns] = await Promise.all([
        ctx.prisma.user_mood_trends.findMany({
          where: {
            user_id: input.userId,
            recorded_date: { gte: startDate }
          },
          orderBy: { recorded_date: 'desc' }
        }),
        ctx.prisma.user_emotional_trends.findMany({
          where: {
            user_id: input.userId,
            recorded_at: { gte: startDate }
          },
          orderBy: { recorded_at: 'desc' }
        }),
        ctx.prisma.user_emotional_states.findMany({
          where: {
            user_id: input.userId,
            is_active: true
          }
        }),
        ctx.prisma.user_emotional_patterns.findMany({
          where: {
            user_id: input.userId,
            is_active: true
          }
        })
      ]);

      const averageMood = moodTrends.length > 0 
        ? moodTrends.reduce((sum, t) => sum + t.mood_score, 0) / moodTrends.length 
        : 0;

      const averageEmotionalScore = emotionalTrends.length > 0 
        ? emotionalTrends.reduce((sum, t) => sum + t.mood_score, 0) / emotionalTrends.length 
        : 0;

      const highIntensityStates = emotionalStates.filter(s => s.intensity_level >= 8).length;
      const highIntensityPatterns = emotionalPatterns.filter(p => p.intensity_level >= 8).length;

      return {
        averageMood,
        averageEmotionalScore,
        totalMoodEntries: moodTrends.length,
        totalEmotionalEntries: emotionalTrends.length,
        totalEmotionalStates: emotionalStates.length,
        totalEmotionalPatterns: emotionalPatterns.length,
        highIntensityStates,
        highIntensityPatterns,
        moodTrend: moodTrends.slice(0, 7).reverse(), // Last 7 days
        emotionalTrend: emotionalTrends.slice(0, 7).reverse() // Last 7 days
      };
    })
}); 