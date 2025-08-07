import { initTRPC } from '@trpc/server';
import { Context } from '../context.js';
import { logger } from '../../utils/logger.js';
import { z } from 'zod';
import { withArrayFallback, withConnectionErrorHandling, withDeleteErrorHandling } from '../../utils/connectionUtils.js';
import { protectedProcedure, publicProcedure } from '../middleware/auth.js';

const t = initTRPC.context<Context>().create();

export const mantrasRouter = t.router({
  // Get mantras for a user
  getMantras: protectedProcedure
    .input(z.object({
      userId: z.string()
    }))
    .query(async ({ input, ctx }) => {
      try {
        logger.info('Getting mantras', { userId: input.userId });
        
        const result = await withArrayFallback(
          () => ctx.prisma.mantras.findMany({
            where: {
              user_id: input.userId
            },
            orderBy: [
              { is_pinned: 'desc' },
              { created_at: 'desc' }
            ],
            select: {
              id: true,
              text: true,
              source: true,
              is_favorite: true,
              tags: true,
              is_pinned: true,
              created_at: true
            }
          }),
          'get_mantras'
        );
        
        logger.info('Retrieved mantras', { userId: input.userId, count: result.data?.length || 0 });
        
        return { 
          success: true, 
          mantras: result.data || [] 
        };
      } catch (error) {
        logger.error('Error getting mantras', { userId: input.userId, error });
        throw new Error('Failed to get mantras');
      }
    }),

  // Create a new mantra
  createMantra: t.procedure
    .input(z.object({
      id: z.string().optional(),
      user_id: z.string(),
      text: z.string(),
      source: z.string().optional(),
      is_favorite: z.boolean().optional(),
      tags: z.array(z.string()).nullable().optional(),
      is_pinned: z.boolean().optional()
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        logger.info('Creating mantra', { userId: input.user_id, text: input.text });
        
        // Generate a proper UUID if not provided
        const mantraId = input.id || crypto.randomUUID();
        
        const newMantra = await ctx.prisma.mantras.create({
          data: {
            id: mantraId,
            user_id: input.user_id,
            text: input.text,
            source: input.source || null,
            is_favorite: input.is_favorite || false,
            tags: input.tags || [],
            is_pinned: input.is_pinned || false
          }
        });
        
        logger.info('Mantra created successfully', { id: newMantra.id, userId: input.user_id });
        return { success: true, message: 'Mantra created', mantra: newMantra };
      } catch (error) {
        logger.error('Error creating mantra', { userId: input.user_id, error });
        throw new Error('Failed to create mantra');
      }
    }),

  // Update a mantra
  updateMantra: t.procedure
    .input(z.object({
      id: z.string(),
      text: z.string().optional(),
      is_pinned: z.boolean().optional()
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        logger.info('Updating mantra', { id: input.id });
        
        const updateData: any = {};
        if (input.text !== undefined) updateData.text = input.text;
        if (input.is_pinned !== undefined) updateData.is_pinned = input.is_pinned;
        
        const updatedMantra = await ctx.prisma.mantras.update({
          where: {
            id: input.id
          },
          data: updateData
        });
        
        logger.info('Mantra updated successfully', { id: input.id });
        return { success: true, message: 'Mantra updated', mantra: updatedMantra };
      } catch (error) {
        logger.error('Error updating mantra', { id: input.id, error });
        throw new Error('Failed to update mantra');
      }
    }),

  // Delete a mantra
  deleteMantra: t.procedure
    .input(z.object({
      id: z.string()
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        logger.info('Deleting mantra', { id: input.id });
        
        const result = await withDeleteErrorHandling(
          () => ctx.prisma.mantras.delete({
            where: {
              id: input.id
            }
          }),
          'delete_mantra'
        );
        
        logger.info('Mantra deleted successfully', { id: input.id });
        return result.data || { success: true, message: 'Mantra deleted' };
      } catch (error) {
        logger.error('Error deleting mantra', { id: input.id, error });
        throw new Error('Failed to delete mantra');
      }
    }),
}); 