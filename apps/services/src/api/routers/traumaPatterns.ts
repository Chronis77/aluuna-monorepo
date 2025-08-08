import { initTRPC } from '@trpc/server';
import { Context } from '../context.js';

const t = initTRPC.context<Context>().create();
import { protectedProcedure } from '../middleware/auth.js';
import { z } from 'zod';

export const traumaPatternsRouter = t.router({
  // Get user's trauma patterns
  getUserTraumaPatterns: protectedProcedure
    .input(z.object({
      userId: z.string(),
      isActive: z.boolean().optional()
    }))
    .query(async ({ ctx, input }) => {
      const where: any = { user_id: input.userId };
      if (input.isActive !== undefined) {
        where.is_active = input.isActive;
      }
      
      return await ctx.prisma.user_trauma_patterns.findMany({
        where,
        orderBy: { severity_level: 'desc' }
      });
    }),

  // Create trauma pattern
  createTraumaPattern: protectedProcedure
    .input(z.object({
      userId: z.string(),
      patternName: z.string(),
      patternDescription: z.string().optional(),
      triggerEvents: z.array(z.string()).optional(),
      emotionalResponse: z.string().optional(),
      copingStrategies: z.array(z.string()).optional(),
      severityLevel: z.number().min(1).max(10).optional()
    }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.user_trauma_patterns.create({
        data: {
          user_id: input.userId,
          pattern_name: input.patternName,
          pattern_description: input.patternDescription,
          trigger_events: input.triggerEvents,
          emotional_response: input.emotionalResponse,
          coping_strategies: input.copingStrategies,
          severity_level: input.severityLevel || 5
        }
      });
    }),

  // Update trauma pattern
  updateTraumaPattern: protectedProcedure
    .input(z.object({
      patternId: z.string(),
      patternName: z.string().optional(),
      patternDescription: z.string().optional(),
      triggerEvents: z.array(z.string()).optional(),
      emotionalResponse: z.string().optional(),
      copingStrategies: z.array(z.string()).optional(),
      severityLevel: z.number().min(1).max(10).optional(),
      isActive: z.boolean().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const { patternId, ...updateData } = input;
      return await ctx.prisma.user_trauma_patterns.update({
        where: { id: patternId },
        data: updateData
      });
    }),

  // Delete trauma pattern (soft delete)
  deleteTraumaPattern: protectedProcedure
    .input(z.object({
      patternId: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.user_trauma_patterns.update({
        where: { id: input.patternId },
        data: { is_active: false }
      });
    }),

  // Get high severity trauma patterns
  getHighSeverityPatterns: protectedProcedure
    .input(z.object({
      userId: z.string(),
      minSeverity: z.number().min(1).max(10).optional()
    }))
    .query(async ({ ctx, input }) => {
      return await ctx.prisma.user_trauma_patterns.findMany({
        where: { 
          user_id: input.userId,
          severity_level: {
            gte: input.minSeverity || 8
          },
          is_active: true 
        },
        orderBy: { severity_level: 'desc' }
      });
    }),

  // Get trauma pattern statistics
  getTraumaPatternStats: protectedProcedure
    .input(z.object({
      userId: z.string()
    }))
    .query(async ({ ctx, input }) => {
      const patterns = await ctx.prisma.user_trauma_patterns.findMany({
        where: { 
          user_id: input.userId,
          is_active: true 
        }
      });

      const totalPatterns = patterns.length;
      const highSeverityPatterns = patterns.filter(p => p.severity_level >= 8).length;
      const averageSeverity = patterns.length > 0 
        ? patterns.reduce((sum, p) => sum + (p.severity_level || 0), 0) / patterns.length 
        : 0;

      const allTriggers = patterns.flatMap(p => p.trigger_events || []);
      const uniqueTriggers = [...new Set(allTriggers)];
      const allCopingStrategies = patterns.flatMap(p => p.coping_strategies || []);
      const uniqueCopingStrategies = [...new Set(allCopingStrategies)];

      return {
        totalPatterns,
        highSeverityPatterns,
        averageSeverity,
        uniqueTriggers,
        uniqueCopingStrategies,
        triggerCount: uniqueTriggers.length,
        copingStrategyCount: uniqueCopingStrategies.length
      };
    })
}); 