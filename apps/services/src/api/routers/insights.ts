import { initTRPC } from '@trpc/server';
import { Context } from '../context.js';
import { logger } from '../../utils/logger.js';
import { z } from 'zod';
import { withArrayFallback, withDeleteErrorHandling } from '../../utils/connectionUtils.js';
import { protectedProcedure } from '../middleware/auth.js';

const t = initTRPC.context<Context>().create();

export const insightsRouter = t.router({
  // Get insights for a user
  getInsights: protectedProcedure
    .input(z.object({
      userId: z.string()
    }))
    .query(async ({ input, ctx }) => {
      try {
        logger.info('Getting insights', { userId: input.userId });
        
        const result = await withArrayFallback(
          () => ctx.prisma.user_insights.findMany({
            where: {
              user_id: input.userId
            },
            orderBy: {
              created_at: 'desc'
            },
            select: {
              id: true,
              insight_text: true,
              related_theme: true,
              importance: true,
              created_at: true,
              updated_at: true
            }
          }),
          'get_insights'
        );
        
        logger.info('Retrieved insights', { userId: input.userId, count: result.data?.length || 0 });
        
        return { 
          success: true, 
          insights: result.data || [] 
        };
      } catch (error) {
        logger.error('Error getting insights', { userId: input.userId, error });
        throw new Error('Failed to get insights');
      }
    }),

  // Update an insight
  updateInsight: t.procedure
    .input(z.object({
      id: z.string(),
      insight_text: z.string(),
      importance: z.number(),
      updated_at: z.string()
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        logger.info('Updating insight', { id: input.id });
        
        const updatedInsight = await ctx.prisma.user_insights.update({
          where: {
            id: input.id
          },
          data: {
            insight_text: input.insight_text,
            importance: input.importance,
            updated_at: new Date(input.updated_at)
          }
        });
        
        logger.info('Insight updated successfully', { id: input.id });
        return { success: true, message: 'Insight updated', insight: updatedInsight };
      } catch (error) {
        logger.error('Error updating insight', { id: input.id, error });
        throw new Error('Failed to update insight');
      }
    }),

  // Delete an insight
  deleteInsight: t.procedure
    .input(z.object({
      id: z.string()
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        logger.info('Deleting insight', { id: input.id });
        
        const result = await withDeleteErrorHandling(
          () => ctx.prisma.user_insights.delete({
            where: {
              id: input.id
            }
          }),
          'delete_insight'
        );
        
        logger.info('Insight deleted successfully', { id: input.id });
        return result.data || { success: true, message: 'Insight deleted' };
      } catch (error) {
        logger.error('Error deleting insight', { id: input.id, error });
        throw new Error('Failed to delete insight');
      }
    }),

  // Create a new insight
  createInsight: t.procedure
    .input(z.object({
      user_id: z.string(),
      insight_text: z.string(),
      related_theme: z.string().optional(),
      importance: z.number().default(5),
      conversation_message_id: z.string().optional()
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        logger.info('Creating insight', { userId: input.user_id });
        
        const newInsight = await ctx.prisma.insights.create({
          data: {
            user_id: input.user_id,
            insight_text: input.insight_text,
            related_theme: input.related_theme,
            importance: input.importance,
            conversation_message_id: input.conversation_message_id
          }
        });
        
        logger.info('Insight created successfully', { id: newInsight.id, userId: input.user_id });
        return { success: true, message: 'Insight created', insight: newInsight };
      } catch (error) {
        logger.error('Error creating insight', { userId: input.user_id, error });
        throw new Error('Failed to create insight');
      }
    }),
}); 