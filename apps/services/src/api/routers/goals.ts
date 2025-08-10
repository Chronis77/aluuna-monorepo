import { initTRPC } from '@trpc/server';
import { Context } from '../context.js';

const t = initTRPC.context<Context>().create();
import { protectedProcedure } from '../middleware/auth.js';
import { z } from 'zod';

export const goalsRouter = t.router({
  // Get user's goals
  getUserGoals: protectedProcedure
    .input(z.object({
      userId: z.string(),
      status: z.enum(['active', 'completed', 'paused', 'abandoned']).optional()
    }))
    .query(async ({ ctx, input }) => {
      const where: any = { user_id: input.userId };
      if (input.status) {
        where.status = input.status;
      }
      
      return await ctx.prisma.user_goals.findMany({
        where,
        orderBy: [
          { priority_level: 'desc' },
          { target_date: 'asc' }
        ]
      });
    }),

  // Create a new goal
  createGoal: protectedProcedure
    .input(z.object({
      userId: z.string(),
      goalTitle: z.string(),
      goalDescription: z.string().optional(),
      goalCategory: z.string().optional(),
      priorityLevel: z.number().min(1).max(5).optional(),
      targetDate: z.string().optional(), // ISO date string
      progressPercentage: z.number().min(0).max(100).optional()
    }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.user_goals.create({
        data: {
          user_id: input.userId,
          goal_title: input.goalTitle,
          ...(input.goalDescription !== undefined && { goal_description: input.goalDescription }),
          ...(input.goalCategory !== undefined && { goal_category: input.goalCategory }),
          priority_level: input.priorityLevel || 3,
          target_date: input.targetDate ? new Date(input.targetDate) : null,
          progress_percentage: input.progressPercentage || 0
        }
      });
    }),

  // Update a goal
  updateGoal: protectedProcedure
    .input(z.object({
      goalId: z.string(),
      goalTitle: z.string().optional(),
      goalDescription: z.string().optional(),
      goalCategory: z.string().optional(),
      priorityLevel: z.number().min(1).max(5).optional(),
      targetDate: z.string().optional(),
      status: z.enum(['active', 'completed', 'paused', 'abandoned']).optional(),
      progressPercentage: z.number().min(0).max(100).optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const { goalId, targetDate, ...updateData } = input;
      const data: any = updateData;
      
      if (targetDate !== undefined) {
        data.target_date = targetDate ? new Date(targetDate) : null;
      }

      return await ctx.prisma.user_goals.update({
        where: { id: goalId },
        data
      });
    }),

  // Delete a goal
  deleteGoal: protectedProcedure
    .input(z.object({
      goalId: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.user_goals.delete({
        where: { id: input.goalId }
      });
    }),

  // Update goal progress
  updateGoalProgress: protectedProcedure
    .input(z.object({
      goalId: z.string(),
      progressPercentage: z.number().min(0).max(100),
      status: z.enum(['active', 'completed', 'paused', 'abandoned']).optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const { goalId, ...updateData } = input;
      return await ctx.prisma.user_goals.update({
        where: { id: goalId },
        data: {
          progress_percentage: updateData.progressPercentage,
          ...(updateData.status !== undefined && { status: updateData.status })
        }
      });
    }),

  // Get goals by category
  getGoalsByCategory: protectedProcedure
    .input(z.object({
      userId: z.string(),
      category: z.string()
    }))
    .query(async ({ ctx, input }) => {
      return await ctx.prisma.user_goals.findMany({
        where: { 
          user_id: input.userId,
          goal_category: input.category
        },
        orderBy: [
          { priority_level: 'desc' },
          { target_date: 'asc' }
        ]
      });
    }),

  // Get overdue goals
  getOverdueGoals: protectedProcedure
    .input(z.object({
      userId: z.string()
    }))
    .query(async ({ ctx, input }) => {
      return await ctx.prisma.user_goals.findMany({
        where: { 
          user_id: input.userId,
          target_date: {
            lt: new Date()
          },
          status: 'active'
        },
        orderBy: { target_date: 'asc' }
      });
    }),

  // Get goal statistics
  getGoalStats: protectedProcedure
    .input(z.object({
      userId: z.string()
    }))
    .query(async ({ ctx, input }) => {
      const goals = await ctx.prisma.user_goals.findMany({
        where: { user_id: input.userId }
      });

      const totalGoals = goals.length;
      const activeGoals = goals.filter(g => g.status === 'active').length;
      const completedGoals = goals.filter(g => g.status === 'completed').length;
      const overdueGoals = goals.filter(g => 
        g.target_date && g.target_date < new Date() && g.status === 'active'
      ).length;

      const averageProgress = goals.length > 0 
        ? goals.reduce((sum, g) => sum + (g.progress_percentage || 0), 0) / goals.length 
        : 0;

      const highPriorityGoals = goals.filter(g => (g.priority_level ?? 0) >= 4).length;

      return {
        totalGoals,
        activeGoals,
        completedGoals,
        overdueGoals,
        averageProgress,
        highPriorityGoals,
        completionRate: totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0
      };
    })
}); 