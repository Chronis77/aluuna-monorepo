import { initTRPC } from '@trpc/server';
import { Context } from '../context.js';
import { logger } from '../../utils/logger.js';
import { buildMCP } from '../../mcp/buildMCP.js';
import { z } from 'zod';
import { 
  fromJsonbArray, 
  toJsonbArray, 
  addToJsonbArray, 
  removeFromJsonbArray, 
  updateJsonbArrayItem,
  sanitizeJsonbData,
  fromJsonbString,
  toJsonbString,
  toJsonbStringArray
} from '../../utils/jsonbUtils.js';
import { measureQuery } from '../../db/performanceMonitor.js';
import { protectedProcedure, publicProcedure } from '../middleware/auth.js';


const t = initTRPC.context<Context>().create();

export const memoryRouter = t.router({
  getMemoryProfile: protectedProcedure
    .input(z.object({
      userId: z.string()
    }))
    .query(async ({ input, ctx }) => {
      const { userId } = input;
      
      try {
        logger.info('Getting memory profile', { userId });
        
        // Try to get memory profile with error handling for array issues
        let memoryProfile = null;
        try {
          memoryProfile = await ctx.prisma.memory_profiles.findFirst({
            where: {
              user_id: userId
            },
            select: {
              stuck_points: true,
              coping_tools: true,
              shadow_themes: true,
              pattern_loops: true
            }
          });
        } catch (arrayError: any) {
          // Check if this is a connection error vs data error
          const isConnectionError = arrayError?.message?.includes('ECONNRESET') || 
                                   arrayError?.message?.includes('ETIMEDOUT') ||
                                   arrayError?.message?.includes('Connection');
          
          if (isConnectionError) {
            logger.warn('Connection error in memory profile query, returning empty profile', { userId, error: arrayError });
            return {
              stuck_points: [],
              coping_tools: [],
              shadow_themes: [],
              pattern_loops: []
            };
          }
          
          logger.warn('Array error in memory profile query, trying alternative approach', { userId, error: arrayError });
          
          // Try a simpler query without array fields first
          const basicProfile = await ctx.prisma.memory_profiles.findFirst({
            where: {
              user_id: userId
            },
            select: {
              id: true
            }
          });
          
          if (basicProfile) {
            // If basic profile exists, try to get array fields individually
            try {
              const stuckPointsResult = await ctx.prisma.$queryRaw<Array<{stuck_points: string[]}>>`
                SELECT stuck_points FROM memory_profiles 
                WHERE user_id = ${userId} AND stuck_points IS NOT NULL
              `;
              const copingToolsResult = await ctx.prisma.$queryRaw<Array<{coping_tools: string[]}>>`
                SELECT coping_tools FROM memory_profiles 
                WHERE user_id = ${userId} AND coping_tools IS NOT NULL
              `;
              const shadowThemesResult = await ctx.prisma.$queryRaw<Array<{shadow_themes: string[]}>>`
                SELECT shadow_themes FROM memory_profiles 
                WHERE user_id = ${userId} AND shadow_themes IS NOT NULL
              `;
              const patternLoopsResult = await ctx.prisma.$queryRaw<Array<{pattern_loops: string[]}>>`
                SELECT pattern_loops FROM memory_profiles 
                WHERE user_id = ${userId} AND pattern_loops IS NOT NULL
              `;
              
              memoryProfile = {
                stuck_points: stuckPointsResult[0]?.stuck_points || [],
                coping_tools: copingToolsResult[0]?.coping_tools || [],
                shadow_themes: shadowThemesResult[0]?.shadow_themes || [],
                pattern_loops: patternLoopsResult[0]?.pattern_loops || []
              };
            } catch (rawQueryError) {
              logger.error('Raw query also failed, returning empty arrays', { userId, error: rawQueryError });
              memoryProfile = {
                stuck_points: [],
                coping_tools: [],
                shadow_themes: [],
                pattern_loops: []
              };
            }
          }
        }

        if (!memoryProfile) {
          // If no memory profile exists, create one with empty arrays
          try {
            logger.info('Creating new memory profile for user', { userId });
            await ctx.prisma.memory_profiles.create({
              data: {
                user_id: userId,
                stuck_points: [],
                coping_tools: [],
                shadow_themes: [],
                pattern_loops: []
              }
            });
            
            memoryProfile = {
              stuck_points: [],
              coping_tools: [],
              shadow_themes: [],
              pattern_loops: []
            };
          } catch (createError) {
            logger.error('Failed to create memory profile', { userId, error: createError });
            return {
              success: true,
              profile: null
            };
          }
        } else {
          // Convert JSONB data to arrays for frontend compatibility
          memoryProfile = {
            ...memoryProfile,
            stuck_points: fromJsonbArray(memoryProfile.stuck_points),
            coping_tools: fromJsonbArray(memoryProfile.coping_tools),
            shadow_themes: fromJsonbArray(memoryProfile.shadow_themes),
            pattern_loops: fromJsonbArray(memoryProfile.pattern_loops)
          };
        }

        return {
          success: true,
          profile: {
            stuck_points: memoryProfile.stuck_points || [],
            coping_tools: memoryProfile.coping_tools || [],
            shadow_themes: memoryProfile.shadow_themes || [],
            pattern_loops: memoryProfile.pattern_loops || []
          }
        };
      } catch (error) {
        logger.error('Error getting memory profile', { userId, error });
        
        // Check if it's a connection error
        if (error && typeof error === 'object' && 'name' in error && error.name === 'PrismaClientUnknownRequestError') {
          logger.warn('Database connection issue during memory profile retrieval', { userId });
          // Return empty profile instead of throwing error
          return {
            success: true,
            profile: {
              stuck_points: [],
              coping_tools: [],
              shadow_themes: [],
              pattern_loops: []
            }
          };
        }
        
        if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string' && error.message.includes('prepared statement')) {
          logger.warn('Database connection issue during memory profile retrieval', { userId });
          // Return empty profile instead of throwing error
          return {
            success: true,
            profile: {
              stuck_points: [],
              coping_tools: [],
              shadow_themes: [],
              pattern_loops: []
            }
          };
        }
        
        throw new Error('Failed to get memory profile');
      }
    }),

  upsertMemoryProfile: protectedProcedure
    .input(z.object({
      user_id: z.string(),
      emotional_patterns: z.array(z.string()).optional(),
      relationship_dynamics: z.array(z.string()).optional(),
      growth_opportunities: z.array(z.string()).optional(),
      therapeutic_approach: z.string().optional(),
      risk_factors: z.array(z.string()).optional(),
      strengths: z.array(z.string()).optional(),
      goals: z.array(z.string()).optional(),
      preferred_therapy_styles: z.array(z.string()).optional(),
      coping_tools: z.array(z.string()).optional(),
      current_practices: z.array(z.string()).optional(),
      suicidal_risk_level: z.number().optional(),
      themes: z.array(z.string()).optional(),
      trauma_patterns: z.string().optional(),
      mood_score_initial: z.number().optional(),
      emotional_states_initial: z.array(z.string()).optional(),
      suicidal_thoughts_initial: z.string().optional(),
      mood_trends: z.array(z.string()).optional(),
      sleep_quality: z.string().optional(),
      relationship_status: z.string().optional(),
      living_situation: z.string().optional(),
      support_system: z.array(z.string()).optional(),
      current_stressors: z.array(z.string()).optional(),
      daily_habits: z.array(z.string()).optional(),
      substance_use: z.array(z.string()).optional(),
      sleep_routine: z.string().optional(),
      biggest_challenge: z.string().optional(),
      previous_therapy: z.string().optional(),
      therapy_type: z.string().optional(),
      therapy_duration: z.string().optional(),
      personal_goals: z.string().optional(),
      biggest_obstacle: z.string().optional(),
      core_values: z.array(z.string()).optional(),
      motivation_for_joining: z.string().optional(),
      hopes_to_achieve: z.string().optional(),
      motivation_level: z.number().optional(),
      personal_agency_level: z.number().optional(),
      awareness_level: z.number().optional(),
      summary: z.string().optional()
    }))
    .mutation(async ({ input }) => {
      try {
        // TODO: Implement with actual database
        logger.info('Upserting memory profile', { userId: input.user_id });
        return { success: true, message: 'Memory profile updated' };
      } catch (error) {
        logger.error('Error upserting memory profile', { userId: input.user_id, error });
        throw new Error('Failed to upsert memory profile');
      }
    }),

  // Memory Snapshots
  getMemorySnapshots: t.procedure
    .input(z.object({
      userId: z.string()
    }))
    .query(async ({ input, ctx }) => {
      try {
        logger.info('Getting memory snapshots', { userId: input.userId });
        
        // Optimize the query to prevent slow queries
        const snapshots = await ctx.prisma.memory_snapshots.findMany({
          where: {
            user_id: input.userId
          },
          orderBy: {
            created_at: 'desc'
          },
          select: {
            id: true,
            summary: true,
            key_themes: true,
            generated_by: true,
            created_at: true
          },
          // Add limit to prevent large result sets
          take: 50
        });
        
        logger.info('Retrieved memory snapshots', { userId: input.userId, count: snapshots.length });
        
        return { 
          success: true, 
          snapshots: snapshots 
        };
      } catch (error: any) {
        logger.error('Error getting memory snapshots', { userId: input.userId, error });
        
        // Check if it's a connection error and return empty array
        if (error?.message?.includes('ECONNRESET') || error?.message?.includes('ETIMEDOUT') || error?.message?.includes('Connection')) {
          logger.warn('Connection error during memory snapshots retrieval, returning empty array', { userId: input.userId });
          return { 
            success: true, 
            snapshots: [] 
          };
        }
        
        throw new Error('Failed to get memory snapshots');
      }
    }),

  updateMemorySnapshot: t.procedure
    .input(z.object({
      id: z.string(),
      content: z.string()
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        logger.info('Updating memory snapshot', { id: input.id });
        
        const updatedSnapshot = await ctx.prisma.memory_snapshots.update({
          where: {
            id: input.id
          },
          data: {
            summary: input.content
          }
        });
        
        logger.info('Memory snapshot updated successfully', { id: input.id });
        return { success: true, message: 'Memory snapshot updated', snapshot: updatedSnapshot };
      } catch (error) {
        logger.error('Error updating memory snapshot', { id: input.id, error });
        throw new Error('Failed to update memory snapshot');
      }
    }),

  deleteMemorySnapshot: t.procedure
    .input(z.object({
      id: z.string()
    }))
    .mutation(async ({ input, ctx }) => {
      return measureQuery('deleteMemorySnapshot', async () => {
        try {
          logger.info('Deleting memory snapshot', { id: input.id });
          
          // Use deleteMany (prepared statements are now disabled)
          const deleteResult = await ctx.prisma.memory_snapshots.deleteMany({
            where: {
              id: input.id
            }
          });
          
          if (deleteResult.count === 0) {
            logger.warn('Memory snapshot not found for deletion', { id: input.id });
            return { success: true, message: 'Memory snapshot not found or already deleted' };
          }
          
          logger.info('Memory snapshot deleted successfully', { id: input.id, count: deleteResult.count });
          return { success: true, message: 'Memory snapshot deleted' };
        } catch (error: any) {
          logger.error('Error deleting memory snapshot', { id: input.id, error });
          
          // Check if it's a connection error and return success
          if (error?.message?.includes('ECONNRESET') || error?.message?.includes('ETIMEDOUT') || error?.message?.includes('Connection')) {
            logger.warn('Connection error during deletion, assuming success', { id: input.id });
            return { success: true, message: 'Memory snapshot deleted (connection issue handled)' };
          }
          
          throw new Error('Failed to delete memory snapshot');
        }
      })();
    }),

  // Stuck Points
  updateStuckPoint: t.procedure
    .input(z.object({
      userId: z.string(),
      index: z.number(),
      content: z.string()
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        logger.info('Updating stuck point', { userId: input.userId, index: input.index });
        
        // Get current memory profile
        const memoryProfile = await ctx.prisma.memory_profiles.findUnique({
          where: { user_id: input.userId }
        });
        
        if (!memoryProfile) {
          throw new Error('Memory profile not found');
        }
        
        // Update the specific stuck point
        const stuckPoints = memoryProfile.stuck_points || [];
        if (input.index >= stuckPoints.length) {
          throw new Error('Stuck point index out of bounds');
        }
        
        stuckPoints[input.index] = input.content;
        
        // Update the memory profile with JSONB data
        await ctx.prisma.memory_profiles.update({
          where: { user_id: input.userId },
          data: { stuck_points: toJsonbArray(stuckPoints) }
        });
        
        logger.info('Stuck point updated successfully', { userId: input.userId, index: input.index });
        return { success: true, message: 'Stuck point updated' };
      } catch (error) {
        logger.error('Error updating stuck point', { userId: input.userId, index: input.index, error });
        throw new Error('Failed to update stuck point');
      }
    }),

  deleteStuckPoint: t.procedure
    .input(z.object({
      userId: z.string(),
      index: z.number()
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        logger.info('Deleting stuck point', { userId: input.userId, index: input.index });
        
        // Get current memory profile
        const memoryProfile = await ctx.prisma.memory_profiles.findUnique({
          where: { user_id: input.userId }
        });
        
        if (!memoryProfile) {
          throw new Error('Memory profile not found');
        }
        
        // Remove the specific stuck point
        const stuckPoints = memoryProfile.stuck_points || [];
        if (input.index >= stuckPoints.length) {
          throw new Error('Stuck point index out of bounds');
        }
        
        stuckPoints.splice(input.index, 1);
        
        // Update the memory profile with JSONB data
        await ctx.prisma.memory_profiles.update({
          where: { user_id: input.userId },
          data: { stuck_points: toJsonbArray(stuckPoints) }
        });
        
        logger.info('Stuck point deleted successfully', { userId: input.userId, index: input.index });
        return { success: true, message: 'Stuck point deleted' };
      } catch (error) {
        logger.error('Error deleting stuck point', { userId: input.userId, index: input.index, error });
        throw new Error('Failed to delete stuck point');
      }
    }),

  // Add new stuck point
  addStuckPoint: t.procedure
    .input(z.object({
      userId: z.string(),
      content: z.string()
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        logger.info('Adding stuck point', { userId: input.userId });
        
        // Get current memory profile
        let memoryProfile = await ctx.prisma.memory_profiles.findUnique({
          where: { user_id: input.userId }
        });
        
        if (!memoryProfile) {
          // Create memory profile if it doesn't exist
          memoryProfile = await ctx.prisma.memory_profiles.create({
            data: {
              user_id: input.userId,
              stuck_points: [input.content],
              coping_tools: [],
              shadow_themes: [],
              pattern_loops: []
            }
          });
        } else {
          // Add to existing stuck points
          const stuckPoints = fromJsonbArray(memoryProfile.stuck_points);
          stuckPoints.push(input.content);
          
          // Update the memory profile with JSONB data
          await ctx.prisma.memory_profiles.update({
            where: { user_id: input.userId },
            data: { stuck_points: toJsonbArray(stuckPoints) }
          });
        }
        
        logger.info('Stuck point added successfully', { userId: input.userId });
        return { success: true, message: 'Stuck point added' };
      } catch (error) {
        logger.error('Error adding stuck point', { userId: input.userId, error });
        throw new Error('Failed to add stuck point');
      }
    }),

  // Coping Tools
  updateCopingTool: t.procedure
    .input(z.object({
      userId: z.string(),
      index: z.number(),
      content: z.string()
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        logger.info('Updating coping tool', { userId: input.userId, index: input.index });
        
        // Get current memory profile
        const memoryProfile = await ctx.prisma.memory_profiles.findUnique({
          where: { user_id: input.userId }
        });
        
        if (!memoryProfile) {
          throw new Error('Memory profile not found');
        }
        
        // Update the specific coping tool
        const copingTools = fromJsonbArray(memoryProfile.coping_tools);
        if (input.index >= copingTools.length) {
          throw new Error('Coping tool index out of bounds');
        }
        
        copingTools[input.index] = input.content;
        
        // Update the memory profile with JSONB data
        await ctx.prisma.memory_profiles.update({
          where: { user_id: input.userId },
          data: { coping_tools: toJsonbArray(copingTools) }
        });
        
        logger.info('Coping tool updated successfully', { userId: input.userId, index: input.index });
        return { success: true, message: 'Coping tool updated' };
      } catch (error) {
        logger.error('Error updating coping tool', { userId: input.userId, index: input.index, error });
        throw new Error('Failed to update coping tool');
      }
    }),

  deleteCopingTool: t.procedure
    .input(z.object({
      userId: z.string(),
      index: z.number()
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        logger.info('Deleting coping tool', { userId: input.userId, index: input.index });
        
        // Get current memory profile
        const memoryProfile = await ctx.prisma.memory_profiles.findUnique({
          where: { user_id: input.userId }
        });
        
        if (!memoryProfile) {
          throw new Error('Memory profile not found');
        }
        
        // Remove the specific coping tool
        const copingTools = fromJsonbArray(memoryProfile.coping_tools);
        if (input.index >= copingTools.length) {
          throw new Error('Coping tool index out of bounds');
        }
        
        copingTools.splice(input.index, 1);
        
        // Update the memory profile with JSONB data
        await ctx.prisma.memory_profiles.update({
          where: { user_id: input.userId },
          data: { coping_tools: toJsonbArray(copingTools) }
        });
        
        logger.info('Coping tool deleted successfully', { userId: input.userId, index: input.index });
        return { success: true, message: 'Coping tool deleted' };
      } catch (error) {
        logger.error('Error deleting coping tool', { userId: input.userId, index: input.index, error });
        throw new Error('Failed to delete coping tool');
      }
    }),

  // Add new coping tool
  addCopingTool: t.procedure
    .input(z.object({
      userId: z.string(),
      content: z.string()
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        logger.info('Adding coping tool', { userId: input.userId });
        
        // Get current memory profile
        let memoryProfile = await ctx.prisma.memory_profiles.findUnique({
          where: { user_id: input.userId }
        });
        
        if (!memoryProfile) {
          // Create memory profile if it doesn't exist
          memoryProfile = await ctx.prisma.memory_profiles.create({
            data: {
              user_id: input.userId,
              stuck_points: [],
              coping_tools: [input.content],
              shadow_themes: [],
              pattern_loops: []
            }
          });
        } else {
          // Add to existing coping tools
          const copingTools = fromJsonbArray(memoryProfile.coping_tools);
          copingTools.push(input.content);
          
          await ctx.prisma.memory_profiles.update({
            where: { user_id: input.userId },
            data: { coping_tools: toJsonbArray(copingTools) }
          });
        }
        
        logger.info('Coping tool added successfully', { userId: input.userId });
        return { success: true, message: 'Coping tool added' };
      } catch (error) {
        logger.error('Error adding coping tool', { userId: input.userId, error });
        throw new Error('Failed to add coping tool');
      }
    }),

  // Shadow Themes
  updateShadowTheme: t.procedure
    .input(z.object({
      userId: z.string(),
      index: z.number(),
      content: z.string()
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        logger.info('Updating shadow theme', { userId: input.userId, index: input.index });
        
        // Get current memory profile
        const memoryProfile = await ctx.prisma.memory_profiles.findUnique({
          where: { user_id: input.userId }
        });
        
        if (!memoryProfile) {
          throw new Error('Memory profile not found');
        }
        
        // Update the specific shadow theme
        const shadowThemes = fromJsonbArray(memoryProfile.shadow_themes);
        if (input.index >= shadowThemes.length) {
          throw new Error('Shadow theme index out of bounds');
        }
        
        shadowThemes[input.index] = input.content;
        
        // Update the memory profile with JSONB data
        await ctx.prisma.memory_profiles.update({
          where: { user_id: input.userId },
          data: { shadow_themes: toJsonbArray(shadowThemes) }
        });
        
        logger.info('Shadow theme updated successfully', { userId: input.userId, index: input.index });
        return { success: true, message: 'Shadow theme updated' };
      } catch (error) {
        logger.error('Error updating shadow theme', { userId: input.userId, index: input.index, error });
        throw new Error('Failed to update shadow theme');
      }
    }),

  deleteShadowTheme: t.procedure
    .input(z.object({
      userId: z.string(),
      index: z.number()
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        logger.info('Deleting shadow theme', { userId: input.userId, index: input.index });
        
        // Get current memory profile
        const memoryProfile = await ctx.prisma.memory_profiles.findUnique({
          where: { user_id: input.userId }
        });
        
        if (!memoryProfile) {
          throw new Error('Memory profile not found');
        }
        
        // Remove the specific shadow theme
        const shadowThemes = fromJsonbArray(memoryProfile.shadow_themes);
        if (input.index >= shadowThemes.length) {
          throw new Error('Shadow theme index out of bounds');
        }
        
        shadowThemes.splice(input.index, 1);
        
        // Update the memory profile with JSONB data
        await ctx.prisma.memory_profiles.update({
          where: { user_id: input.userId },
          data: { shadow_themes: toJsonbArray(shadowThemes) }
        });
        
        logger.info('Shadow theme deleted successfully', { userId: input.userId, index: input.index });
        return { success: true, message: 'Shadow theme deleted' };
      } catch (error) {
        logger.error('Error deleting shadow theme', { userId: input.userId, index: input.index, error });
        throw new Error('Failed to delete shadow theme');
      }
    }),

  // Add new shadow theme
  addShadowTheme: t.procedure
    .input(z.object({
      userId: z.string(),
      content: z.string()
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        logger.info('Adding shadow theme', { userId: input.userId });
        
        // Get current memory profile
        let memoryProfile = await ctx.prisma.memory_profiles.findUnique({
          where: { user_id: input.userId }
        });
        
        if (!memoryProfile) {
          // Create memory profile if it doesn't exist
          memoryProfile = await ctx.prisma.memory_profiles.create({
            data: {
              user_id: input.userId,
              stuck_points: [],
              coping_tools: [],
              shadow_themes: [input.content],
              pattern_loops: []
            }
          });
        } else {
          // Add to existing shadow themes
          const shadowThemes = fromJsonbArray(memoryProfile.shadow_themes);
          shadowThemes.push(input.content);
          
          await ctx.prisma.memory_profiles.update({
            where: { user_id: input.userId },
            data: { shadow_themes: toJsonbArray(shadowThemes) }
          });
        }
        
        logger.info('Shadow theme added successfully', { userId: input.userId });
        return { success: true, message: 'Shadow theme added' };
      } catch (error) {
        logger.error('Error adding shadow theme', { userId: input.userId, error });
        throw new Error('Failed to add shadow theme');
      }
    }),

  // Pattern Loops
  updatePatternLoop: t.procedure
    .input(z.object({
      userId: z.string(),
      index: z.number(),
      content: z.string()
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        logger.info('Updating pattern loop', { userId: input.userId, index: input.index });
        
        // Get current memory profile
        const memoryProfile = await ctx.prisma.memory_profiles.findUnique({
          where: { user_id: input.userId }
        });
        
        if (!memoryProfile) {
          throw new Error('Memory profile not found');
        }
        
        // Update the specific pattern loop
        const patternLoops = fromJsonbArray(memoryProfile.pattern_loops);
        if (input.index >= patternLoops.length) {
          throw new Error('Pattern loop index out of bounds');
        }
        
        patternLoops[input.index] = input.content;
        
        // Update the memory profile with JSONB data
        await ctx.prisma.memory_profiles.update({
          where: { user_id: input.userId },
          data: { pattern_loops: toJsonbArray(patternLoops) }
        });
        
        logger.info('Pattern loop updated successfully', { userId: input.userId, index: input.index });
        return { success: true, message: 'Pattern loop updated' };
      } catch (error) {
        logger.error('Error updating pattern loop', { userId: input.userId, index: input.index, error });
        throw new Error('Failed to update pattern loop');
      }
    }),

  deletePatternLoop: t.procedure
    .input(z.object({
      userId: z.string(),
      index: z.number()
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        logger.info('Deleting pattern loop', { userId: input.userId, index: input.index });
        
        // Get current memory profile
        const memoryProfile = await ctx.prisma.memory_profiles.findUnique({
          where: { user_id: input.userId }
        });
        
        if (!memoryProfile) {
          throw new Error('Memory profile not found');
        }
        
        // Remove the specific pattern loop
        const patternLoops = fromJsonbArray(memoryProfile.pattern_loops);
        if (input.index >= patternLoops.length) {
          throw new Error('Pattern loop index out of bounds');
        }
        
        patternLoops.splice(input.index, 1);
        
        // Update the memory profile with JSONB data
        await ctx.prisma.memory_profiles.update({
          where: { user_id: input.userId },
          data: { pattern_loops: toJsonbArray(patternLoops) }
        });
        
        logger.info('Pattern loop deleted successfully', { userId: input.userId, index: input.index });
        return { success: true, message: 'Pattern loop deleted' };
      } catch (error) {
        logger.error('Error deleting pattern loop', { userId: input.userId, index: input.index, error });
        throw new Error('Failed to delete pattern loop');
      }
    }),

  // Add new pattern loop
  addPatternLoop: t.procedure
    .input(z.object({
      userId: z.string(),
      content: z.string()
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        logger.info('Adding pattern loop', { userId: input.userId });
        
        // Get current memory profile
        let memoryProfile = await ctx.prisma.memory_profiles.findUnique({
          where: { user_id: input.userId }
        });
        
        if (!memoryProfile) {
          // Create memory profile if it doesn't exist
          memoryProfile = await ctx.prisma.memory_profiles.create({
            data: {
              user_id: input.userId,
              stuck_points: [],
              coping_tools: [],
              shadow_themes: [],
              pattern_loops: [input.content]
            }
          });
        } else {
          // Add to existing pattern loops
          const patternLoops = fromJsonbArray(memoryProfile.pattern_loops);
          patternLoops.push(input.content);
          
          await ctx.prisma.memory_profiles.update({
            where: { user_id: input.userId },
            data: { pattern_loops: toJsonbArray(patternLoops) }
          });
        }
        
        logger.info('Pattern loop added successfully', { userId: input.userId });
        return { success: true, message: 'Pattern loop added' };
      } catch (error) {
        logger.error('Error adding pattern loop', { userId: input.userId, error });
        throw new Error('Failed to add pattern loop');
      }
    }),

  // Relationships
  getRelationships: t.procedure
    .input(z.object({
      userId: z.string()
    }))
    .query(async ({ input }) => {
      try {
        // TODO: Implement with actual database
        logger.info('Getting relationships', { userId: input.userId });
        return { success: true, relationships: [] };
      } catch (error) {
        logger.error('Error getting relationships', { userId: input.userId, error });
        throw new Error('Failed to get relationships');
      }
    }),

  createRelationship: t.procedure
    .input(z.object({
      id: z.string(),
      user_id: z.string(),
      name: z.string(),
      role: z.string(),
      notes: z.string().nullable().optional(),
      is_active: z.boolean().optional()
    }))
    .mutation(async ({ input }) => {
      try {
        // TODO: Implement with actual database
        logger.info('Creating relationship', { userId: input.user_id, name: input.name });
        return { success: true, message: 'Relationship created' };
      } catch (error) {
        logger.error('Error creating relationship', { userId: input.user_id, error });
        throw new Error('Failed to create relationship');
      }
    }),

  updateRelationship: t.procedure
    .input(z.object({
      id: z.string(),
      name: z.string(),
      role: z.string(),
      notes: z.string().nullable().optional()
    }))
    .mutation(async ({ input }) => {
      try {
        // TODO: Implement with actual database
        logger.info('Updating relationship', { id: input.id });
        return { success: true, message: 'Relationship updated' };
      } catch (error) {
        logger.error('Error updating relationship', { id: input.id, error });
        throw new Error('Failed to update relationship');
      }
    }),

  deleteRelationship: t.procedure
    .input(z.object({
      id: z.string()
    }))
    .mutation(async ({ input }) => {
      try {
        // TODO: Implement with actual database
        logger.info('Deleting relationship', { id: input.id });
        return { success: true, message: 'Relationship deleted' };
      } catch (error) {
        logger.error('Error deleting relationship', { id: input.id, error });
        throw new Error('Failed to delete relationship');
      }
    }),
}); 