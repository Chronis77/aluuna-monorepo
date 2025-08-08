import { initTRPC } from '@trpc/server';
import { Context } from '../context.js';

const t = initTRPC.context<Context>().create();
import { protectedProcedure } from '../middleware/auth.js';
import { z } from 'zod';

export const lifestyleRouter = t.router({
  // ===== DAILY HABITS =====
  
  // Get user's daily habits
  getUserDailyHabits: protectedProcedure
    .input(z.object({
      userId: z.string(),
      category: z.string().optional(),
      isActive: z.boolean().optional()
    }))
    .query(async ({ ctx, input }) => {
      const where: any = { user_id: input.userId };
      if (input.category) {
        where.habit_category = input.category;
      }
      if (input.isActive !== undefined) {
        where.is_active = input.isActive;
      }
      
      return await ctx.prisma.user_daily_habits.findMany({
        where,
        orderBy: { consistency_level: 'desc' }
      });
    }),

  // Create daily habit
  createDailyHabit: protectedProcedure
    .input(z.object({
      userId: z.string(),
      habitName: z.string(),
      habitCategory: z.string().optional(),
      frequency: z.string().optional(),
      consistencyLevel: z.number().min(1).max(10).optional(),
      impactOnWellbeing: z.string().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.user_daily_habits.create({
        data: {
          user_id: input.userId,
          habit_name: input.habitName,
          habit_category: input.habitCategory,
          frequency: input.frequency,
          consistency_level: input.consistencyLevel || 5,
          impact_on_wellbeing: input.impactOnWellbeing
        }
      });
    }),

  // Update daily habit
  updateDailyHabit: protectedProcedure
    .input(z.object({
      habitId: z.string(),
      habitName: z.string().optional(),
      habitCategory: z.string().optional(),
      frequency: z.string().optional(),
      consistencyLevel: z.number().min(1).max(10).optional(),
      impactOnWellbeing: z.string().optional(),
      isActive: z.boolean().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const { habitId, ...updateData } = input;
      return await ctx.prisma.user_daily_habits.update({
        where: { id: habitId },
        data: updateData
      });
    }),

  // ===== SLEEP ROUTINE =====
  
  // Get user's sleep routine
  getUserSleepRoutine: protectedProcedure
    .input(z.object({
      userId: z.string()
    }))
    .query(async ({ ctx, input }) => {
      return await ctx.prisma.user_sleep_routine.findUnique({
        where: { user_id: input.userId }
      });
    }),

  // Create or update sleep routine
  upsertSleepRoutine: protectedProcedure
    .input(z.object({
      userId: z.string(),
      bedtime: z.string().optional(),
      wakeTime: z.string().optional(),
      sleepDurationHours: z.number().optional(),
      sleepQualityRating: z.number().min(1).max(10).optional(),
      sleepHygienePractices: z.array(z.string()).optional(),
      sleepIssues: z.array(z.string()).optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const { userId, ...data } = input;
      return await ctx.prisma.user_sleep_routine.upsert({
        where: { user_id: userId },
        update: data,
        create: {
          user_id: userId,
          ...data
        }
      });
    }),

  // ===== SUBSTANCE USE =====
  
  // Get user's substance use data
  getUserSubstanceUse: protectedProcedure
    .input(z.object({
      userId: z.string(),
      isActive: z.boolean().optional()
    }))
    .query(async ({ ctx, input }) => {
      const where: any = { user_id: input.userId };
      if (input.isActive !== undefined) {
        where.is_active = input.isActive;
      }
      
      return await ctx.prisma.user_substance_use.findMany({
        where,
        orderBy: { impact_level: 'desc' }
      });
    }),

  // Create substance use entry
  createSubstanceUse: protectedProcedure
    .input(z.object({
      userId: z.string(),
      substanceName: z.string(),
      usagePattern: z.string().optional(),
      frequency: z.string().optional(),
      impactLevel: z.number().min(1).max(10).optional(),
      triggers: z.array(z.string()).optional(),
      harmReductionStrategies: z.array(z.string()).optional()
    }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.user_substance_use.create({
        data: {
          user_id: input.userId,
          substance_name: input.substanceName,
          usage_pattern: input.usagePattern,
          frequency: input.frequency,
          impact_level: input.impactLevel || 5,
          triggers: input.triggers,
          harm_reduction_strategies: input.harmReductionStrategies
        }
      });
    }),

  // Update substance use entry
  updateSubstanceUse: protectedProcedure
    .input(z.object({
      substanceId: z.string(),
      substanceName: z.string().optional(),
      usagePattern: z.string().optional(),
      frequency: z.string().optional(),
      impactLevel: z.number().min(1).max(10).optional(),
      triggers: z.array(z.string()).optional(),
      harmReductionStrategies: z.array(z.string()).optional(),
      isActive: z.boolean().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const { substanceId, ...updateData } = input;
      return await ctx.prisma.user_substance_use.update({
        where: { id: substanceId },
        data: updateData
      });
    }),

  // ===== ANALYTICS =====
  
  // Get lifestyle statistics
  getLifestyleStats: protectedProcedure
    .input(z.object({
      userId: z.string()
    }))
    .query(async ({ ctx, input }) => {
      const [habits, sleepRoutine, substanceUse] = await Promise.all([
        ctx.prisma.user_daily_habits.findMany({
          where: {
            user_id: input.userId,
            is_active: true
          }
        }),
        ctx.prisma.user_sleep_routine.findUnique({
          where: { user_id: input.userId }
        }),
        ctx.prisma.user_substance_use.findMany({
          where: {
            user_id: input.userId,
            is_active: true
          }
        })
      ]);

      const totalHabits = habits.length;
      const highConsistencyHabits = habits.filter(h => h.consistency_level >= 8).length;
      const habitCategories = [...new Set(habits.map(h => h.habit_category).filter(Boolean))];
      const averageConsistency = habits.length > 0 
        ? habits.reduce((sum, h) => sum + (h.consistency_level || 0), 0) / habits.length 
        : 0;

      const highImpactSubstances = substanceUse.filter(s => s.impact_level >= 8).length;
      const substanceCategories = [...new Set(substanceUse.map(s => s.substance_name))];

      return {
        // Habits
        totalHabits,
        highConsistencyHabits,
        habitCategories,
        averageConsistency,
        
        // Sleep
        hasSleepRoutine: !!sleepRoutine,
        sleepQuality: sleepRoutine?.sleep_quality_rating || 0,
        sleepDuration: sleepRoutine?.sleep_duration_hours || 0,
        
        // Substance use
        totalSubstances: substanceUse.length,
        highImpactSubstances,
        substanceCategories,
        
        // Overall wellness indicators
        wellnessScore: calculateWellnessScore(habits, sleepRoutine, substanceUse)
      };
    })
});

// Helper function to calculate overall wellness score
function calculateWellnessScore(habits: any[], sleepRoutine: any, substanceUse: any[]): number {
  let score = 50; // Base score
  
  // Habits contribution (0-25 points)
  if (habits.length > 0) {
    const avgConsistency = habits.reduce((sum, h) => sum + (h.consistency_level || 0), 0) / habits.length;
    score += (avgConsistency / 10) * 25;
  }
  
  // Sleep contribution (0-15 points)
  if (sleepRoutine) {
    const sleepScore = (sleepRoutine.sleep_quality_rating || 0) / 10;
    score += sleepScore * 15;
  }
  
  // Substance use penalty (0-10 points deducted)
  const highImpactSubstances = substanceUse.filter(s => s.impact_level >= 8).length;
  score -= Math.min(highImpactSubstances * 2, 10);
  
  return Math.max(0, Math.min(100, Math.round(score)));
} 