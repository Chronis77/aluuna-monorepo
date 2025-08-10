import { initTRPC } from '@trpc/server';
import { Context } from '../context.js';
import { logger } from '../../utils/logger.js';
import { z } from 'zod';
import { withArrayFallback, withDeleteErrorHandling } from '../../utils/connectionUtils.js';


const t = initTRPC.context<Context>().create();

export const innerPartsRouter = t.router({
  // Get inner parts for a user
  getInnerParts: t.procedure
    .input(z.object({
      userId: z.string()
    }))
    .query(async ({ input, ctx }) => {
      try {
        logger.info('Getting inner parts', { userId: input.userId });
        
        const result = await withArrayFallback(
          () => ctx.prisma.user_inner_parts.findMany({
            where: {
              user_id: input.userId
            },
            // Add limit to prevent large result sets
            take: 100
          }),
          'get_inner_parts'
        );
        
        // Filter out inner parts with null names and provide fallbacks
        const validInnerParts = (result.data || [])
          .filter((part: any) => part.name !== null && part.role !== null && part.description !== null)
          .map((part: any) => ({
            id: part.id,
            name: part.name || 'Unnamed Part',
            role: part.role || 'Unknown Role',
            tone: part.tone || 'Neutral',
            description: part.description || 'No description available',
            updated_at: part.updated_at
          }));
        
        logger.info('Retrieved inner parts', { userId: input.userId, count: validInnerParts.length });
        
        return { 
          success: true, 
          innerParts: validInnerParts 
        };
      } catch (error) {
        logger.error('Error getting inner parts', { userId: input.userId, error });
        throw new Error('Failed to get inner parts');
      }
    }),

  // Update an inner part
  updateInnerPart: t.procedure
    .input(z.object({
      id: z.string(),
      role: z.string(),
      description: z.string()
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        logger.info('Updating inner part', { id: input.id });
        
        const updatedInnerPart = await ctx.prisma.user_inner_parts.update({
          where: {
            id: input.id
          },
          data: {
            role: input.role,
            description: input.description,
            updated_at: new Date()
          }
        });
        
        logger.info('Inner part updated successfully', { id: input.id });
        return { success: true, message: 'Inner part updated', innerPart: updatedInnerPart };
      } catch (error) {
        logger.error('Error updating inner part', { id: input.id, error });
        throw new Error('Failed to update inner part');
      }
    }),

  // Delete an inner part
  deleteInnerPart: t.procedure
    .input(z.object({
      id: z.string()
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        logger.info('Deleting inner part', { id: input.id });
        
        const result = await withDeleteErrorHandling(
          () => ctx.prisma.user_inner_parts.delete({
            where: {
              id: input.id
            }
          }),
          'delete_inner_part'
        );
        
        logger.info('Inner part deleted successfully', { id: input.id });
        return result.data || { success: true, message: 'Inner part deleted' };
      } catch (error) {
        logger.error('Error deleting inner part', { id: input.id, error });
        throw new Error('Failed to delete inner part');
      }
    }),
}); 