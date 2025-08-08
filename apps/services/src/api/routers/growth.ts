import { initTRPC } from '@trpc/server';
import { Context } from '../context.js';

const t = initTRPC.context<Context>().create();
import { protectedProcedure } from '../middleware/auth.js';
import { z } from 'zod';

export const growthRouter = t.router({
  // ===== GROWTH MILESTONES =====
  
  // Get user's growth milestones
  getUserGrowthMilestones: protectedProcedure
    .input(z.object({
      userId: z.string(),
      category: z.string().optional(),
      isActive: z.boolean().optional()
    }))
    .query(async ({ ctx, input }) => {
      const where: any = { user_id: input.userId };
      if (input.category) {
        where.category = input.category;
      }
      if (input.isActive !== undefined) {
        where.is_active = input.isActive;
      }
      
      return await ctx.prisma.user_growth_milestones.findMany({
        where,
        orderBy: { significance_level: 'desc' }
      });
    }),

  // Create growth milestone
  createGrowthMilestone: protectedProcedure
    .input(z.object({
      userId: z.string(),
      milestoneTitle: z.string(),
      milestoneDescription: z.string().optional(),
      category: z.string().optional(),
      dateAchieved: z.string().optional(), // ISO date string
      significanceLevel: z.number().min(1).max(10).optional(),
      lessonsLearned: z.string().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.user_growth_milestones.create({
        data: {
          user_id: input.userId,
          milestone_title: input.milestoneTitle,
          milestone_description: input.milestoneDescription,
          category: input.category,
          date_achieved: input.dateAchieved ? new Date(input.dateAchieved) : null,
          significance_level: input.significanceLevel || 5,
          lessons_learned: input.lessonsLearned
        }
      });
    }),

  // Update growth milestone
  updateGrowthMilestone: protectedProcedure
    .input(z.object({
      milestoneId: z.string(),
      milestoneTitle: z.string().optional(),
      milestoneDescription: z.string().optional(),
      category: z.string().optional(),
      dateAchieved: z.string().optional(),
      significanceLevel: z.number().min(1).max(10).optional(),
      lessonsLearned: z.string().optional(),
      isActive: z.boolean().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const { milestoneId, dateAchieved, ...updateData } = input;
      const data: any = updateData;
      
      if (dateAchieved !== undefined) {
        data.date_achieved = dateAchieved ? new Date(dateAchieved) : null;
      }

      return await ctx.prisma.user_growth_milestones.update({
        where: { id: milestoneId },
        data
      });
    }),

  // ===== GROWTH OPPORTUNITIES =====
  
  // Get user's growth opportunities
  getUserGrowthOpportunities: protectedProcedure
    .input(z.object({
      userId: z.string(),
      areaOfGrowth: z.string().optional(),
      isActive: z.boolean().optional()
    }))
    .query(async ({ ctx, input }) => {
      const where: any = { user_id: input.userId };
      if (input.areaOfGrowth) {
        where.area_of_growth = input.areaOfGrowth;
      }
      if (input.isActive !== undefined) {
        where.is_active = input.isActive;
      }
      
      return await ctx.prisma.user_growth_opportunities.findMany({
        where,
        orderBy: { readiness_level: 'desc' }
      });
    }),

  // Create growth opportunity
  createGrowthOpportunity: protectedProcedure
    .input(z.object({
      userId: z.string(),
      opportunityTitle: z.string(),
      opportunityDescription: z.string().optional(),
      areaOfGrowth: z.string().optional(),
      readinessLevel: z.number().min(1).max(10).optional(),
      potentialImpact: z.string().optional(),
      actionSteps: z.array(z.string()).optional()
    }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.user_growth_opportunities.create({
        data: {
          user_id: input.userId,
          opportunity_title: input.opportunityTitle,
          opportunity_description: input.opportunityDescription,
          area_of_growth: input.areaOfGrowth,
          readiness_level: input.readinessLevel || 5,
          potential_impact: input.potentialImpact,
          action_steps: input.actionSteps
        }
      });
    }),

  // Update growth opportunity
  updateGrowthOpportunity: protectedProcedure
    .input(z.object({
      opportunityId: z.string(),
      opportunityTitle: z.string().optional(),
      opportunityDescription: z.string().optional(),
      areaOfGrowth: z.string().optional(),
      readinessLevel: z.number().min(1).max(10).optional(),
      potentialImpact: z.string().optional(),
      actionSteps: z.array(z.string()).optional(),
      isActive: z.boolean().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const { opportunityId, ...updateData } = input;
      return await ctx.prisma.user_growth_opportunities.update({
        where: { id: opportunityId },
        data: updateData
      });
    }),

  // ===== STRENGTHS =====
  
  // Get user's strengths
  getUserStrengths: protectedProcedure
    .input(z.object({
      userId: z.string(),
      category: z.string().optional(),
      isActive: z.boolean().optional()
    }))
    .query(async ({ ctx, input }) => {
      const where: any = { user_id: input.userId };
      if (input.category) {
        where.strength_category = input.category;
      }
      if (input.isActive !== undefined) {
        where.is_active = input.isActive;
      }
      
      return await ctx.prisma.user_strengths.findMany({
        where,
        orderBy: { confidence_level: 'desc' }
      });
    }),

  // Create strength
  createStrength: protectedProcedure
    .input(z.object({
      userId: z.string(),
      strengthName: z.string(),
      strengthCategory: z.string().optional(),
      confidenceLevel: z.number().min(1).max(10).optional(),
      howDeveloped: z.string().optional(),
      howUtilized: z.string().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.user_strengths.create({
        data: {
          user_id: input.userId,
          strength_name: input.strengthName,
          strength_category: input.strengthCategory,
          confidence_level: input.confidenceLevel || 5,
          how_developed: input.howDeveloped,
          how_utilized: input.howUtilized
        }
      });
    }),

  // Update strength
  updateStrength: protectedProcedure
    .input(z.object({
      strengthId: z.string(),
      strengthName: z.string().optional(),
      strengthCategory: z.string().optional(),
      confidenceLevel: z.number().min(1).max(10).optional(),
      howDeveloped: z.string().optional(),
      howUtilized: z.string().optional(),
      isActive: z.boolean().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const { strengthId, ...updateData } = input;
      return await ctx.prisma.user_strengths.update({
        where: { id: strengthId },
        data: updateData
      });
    }),

  // ===== GROWTH MILESTONES LOG =====
  
  // Get user's growth milestones log
  getUserGrowthMilestonesLog: protectedProcedure
    .input(z.object({
      userId: z.string(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      limit: z.number().optional()
    }))
    .query(async ({ ctx, input }) => {
      const where: any = { user_id: input.userId };
      
      if (input.startDate || input.endDate) {
        where.created_at = {};
        if (input.startDate) {
          where.created_at.gte = new Date(input.startDate);
        }
        if (input.endDate) {
          where.created_at.lte = new Date(input.endDate);
        }
      }
      
      return await ctx.prisma.user_growth_milestones_log.findMany({
        where,
        orderBy: { created_at: 'desc' },
        take: input.limit || 50
      });
    }),

  // Create growth milestone log entry
  createGrowthMilestoneLog: protectedProcedure
    .input(z.object({
      userId: z.string(),
      milestone: z.string(),
      relatedSessionId: z.string().optional(),
      dateAchieved: z.string().optional(), // ISO date string
      method: z.string().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.user_growth_milestones_log.create({
        data: {
          user_id: input.userId,
          milestone: input.milestone,
          related_session_id: input.relatedSessionId,
          date_achieved: input.dateAchieved ? new Date(input.dateAchieved) : null,
          method: input.method
        }
      });
    }),

  // ===== ANALYTICS =====
  
  // Get growth statistics
  getGrowthStats: protectedProcedure
    .input(z.object({
      userId: z.string(),
      days: z.number().optional()
    }))
    .query(async ({ ctx, input }) => {
      const days = input.days || 365; // Default to 1 year for growth tracking
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const [milestones, opportunities, strengths, milestonesLog] = await Promise.all([
        ctx.prisma.user_growth_milestones.findMany({
          where: {
            user_id: input.userId,
            is_active: true
          }
        }),
        ctx.prisma.user_growth_opportunities.findMany({
          where: {
            user_id: input.userId,
            is_active: true
          }
        }),
        ctx.prisma.user_strengths.findMany({
          where: {
            user_id: input.userId,
            is_active: true
          }
        }),
        ctx.prisma.user_growth_milestones_log.findMany({
          where: {
            user_id: input.userId,
            created_at: { gte: startDate }
          }
        })
      ]);

      const totalMilestones = milestones.length;
      const highSignificanceMilestones = milestones.filter(m => m.significance_level >= 8).length;
      const milestoneCategories = [...new Set(milestones.map(m => m.category).filter(Boolean))];
      const averageSignificance = milestones.length > 0 
        ? milestones.reduce((sum, m) => sum + (m.significance_level || 0), 0) / milestones.length 
        : 0;

      const totalOpportunities = opportunities.length;
      const highReadinessOpportunities = opportunities.filter(o => o.readiness_level >= 8).length;
      const opportunityAreas = [...new Set(opportunities.map(o => o.area_of_growth).filter(Boolean))];

      const totalStrengths = strengths.length;
      const highConfidenceStrengths = strengths.filter(s => s.confidence_level >= 8).length;
      const strengthCategories = [...new Set(strengths.map(s => s.strength_category).filter(Boolean))];
      const averageConfidence = strengths.length > 0 
        ? strengths.reduce((sum, s) => sum + (s.confidence_level || 0), 0) / strengths.length 
        : 0;

      const recentMilestones = milestonesLog.length;
      const milestonesThisMonth = milestonesLog.filter(m => {
        const logDate = new Date(m.created_at);
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return logDate >= monthAgo;
      }).length;

      return {
        // Milestones
        totalMilestones,
        highSignificanceMilestones,
        milestoneCategories,
        averageSignificance,
        
        // Opportunities
        totalOpportunities,
        highReadinessOpportunities,
        opportunityAreas,
        
        // Strengths
        totalStrengths,
        highConfidenceStrengths,
        strengthCategories,
        averageConfidence,
        
        // Growth activity
        recentMilestones,
        milestonesThisMonth,
        
        // Overall growth score
        growthScore: calculateGrowthScore(milestones, opportunities, strengths, milestonesLog)
      };
    })
});

// Helper function to calculate overall growth score
function calculateGrowthScore(
  milestones: any[], 
  opportunities: any[], 
  strengths: any[], 
  milestonesLog: any[]
): number {
  let score = 50; // Base score
  
  // Milestones contribution (0-25 points)
  if (milestones.length > 0) {
    const avgSignificance = milestones.reduce((sum, m) => sum + (m.significance_level || 0), 0) / milestones.length;
    score += (avgSignificance / 10) * 25;
  }
  
  // Opportunities readiness (0-15 points)
  if (opportunities.length > 0) {
    const avgReadiness = opportunities.reduce((sum, o) => sum + (o.readiness_level || 0), 0) / opportunities.length;
    score += (avgReadiness / 10) * 15;
  }
  
  // Strengths confidence (0-10 points)
  if (strengths.length > 0) {
    const avgConfidence = strengths.reduce((sum, s) => sum + (s.confidence_level || 0), 0) / strengths.length;
    score += (avgConfidence / 10) * 10;
  }
  
  // Recent activity bonus (0-10 points)
  const recentActivity = milestonesLog.length;
  score += Math.min(recentActivity * 2, 10);
  
  return Math.max(0, Math.min(100, Math.round(score)));
} 