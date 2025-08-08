import { initTRPC } from '@trpc/server';
import { Context } from '../context.js';

const t = initTRPC.context<Context>().create();
import { protectedProcedure } from '../middleware/auth.js';
import { z } from 'zod';

export const copingToolsRouter = t.router({
  // Get user's coping tools
  getUserCopingTools: protectedProcedure
    .input(z.object({
      userId: z.string(),
      category: z.string().optional(),
      isActive: z.boolean().optional()
    }))
    .query(async ({ ctx, input }) => {
      const where: any = { user_id: input.userId };
      if (input.category) {
        where.tool_category = input.category;
      }
      if (input.isActive !== undefined) {
        where.is_active = input.isActive;
      }
      
      return await ctx.prisma.user_coping_tools.findMany({
        where,
        orderBy: [
          { effectiveness_rating: 'desc' },
          { tool_name: 'asc' }
        ]
      });
    }),

  // Create a new coping tool
  createCopingTool: protectedProcedure
    .input(z.object({
      userId: z.string(),
      toolName: z.string(),
      toolCategory: z.string().optional(),
      effectivenessRating: z.number().min(1).max(10).optional(),
      description: z.string().optional(),
      whenToUse: z.string().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.user_coping_tools.create({
        data: {
          user_id: input.userId,
          tool_name: input.toolName,
          tool_category: input.toolCategory,
          effectiveness_rating: input.effectivenessRating || 5,
          description: input.description,
          when_to_use: input.whenToUse
        }
      });
    }),

  // Update a coping tool
  updateCopingTool: protectedProcedure
    .input(z.object({
      toolId: z.string(),
      toolName: z.string().optional(),
      toolCategory: z.string().optional(),
      effectivenessRating: z.number().min(1).max(10).optional(),
      description: z.string().optional(),
      whenToUse: z.string().optional(),
      isActive: z.boolean().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const { toolId, ...updateData } = input;
      return await ctx.prisma.user_coping_tools.update({
        where: { id: toolId },
        data: updateData
      });
    }),

  // Delete a coping tool (soft delete)
  deleteCopingTool: protectedProcedure
    .input(z.object({
      toolId: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.user_coping_tools.update({
        where: { id: input.toolId },
        data: { is_active: false }
      });
    }),

  // Get coping tools by category
  getCopingToolsByCategory: protectedProcedure
    .input(z.object({
      userId: z.string(),
      category: z.string()
    }))
    .query(async ({ ctx, input }) => {
      return await ctx.prisma.user_coping_tools.findMany({
        where: { 
          user_id: input.userId,
          tool_category: input.category,
          is_active: true 
        },
        orderBy: { effectiveness_rating: 'desc' }
      });
    }),

  // Get highly effective coping tools
  getHighlyEffectiveTools: protectedProcedure
    .input(z.object({
      userId: z.string(),
      minRating: z.number().min(1).max(10).optional()
    }))
    .query(async ({ ctx, input }) => {
      return await ctx.prisma.user_coping_tools.findMany({
        where: { 
          user_id: input.userId,
          effectiveness_rating: {
            gte: input.minRating || 8
          },
          is_active: true 
        },
        orderBy: { effectiveness_rating: 'desc' }
      });
    }),

  // Get coping tool statistics
  getCopingToolStats: protectedProcedure
    .input(z.object({
      userId: z.string()
    }))
    .query(async ({ ctx, input }) => {
      const tools = await ctx.prisma.user_coping_tools.findMany({
        where: { 
          user_id: input.userId,
          is_active: true 
        }
      });

      const totalTools = tools.length;
      const highlyEffectiveTools = tools.filter(t => t.effectiveness_rating >= 8).length;
      const categories = [...new Set(tools.map(t => t.tool_category).filter(Boolean))];
      const averageEffectiveness = tools.length > 0 
        ? tools.reduce((sum, t) => sum + (t.effectiveness_rating || 0), 0) / tools.length 
        : 0;

      return {
        totalTools,
        highlyEffectiveTools,
        categories,
        averageEffectiveness
      };
    }),

  // Search coping tools
  searchCopingTools: protectedProcedure
    .input(z.object({
      userId: z.string(),
      searchTerm: z.string()
    }))
    .query(async ({ ctx, input }) => {
      return await ctx.prisma.user_coping_tools.findMany({
        where: {
          user_id: input.userId,
          is_active: true,
          OR: [
            { tool_name: { contains: input.searchTerm, mode: 'insensitive' } },
            { description: { contains: input.searchTerm, mode: 'insensitive' } },
            { when_to_use: { contains: input.searchTerm, mode: 'insensitive' } }
          ]
        },
        orderBy: { effectiveness_rating: 'desc' }
      });
    })
}); 