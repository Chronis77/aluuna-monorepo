import { initTRPC } from '@trpc/server';
import { Context } from '../context.js';
import { logger } from '../../utils/logger.js';
import { z } from 'zod';
import { 
  fromJsonbArray, 
  toJsonbArray, 
  fromJsonbString,
  toJsonbString,
  addToJsonbArray,
  removeFromJsonbArray,
  updateJsonbArrayItem
} from '../../utils/jsonbUtils.js';

const t = initTRPC.context<Context>().create();

// Helper function to safely get memory profile
async function getMemoryProfileSafely(ctx: Context, userId: string) {
  let memoryProfile = await ctx.prisma.memory_profiles.findUnique({
    where: { user_id: userId }
  });

  if (!memoryProfile) {
    // Create memory profile if it doesn't exist
    memoryProfile = await ctx.prisma.memory_profiles.create({
      data: {
        user_id: userId,
        // Initialize all JSONB fields as empty arrays/objects
        themes: [],
        people: {},
        coping_tools: [],
        goals: [],
        summary: null,
        preferred_therapy_styles: [],
        preferred_tone: [],
        trauma_patterns: null,
        pattern_loops: [],
        shadow_themes: [],
        ancestral_issues: null,
        current_practices: [],
        regulation_strategies: [],
        dysregulating_factors: [],
        role_model_traits: [],
        growth_milestones: [],
        emotional_patterns: [],
        relationship_dynamics: [],
        growth_opportunities: [],
        therapeutic_approach: null,
        risk_factors: [],
        strengths: [],
        motivation_for_joining: null,
        hopes_to_achieve: null,
        previous_therapy: null,
        therapy_type: null,
        therapy_duration: null,
        sleep_routine: null,
        mood_trends: [],
        emotional_states_initial: [],
        suicidal_thoughts_initial: null,
        relationship_status: null,
        living_situation: null,
        support_system: [],
        current_stressors: [],
        daily_habits: [],
        substance_use: [],
        biggest_challenge: null,
        biggest_obstacle: null
      }
    });
  }

  return memoryProfile;
}

