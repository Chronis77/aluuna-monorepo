import { initTRPC } from '@trpc/server';
import { z } from 'zod';
import { Context } from '../context.js';
import { logger } from '../../utils/logger.js';
import { withArrayFallback, withDeleteErrorHandling } from '../../utils/connectionUtils.js';
import { protectedProcedure } from '../middleware/auth.js';

const t = initTRPC.context<Context>().create();

export const boundariesRouter = t.router({
  getBoundaries: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input, ctx }) => {
      try {
        logger.info('Getting boundaries', { userId: input.userId });
        const result = await withArrayFallback(
          () => ctx.prisma.user_boundaries.findMany({
            where: { user_id: input.userId },
            orderBy: { created_at: 'desc' },
            select: {
              id: true,
              boundary_text: true,
              related_context: true,
              firmness_level: true,
              is_active: true,
              created_at: true,
              updated_at: true,
            }
          }),
          'get_boundaries'
        );
        return { success: true, boundaries: result.data || [] };
      } catch (error) {
        logger.error('Error getting boundaries', { userId: input.userId, error });
        throw new Error('Failed to get boundaries');
      }
    }),

  createBoundary: protectedProcedure
    .input(z.object({
      user_id: z.string(),
      boundary_text: z.string(),
      related_context: z.string().optional(),
      firmness_level: z.number().int().min(1).max(10).optional(),
      is_active: z.boolean().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        logger.info('Creating boundary', { userId: input.user_id });
        const created = await ctx.prisma.user_boundaries.create({
          data: {
            user_id: input.user_id,
            boundary_text: input.boundary_text,
            related_context: input.related_context ?? null,
            firmness_level: input.firmness_level ?? 5,
            is_active: input.is_active ?? true,
          }
        });
        logger.info('Boundary created', { id: created.id });
        return { success: true, boundary: created };
      } catch (error) {
        logger.error('Error creating boundary', { userId: input.user_id, error });
        throw new Error('Failed to create boundary');
      }
    }),

  updateBoundary: protectedProcedure
    .input(z.object({
      id: z.string(),
      boundary_text: z.string().optional(),
      related_context: z.string().optional(),
      firmness_level: z.number().int().min(1).max(10).optional(),
      is_active: z.boolean().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        logger.info('Updating boundary', { id: input.id });
        const updated = await ctx.prisma.user_boundaries.update({
          where: { id: input.id },
          data: {
            boundary_text: input.boundary_text ?? undefined,
            related_context: input.related_context ?? undefined,
            firmness_level: input.firmness_level ?? undefined,
            is_active: input.is_active ?? undefined,
            updated_at: new Date(),
          }
        });
        return { success: true, boundary: updated };
      } catch (error) {
        logger.error('Error updating boundary', { id: input.id, error });
        throw new Error('Failed to update boundary');
      }
    }),

  deleteBoundary: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      try {
        logger.info('Deleting boundary', { id: input.id });
        const result = await withDeleteErrorHandling(
          () => ctx.prisma.user_boundaries.delete({ where: { id: input.id } }),
          'delete_boundary'
        );
        return result.data || { success: true };
      } catch (error) {
        logger.error('Error deleting boundary', { id: input.id, error });
        throw new Error('Failed to delete boundary');
      }
    })
});

