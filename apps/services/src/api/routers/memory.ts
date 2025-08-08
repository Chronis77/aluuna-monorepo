import { initTRPC } from '@trpc/server';
import { Context } from '../context.js';
import { logger } from '../../utils/logger.js';
import { buildMCP } from '../../mcp/buildMCP.js';
import { z } from 'zod';
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

        return memoryProfile;
      } catch (error) {
        logger.error('Error fetching memory profile', { userId, error });
        throw new Error('Failed to fetch memory profile');
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
        
        // Idempotent: avoid duplicate themes per user+name
        const existing = await ctx.prisma.user_themes.findFirst({
          where: { user_id: input.userId, theme_name: input.themeName }
        });
        const theme = existing
          ? await ctx.prisma.user_themes.update({
              where: { id: existing.id },
              data: {
                theme_category: input.themeCategory ?? existing.theme_category,
                importance_level: input.importanceLevel ?? existing.importance_level
              }
            })
          : await ctx.prisma.user_themes.create({
              data: {
                user_id: input.userId,
                theme_name: input.themeName,
                theme_category: input.themeCategory,
                importance_level: input.importanceLevel
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
            relationship_type: input.relationshipType,
            role: input.role,
            importance_level: input.importanceLevel,
            notes: input.notes
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
        
        // Idempotent: avoid duplicate coping tools per user+name
        const existing = await ctx.prisma.user_coping_tools.findFirst({
          where: { user_id: input.userId, tool_name: input.toolName }
        });
        const copingTool = existing
          ? await ctx.prisma.user_coping_tools.update({
              where: { id: existing.id },
              data: {
                tool_category: input.toolCategory ?? existing.tool_category,
                effectiveness_rating: input.effectivenessRating ?? existing.effectiveness_rating,
                description: input.description ?? existing.description,
                when_to_use: input.whenToUse ?? existing.when_to_use
              }
            })
          : await ctx.prisma.user_coping_tools.create({
              data: {
                user_id: input.userId,
                tool_name: input.toolName,
                tool_category: input.toolCategory,
                effectiveness_rating: input.effectivenessRating,
                description: input.description,
                when_to_use: input.whenToUse
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
        
        // Idempotent: avoid duplicate goals per user+title
        const existing = await ctx.prisma.user_goals.findFirst({
          where: { user_id: input.userId, goal_title: input.goalTitle }
        });
        const goal = existing
          ? await ctx.prisma.user_goals.update({
              where: { id: existing.id },
              data: {
                goal_description: input.goalDescription ?? existing.goal_description,
                goal_category: input.goalCategory ?? existing.goal_category,
                priority_level: input.priorityLevel ?? existing.priority_level,
                target_date: input.targetDate ?? existing.target_date,
                status: input.status ?? existing.status
              }
            })
          : await ctx.prisma.user_goals.create({
              data: {
                user_id: input.userId,
                goal_title: input.goalTitle,
                goal_description: input.goalDescription,
                goal_category: input.goalCategory,
                priority_level: input.priorityLevel,
                target_date: input.targetDate,
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
            pattern_description: input.patternDescription,
            trigger_events: input.triggerEvents || [],
            emotional_response: input.emotionalResponse,
            coping_strategies: input.copingStrategies || [],
            severity_level: input.severityLevel
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
            trigger_situation: input.triggerSituation,
            automatic_response: input.automaticResponse,
            consequences: input.consequences,
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
            theme_description: input.themeDescription,
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
        
        // Idempotent: avoid duplicate strengths per user+name
        const existing = await ctx.prisma.user_strengths.findFirst({
          where: { user_id: input.userId, strength_name: input.strengthName }
        });
        const strength = existing
          ? await ctx.prisma.user_strengths.update({
              where: { id: existing.id },
              data: {
                strength_category: input.strengthCategory ?? existing.strength_category,
                confidence_level: input.confidenceLevel ?? existing.confidence_level,
                how_developed: input.howDeveloped ?? existing.how_developed,
                how_utilized: input.howUtilized ?? existing.how_utilized
              }
            })
          : await ctx.prisma.user_strengths.create({
              data: {
                user_id: input.userId,
                strength_name: input.strengthName,
                strength_category: input.strengthCategory,
                confidence_level: input.confidenceLevel,
                how_developed: input.howDeveloped,
                how_utilized: input.howUtilized
              }
            });
        
        logger.info(existing ? 'Updated strength' : 'Added strength', { id: strength.id });
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
            insight_category: input.insightCategory,
            importance_level: input.importanceLevel,
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
            partner_name: input.partnerName,
            relationship_duration: input.relationshipDuration,
            satisfaction_level: input.satisfactionLevel,
            challenges: input.challenges || [],
            strengths: input.strengths || []
          },
          create: {
            user_id: input.userId,
            current_status: input.currentStatus,
            partner_name: input.partnerName,
            relationship_duration: input.relationshipDuration,
            satisfaction_level: input.satisfactionLevel,
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
            location: input.location,
            housemates: input.housemates || [],
            financial_stability: input.financialStability,
            housing_satisfaction: input.housingSatisfaction
          },
          create: {
            user_id: input.userId,
            living_arrangement: input.livingArrangement,
            location: input.location,
            housemates: input.housemates || [],
            financial_stability: input.financialStability,
            housing_satisfaction: input.housingSatisfaction
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
        
        // Idempotent: avoid duplicate support member per user+person_name
        const existing = await ctx.prisma.user_support_system.findFirst({
          where: { user_id: input.userId, person_name: input.personName }
        });
        const supportMember = existing
          ? await ctx.prisma.user_support_system.update({
              where: { id: existing.id },
              data: {
                relationship_type: input.relationshipType ?? existing.relationship_type,
                support_type: input.supportType ?? existing.support_type,
                reliability_level: input.reliabilityLevel ?? existing.reliability_level,
                contact_info: input.contactInfo ?? existing.contact_info
              }
            })
          : await ctx.prisma.user_support_system.create({
              data: {
                user_id: input.userId,
                person_name: input.personName,
                relationship_type: input.relationshipType,
                support_type: input.supportType || [],
                reliability_level: input.reliabilityLevel,
                contact_info: input.contactInfo
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
        
        // Idempotent: avoid duplicate stressor per user+name
        const existing = await ctx.prisma.user_current_stressors.findFirst({
          where: { user_id: input.userId, stressor_name: input.stressorName }
        });
        const stressor = existing
          ? await ctx.prisma.user_current_stressors.update({
              where: { id: existing.id },
              data: {
                stressor_type: input.stressorType ?? existing.stressor_type,
                impact_level: input.impactLevel ?? existing.impact_level,
                duration: input.duration ?? existing.duration,
                coping_strategies: input.copingStrategies ?? existing.coping_strategies
              }
            })
          : await ctx.prisma.user_current_stressors.create({
              data: {
                user_id: input.userId,
                stressor_name: input.stressorName,
                stressor_type: input.stressorType,
                impact_level: input.impactLevel,
                duration: input.duration,
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
        
        // Idempotent: avoid duplicate daily habit per user+name
        const existing = await ctx.prisma.user_daily_habits.findFirst({
          where: { user_id: input.userId, habit_name: input.habitName }
        });
        const habit = existing
          ? await ctx.prisma.user_daily_habits.update({
              where: { id: existing.id },
              data: {
                habit_category: input.habitCategory ?? existing.habit_category,
                frequency: input.frequency ?? existing.frequency,
                consistency_level: input.consistencyLevel ?? existing.consistency_level,
                impact_on_wellbeing: input.impactOnWellbeing ?? existing.impact_on_wellbeing
              }
            })
          : await ctx.prisma.user_daily_habits.create({
              data: {
                user_id: input.userId,
                habit_name: input.habitName,
                habit_category: input.habitCategory,
                frequency: input.frequency,
                consistency_level: input.consistencyLevel,
                impact_on_wellbeing: input.impactOnWellbeing
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
        
        // Idempotent: avoid duplicate substance per user+name
        const existing = await ctx.prisma.user_substance_use.findFirst({
          where: { user_id: input.userId, substance_name: input.substanceName }
        });
        const substance = existing
          ? await ctx.prisma.user_substance_use.update({
              where: { id: existing.id },
              data: {
                usage_pattern: input.usagePattern ?? existing.usage_pattern,
                frequency: input.frequency ?? existing.frequency,
                impact_level: input.impactLevel ?? existing.impact_level,
                triggers: input.triggers ?? existing.triggers,
                harm_reduction_strategies: input.harmReductionStrategies ?? existing.harm_reduction_strategies
              }
            })
          : await ctx.prisma.user_substance_use.create({
              data: {
                user_id: input.userId,
                substance_name: input.substanceName,
                usage_pattern: input.usagePattern,
                frequency: input.frequency,
                impact_level: input.impactLevel,
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
            bedtime: input.bedtime,
            wake_time: input.wakeTime,
            sleep_duration_hours: input.sleepDurationHours,
            sleep_quality_rating: input.sleepQualityRating,
            sleep_hygiene_practices: input.sleepHygienePractices || [],
            sleep_issues: input.sleepIssues || []
          },
          create: {
            user_id: input.userId,
            bedtime: input.bedtime,
            wake_time: input.wakeTime,
            sleep_duration_hours: input.sleepDurationHours,
            sleep_quality_rating: input.sleepQualityRating,
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
        
        // Idempotent: avoid duplicate previous therapy per user+therapy_type(+duration)
        const existing = await ctx.prisma.user_previous_therapy.findFirst({
          where: { user_id: input.userId, therapy_type: input.therapyType, duration: input.duration ?? undefined }
        });
        const previousTherapy = existing
          ? await ctx.prisma.user_previous_therapy.update({
              where: { id: existing.id },
              data: {
                therapist_name: input.therapistName ?? existing.therapist_name,
                effectiveness_rating: input.effectivenessRating ?? existing.effectiveness_rating,
                key_insights: input.keyInsights ?? existing.key_insights,
                termination_reason: input.terminationReason ?? existing.termination_reason
              }
            })
          : await ctx.prisma.user_previous_therapy.create({
              data: {
                user_id: input.userId,
                therapy_type: input.therapyType,
                therapist_name: input.therapistName,
                duration: input.duration,
                effectiveness_rating: input.effectivenessRating,
                key_insights: input.keyInsights,
                termination_reason: input.terminationReason
              }
            });
        
        logger.info(existing ? 'Updated previous therapy' : 'Added previous therapy', { id: previousTherapy.id });
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
            preferred_tone: input.preferredTone,
            communication_style: input.communicationStyle,
            feedback_frequency: input.feedbackFrequency,
            session_length_preference: input.sessionLengthPreference
          },
          create: {
            user_id: input.userId,
            preferred_therapy_styles: input.preferredTherapyStyles || [],
            preferred_tone: input.preferredTone,
            communication_style: input.communicationStyle,
            feedback_frequency: input.feedbackFrequency,
            session_length_preference: input.sessionLengthPreference
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
            spiritual_connection_level: input.spiritualConnectionLevel,
            personal_agency_level: input.personalAgencyLevel,
            boundaries_awareness: input.boundariesAwareness,
            self_development_capacity: input.selfDevelopmentCapacity,
            hard_truths_tolerance: input.hardTruthsTolerance,
            awareness_level: input.awarenessLevel,
            suicidal_risk_level: input.suicidalRiskLevel,
            sleep_quality: input.sleepQuality,
            mood_score_initial: input.moodScoreInitial,
            biggest_challenge: input.biggestChallenge,
            biggest_obstacle: input.biggestObstacle,
            motivation_for_joining: input.motivationForJoining,
            hopes_to_achieve: input.hopesToAchieve
          },
          create: {
            user_id: input.userId,
            spiritual_connection_level: input.spiritualConnectionLevel,
            personal_agency_level: input.personalAgencyLevel,
            boundaries_awareness: input.boundariesAwareness,
            self_development_capacity: input.selfDevelopmentCapacity,
            hard_truths_tolerance: input.hardTruthsTolerance,
            awareness_level: input.awarenessLevel,
            suicidal_risk_level: input.suicidalRiskLevel,
            sleep_quality: input.sleepQuality,
            mood_score_initial: input.moodScoreInitial,
            biggest_challenge: input.biggestChallenge,
            biggest_obstacle: input.biggestObstacle,
            motivation_for_joining: input.motivationForJoining,
            hopes_to_achieve: input.hopesToAchieve
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
            state_description: input.stateDescription,
            physical_sensations: input.physicalSensations || [],
            thoughts_patterns: input.thoughtsPatterns || [],
            behaviors: input.behaviors || [],
            intensity_level: input.intensityLevel
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
        
        // Idempotency: if a record already exists for the same user and calendar day, update it instead of creating a duplicate
        const targetDate = new Date(input.thoughtDate);
        const startOfDay = new Date(targetDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(startOfDay);
        endOfDay.setDate(endOfDay.getDate() + 1);

        const existing = await ctx.prisma.user_suicidal_thoughts.findFirst({
          where: {
            user_id: input.userId,
            thought_date: {
              gte: startOfDay,
              lt: endOfDay
            }
          },
          orderBy: { thought_date: 'desc' }
        });

        const data = {
          user_id: input.userId,
          thought_date: targetDate,
          thought_content: input.thoughtContent,
          intensity_level: input.intensityLevel,
          risk_level: input.riskLevel,
          protective_factors: input.protectiveFactors || [],
          safety_plan_activated: input.safetyPlanActivated || false,
          professional_help_sought: input.professionalHelpSought || false
        };

        if (existing) {
          const updated = await ctx.prisma.user_suicidal_thoughts.update({
            where: { id: existing.id },
            data
          });
          logger.info('Updated existing suicidal thought for day', { id: updated.id });
          return updated;
        }

        const created = await ctx.prisma.user_suicidal_thoughts.create({ data });
        logger.info('Added suicidal thought', { id: created.id });
        return created;
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
          'user_insight_notes': ctx.prisma.user_insight_notes
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
          'user_insight_notes': ctx.prisma.user_insight_notes
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