export const memoryProfileRouter = t.router({
  // Get complete memory profile
  getMemoryProfile: t.procedure
    .input(z.object({
      userId: z.string()
    }))
    .query(async ({ input, ctx }) => {
      try {
        logger.info('Getting complete memory profile', { userId: input.userId });
        
        const memoryProfile = await getMemoryProfileSafely(ctx, input.userId);
        
        // Convert all JSONB fields to frontend-friendly format
        const formattedProfile = {
          ...memoryProfile,
          // Array fields
          themes: fromJsonbArray(memoryProfile.themes),
          coping_tools: fromJsonbArray(memoryProfile.coping_tools),
          goals: fromJsonbArray(memoryProfile.goals),
          preferred_therapy_styles: fromJsonbArray(memoryProfile.preferred_therapy_styles),
          preferred_tone: fromJsonbArray(memoryProfile.preferred_tone),
          pattern_loops: fromJsonbArray(memoryProfile.pattern_loops),
          shadow_themes: fromJsonbArray(memoryProfile.shadow_themes),
          current_practices: fromJsonbArray(memoryProfile.current_practices),
          regulation_strategies: fromJsonbArray(memoryProfile.regulation_strategies),
          dysregulating_factors: fromJsonbArray(memoryProfile.dysregulating_factors),
          role_model_traits: fromJsonbArray(memoryProfile.role_model_traits),
          growth_milestones: fromJsonbArray(memoryProfile.growth_milestones),
          emotional_patterns: fromJsonbArray(memoryProfile.emotional_patterns),
          relationship_dynamics: fromJsonbArray(memoryProfile.relationship_dynamics),
          growth_opportunities: fromJsonbArray(memoryProfile.growth_opportunities),
          risk_factors: fromJsonbArray(memoryProfile.risk_factors),
          strengths: fromJsonbArray(memoryProfile.strengths),
          mood_trends: fromJsonbArray(memoryProfile.mood_trends),
          emotional_states_initial: fromJsonbArray(memoryProfile.emotional_states_initial),
          support_system: fromJsonbArray(memoryProfile.support_system),
          current_stressors: fromJsonbArray(memoryProfile.current_stressors),
          daily_habits: fromJsonbArray(memoryProfile.daily_habits),
          substance_use: fromJsonbArray(memoryProfile.substance_use),
          stuck_points: fromJsonbArray(memoryProfile.stuck_points),
          
          // String fields
          summary: fromJsonbString(memoryProfile.summary),
          trauma_patterns: fromJsonbString(memoryProfile.trauma_patterns),
          ancestral_issues: fromJsonbString(memoryProfile.ancestral_issues),
          spiritual_path_notes: fromJsonbString(memoryProfile.spiritual_path_notes),
          insight_notes: fromJsonbString(memoryProfile.insight_notes),
          therapeutic_approach: fromJsonbString(memoryProfile.therapeutic_approach),
          motivation_for_joining: fromJsonbString(memoryProfile.motivation_for_joining),
          hopes_to_achieve: fromJsonbString(memoryProfile.hopes_to_achieve),
          previous_therapy: fromJsonbString(memoryProfile.previous_therapy),
          therapy_type: fromJsonbString(memoryProfile.therapy_type),
          therapy_duration: fromJsonbString(memoryProfile.therapy_duration),
          sleep_routine: fromJsonbString(memoryProfile.sleep_routine),
          suicidal_thoughts_initial: fromJsonbString(memoryProfile.suicidal_thoughts_initial),
          relationship_status: fromJsonbString(memoryProfile.relationship_status),
          living_situation: fromJsonbString(memoryProfile.living_situation),
          biggest_challenge: fromJsonbString(memoryProfile.biggest_challenge),
          biggest_obstacle: fromJsonbString(memoryProfile.biggest_obstacle)
        };
        
        logger.info('Memory profile retrieved successfully', { userId: input.userId });
        return { success: true, profile: formattedProfile };
      } catch (error) {
        logger.error('Error getting memory profile', { userId: input.userId, error });
        throw new Error('Failed to get memory profile');
      }
    }),

  // Update string field
  updateStringField: t.procedure
    .input(z.object({
      userId: z.string(),
      field: z.enum([
        'summary', 'trauma_patterns', 'ancestral_issues', 'spiritual_path_notes',
        'insight_notes', 'therapeutic_approach', 'motivation_for_joining',
        'hopes_to_achieve', 'previous_therapy', 'therapy_type', 'therapy_duration',
        'sleep_routine', 'suicidal_thoughts_initial', 'relationship_status',
        'living_situation', 'biggest_challenge', 'biggest_obstacle'
      ]),
      value: z.string()
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        logger.info('Updating string field', { userId: input.userId, field: input.field });
        
        await ctx.prisma.memory_profiles.update({
          where: { user_id: input.userId },
          data: { [input.field]: toJsonbString(input.value) }
        });
        
        logger.info('String field updated successfully', { userId: input.userId, field: input.field });
        return { success: true, message: `${input.field} updated successfully` };
      } catch (error) {
        logger.error('Error updating string field', { userId: input.userId, field: input.field, error });
        throw new Error(`Failed to update ${input.field}`);
      }
    }),

  // Update array field - add item
  addArrayItem: t.procedure
    .input(z.object({
      userId: z.string(),
      field: z.enum([
        'themes', 'coping_tools', 'goals', 'preferred_therapy_styles',
        'preferred_tone', 'pattern_loops', 'shadow_themes', 'current_practices',
        'regulation_strategies', 'dysregulating_factors', 'role_model_traits',
        'growth_milestones', 'emotional_patterns', 'relationship_dynamics',
        'growth_opportunities', 'risk_factors', 'strengths', 'mood_trends',
        'emotional_states_initial', 'support_system', 'current_stressors',
        'daily_habits', 'substance_use', 'stuck_points'
      ]),
      item: z.string()
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        logger.info('Adding array item', { userId: input.userId, field: input.field, item: input.item });
        
        const memoryProfile = await getMemoryProfileSafely(ctx, input.userId);
        const currentArray = fromJsonbArray(memoryProfile[input.field]);
        currentArray.push(input.item);
        
        await ctx.prisma.memory_profiles.update({
          where: { user_id: input.userId },
          data: { [input.field]: toJsonbArray(currentArray) }
        });
        
        logger.info('Array item added successfully', { userId: input.userId, field: input.field });
        return { success: true, message: `Item added to ${input.field} successfully` };
      } catch (error) {
        logger.error('Error adding array item', { userId: input.userId, field: input.field, error });
        throw new Error(`Failed to add item to ${input.field}`);
      }
    }),

  // Update array field - update item by index
  updateArrayItem: t.procedure
    .input(z.object({
      userId: z.string(),
      field: z.enum([
        'themes', 'coping_tools', 'goals', 'preferred_therapy_styles',
        'preferred_tone', 'pattern_loops', 'shadow_themes', 'current_practices',
        'regulation_strategies', 'dysregulating_factors', 'role_model_traits',
        'growth_milestones', 'emotional_patterns', 'relationship_dynamics',
        'growth_opportunities', 'risk_factors', 'strengths', 'mood_trends',
        'emotional_states_initial', 'support_system', 'current_stressors',
        'daily_habits', 'substance_use', 'stuck_points'
      ]),
      index: z.number(),
      item: z.string()
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        logger.info('Updating array item', { userId: input.userId, field: input.field, index: input.index });
        
        const memoryProfile = await getMemoryProfileSafely(ctx, input.userId);
        const currentArray = fromJsonbArray(memoryProfile[input.field]);
        
        if (input.index < 0 || input.index >= currentArray.length) {
          throw new Error(`Index ${input.index} out of bounds for ${input.field}`);
        }
        
        currentArray[input.index] = input.item;
        
        await ctx.prisma.memory_profiles.update({
          where: { user_id: input.userId },
          data: { [input.field]: toJsonbArray(currentArray) }
        });
        
        logger.info('Array item updated successfully', { userId: input.userId, field: input.field, index: input.index });
        return { success: true, message: `Item updated in ${input.field} successfully` };
      } catch (error) {
        logger.error('Error updating array item', { userId: input.userId, field: input.field, index: input.index, error });
        throw new Error(`Failed to update item in ${input.field}`);
      }
    }),

  // Update array field - delete item by index
  deleteArrayItem: t.procedure
    .input(z.object({
      userId: z.string(),
      field: z.enum([
        'themes', 'coping_tools', 'goals', 'preferred_therapy_styles',
        'preferred_tone', 'pattern_loops', 'shadow_themes', 'current_practices',
        'regulation_strategies', 'dysregulating_factors', 'role_model_traits',
        'growth_milestones', 'emotional_patterns', 'relationship_dynamics',
        'growth_opportunities', 'risk_factors', 'strengths', 'mood_trends',
        'emotional_states_initial', 'support_system', 'current_stressors',
        'daily_habits', 'substance_use', 'stuck_points'
      ]),
      index: z.number()
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        logger.info('Deleting array item', { userId: input.userId, field: input.field, index: input.index });
        
        const memoryProfile = await getMemoryProfileSafely(ctx, input.userId);
        const currentArray = fromJsonbArray(memoryProfile[input.field]);
        
        if (input.index < 0 || input.index >= currentArray.length) {
          throw new Error(`Index ${input.index} out of bounds for ${input.field}`);
        }
        
        currentArray.splice(input.index, 1);
        
        await ctx.prisma.memory_profiles.update({
          where: { user_id: input.userId },
          data: { [input.field]: toJsonbArray(currentArray) }
        });
        
        logger.info('Array item deleted successfully', { userId: input.userId, field: input.field, index: input.index });
        return { success: true, message: `Item deleted from ${input.field} successfully` };
      } catch (error) {
        logger.error('Error deleting array item', { userId: input.userId, field: input.field, index: input.index, error });
        throw new Error(`Failed to delete item from ${input.field}`);
      }
    }),

  // Update numeric field
  updateNumericField: t.procedure
    .input(z.object({
      userId: z.string(),
      field: z.enum([
        'spiritual_connection_level', 'personal_agency_level', 'boundaries_awareness',
        'self_development_capacity', 'hard_truths_tolerance', 'awareness_level',
        'suicidal_risk_level', 'mood_score_initial'
      ]),
      value: z.number()
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        logger.info('Updating numeric field', { userId: input.userId, field: input.field, value: input.value });
        
        await ctx.prisma.memory_profiles.update({
          where: { user_id: input.userId },
          data: { [input.field]: input.value }
        });
        
        logger.info('Numeric field updated successfully', { userId: input.userId, field: input.field });
        return { success: true, message: `${input.field} updated successfully` };
      } catch (error) {
        logger.error('Error updating numeric field', { userId: input.userId, field: input.field, error });
        throw new Error(`Failed to update ${input.field}`);
      }
    }),

  // Update people field (JSON object)
  updatePeople: t.procedure
    .input(z.object({
      userId: z.string(),
      people: z.record(z.any())
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        logger.info('Updating people field', { userId: input.userId });
        
        await ctx.prisma.memory_profiles.update({
          where: { user_id: input.userId },
          data: { people: input.people }
        });
        
        logger.info('People field updated successfully', { userId: input.userId });
        return { success: true, message: 'People updated successfully' };
      } catch (error) {
        logger.error('Error updating people field', { userId: input.userId, error });
        throw new Error('Failed to update people');
      }
    }),

  // Bulk update multiple fields
  bulkUpdate: t.procedure
    .input(z.object({
      userId: z.string(),
      updates: z.record(z.any())
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        logger.info('Bulk updating memory profile', { userId: input.userId, fields: Object.keys(input.updates) });
        
        // Process updates to convert to proper JSONB format
        const processedUpdates: any = {};
        
        for (const [field, value] of Object.entries(input.updates)) {
          if (Array.isArray(value)) {
            processedUpdates[field] = toJsonbArray(value);
          } else if (typeof value === 'string') {
            processedUpdates[field] = toJsonbString(value);
          } else {
            processedUpdates[field] = value;
          }
        }
        
        await ctx.prisma.memory_profiles.update({
          where: { user_id: input.userId },
          data: processedUpdates
        });
        
        logger.info('Bulk update completed successfully', { userId: input.userId });
        return { success: true, message: 'Memory profile updated successfully' };
      } catch (error) {
        logger.error('Error in bulk update', { userId: input.userId, error });
        throw new Error('Failed to update memory profile');
      }
    })
}); 