import { initTRPC } from '@trpc/server';
import { Context } from '../context.js';

const t = initTRPC.context<Context>().create();
import { protectedProcedure } from '../middleware/auth.js';
import { z } from 'zod';

export const patternsRouter = t.router({
  // ===== PATTERN LOOPS =====
  
  // Get user's pattern loops
  getUserPatternLoops: protectedProcedure
    .input(z.object({
      userId: z.string(),
      isActive: z.boolean().optional()
    }))
    .query(async ({ ctx, input }) => {
      const where: any = { user_id: input.userId };
      if (input.isActive !== undefined) {
        where.is_active = input.isActive;
      }
      
      return await ctx.prisma.user_pattern_loops.findMany({
        where,
        orderBy: { created_at: 'desc' }
      });
    }),

  // Create pattern loop
  createPatternLoop: protectedProcedure
    .input(z.object({
      userId: z.string(),
      loopName: z.string(),
      triggerSituation: z.string().optional(),
      automaticResponse: z.string().optional(),
      consequences: z.string().optional(),
      alternativeResponses: z.array(z.string()).optional()
    }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.user_pattern_loops.create({
        data: {
          user_id: input.userId,
          loop_name: input.loopName,
          trigger_situation: input.triggerSituation,
          automatic_response: input.automaticResponse,
          consequences: input.consequences,
          alternative_responses: input.alternativeResponses
        }
      });
    }),

  // Update pattern loop
  updatePatternLoop: protectedProcedure
    .input(z.object({
      loopId: z.string(),
      loopName: z.string().optional(),
      triggerSituation: z.string().optional(),
      automaticResponse: z.string().optional(),
      consequences: z.string().optional(),
      alternativeResponses: z.array(z.string()).optional(),
      isActive: z.boolean().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const { loopId, ...updateData } = input;
      return await ctx.prisma.user_pattern_loops.update({
        where: { id: loopId },
        data: updateData
      });
    }),

  // Delete pattern loop (soft delete)
  deletePatternLoop: protectedProcedure
    .input(z.object({
      loopId: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.user_pattern_loops.update({
        where: { id: input.loopId },
        data: { is_active: false }
      });
    }),

  // ===== SHADOW THEMES =====
  
  // Get user's shadow themes
  getUserShadowThemes: protectedProcedure
    .input(z.object({
      userId: z.string(),
      isActive: z.boolean().optional()
    }))
    .query(async ({ ctx, input }) => {
      const where: any = { user_id: input.userId };
      if (input.isActive !== undefined) {
        where.is_active = input.isActive;
      }
      
      return await ctx.prisma.user_shadow_themes.findMany({
        where,
        orderBy: { created_at: 'desc' }
      });
    }),

  // Create shadow theme
  createShadowTheme: protectedProcedure
    .input(z.object({
      userId: z.string(),
      themeName: z.string(),
      themeDescription: z.string().optional(),
      triggers: z.array(z.string()).optional(),
      avoidanceBehaviors: z.array(z.string()).optional(),
      integrationStrategies: z.array(z.string()).optional()
    }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.user_shadow_themes.create({
        data: {
          user_id: input.userId,
          theme_name: input.themeName,
          theme_description: input.themeDescription,
          triggers: input.triggers,
          avoidance_behaviors: input.avoidanceBehaviors,
          integration_strategies: input.integrationStrategies
        }
      });
    }),

  // Update shadow theme
  updateShadowTheme: protectedProcedure
    .input(z.object({
      themeId: z.string(),
      themeName: z.string().optional(),
      themeDescription: z.string().optional(),
      triggers: z.array(z.string()).optional(),
      avoidanceBehaviors: z.array(z.string()).optional(),
      integrationStrategies: z.array(z.string()).optional(),
      isActive: z.boolean().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const { themeId, ...updateData } = input;
      return await ctx.prisma.user_shadow_themes.update({
        where: { id: themeId },
        data: updateData
      });
    }),

  // Delete shadow theme (soft delete)
  deleteShadowTheme: protectedProcedure
    .input(z.object({
      themeId: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.user_shadow_themes.update({
        where: { id: input.themeId },
        data: { is_active: false }
      });
    }),

  // ===== ANCESTRAL ISSUES =====
  
  // Get user's ancestral issues
  getUserAncestralIssues: protectedProcedure
    .input(z.object({
      userId: z.string(),
      isActive: z.boolean().optional()
    }))
    .query(async ({ ctx, input }) => {
      const where: any = { user_id: input.userId };
      if (input.isActive !== undefined) {
        where.is_active = input.isActive;
      }
      
      return await ctx.prisma.user_ancestral_issues.findMany({
        where,
        orderBy: { created_at: 'desc' }
      });
    }),

  // Create ancestral issue
  createAncestralIssue: protectedProcedure
    .input(z.object({
      userId: z.string(),
      issueName: z.string(),
      issueDescription: z.string().optional(),
      generationalImpact: z.string().optional(),
      currentManifestation: z.string().optional(),
      healingApproaches: z.array(z.string()).optional()
    }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.user_ancestral_issues.create({
        data: {
          user_id: input.userId,
          issue_name: input.issueName,
          issue_description: input.issueDescription,
          generational_impact: input.generationalImpact,
          current_manifestation: input.currentManifestation,
          healing_approaches: input.healingApproaches
        }
      });
    }),

  // Update ancestral issue
  updateAncestralIssue: protectedProcedure
    .input(z.object({
      issueId: z.string(),
      issueName: z.string().optional(),
      issueDescription: z.string().optional(),
      generationalImpact: z.string().optional(),
      currentManifestation: z.string().optional(),
      healingApproaches: z.array(z.string()).optional(),
      isActive: z.boolean().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const { issueId, ...updateData } = input;
      return await ctx.prisma.user_ancestral_issues.update({
        where: { id: issueId },
        data: updateData
      });
    }),

  // Delete ancestral issue (soft delete)
  deleteAncestralIssue: protectedProcedure
    .input(z.object({
      issueId: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.user_ancestral_issues.update({
        where: { id: input.issueId },
        data: { is_active: false }
      });
    }),

  // ===== ANALYTICS =====
  
  // Get pattern statistics
  getPatternStats: protectedProcedure
    .input(z.object({
      userId: z.string()
    }))
    .query(async ({ ctx, input }) => {
      const [patternLoops, shadowThemes, ancestralIssues] = await Promise.all([
        ctx.prisma.user_pattern_loops.findMany({
          where: {
            user_id: input.userId,
            is_active: true
          }
        }),
        ctx.prisma.user_shadow_themes.findMany({
          where: {
            user_id: input.userId,
            is_active: true
          }
        }),
        ctx.prisma.user_ancestral_issues.findMany({
          where: {
            user_id: input.userId,
            is_active: true
          }
        })
      ]);

      const totalPatternLoops = patternLoops.length;
      const totalShadowThemes = shadowThemes.length;
      const totalAncestralIssues = ancestralIssues.length;

      const allTriggers = [
        ...patternLoops.map(p => p.trigger_situation).filter(Boolean),
        ...shadowThemes.flatMap(s => s.triggers || [])
      ];
      const uniqueTriggers = [...new Set(allTriggers)];

      const allAvoidanceBehaviors = shadowThemes.flatMap(s => s.avoidance_behaviors || []);
      const uniqueAvoidanceBehaviors = [...new Set(allAvoidanceBehaviors)];

      const allIntegrationStrategies = shadowThemes.flatMap(s => s.integration_strategies || []);
      const uniqueIntegrationStrategies = [...new Set(allIntegrationStrategies)];

      const allHealingApproaches = ancestralIssues.flatMap(a => a.healing_approaches || []);
      const uniqueHealingApproaches = [...new Set(allHealingApproaches)];

      return {
        // Pattern loops
        totalPatternLoops,
        
        // Shadow themes
        totalShadowThemes,
        uniqueTriggers,
        uniqueAvoidanceBehaviors,
        uniqueIntegrationStrategies,
        
        // Ancestral issues
        totalAncestralIssues,
        uniqueHealingApproaches,
        
        // Overall pattern awareness
        patternAwarenessScore: calculatePatternAwarenessScore(
          patternLoops, shadowThemes, ancestralIssues
        )
      };
    })
});

// Helper function to calculate pattern awareness score
function calculatePatternAwarenessScore(
  patternLoops: any[], 
  shadowThemes: any[], 
  ancestralIssues: any[]
): number {
  let score = 50; // Base score
  
  // Pattern loops awareness (0-20 points)
  if (patternLoops.length > 0) {
    score += Math.min(patternLoops.length * 4, 20);
  }
  
  // Shadow themes awareness (0-20 points)
  if (shadowThemes.length > 0) {
    score += Math.min(shadowThemes.length * 4, 20);
  }
  
  // Ancestral issues awareness (0-10 points)
  if (ancestralIssues.length > 0) {
    score += Math.min(ancestralIssues.length * 2, 10);
  }
  
  return Math.max(0, Math.min(100, Math.round(score)));
} 