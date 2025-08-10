import { initTRPC } from '@trpc/server';
import { Context } from '../context.js';
import { logger } from '../../utils/logger.js';
import { z } from 'zod';
import { protectedProcedure } from '../middleware/auth.js';

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
        
        // Get all memory data from the new normalized tables
        const [
          userProfileSummary,
          userThemes,
          userPeople,
          userCopingTools,
          userGoals,
          userTraumaPatterns,
          userPatternLoops,
          userShadowThemes,
          userAncestralIssues,
          userCurrentPractices,
          userRegulationStrategies,
          userDysregulatingFactors,
          userRoleModelTraits,
          userGrowthMilestones,
          userEmotionalPatterns,
          userRelationshipDynamics,
          userGrowthOpportunities,
          userRiskFactors,
          userStrengths,
          userMoodTrends,
          userEmotionalStates,
          userSupportSystem,
          userCurrentStressors,
          userDailyHabits,
          userSubstanceUse,
          userPreviousTherapy,
          userSuicidalThoughts,
          userInsightNotes
        ] = await Promise.all([
          ctx.prisma.user_profile_summary.findUnique({
            where: { user_id: userId }
          }),
          ctx.prisma.user_themes.findMany({
            where: { user_id: userId, is_active: true }
          }),
          ctx.prisma.user_people.findMany({
            where: { user_id: userId, is_active: true }
          }),
          ctx.prisma.user_coping_tools.findMany({
            where: { user_id: userId, is_active: true }
          }),
          ctx.prisma.user_goals.findMany({
            where: { user_id: userId }
          }),
          ctx.prisma.user_trauma_patterns.findMany({
            where: { user_id: userId, is_active: true }
          }),
          ctx.prisma.user_pattern_loops.findMany({
            where: { user_id: userId, is_active: true }
          }),
          ctx.prisma.user_shadow_themes.findMany({
            where: { user_id: userId, is_active: true }
          }),
          ctx.prisma.user_ancestral_issues.findMany({
            where: { user_id: userId, is_active: true }
          }),
          ctx.prisma.user_current_practices.findMany({
            where: { user_id: userId, is_active: true }
          }),
          ctx.prisma.user_regulation_strategies.findMany({
            where: { user_id: userId, is_active: true }
          }),
          ctx.prisma.user_dysregulating_factors.findMany({
            where: { user_id: userId, is_active: true }
          }),
          ctx.prisma.user_role_model_traits.findMany({
            where: { user_id: userId, is_active: true }
          }),
          ctx.prisma.user_growth_milestones.findMany({
            where: { user_id: userId, is_active: true }
          }),
          ctx.prisma.user_emotional_patterns.findMany({
            where: { user_id: userId, is_active: true }
          }),
          ctx.prisma.user_relationship_dynamics.findMany({
            where: { user_id: userId, is_active: true }
          }),
          ctx.prisma.user_growth_opportunities.findMany({
            where: { user_id: userId, is_active: true }
          }),
          ctx.prisma.user_risk_factors.findMany({
            where: { user_id: userId, is_active: true }
          }),
          ctx.prisma.user_strengths.findMany({
            where: { user_id: userId, is_active: true }
          }),
          ctx.prisma.user_mood_trends.findMany({
            where: { user_id: userId },
            orderBy: { recorded_date: 'desc' },
            take: 30 // Last 30 entries
          }),
          ctx.prisma.user_emotional_states.findMany({
            where: { user_id: userId, is_active: true }
          }),
          ctx.prisma.user_support_system.findMany({
            where: { user_id: userId, is_active: true }
          }),
          ctx.prisma.user_current_stressors.findMany({
            where: { user_id: userId, is_active: true }
          }),
          ctx.prisma.user_daily_habits.findMany({
            where: { user_id: userId, is_active: true }
          }),
          ctx.prisma.user_substance_use.findMany({
            where: { user_id: userId, is_active: true }
          }),
          ctx.prisma.user_previous_therapy.findMany({
            where: { user_id: userId, is_active: true }
          }),
          ctx.prisma.user_suicidal_thoughts.findMany({
            where: { user_id: userId },
            orderBy: { thought_date: 'desc' },
            take: 10 // Last 10 entries
          }),
          ctx.prisma.user_insight_notes.findMany({
            where: { user_id: userId, is_active: true },
            orderBy: { created_at: 'desc' },
            take: 20 // Last 20 insights
          })
        ]);

        // Build comprehensive memory profile
        const memoryProfile = {
          // Profile summary
          profile_summary: userProfileSummary,
          
          // Core memory data
          themes: userThemes,
          people: userPeople,
          coping_tools: userCopingTools,
          goals: userGoals,
          trauma_patterns: userTraumaPatterns,
          pattern_loops: userPatternLoops,
          shadow_themes: userShadowThemes,
          ancestral_issues: userAncestralIssues,
          current_practices: userCurrentPractices,
          regulation_strategies: userRegulationStrategies,
          dysregulating_factors: userDysregulatingFactors,
          role_model_traits: userRoleModelTraits,
          growth_milestones: userGrowthMilestones,
          emotional_patterns: userEmotionalPatterns,
          relationship_dynamics: userRelationshipDynamics,
          growth_opportunities: userGrowthOpportunities,
          risk_factors: userRiskFactors,
          strengths: userStrengths,
          mood_trends: userMoodTrends,
          emotional_states: userEmotionalStates,
          support_system: userSupportSystem,
          current_stressors: userCurrentStressors,
          daily_habits: userDailyHabits,
          substance_use: userSubstanceUse,
          previous_therapy: userPreviousTherapy,
          suicidal_thoughts: userSuicidalThoughts,
          insight_notes: userInsightNotes
        };

        logger.info('Retrieved memory profile', { 
          userId, 
          themesCount: userThemes.length,
          peopleCount: userPeople.length,
          copingToolsCount: userCopingTools.length,
          goalsCount: userGoals.length
        });

        return { success: true, profile: memoryProfile };
      } catch (error) {
        logger.error('Error fetching memory profile', { userId, error });
        throw new Error('Failed to fetch memory profile');
      }
    }),

  // Unified memories feed for memory profile page
  getAllMemories: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input, ctx }) => {
      const { userId } = input;
      try {
        const [
          innerParts,
          snapshots,
          copingTools,
          shadowThemes,
          patternLoops
        ] = await Promise.all([
          ctx.prisma.user_inner_parts.findMany({ where: { user_id: userId } }),
          ctx.prisma.user_memory_snapshots.findMany({ where: { user_id: userId }, orderBy: { created_at: 'desc' } }),
          ctx.prisma.user_coping_tools.findMany({ where: { user_id: userId, is_active: true }, orderBy: { created_at: 'desc' } }),
          ctx.prisma.user_shadow_themes.findMany({ where: { user_id: userId, is_active: true }, orderBy: { created_at: 'desc' } }),
          ctx.prisma.user_pattern_loops.findMany({ where: { user_id: userId, is_active: true }, orderBy: { created_at: 'desc' } }),
        ]);

        const items = [
          // Inner parts
          ...innerParts.map((part) => ({
            id: part.id,
            type: 'inner_part' as const,
            title: part.name,
            content: [part.role, part.description].filter(Boolean).join(' - '),
            metadata: { role: part.role, tone: part.tone },
            createdAt: part.created_at,
            updatedAt: part.updated_at,
          })),
          // Memory snapshots
          ...snapshots.map((snap) => ({
            id: snap.id,
            type: 'memory_snapshot' as const,
            title: 'Session Memory',
            content: snap.summary,
            metadata: { themes: snap.key_themes || [], generatedBy: snap.generated_by },
            createdAt: snap.created_at,
            updatedAt: snap.updated_at,
          })),
          // Coping tools
          ...copingTools.map((tool) => ({
            id: tool.id,
            type: 'coping_tool' as const,
            title: tool.tool_name,
            content: tool.description || tool.tool_category || 'Coping tool',
            metadata: {
              tool_category: tool.tool_category,
              effectiveness_rating: tool.effectiveness_rating,
              when_to_use: tool.when_to_use,
            },
            createdAt: tool.created_at,
            updatedAt: tool.updated_at,
          })),
          // Shadow themes
          ...shadowThemes.map((theme) => ({
            id: theme.id,
            type: 'shadow_theme' as const,
            title: theme.theme_name,
            content: theme.theme_description || 'Shadow theme',
            metadata: {
              triggers: theme.triggers,
              avoidance_behaviors: theme.avoidance_behaviors,
              integration_strategies: theme.integration_strategies,
            },
            createdAt: theme.created_at,
            updatedAt: theme.updated_at,
          })),
          // Pattern loops
          ...patternLoops.map((loop) => ({
            id: loop.id,
            type: 'pattern_loop' as const,
            title: loop.loop_name,
            content: loop.automatic_response || loop.trigger_situation || loop.consequences || 'Pattern loop',
            metadata: {
              trigger_situation: loop.trigger_situation,
              consequences: loop.consequences,
              alternative_responses: loop.alternative_responses,
            },
            createdAt: loop.created_at,
            updatedAt: loop.updated_at,
          })),
        ];

        // Sort newest first by createdAt
        items.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        return { success: true, items };
      } catch (error) {
        logger.error('Error getting all memories', { userId, error });
        throw new Error('Failed to get memories');
      }
    }),

  // Get memory snapshots for a user
  getMemorySnapshots: protectedProcedure
    .input(z.object({
      userId: z.string()
    }))
    .query(async ({ input, ctx }) => {
      try {
        const snapshots = await ctx.prisma.user_memory_snapshots.findMany({
          where: { user_id: input.userId },
          orderBy: { created_at: 'desc' }
        });
        return { success: true, snapshots };
      } catch (error) {
        logger.error('Error getting memory snapshots', { userId: input.userId, error });
        throw new Error('Failed to get memory snapshots');
      }
    }),

  // Update a memory snapshot summary
  updateMemorySnapshot: protectedProcedure
    .input(z.object({
      id: z.string(),
      content: z.string()
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        const updated = await ctx.prisma.user_memory_snapshots.update({
          where: { id: input.id },
          data: { summary: input.content }
        });
        return { success: true, snapshot: updated };
      } catch (error) {
        logger.error('Error updating memory snapshot', { id: input.id, error });
        throw new Error('Failed to update memory snapshot');
      }
    }),

  // Delete a memory snapshot
  deleteMemorySnapshot: protectedProcedure
    .input(z.object({
      id: z.string()
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        await ctx.prisma.user_memory_snapshots.delete({ where: { id: input.id } });
        return { success: true };
      } catch (error) {
        logger.error('Error deleting memory snapshot', { id: input.id, error });
        throw new Error('Failed to delete memory snapshot');
      }
    }),

  // Add theme to user's memory
  addTheme: protectedProcedure
    .input(z.object({
      userId: z.string(),
      themeName: z.string(),
      themeCategory: z.string().optional(),
      importanceLevel: z.number().min(1).max(10).optional()
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        logger.info('Adding theme', { input });
        
        const theme = await ctx.prisma.user_themes.create({
          data: {
            user_id: input.userId,
            theme_name: input.themeName,
            theme_category: input.themeCategory ?? null,
            importance_level: input.importanceLevel ?? null
          }
        });
        
        logger.info('Added theme', { id: theme.id });
        return theme;
      } catch (error) {
        logger.error('Error adding theme', { input, error });
        throw new Error('Failed to add theme');
      }
    }),

  // Add person to user's memory
  addPerson: protectedProcedure
    .input(z.object({
      userId: z.string(),
      name: z.string(),
      relationshipType: z.string().optional(),
      role: z.string().optional(),
      importanceLevel: z.number().min(1).max(10).optional(),
      notes: z.string().optional()
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        logger.info('Adding person', { input });
        
        const person = await ctx.prisma.user_people.create({
          data: {
            user_id: input.userId,
            name: input.name,
            relationship_type: input.relationshipType ?? null,
            role: input.role ?? null,
            importance_level: input.importanceLevel ?? null,
            notes: input.notes ?? null
          }
        });
        
        logger.info('Added person', { id: person.id });
        return person;
      } catch (error) {
        logger.error('Error adding person', { input, error });
        throw new Error('Failed to add person');
      }
    }),

  // Add coping tool to user's memory
  addCopingTool: protectedProcedure
    .input(z.object({
      userId: z.string(),
      toolName: z.string(),
      toolCategory: z.string().optional(),
      effectivenessRating: z.number().min(1).max(10).optional(),
      description: z.string().optional(),
      whenToUse: z.string().optional()
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        logger.info('Adding coping tool', { input });
        
        const copingTool = await ctx.prisma.user_coping_tools.create({
          data: {
            user_id: input.userId,
            tool_name: input.toolName,
            tool_category: input.toolCategory ?? null,
            effectiveness_rating: input.effectivenessRating ?? null,
            description: input.description ?? null,
            when_to_use: input.whenToUse ?? null
          }
        });
        
        logger.info('Added coping tool', { id: copingTool.id });
        return copingTool;
      } catch (error) {
        logger.error('Error adding coping tool', { input, error });
        throw new Error('Failed to add coping tool');
      }
    }),

  // Add goal to user's memory
  addGoal: protectedProcedure
    .input(z.object({
      userId: z.string(),
      goalTitle: z.string(),
      goalDescription: z.string().optional(),
      goalCategory: z.string().optional(),
      priorityLevel: z.number().min(1).max(5).optional(),
      targetDate: z.date().optional(),
      status: z.enum(['active', 'completed', 'paused', 'abandoned']).default('active')
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        logger.info('Adding goal', { input });
        
        const goal = await ctx.prisma.user_goals.create({
            data: {
              user_id: input.userId,
            goal_title: input.goalTitle,
            goal_description: input.goalDescription ?? null,
            goal_category: input.goalCategory ?? null,
            priority_level: input.priorityLevel ?? null,
            target_date: input.targetDate ?? null,
            status: input.status
          }
        });
        
        logger.info('Added goal', { id: goal.id });
        return goal;
      } catch (error) {
        logger.error('Error adding goal', { input, error });
        throw new Error('Failed to add goal');
      }
    }),

  // Add trauma pattern to user's memory
  addTraumaPattern: protectedProcedure
    .input(z.object({
      userId: z.string(),
      patternName: z.string(),
      patternDescription: z.string().optional(),
      triggerEvents: z.array(z.string()).optional(),
      emotionalResponse: z.string().optional(),
      copingStrategies: z.array(z.string()).optional(),
      severityLevel: z.number().min(1).max(10).optional()
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        logger.info('Adding trauma pattern', { input });
        
        const traumaPattern = await ctx.prisma.user_trauma_patterns.create({
          data: {
            user_id: input.userId,
            pattern_name: input.patternName,
            pattern_description: input.patternDescription ?? null,
            trigger_events: input.triggerEvents || [],
            emotional_response: input.emotionalResponse ?? null,
            coping_strategies: input.copingStrategies || [],
            severity_level: input.severityLevel ?? null
          }
        });
        
        logger.info('Added trauma pattern', { id: traumaPattern.id });
        return traumaPattern;
      } catch (error) {
        logger.error('Error adding trauma pattern', { input, error });
        throw new Error('Failed to add trauma pattern');
      }
    }),

  // Add pattern loop to user's memory
  addPatternLoop: protectedProcedure
    .input(z.object({
      userId: z.string(),
      loopName: z.string(),
      triggerSituation: z.string().optional(),
      automaticResponse: z.string().optional(),
      consequences: z.string().optional(),
      alternativeResponses: z.array(z.string()).optional()
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        logger.info('Adding pattern loop', { input });
        
        const patternLoop = await ctx.prisma.user_pattern_loops.create({
          data: {
            user_id: input.userId,
            loop_name: input.loopName,
            trigger_situation: input.triggerSituation ?? null,
            automatic_response: input.automaticResponse ?? null,
            consequences: input.consequences ?? null,
            alternative_responses: input.alternativeResponses || []
          }
        });
        
        logger.info('Added pattern loop', { id: patternLoop.id });
        return patternLoop;
      } catch (error) {
        logger.error('Error adding pattern loop', { input, error });
        throw new Error('Failed to add pattern loop');
      }
    }),

  // Add shadow theme to user's memory
  addShadowTheme: protectedProcedure
    .input(z.object({
      userId: z.string(),
      themeName: z.string(),
      themeDescription: z.string().optional(),
      triggers: z.array(z.string()).optional(),
      avoidanceBehaviors: z.array(z.string()).optional(),
      integrationStrategies: z.array(z.string()).optional()
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        logger.info('Adding shadow theme', { input });
        
        const shadowTheme = await ctx.prisma.user_shadow_themes.create({
            data: {
              user_id: input.userId,
            theme_name: input.themeName,
            theme_description: input.themeDescription ?? null,
            triggers: input.triggers || [],
            avoidance_behaviors: input.avoidanceBehaviors || [],
            integration_strategies: input.integrationStrategies || []
          }
        });
        
        logger.info('Added shadow theme', { id: shadowTheme.id });
        return shadowTheme;
      } catch (error) {
        logger.error('Error adding shadow theme', { input, error });
        throw new Error('Failed to add shadow theme');
      }
    }),

  // Add strength to user's memory
  addStrength: protectedProcedure
    .input(z.object({
      userId: z.string(),
      strengthName: z.string(),
      strengthCategory: z.string().optional(),
      confidenceLevel: z.number().min(1).max(10).optional(),
      howDeveloped: z.string().optional(),
      howUtilized: z.string().optional()
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        logger.info('Adding strength', { input });
        
        const strength = await ctx.prisma.user_strengths.create({
          data: {
            user_id: input.userId,
            strength_name: input.strengthName,
            strength_category: input.strengthCategory ?? null,
            confidence_level: input.confidenceLevel ?? null,
            how_developed: input.howDeveloped ?? null,
            how_utilized: input.howUtilized ?? null
          }
        });
        
        logger.info('Added strength', { id: strength.id });
        return strength;
      } catch (error) {
        logger.error('Error adding strength', { input, error });
        throw new Error('Failed to add strength');
      }
    }),

  // Add insight note to user's memory
  addInsightNote: protectedProcedure
    .input(z.object({
      userId: z.string(),
      insightTitle: z.string(),
      insightContent: z.string(),
      insightCategory: z.string().optional(),
      importanceLevel: z.number().min(1).max(10).optional(),
      relatedThemes: z.array(z.string()).optional(),
      actionItems: z.array(z.string()).optional()
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        logger.info('Adding insight note', { input });
        
        const insightNote = await ctx.prisma.user_insight_notes.create({
            data: {
              user_id: input.userId,
            insight_title: input.insightTitle,
            insight_content: input.insightContent,
            insight_category: input.insightCategory ?? null,
            importance_level: input.importanceLevel ?? null,
            related_themes: input.relatedThemes || [],
            action_items: input.actionItems || []
          }
        });
        
        logger.info('Added insight note', { id: insightNote.id });
        return insightNote;
      } catch (error) {
        logger.error('Error adding insight note', { input, error });
        throw new Error('Failed to add insight note');
      }
    }),

  // Add relationship status
  addRelationshipStatus: protectedProcedure
    .input(z.object({
      userId: z.string(),
      currentStatus: z.string(),
      partnerName: z.string().optional(),
      relationshipDuration: z.string().optional(),
      satisfactionLevel: z.number().min(1).max(10).optional(),
      challenges: z.array(z.string()).optional(),
      strengths: z.array(z.string()).optional()
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        logger.info('Adding relationship status', { input });
        
        const relationshipStatus = await ctx.prisma.user_relationship_status.upsert({
          where: { user_id: input.userId },
          update: {
            current_status: input.currentStatus,
            partner_name: input.partnerName ?? null,
            relationship_duration: input.relationshipDuration ?? null,
            satisfaction_level: input.satisfactionLevel ?? null,
            challenges: input.challenges || [],
            strengths: input.strengths || []
          },
          create: {
            user_id: input.userId,
            current_status: input.currentStatus,
            partner_name: input.partnerName ?? null,
            relationship_duration: input.relationshipDuration ?? null,
            satisfaction_level: input.satisfactionLevel ?? null,
            challenges: input.challenges || [],
            strengths: input.strengths || []
          }
        });
        
        logger.info('Added relationship status', { id: relationshipStatus.id });
        return relationshipStatus;
      } catch (error) {
        logger.error('Error adding relationship status', { input, error });
        throw new Error('Failed to add relationship status');
      }
    }),

  // Add living situation
  addLivingSituation: protectedProcedure
    .input(z.object({
      userId: z.string(),
      livingArrangement: z.string(),
      location: z.string().optional(),
      housemates: z.array(z.string()).optional(),
      financialStability: z.string().optional(),
      housingSatisfaction: z.number().min(1).max(10).optional()
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        logger.info('Adding living situation', { input });
        
        const livingSituation = await ctx.prisma.user_living_situation.upsert({
          where: { user_id: input.userId },
          update: {
            living_arrangement: input.livingArrangement,
            location: input.location ?? null,
            housemates: input.housemates || [],
            financial_stability: input.financialStability ?? null,
            housing_satisfaction: input.housingSatisfaction ?? null
          },
          create: {
            user_id: input.userId,
            living_arrangement: input.livingArrangement,
            location: input.location ?? null,
            housemates: input.housemates || [],
            financial_stability: input.financialStability ?? null,
            housing_satisfaction: input.housingSatisfaction ?? null
          }
        });
        
        logger.info('Added living situation', { id: livingSituation.id });
        return livingSituation;
      } catch (error) {
        logger.error('Error adding living situation', { input, error });
        throw new Error('Failed to add living situation');
      }
    }),

  // Add support system members
  addSupportSystem: protectedProcedure
    .input(z.object({
      userId: z.string(),
      personName: z.string(),
      relationshipType: z.string().optional(),
      supportType: z.array(z.string()).optional(),
      reliabilityLevel: z.number().min(1).max(10).optional(),
      contactInfo: z.string().optional()
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        logger.info('Adding support system member', { input });
        
        const supportMember = await ctx.prisma.user_support_system.create({
          data: {
            user_id: input.userId,
            person_name: input.personName,
            relationship_type: input.relationshipType ?? null,
            support_type: input.supportType || [],
            reliability_level: input.reliabilityLevel ?? null,
            contact_info: input.contactInfo ?? null
          }
        });
        
        logger.info('Added support system member', { id: supportMember.id });
        return supportMember;
      } catch (error) {
        logger.error('Error adding support system member', { input, error });
        throw new Error('Failed to add support system member');
      }
    }),

  // Add current stressor
  addCurrentStressor: protectedProcedure
    .input(z.object({
      userId: z.string(),
      stressorName: z.string(),
      stressorType: z.string().optional(),
      impactLevel: z.number().min(1).max(10).optional(),
      duration: z.string().optional(),
      copingStrategies: z.array(z.string()).optional()
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        logger.info('Adding current stressor', { input });
        
        const stressor = await ctx.prisma.user_current_stressors.create({
          data: {
            user_id: input.userId,
            stressor_name: input.stressorName,
            stressor_type: input.stressorType ?? null,
            impact_level: input.impactLevel ?? null,
            duration: input.duration ?? null,
            coping_strategies: input.copingStrategies || []
          }
        });
        
        logger.info('Added current stressor', { id: stressor.id });
        return stressor;
      } catch (error) {
        logger.error('Error adding current stressor', { input, error });
        throw new Error('Failed to add current stressor');
      }
    }),

  // Add daily habit
  addDailyHabit: protectedProcedure
    .input(z.object({
      userId: z.string(),
      habitName: z.string(),
      habitCategory: z.string().optional(),
      frequency: z.string().optional(),
      consistencyLevel: z.number().min(1).max(10).optional(),
      impactOnWellbeing: z.string().optional()
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        logger.info('Adding daily habit', { input });
        
        const habit = await ctx.prisma.user_daily_habits.create({
          data: {
            user_id: input.userId,
            habit_name: input.habitName,
            habit_category: input.habitCategory ?? null,
            frequency: input.frequency ?? null,
            consistency_level: input.consistencyLevel ?? null,
            impact_on_wellbeing: input.impactOnWellbeing ?? null
          }
        });
        
        logger.info('Added daily habit', { id: habit.id });
        return habit;
      } catch (error) {
        logger.error('Error adding daily habit', { input, error });
        throw new Error('Failed to add daily habit');
      }
    }),

  // Add substance use
  addSubstanceUse: protectedProcedure
    .input(z.object({
      userId: z.string(),
      substanceName: z.string(),
      usagePattern: z.string().optional(),
      frequency: z.string().optional(),
      impactLevel: z.number().min(1).max(10).optional(),
      triggers: z.array(z.string()).optional(),
      harmReductionStrategies: z.array(z.string()).optional()
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        logger.info('Adding substance use', { input });
        
        const substance = await ctx.prisma.user_substance_use.create({
          data: {
            user_id: input.userId,
            substance_name: input.substanceName,
            usage_pattern: input.usagePattern ?? null,
            frequency: input.frequency ?? null,
            impact_level: input.impactLevel ?? null,
            triggers: input.triggers || [],
            harm_reduction_strategies: input.harmReductionStrategies || []
          }
        });
        
        logger.info('Added substance use', { id: substance.id });
        return substance;
      } catch (error) {
        logger.error('Error adding substance use', { input, error });
        throw new Error('Failed to add substance use');
      }
    }),

  // Add sleep routine
  addSleepRoutine: protectedProcedure
    .input(z.object({
      userId: z.string(),
      bedtime: z.string().optional(),
      wakeTime: z.string().optional(),
      sleepDurationHours: z.number().optional(),
      sleepQualityRating: z.number().min(1).max(10).optional(),
      sleepHygienePractices: z.array(z.string()).optional(),
      sleepIssues: z.array(z.string()).optional()
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        logger.info('Adding sleep routine', { input });
        
        const sleepRoutine = await ctx.prisma.user_sleep_routine.upsert({
          where: { user_id: input.userId },
          update: {
            bedtime: input.bedtime ?? null,
            wake_time: input.wakeTime ?? null,
            sleep_duration_hours: input.sleepDurationHours ?? null,
            sleep_quality_rating: input.sleepQualityRating ?? null,
            sleep_hygiene_practices: input.sleepHygienePractices || [],
            sleep_issues: input.sleepIssues || []
          },
          create: {
            user_id: input.userId,
            bedtime: input.bedtime ?? null,
            wake_time: input.wakeTime ?? null,
            sleep_duration_hours: input.sleepDurationHours ?? null,
            sleep_quality_rating: input.sleepQualityRating ?? null,
            sleep_hygiene_practices: input.sleepHygienePractices || [],
            sleep_issues: input.sleepIssues || []
          }
        });
        
        logger.info('Added sleep routine', { id: sleepRoutine.id });
        return sleepRoutine;
      } catch (error) {
        logger.error('Error adding sleep routine', { input, error });
        throw new Error('Failed to add sleep routine');
      }
    }),

  // Add previous therapy
  addPreviousTherapy: protectedProcedure
    .input(z.object({
      userId: z.string(),
      therapyType: z.string(),
      therapistName: z.string().optional(),
      duration: z.string().optional(),
      effectivenessRating: z.number().min(1).max(10).optional(),
      keyInsights: z.string().optional(),
      terminationReason: z.string().optional()
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        logger.info('Adding previous therapy', { input });
        
        const previousTherapy = await ctx.prisma.user_previous_therapy.create({
          data: {
            user_id: input.userId,
            therapy_type: input.therapyType,
            therapist_name: input.therapistName ?? null,
            duration: input.duration ?? null,
            effectiveness_rating: input.effectivenessRating ?? null,
            key_insights: input.keyInsights ?? null,
            termination_reason: input.terminationReason ?? null
          }
        });
        
        logger.info('Added previous therapy', { id: previousTherapy.id });
        return previousTherapy;
      } catch (error) {
        logger.error('Error adding previous therapy', { input, error });
        throw new Error('Failed to add previous therapy');
      }
    }),

  // Add therapy preferences
  addTherapyPreferences: protectedProcedure
    .input(z.object({
      userId: z.string(),
      preferredTherapyStyles: z.array(z.string()).optional(),
      preferredTone: z.string().optional(),
      communicationStyle: z.string().optional(),
      feedbackFrequency: z.string().optional(),
      sessionLengthPreference: z.number().optional()
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        logger.info('Adding therapy preferences', { input });
        
        const therapyPreferences = await ctx.prisma.user_therapy_preferences.upsert({
          where: { user_id: input.userId },
          update: {
            preferred_therapy_styles: input.preferredTherapyStyles || [],
            preferred_tone: input.preferredTone ?? null,
            communication_style: input.communicationStyle ?? null,
            feedback_frequency: input.feedbackFrequency ?? null,
            session_length_preference: input.sessionLengthPreference ?? null
          },
          create: {
            user_id: input.userId,
            preferred_therapy_styles: input.preferredTherapyStyles || [],
            preferred_tone: input.preferredTone ?? null,
            communication_style: input.communicationStyle ?? null,
            feedback_frequency: input.feedbackFrequency ?? null,
            session_length_preference: input.sessionLengthPreference ?? null
          }
        });
        
        logger.info('Added therapy preferences', { id: therapyPreferences.id });
        return therapyPreferences;
      } catch (error) {
        logger.error('Error adding therapy preferences', { input, error });
        throw new Error('Failed to add therapy preferences');
      }
    }),

  // Add profile summary
  addProfileSummary: protectedProcedure
    .input(z.object({
      userId: z.string(),
      spiritualConnectionLevel: z.number().min(1).max(10).optional(),
      personalAgencyLevel: z.number().min(1).max(10).optional(),
      boundariesAwareness: z.number().min(1).max(10).optional(),
      selfDevelopmentCapacity: z.number().min(1).max(10).optional(),
      hardTruthsTolerance: z.number().min(1).max(10).optional(),
      awarenessLevel: z.number().min(1).max(10).optional(),
      suicidalRiskLevel: z.number().min(0).max(4).optional(),
      sleepQuality: z.string().optional(),
      moodScoreInitial: z.number().optional(),
      biggestChallenge: z.string().optional(),
      biggestObstacle: z.string().optional(),
      motivationForJoining: z.string().optional(),
      hopesToAchieve: z.string().optional()
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        logger.info('Adding profile summary', { input });
        
        const profileSummary = await ctx.prisma.user_profile_summary.upsert({
          where: { user_id: input.userId },
          update: {
            spiritual_connection_level: input.spiritualConnectionLevel ?? null,
            personal_agency_level: input.personalAgencyLevel ?? null,
            boundaries_awareness: input.boundariesAwareness ?? null,
            self_development_capacity: input.selfDevelopmentCapacity ?? null,
            hard_truths_tolerance: input.hardTruthsTolerance ?? null,
            awareness_level: input.awarenessLevel ?? null,
            suicidal_risk_level: input.suicidalRiskLevel ?? null,
            sleep_quality: input.sleepQuality ?? null,
            mood_score_initial: input.moodScoreInitial ?? null,
            biggest_challenge: input.biggestChallenge ?? null,
            biggest_obstacle: input.biggestObstacle ?? null,
            motivation_for_joining: input.motivationForJoining ?? null,
            hopes_to_achieve: input.hopesToAchieve ?? null
          },
          create: {
            user_id: input.userId,
            spiritual_connection_level: input.spiritualConnectionLevel ?? null,
            personal_agency_level: input.personalAgencyLevel ?? null,
            boundaries_awareness: input.boundariesAwareness ?? null,
            self_development_capacity: input.selfDevelopmentCapacity ?? null,
            hard_truths_tolerance: input.hardTruthsTolerance ?? null,
            awareness_level: input.awarenessLevel ?? null,
            suicidal_risk_level: input.suicidalRiskLevel ?? null,
            sleep_quality: input.sleepQuality ?? null,
            mood_score_initial: input.moodScoreInitial ?? null,
            biggest_challenge: input.biggestChallenge ?? null,
            biggest_obstacle: input.biggestObstacle ?? null,
            motivation_for_joining: input.motivationForJoining ?? null,
            hopes_to_achieve: input.hopesToAchieve ?? null
          }
        });
        
        logger.info('Added profile summary', { id: profileSummary.id });
        return profileSummary;
      } catch (error) {
        logger.error('Error adding profile summary', { input, error });
        throw new Error('Failed to add profile summary');
      }
    }),

  // Add emotional state
  addEmotionalState: protectedProcedure
    .input(z.object({
      userId: z.string(),
      stateName: z.string(),
      stateDescription: z.string().optional(),
      physicalSensations: z.array(z.string()).optional(),
      thoughtsPatterns: z.array(z.string()).optional(),
      behaviors: z.array(z.string()).optional(),
      intensityLevel: z.number().min(1).max(10).optional()
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        logger.info('Adding emotional state', { input });
        
        const emotionalState = await ctx.prisma.user_emotional_states.create({
          data: {
            user_id: input.userId,
            state_name: input.stateName,
            state_description: input.stateDescription ?? null,
            physical_sensations: input.physicalSensations || [],
            thoughts_patterns: input.thoughtsPatterns || [],
            behaviors: input.behaviors || [],
            intensity_level: input.intensityLevel ?? null
          }
        });
        
        logger.info('Added emotional state', { id: emotionalState.id });
        return emotionalState;
      } catch (error) {
        logger.error('Error adding emotional state', { input, error });
        throw new Error('Failed to add emotional state');
      }
    }),

  // Add suicidal thought
  addSuicidalThought: protectedProcedure
    .input(z.object({
      userId: z.string(),
      thoughtDate: z.string(),
      thoughtContent: z.string().optional(),
      intensityLevel: z.number().min(1).max(10).optional(),
      riskLevel: z.number().min(1).max(10).optional(),
      protectiveFactors: z.array(z.string()).optional(),
      safetyPlanActivated: z.boolean().optional(),
      professionalHelpSought: z.boolean().optional()
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        logger.info('Adding suicidal thought', { input });
        
        const suicidalThought = await ctx.prisma.user_suicidal_thoughts.create({
          data: {
            user_id: input.userId,
            thought_date: new Date(input.thoughtDate),
            thought_content: input.thoughtContent ?? null,
            intensity_level: input.intensityLevel ?? null,
            risk_level: input.riskLevel ?? null,
            protective_factors: input.protectiveFactors || [],
            safety_plan_activated: input.safetyPlanActivated || false,
            professional_help_sought: input.professionalHelpSought || false
          }
        });
        
        logger.info('Added suicidal thought', { id: suicidalThought.id });
        return suicidalThought;
      } catch (error) {
        logger.error('Error adding suicidal thought', { input, error });
        throw new Error('Failed to add suicidal thought');
      }
    }),

  // Update memory item (generic function for any table)
  updateMemoryItem: protectedProcedure
    .input(z.object({
      tableName: z.string(),
      itemId: z.string(),
      updates: z.record(z.any())
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        logger.info('Updating memory item', { input });
        
        // Map table names to Prisma models
        const tableMap: Record<string, any> = {
          'user_themes': ctx.prisma.user_themes,
          'user_people': ctx.prisma.user_people,
          'user_coping_tools': ctx.prisma.user_coping_tools,
          'user_goals': ctx.prisma.user_goals,
          'user_trauma_patterns': ctx.prisma.user_trauma_patterns,
          'user_pattern_loops': ctx.prisma.user_pattern_loops,
          'user_shadow_themes': ctx.prisma.user_shadow_themes,
          'user_strengths': ctx.prisma.user_strengths,
          'user_insight_notes': ctx.prisma.user_insight_notes,
          'user_regulation_strategies': ctx.prisma.user_regulation_strategies,
          'user_dysregulating_factors': ctx.prisma.user_dysregulating_factors,
          'user_support_system': ctx.prisma.user_support_system
        };
        
        const model = tableMap[input.tableName];
        if (!model) {
          throw new Error(`Unsupported table: ${input.tableName}`);
        }
        
        const updatedItem = await model.update({
          where: { id: input.itemId },
          data: input.updates
        });
        
        logger.info('Updated memory item', { id: updatedItem.id });
        return updatedItem;
      } catch (error) {
        logger.error('Error updating memory item', { input, error });
        throw new Error('Failed to update memory item');
      }
    }),

  // Delete memory item (generic function for any table)
  deleteMemoryItem: protectedProcedure
    .input(z.object({
      tableName: z.string(),
      itemId: z.string()
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        logger.info('Deleting memory item', { input });
        
        // Map table names to Prisma models
        const tableMap: Record<string, any> = {
          'user_themes': ctx.prisma.user_themes,
          'user_people': ctx.prisma.user_people,
          'user_coping_tools': ctx.prisma.user_coping_tools,
          'user_goals': ctx.prisma.user_goals,
          'user_trauma_patterns': ctx.prisma.user_trauma_patterns,
          'user_pattern_loops': ctx.prisma.user_pattern_loops,
          'user_shadow_themes': ctx.prisma.user_shadow_themes,
          'user_strengths': ctx.prisma.user_strengths,
          'user_insight_notes': ctx.prisma.user_insight_notes,
          'user_regulation_strategies': ctx.prisma.user_regulation_strategies,
          'user_dysregulating_factors': ctx.prisma.user_dysregulating_factors,
          'user_support_system': ctx.prisma.user_support_system
        };
        
        const model = tableMap[input.tableName];
        if (!model) {
          throw new Error(`Unsupported table: ${input.tableName}`);
        }
        
        await model.delete({
          where: { id: input.itemId }
        });
        
        logger.info('Deleted memory item', { id: input.itemId });
        return { success: true };
      } catch (error) {
        logger.error('Error deleting memory item', { input, error });
        throw new Error('Failed to delete memory item');
      }
    }),

  // Get memory statistics
  getMemoryStats: protectedProcedure
    .input(z.object({
      userId: z.string()
    }))
    .query(async ({ input, ctx }) => {
      try {
        logger.info('Getting memory stats', { input });
        
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
        logger.error('Error fetching memory stats', { input, error });
        throw new Error('Failed to fetch memory stats');
      }
    }),


}); 