import { initTRPC } from '@trpc/server';
import { Context } from '../context.js';

const t = initTRPC.context<Context>().create();
import { protectedProcedure } from '../middleware/auth.js';
import { z } from 'zod';

export const themesRouter = t.router({
  // Get all global themes
  getAllThemes: protectedProcedure
    .query(async ({ ctx }) => {
      return await ctx.prisma.themes.findMany({
        orderBy: { name: 'asc' }
      });
    }),

  // Get user's themes
  getUserThemes: protectedProcedure
    .input(z.object({
      userId: z.string()
    }))
    .query(async ({ ctx, input }) => {
      return await ctx.prisma.user_themes.findMany({
        where: { 
          user_id: input.userId,
          is_active: true 
        },
        orderBy: { importance_level: 'desc' }
      });
    }),

  // Create a new user theme
  createUserTheme: protectedProcedure
    .input(z.object({
      userId: z.string(),
      themeName: z.string(),
      themeCategory: z.string().optional(),
      importanceLevel: z.number().min(1).max(10).optional()
    }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.user_themes.create({
        data: {
          user_id: input.userId,
          theme_name: input.themeName,
          theme_category: input.themeCategory,
          importance_level: input.importanceLevel || 5
        }
      });
    }),

  // Update a user theme
  updateUserTheme: protectedProcedure
    .input(z.object({
      themeId: z.string(),
      themeName: z.string().optional(),
      themeCategory: z.string().optional(),
      importanceLevel: z.number().min(1).max(10).optional(),
      isActive: z.boolean().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const { themeId, ...updateData } = input;
      return await ctx.prisma.user_themes.update({
        where: { id: themeId },
        data: updateData
      });
    }),

  // Delete a user theme (soft delete)
  deleteUserTheme: protectedProcedure
    .input(z.object({
      themeId: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.user_themes.update({
        where: { id: input.themeId },
        data: { is_active: false }
      });
    }),

  // Get themes by category
  getThemesByCategory: protectedProcedure
    .input(z.object({
      userId: z.string(),
      category: z.string()
    }))
    .query(async ({ ctx, input }) => {
      return await ctx.prisma.user_themes.findMany({
        where: { 
          user_id: input.userId,
          theme_category: input.category,
          is_active: true 
        },
        orderBy: { importance_level: 'desc' }
      });
    }),

  // Get theme statistics
  getThemeStats: protectedProcedure
    .input(z.object({
      userId: z.string()
    }))
    .query(async ({ ctx, input }) => {
      const themes = await ctx.prisma.user_themes.findMany({
        where: { 
          user_id: input.userId,
          is_active: true 
        }
      });

      const totalThemes = themes.length;
      const highImportanceThemes = themes.filter(t => t.importance_level >= 8).length;
      const categories = [...new Set(themes.map(t => t.theme_category).filter(Boolean))];

      return {
        totalThemes,
        highImportanceThemes,
        categories,
        averageImportance: themes.length > 0 
          ? themes.reduce((sum, t) => sum + (t.importance_level || 0), 0) / themes.length 
          : 0
      };
    })
}); 