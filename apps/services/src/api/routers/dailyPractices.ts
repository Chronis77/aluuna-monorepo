import { initTRPC } from '@trpc/server';
import { Context } from '../context.js';
import { protectedProcedure } from '../middleware/auth.js';
import { z } from 'zod';

const t = initTRPC.context<Context>().create();

export const dailyPracticesRouter = t.router({
  // List user's daily practices
  getUserDailyPractices: protectedProcedure
    .input(z.object({
      userId: z.string(),
      onlyPinned: z.boolean().optional(),
      onlySuggested: z.boolean().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const where: any = { user_id: input.userId };
      if (input.onlyPinned !== undefined) where.is_pinned = input.onlyPinned;
      if (input.onlySuggested !== undefined) where.is_suggested = input.onlySuggested;
      const practices = await ctx.prisma.user_daily_practices.findMany({
        where,
        orderBy: [
          { is_pinned: 'desc' },
          { created_at: 'desc' },
        ],
      });
      return { success: true, practices };
    }),

  // Create a daily practice
  createDailyPractice: protectedProcedure
    .input(z.object({
      userId: z.string(),
      promptText: z.string(),
      isSuggested: z.boolean().optional(),
      isPinned: z.boolean().optional(),
      relatedSessionId: z.string().optional(),
      date: z.string().optional(),
      source: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const data: any = {
        user_id: input.userId,
        prompt_text: input.promptText,
        is_suggested: input.isSuggested ?? false,
        is_pinned: input.isPinned ?? false,
        related_session_id: input.relatedSessionId ?? null,
        source: input.source ?? 'user',
      };
      if (input.date) {
        data.date = new Date(input.date);
      }
      const practice = await ctx.prisma.user_daily_practices.create({
        data,
      });
      return { success: true, practice };
    }),

  // Update a daily practice
  updateDailyPractice: protectedProcedure
    .input(z.object({
      id: z.string(),
      promptText: z.string().optional(),
      isSuggested: z.boolean().optional(),
      isPinned: z.boolean().optional(),
      completedAt: z.string().nullable().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const updated = await ctx.prisma.user_daily_practices.update({
        where: { id: input.id },
        data: {
          ...(input.promptText !== undefined && { prompt_text: input.promptText }),
          ...(input.isSuggested !== undefined && { is_suggested: input.isSuggested }),
          ...(input.isPinned !== undefined && { is_pinned: input.isPinned }),
          ...(input.completedAt !== undefined && { completed_at: input.completedAt ? new Date(input.completedAt) : null }),
        },
      });
      return { success: true, practice: updated };
    }),

  // Delete a daily practice
  deleteDailyPractice: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.user_daily_practices.delete({ where: { id: input.id } });
      return { success: true };
    }),

  // Log a daily practice completion
  logDailyPractice: protectedProcedure
    .input(z.object({
      userId: z.string(),
      practiceId: z.string(),
      moodBefore: z.number().min(1).max(10).optional(),
      moodAfter: z.number().min(1).max(10).optional(),
      reflection: z.string().optional(),
      date: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const data: any = {
        user_id: input.userId,
        practice_id: input.practiceId,
        mood_before: input.moodBefore ?? null,
        mood_after: input.moodAfter ?? null,
        reflection: input.reflection ?? null,
      };
      if (input.date) {
        data.date = new Date(input.date);
      }
      const log = await ctx.prisma.user_daily_practice_logs.create({
        data,
      });
      return { success: true, log };
    }),
});


