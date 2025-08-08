import { initTRPC } from '@trpc/server';
import { Context } from '../context.js';
import { logger } from '../../utils/logger.js';
import { z } from 'zod';
import { protectedProcedure, publicProcedure } from '../middleware/auth.js';

const t = initTRPC.context<Context>().create();

// Helper function to safely get or create user profile summary
async function getOrCreateUserProfileSummary(ctx: Context, userId: string) {
  let profileSummary = await ctx.prisma.user_profile_summary.findUnique({
    where: { user_id: userId }
  });

  if (!profileSummary) {
    // Create profile summary if it doesn't exist
    profileSummary = await ctx.prisma.user_profile_summary.create({
      data: {
        user_id: userId,
        spiritual_connection_level: null,
        personal_agency_level: null,
        boundaries_awareness: null,
        self_development_capacity: null,
        hard_truths_tolerance: null,
        awareness_level: null,
        suicidal_risk_level: null,
        sleep_quality: null,
        mood_score_initial: null,
        biggest_challenge: null,
        biggest_obstacle: null,
        motivation_for_joining: null,
        hopes_to_achieve: null
      }
    });
  }

  return profileSummary;
}

export const userProfileRouter = t.router({
  // Get complete memory profile
  getMemoryProfile: t.procedure
    .input(z.object({
      userId: z.string()
    }))
    .query(async ({ input, ctx }) => {
      try {
        logger.info('Getting complete memory profile', { userId: input.userId });
        
        const profileSummary = await getOrCreateUserProfileSummary(ctx, input.userId);
        
        // Get all related memory data
        const [
          themes,
          people,
          copingTools,
          goals,
          traumaPatterns,
          patternLoops,
          shadowThemes,
          ancestralIssues,
          currentPractices,
          regulationStrategies,
          dysregulatingFactors,
          roleModelTraits,
          growthMilestones,
          emotionalPatterns,
          relationshipDynamics,
          growthOpportunities,
          riskFactors,
          strengths,
          moodTrends,
          emotionalStates,
          supportSystem,
          currentStressors,
          dailyHabits,
          substanceUse,
          previousTherapy,
          suicidalThoughts,
          insightNotes
        ] = await Promise.all([
          ctx.prisma.user_themes.findMany({
            where: { user_id: input.userId, is_active: true }
          }),
          ctx.prisma.user_people.findMany({
            where: { user_id: input.userId, is_active: true }
          }),
          ctx.prisma.user_coping_tools.findMany({
            where: { user_id: input.userId, is_active: true }
          }),
          ctx.prisma.user_goals.findMany({
            where: { user_id: input.userId }
          }),
          ctx.prisma.user_trauma_patterns.findMany({
            where: { user_id: input.userId, is_active: true }
          }),
          ctx.prisma.user_pattern_loops.findMany({
            where: { user_id: input.userId, is_active: true }
          }),
          ctx.prisma.user_shadow_themes.findMany({
            where: { user_id: input.userId, is_active: true }
          }),
          ctx.prisma.user_ancestral_issues.findMany({
            where: { user_id: input.userId, is_active: true }
          }),
          ctx.prisma.user_current_practices.findMany({
            where: { user_id: input.userId, is_active: true }
          }),
          ctx.prisma.user_regulation_strategies.findMany({
            where: { user_id: input.userId, is_active: true }
          }),
          ctx.prisma.user_dysregulating_factors.findMany({
            where: { user_id: input.userId, is_active: true }
          }),
          ctx.prisma.user_role_model_traits.findMany({
            where: { user_id: input.userId, is_active: true }
          }),
          ctx.prisma.user_growth_milestones.findMany({
            where: { user_id: input.userId, is_active: true }
          }),
          ctx.prisma.user_emotional_patterns.findMany({
            where: { user_id: input.userId, is_active: true }
          }),
          ctx.prisma.user_relationship_dynamics.findMany({
            where: { user_id: input.userId, is_active: true }
          }),
          ctx.prisma.user_growth_opportunities.findMany({
            where: { user_id: input.userId, is_active: true }
          }),
          ctx.prisma.user_risk_factors.findMany({
            where: { user_id: input.userId, is_active: true }
          }),
          ctx.prisma.user_strengths.findMany({
            where: { user_id: input.userId, is_active: true }
          }),
          ctx.prisma.user_mood_trends.findMany({
            where: { user_id: input.userId },
            orderBy: { recorded_date: 'desc' },
            take: 30
          }),
          ctx.prisma.user_emotional_states.findMany({
            where: { user_id: input.userId, is_active: true }
          }),
          ctx.prisma.user_support_system.findMany({
            where: { user_id: input.userId, is_active: true }
          }),
          ctx.prisma.user_current_stressors.findMany({
            where: { user_id: input.userId, is_active: true }
          }),
          ctx.prisma.user_daily_habits.findMany({
            where: { user_id: input.userId, is_active: true }
          }),
          ctx.prisma.user_substance_use.findMany({
            where: { user_id: input.userId, is_active: true }
          }),
          ctx.prisma.user_previous_therapy.findMany({
            where: { user_id: input.userId, is_active: true }
          }),
          ctx.prisma.user_suicidal_thoughts.findMany({
            where: { user_id: input.userId },
            orderBy: { thought_date: 'desc' },
            take: 10
          }),
          ctx.prisma.user_insight_notes.findMany({
            where: { user_id: input.userId, is_active: true },
            orderBy: { created_at: 'desc' },
            take: 20
          })
        ]);

        const completeProfile = {
          profile_summary: profileSummary,
          themes,
          people,
          coping_tools: copingTools,
          goals,
          trauma_patterns: traumaPatterns,
          pattern_loops: patternLoops,
          shadow_themes: shadowThemes,
          ancestral_issues: ancestralIssues,
          current_practices: currentPractices,
          regulation_strategies: regulationStrategies,
          dysregulating_factors: dysregulatingFactors,
          role_model_traits: roleModelTraits,
          growth_milestones: growthMilestones,
          emotional_patterns: emotionalPatterns,
          relationship_dynamics: relationshipDynamics,
          growth_opportunities: growthOpportunities,
          risk_factors: riskFactors,
          strengths,
          mood_trends: moodTrends,
          emotional_states: emotionalStates,
          support_system: supportSystem,
          current_stressors: currentStressors,
          daily_habits: dailyHabits,
          substance_use: substanceUse,
          previous_therapy: previousTherapy,
          suicidal_thoughts: suicidalThoughts,
          insight_notes: insightNotes
        };

        logger.info('Retrieved complete memory profile', { 
          userId: input.userId,
          themesCount: themes.length,
          peopleCount: people.length,
          copingToolsCount: copingTools.length
        });

        return completeProfile;
      } catch (error) {
        logger.error('Error getting complete memory profile', { userId: input.userId, error });
        throw new Error('Failed to get complete memory profile');
      }
    }),

  // Update profile summary
  updateProfileSummary: protectedProcedure
    .input(z.object({
      userId: z.string(),
      updates: z.object({
        spiritual_connection_level: z.number().min(1).max(10).optional(),
        personal_agency_level: z.number().min(1).max(10).optional(),
        boundaries_awareness: z.number().min(1).max(10).optional(),
        self_development_capacity: z.number().min(1).max(10).optional(),
        hard_truths_tolerance: z.number().min(1).max(10).optional(),
        awareness_level: z.number().min(1).max(10).optional(),
        suicidal_risk_level: z.number().min(0).max(3).optional(),
        sleep_quality: z.string().optional(),
        mood_score_initial: z.number().min(1).max(10).optional(),
        biggest_challenge: z.string().optional(),
        biggest_obstacle: z.string().optional(),
        motivation_for_joining: z.string().optional(),
        hopes_to_achieve: z.string().optional()
      })
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        logger.info('Updating profile summary', { userId: input.userId, updates: input.updates });
        
        const profileSummary = await ctx.prisma.user_profile_summary.upsert({
          where: { user_id: input.userId },
          update: input.updates,
          create: {
            user_id: input.userId,
            ...input.updates
          }
        });
        
        logger.info('Updated profile summary', { userId: input.userId });
        return profileSummary;
      } catch (error) {
        logger.error('Error updating profile summary', { userId: input.userId, error });
        throw new Error('Failed to update profile summary');
      }
    }),

  // Get profile summary only
  getProfileSummary: t.procedure
    .input(z.object({
      userId: z.string()
    }))
    .query(async ({ input, ctx }) => {
      try {
        logger.info('Getting profile summary', { userId: input.userId });
        
        const profileSummary = await getOrCreateUserProfileSummary(ctx, input.userId);
        
        logger.info('Retrieved profile summary', { userId: input.userId });
        return profileSummary;
      } catch (error) {
        logger.error('Error getting profile summary', { userId: input.userId, error });
        throw new Error('Failed to get profile summary');
      }
    }),

  // Get specific memory category
  getMemoryCategory: t.procedure
    .input(z.object({
      userId: z.string(),
      category: z.enum([
        'themes', 'people', 'coping_tools', 'goals', 'trauma_patterns', 
        'pattern_loops', 'shadow_themes', 'ancestral_issues', 'current_practices',
        'regulation_strategies', 'dysregulating_factors', 'role_model_traits',
        'growth_milestones', 'emotional_patterns', 'relationship_dynamics',
        'growth_opportunities', 'risk_factors', 'strengths', 'mood_trends',
        'emotional_states', 'support_system', 'current_stressors', 'daily_habits',
        'substance_use', 'previous_therapy', 'suicidal_thoughts', 'insight_notes'
      ])
    }))
    .query(async ({ input, ctx }) => {
      try {
        logger.info('Getting memory category', { userId: input.userId, category: input.category });
        
        const categoryMap: Record<string, any> = {
          themes: ctx.prisma.user_themes,
          people: ctx.prisma.user_people,
          coping_tools: ctx.prisma.user_coping_tools,
          goals: ctx.prisma.user_goals,
          trauma_patterns: ctx.prisma.user_trauma_patterns,
          pattern_loops: ctx.prisma.user_pattern_loops,
          shadow_themes: ctx.prisma.user_shadow_themes,
          ancestral_issues: ctx.prisma.user_ancestral_issues,
          current_practices: ctx.prisma.user_current_practices,
          regulation_strategies: ctx.prisma.user_regulation_strategies,
          dysregulating_factors: ctx.prisma.user_dysregulating_factors,
          role_model_traits: ctx.prisma.user_role_model_traits,
          growth_milestones: ctx.prisma.user_growth_milestones,
          emotional_patterns: ctx.prisma.user_emotional_patterns,
          relationship_dynamics: ctx.prisma.user_relationship_dynamics,
          growth_opportunities: ctx.prisma.user_growth_opportunities,
          risk_factors: ctx.prisma.user_risk_factors,
          strengths: ctx.prisma.user_strengths,
          mood_trends: ctx.prisma.user_mood_trends,
          emotional_states: ctx.prisma.user_emotional_states,
          support_system: ctx.prisma.user_support_system,
          current_stressors: ctx.prisma.user_current_stressors,
          daily_habits: ctx.prisma.user_daily_habits,
          substance_use: ctx.prisma.user_substance_use,
          previous_therapy: ctx.prisma.user_previous_therapy,
          suicidal_thoughts: ctx.prisma.user_suicidal_thoughts,
          insight_notes: ctx.prisma.user_insight_notes
        };
        
        const model = categoryMap[input.category];
        if (!model) {
          throw new Error(`Unsupported category: ${input.category}`);
        }
        
        const items = await model.findMany({
          where: { 
            user_id: input.userId,
            ...(input.category !== 'goals' && input.category !== 'mood_trends' && input.category !== 'suicidal_thoughts' && { is_active: true })
          },
          orderBy: { created_at: 'desc' }
        });
        
        logger.info('Retrieved memory category', { 
          userId: input.userId, 
          category: input.category, 
          count: items.length 
        });
        
        return items;
      } catch (error) {
        logger.error('Error getting memory category', { userId: input.userId, category: input.category, error });
        throw new Error('Failed to get memory category');
      }
    }),

  // Get memory statistics
  getMemoryStats: t.procedure
    .input(z.object({
      userId: z.string()
    }))
    .query(async ({ input, ctx }) => {
      try {
        logger.info('Getting memory stats', { userId: input.userId });
        
        const [
          themesCount,
          peopleCount,
          copingToolsCount,
          goalsCount,
          traumaPatternsCount,
          patternLoopsCount,
          shadowThemesCount,
          strengthsCount,
          insightNotesCount
        ] = await Promise.all([
          ctx.prisma.user_themes.count({ where: { user_id: input.userId, is_active: true } }),
          ctx.prisma.user_people.count({ where: { user_id: input.userId, is_active: true } }),
          ctx.prisma.user_coping_tools.count({ where: { user_id: input.userId, is_active: true } }),
          ctx.prisma.user_goals.count({ where: { user_id: input.userId } }),
          ctx.prisma.user_trauma_patterns.count({ where: { user_id: input.userId, is_active: true } }),
          ctx.prisma.user_pattern_loops.count({ where: { user_id: input.userId, is_active: true } }),
          ctx.prisma.user_shadow_themes.count({ where: { user_id: input.userId, is_active: true } }),
          ctx.prisma.user_strengths.count({ where: { user_id: input.userId, is_active: true } }),
          ctx.prisma.user_insight_notes.count({ where: { user_id: input.userId, is_active: true } })
        ]);
        
        const stats = {
          themes: themesCount,
          people: peopleCount,
          coping_tools: copingToolsCount,
          goals: goalsCount,
          trauma_patterns: traumaPatternsCount,
          pattern_loops: patternLoopsCount,
          shadow_themes: shadowThemesCount,
          strengths: strengthsCount,
          insight_notes: insightNotesCount,
          total_items: themesCount + peopleCount + copingToolsCount + goalsCount + 
                      traumaPatternsCount + patternLoopsCount + shadowThemesCount + 
                      strengthsCount + insightNotesCount
        };
        
        logger.info('Retrieved memory stats', { userId: input.userId, stats });
        return stats;
      } catch (error) {
        logger.error('Error getting memory stats', { userId: input.userId, error });
        throw new Error('Failed to get memory stats');
      }
    })
}); 