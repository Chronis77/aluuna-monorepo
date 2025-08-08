import { initTRPC } from '@trpc/server';
import { Context } from '../context.js';

const t = initTRPC.context<Context>().create();
import { protectedProcedure } from '../middleware/auth.js';
import { z } from 'zod';

export const therapyRouter = t.router({
  // ===== THERAPY PREFERENCES =====
  
  // Get user's therapy preferences
  getUserTherapyPreferences: protectedProcedure
    .input(z.object({
      userId: z.string()
    }))
    .query(async ({ ctx, input }) => {
      return await ctx.prisma.user_therapy_preferences.findUnique({
        where: { user_id: input.userId }
      });
    }),

  // Create or update therapy preferences
  upsertTherapyPreferences: protectedProcedure
    .input(z.object({
      userId: z.string(),
      preferredTherapyStyles: z.array(z.string()).optional(),
      preferredTone: z.string().optional(),
      communicationStyle: z.string().optional(),
      feedbackFrequency: z.string().optional(),
      sessionLengthPreference: z.number().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const { userId, ...data } = input;
      return await ctx.prisma.user_therapy_preferences.upsert({
        where: { user_id: userId },
        update: data,
        create: {
          user_id: userId,
          ...data
        }
      });
    }),

  // ===== THERAPEUTIC APPROACH =====
  
  // Get user's therapeutic approach
  getUserTherapeuticApproach: protectedProcedure
    .input(z.object({
      userId: z.string()
    }))
    .query(async ({ ctx, input }) => {
      return await ctx.prisma.user_therapeutic_approach.findUnique({
        where: { user_id: input.userId }
      });
    }),

  // Create or update therapeutic approach
  upsertTherapeuticApproach: protectedProcedure
    .input(z.object({
      userId: z.string(),
      preferredApproaches: z.array(z.string()).optional(),
      workingAllianceStyle: z.string().optional(),
      feedbackPreferences: z.string().optional(),
      sessionStructurePreference: z.string().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const { userId, ...data } = input;
      return await ctx.prisma.user_therapeutic_approach.upsert({
        where: { user_id: userId },
        update: data,
        create: {
          user_id: userId,
          ...data
        }
      });
    }),

  // ===== PREVIOUS THERAPY =====
  
  // Get user's previous therapy
  getUserPreviousTherapy: protectedProcedure
    .input(z.object({
      userId: z.string(),
      isActive: z.boolean().optional()
    }))
    .query(async ({ ctx, input }) => {
      const where: any = { user_id: input.userId };
      if (input.isActive !== undefined) {
        where.is_active = input.isActive;
      }
      
      return await ctx.prisma.user_previous_therapy.findMany({
        where,
        orderBy: { created_at: 'desc' }
      });
    }),

  // Create previous therapy entry
  createPreviousTherapy: protectedProcedure
    .input(z.object({
      userId: z.string(),
      therapyType: z.string(),
      therapistName: z.string().optional(),
      duration: z.string().optional(),
      effectivenessRating: z.number().min(1).max(10).optional(),
      keyInsights: z.string().optional(),
      terminationReason: z.string().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.user_previous_therapy.create({
        data: {
          user_id: input.userId,
          therapy_type: input.therapyType,
          therapist_name: input.therapistName,
          duration: input.duration,
          effectiveness_rating: input.effectivenessRating,
          key_insights: input.keyInsights,
          termination_reason: input.terminationReason
        }
      });
    }),

  // Update previous therapy entry
  updatePreviousTherapy: protectedProcedure
    .input(z.object({
      therapyId: z.string(),
      therapyType: z.string().optional(),
      therapistName: z.string().optional(),
      duration: z.string().optional(),
      effectivenessRating: z.number().min(1).max(10).optional(),
      keyInsights: z.string().optional(),
      terminationReason: z.string().optional(),
      isActive: z.boolean().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const { therapyId, ...updateData } = input;
      return await ctx.prisma.user_previous_therapy.update({
        where: { id: therapyId },
        data: updateData
      });
    }),

  // Delete previous therapy entry (soft delete)
  deletePreviousTherapy: protectedProcedure
    .input(z.object({
      therapyId: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.user_previous_therapy.update({
        where: { id: input.therapyId },
        data: { is_active: false }
      });
    }),

  // ===== CURRENT PRACTICES =====
  
  // Get user's current practices
  getUserCurrentPractices: protectedProcedure
    .input(z.object({
      userId: z.string(),
      practiceType: z.string().optional(),
      isActive: z.boolean().optional()
    }))
    .query(async ({ ctx, input }) => {
      const where: any = { user_id: input.userId };
      if (input.practiceType) {
        where.practice_type = input.practiceType;
      }
      if (input.isActive !== undefined) {
        where.is_active = input.isActive;
      }
      
      return await ctx.prisma.user_current_practices.findMany({
        where,
        orderBy: { effectiveness_rating: 'desc' }
      });
    }),

  // Create current practice
  createCurrentPractice: protectedProcedure
    .input(z.object({
      userId: z.string(),
      practiceName: z.string(),
      practiceType: z.string().optional(),
      frequency: z.string().optional(),
      effectivenessRating: z.number().min(1).max(10).optional(),
      notes: z.string().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.user_current_practices.create({
        data: {
          user_id: input.userId,
          practice_name: input.practiceName,
          practice_type: input.practiceType,
          frequency: input.frequency,
          effectiveness_rating: input.effectivenessRating || 5,
          notes: input.notes
        }
      });
    }),

  // Update current practice
  updateCurrentPractice: protectedProcedure
    .input(z.object({
      practiceId: z.string(),
      practiceName: z.string().optional(),
      practiceType: z.string().optional(),
      frequency: z.string().optional(),
      effectivenessRating: z.number().min(1).max(10).optional(),
      notes: z.string().optional(),
      isActive: z.boolean().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const { practiceId, ...updateData } = input;
      return await ctx.prisma.user_current_practices.update({
        where: { id: practiceId },
        data: updateData
      });
    }),

  // ===== REGULATION STRATEGIES =====
  
  // Get user's regulation strategies
  getUserRegulationStrategies: protectedProcedure
    .input(z.object({
      userId: z.string(),
      strategyType: z.string().optional(),
      isActive: z.boolean().optional()
    }))
    .query(async ({ ctx, input }) => {
      const where: any = { user_id: input.userId };
      if (input.strategyType) {
        where.strategy_type = input.strategyType;
      }
      if (input.isActive !== undefined) {
        where.is_active = input.isActive;
      }
      
      return await ctx.prisma.user_regulation_strategies.findMany({
        where,
        orderBy: { effectiveness_rating: 'desc' }
      });
    }),

  // Create regulation strategy
  createRegulationStrategy: protectedProcedure
    .input(z.object({
      userId: z.string(),
      strategyName: z.string(),
      strategyType: z.string().optional(),
      whenToUse: z.string().optional(),
      effectivenessRating: z.number().min(1).max(10).optional(),
      notes: z.string().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.user_regulation_strategies.create({
        data: {
          user_id: input.userId,
          strategy_name: input.strategyName,
          strategy_type: input.strategyType,
          when_to_use: input.whenToUse,
          effectiveness_rating: input.effectivenessRating || 5,
          notes: input.notes
        }
      });
    }),

  // Update regulation strategy
  updateRegulationStrategy: protectedProcedure
    .input(z.object({
      strategyId: z.string(),
      strategyName: z.string().optional(),
      strategyType: z.string().optional(),
      whenToUse: z.string().optional(),
      effectivenessRating: z.number().min(1).max(10).optional(),
      notes: z.string().optional(),
      isActive: z.boolean().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const { strategyId, ...updateData } = input;
      return await ctx.prisma.user_regulation_strategies.update({
        where: { id: strategyId },
        data: updateData
      });
    }),

  // ===== ANALYTICS =====
  
  // Get therapy statistics
  getTherapyStats: protectedProcedure
    .input(z.object({
      userId: z.string()
    }))
    .query(async ({ ctx, input }) => {
      const [preferences, approach, previousTherapy, currentPractices, regulationStrategies] = await Promise.all([
        ctx.prisma.user_therapy_preferences.findUnique({
          where: { user_id: input.userId }
        }),
        ctx.prisma.user_therapeutic_approach.findUnique({
          where: { user_id: input.userId }
        }),
        ctx.prisma.user_previous_therapy.findMany({
          where: {
            user_id: input.userId,
            is_active: true
          }
        }),
        ctx.prisma.user_current_practices.findMany({
          where: {
            user_id: input.userId,
            is_active: true
          }
        }),
        ctx.prisma.user_regulation_strategies.findMany({
          where: {
            user_id: input.userId,
            is_active: true
          }
        })
      ]);

      const totalPreviousTherapy = previousTherapy.length;
      const effectivePreviousTherapy = previousTherapy.filter(t => (t.effectiveness_rating || 0) >= 7).length;
      const averageEffectiveness = previousTherapy.length > 0 
        ? previousTherapy.reduce((sum, t) => sum + (t.effectiveness_rating || 0), 0) / previousTherapy.length 
        : 0;

      const totalCurrentPractices = currentPractices.length;
      const effectiveCurrentPractices = currentPractices.filter(p => (p.effectiveness_rating || 0) >= 7).length;
      const averagePracticeEffectiveness = currentPractices.length > 0 
        ? currentPractices.reduce((sum, p) => sum + (p.effectiveness_rating || 0), 0) / currentPractices.length 
        : 0;

      const totalRegulationStrategies = regulationStrategies.length;
      const effectiveRegulationStrategies = regulationStrategies.filter(s => (s.effectiveness_rating || 0) >= 7).length;
      const averageStrategyEffectiveness = regulationStrategies.length > 0 
        ? regulationStrategies.reduce((sum, s) => sum + (s.effectiveness_rating || 0), 0) / regulationStrategies.length 
        : 0;

      return {
        // Preferences and approach
        hasTherapyPreferences: !!preferences,
        hasTherapeuticApproach: !!approach,
        
        // Previous therapy
        totalPreviousTherapy,
        effectivePreviousTherapy,
        averageEffectiveness,
        
        // Current practices
        totalCurrentPractices,
        effectiveCurrentPractices,
        averagePracticeEffectiveness,
        
        // Regulation strategies
        totalRegulationStrategies,
        effectiveRegulationStrategies,
        averageStrategyEffectiveness,
        
        // Overall therapy readiness
        therapyReadinessScore: calculateTherapyReadinessScore(
          preferences, approach, previousTherapy, currentPractices, regulationStrategies
        )
      };
    })
});

// Helper function to calculate therapy readiness score
function calculateTherapyReadinessScore(
  preferences: any, 
  approach: any, 
  previousTherapy: any[], 
  currentPractices: any[], 
  regulationStrategies: any[]
): number {
  let score = 50; // Base score
  
  // Preferences and approach (0-20 points)
  if (preferences) score += 10;
  if (approach) score += 10;
  
  // Previous therapy experience (0-15 points)
  if (previousTherapy.length > 0) {
    const avgEffectiveness = previousTherapy.reduce((sum, t) => sum + (t.effectiveness_rating || 0), 0) / previousTherapy.length;
    score += (avgEffectiveness / 10) * 15;
  }
  
  // Current practices (0-10 points)
  if (currentPractices.length > 0) {
    const avgEffectiveness = currentPractices.reduce((sum, p) => sum + (p.effectiveness_rating || 0), 0) / currentPractices.length;
    score += (avgEffectiveness / 10) * 10;
  }
  
  // Regulation strategies (0-5 points)
  if (regulationStrategies.length > 0) {
    const avgEffectiveness = regulationStrategies.reduce((sum, s) => sum + (s.effectiveness_rating || 0), 0) / regulationStrategies.length;
    score += (avgEffectiveness / 10) * 5;
  }
  
  return Math.max(0, Math.min(100, Math.round(score)));
} 