import { initTRPC } from '@trpc/server';
import { Context } from '../context.js';
import { logger } from '../../utils/logger.js';
import { z } from 'zod';
import { prisma } from '../../db/client.js';

const t = initTRPC.context<Context>().create();

export const onboardingRouter = t.router({
  getOnboardingProgress: t.procedure
    .input(z.object({
      user_id: z.string()
    }))
    .query(async ({ input }) => {
      try {
        logger.info('Getting onboarding progress', { userId: input.user_id });
        
        const progress = await prisma.user_onboarding_progress.findUnique({
          where: { user_id: input.user_id }
        });
        
        if (progress) {
          logger.info('Found onboarding progress', { userId: input.user_id });
          return { onboarding_data: progress.onboarding_data };
        } else {
          logger.info('No onboarding progress found', { userId: input.user_id });
          return { onboarding_data: {} };
        }
      } catch (error) {
        logger.error('Error fetching onboarding progress', { userId: input.user_id, error });
        throw new Error('Failed to fetch onboarding progress');
      }
    }),

  upsertOnboardingProgress: t.procedure
    .input(z.object({
      user_id: z.string(),
      onboarding_data: z.any(),
      updated_at: z.string()
    }))
    .mutation(async ({ input }) => {
      try {
        logger.info('Upserting onboarding progress', { userId: input.user_id });
        
        await prisma.user_onboarding_progress.upsert({
          where: { user_id: input.user_id },
          update: {
            onboarding_data: input.onboarding_data,
            updated_at: new Date()
          },
          create: {
            user_id: input.user_id,
            onboarding_data: input.onboarding_data
          }
        });
        
        logger.info('Onboarding progress upserted successfully', { userId: input.user_id });
        return { success: true, message: 'Onboarding progress updated' };
      } catch (error) {
        logger.error('Error upserting onboarding progress', { userId: input.user_id, error });
        throw new Error('Failed to upsert onboarding progress');
      }
    }),

  deleteOnboardingProgress: t.procedure
    .input(z.object({
      user_id: z.string()
    }))
    .mutation(async ({ input }) => {
      try {
        logger.info('Deleting onboarding progress', { userId: input.user_id });
        // Idempotent delete (record may already be removed by finalizeOnboarding)
        const result = await prisma.user_onboarding_progress.deleteMany({
          where: { user_id: input.user_id }
        });
        logger.info('Onboarding progress delete attempted', { userId: input.user_id, deletedCount: result.count });
        return { success: true, deleted: result.count };
      } catch (error) {
        logger.error('Error deleting onboarding progress', { userId: input.user_id, error });
        // Swallow not-found to keep operation idempotent
        // Prisma P2025 can surface here if using delete (now using deleteMany)
        return { success: true, deleted: 0 };
      }
    }),

  checkOnboardingStatus: t.procedure
    .input(z.object({
      user_id: z.string()
    }))
    .query(async ({ input }) => {
      try {
        logger.info('Checking onboarding status', { userId: input.user_id });
        
        // Check if user has skipped or completed onboarding
        const user = await prisma.users.findUnique({
          where: { id: input.user_id },
        }) as any;
        
        if (!user) {
          throw new Error('User not found');
        }
        
        // Check if user has completed onboarding
        const progress = await prisma.user_onboarding_progress.findUnique({
          where: { user_id: input.user_id }
        });
        
        const hasCompletedOnboarding = Boolean(user.onboarding_completed_at) || (
          progress && 
          progress.onboarding_data && 
          typeof progress.onboarding_data === 'object' &&
          Object.keys(progress.onboarding_data).length > 0
        );
        
        logger.info('Onboarding status checked', { 
          userId: input.user_id, 
          skipped: user.onboarding_skipped,
          completed: hasCompletedOnboarding,
          completedAt: user.onboarding_completed_at ?? null
        });
        
        return {
          shouldShowOnboarding: !user.onboarding_skipped && !hasCompletedOnboarding,
          hasSkipped: user.onboarding_skipped,
          hasCompleted: hasCompletedOnboarding,
          completedAt: user.onboarding_completed_at ?? null
        };
      } catch (error) {
        logger.error('Error checking onboarding status', { userId: input.user_id, error });
        throw new Error('Failed to check onboarding status');
      }
    }),

  markOnboardingCompleted: t.procedure
    .input(z.object({
      user_id: z.string(),
      completed_at: z.string().optional()
    }))
    .mutation(async ({ input }) => {
      try {
        logger.info('Marking onboarding as completed', { userId: input.user_id });
        
        const updated = await prisma.users.update({
          where: { id: input.user_id },
          data: ({ onboarding_completed_at: input.completed_at ? new Date(input.completed_at) : new Date() } as any)
        });
        
        logger.info('Onboarding marked as completed', { userId: input.user_id, completedAt: (updated as any).onboarding_completed_at ?? null });
        return { success: true, completed_at: (updated as any).onboarding_completed_at ?? null };
      } catch (error) {
        logger.error('Error marking onboarding as completed', { userId: input.user_id, error });
        throw new Error('Failed to mark onboarding as completed');
      }
    }),

  markOnboardingSkipped: t.procedure
    .input(z.object({
      user_id: z.string()
    }))
    .mutation(async ({ input }) => {
      try {
        logger.info('Marking onboarding as skipped', { userId: input.user_id });
        
        await prisma.users.update({
          where: { id: input.user_id },
          data: { onboarding_skipped: true }
        });
        
        logger.info('Onboarding marked as skipped successfully', { userId: input.user_id });
        return { success: true };
      } catch (error) {
        logger.error('Error marking onboarding as skipped', { userId: input.user_id, error });
        throw new Error('Failed to mark onboarding as skipped');
      }
    }),

  // Finalize onboarding in a single transaction
  finalizeOnboarding: t.procedure
    .input(z.object({
      user_id: z.string(),
      onboarding_data: z.any()
    }))
    .mutation(async ({ input }) => {
      const userId = input.user_id;
      const data = input.onboarding_data || {};
      logger.info('Finalizing onboarding (transactional)', { userId });

      try {
        await prisma.$transaction(async (tx) => {
          // Step 1: Profile summary
          const suicidalRiskLevel = data?.step1?.suicidalThoughts === 'Currently' ? 4 :
            data?.step1?.suicidalThoughts === 'Often' ? 3 :
            data?.step1?.suicidalThoughts === 'Sometimes' ? 2 :
            data?.step1?.suicidalThoughts === 'Rarely' ? 1 : 0;

          await tx.user_profile_summary.upsert({
            where: { user_id: userId },
            update: {
              personal_agency_level: data?.step5?.motivationLevel,
              awareness_level: data?.step5?.motivationLevel,
              suicidal_risk_level: suicidalRiskLevel,
              sleep_quality: data?.step1?.sleepQuality,
              mood_score_initial: data?.step1?.moodScore,
              biggest_challenge: data?.step3?.biggestChallenge,
              biggest_obstacle: data?.step4?.biggestObstacle,
              motivation_for_joining: data?.step5?.motivationForJoining,
              hopes_to_achieve: data?.step5?.hopesToAchieve,
            },
            create: {
              user_id: userId,
              personal_agency_level: data?.step5?.motivationLevel,
              awareness_level: data?.step5?.motivationLevel,
              suicidal_risk_level: suicidalRiskLevel,
              sleep_quality: data?.step1?.sleepQuality,
              mood_score_initial: data?.step1?.moodScore,
              biggest_challenge: data?.step3?.biggestChallenge,
              biggest_obstacle: data?.step4?.biggestObstacle,
              motivation_for_joining: data?.step5?.motivationForJoining,
              hopes_to_achieve: data?.step5?.hopesToAchieve,
            }
          });

          // Emotional states (reset onboarding-tagged entries then bulk insert)
          if (Array.isArray(data?.step1?.emotionalStates)) {
            await tx.user_emotional_states.deleteMany({
              where: { user_id: userId, state_description: 'Initial emotional state from onboarding' }
            });
            if (data.step1.emotionalStates.length > 0) {
              await tx.user_emotional_states.createMany({
                data: data.step1.emotionalStates.map((name: string) => ({
                  user_id: userId,
                  state_name: name,
                  state_description: 'Initial emotional state from onboarding',
                  intensity_level: 5,
                  is_active: true,
                }))
              });
            }
          }

          // Suicidal thoughts (optional)
          if (data?.step1?.suicidalThoughts && data.step1.suicidalThoughts !== 'Never') {
            await tx.user_suicidal_thoughts.create({
              data: {
                user_id: userId,
                thought_date: new Date(),
                thought_content: data.step1.suicidalThoughts,
                intensity_level: suicidalRiskLevel,
                risk_level: suicidalRiskLevel
              }
            });
          }

          // Step 2: Relationship status
          if (data?.step2?.relationshipStatus) {
            await tx.user_relationship_status.upsert({
              where: { user_id: userId },
              update: { current_status: data.step2.relationshipStatus },
              create: { user_id: userId, current_status: data.step2.relationshipStatus }
            });
          }

          // Living situation
          if (data?.step2?.livingSituation) {
            await tx.user_living_situation.upsert({
              where: { user_id: userId },
              update: { living_arrangement: data.step2.livingSituation },
              create: { user_id: userId, living_arrangement: data.step2.livingSituation }
            });
          }

          // Support system (reset category then bulk insert)
          if (Array.isArray(data?.step2?.supportSystem)) {
            await tx.user_support_system.deleteMany({ where: { user_id: userId, relationship_type: 'support_person' } });
            if (data.step2.supportSystem.length > 0) {
              await tx.user_support_system.createMany({
                data: data.step2.supportSystem.map((personName: string) => ({
                  user_id: userId,
                  person_name: personName,
                  relationship_type: 'support_person',
                  support_type: ['emotional', 'practical'],
                  reliability_level: 7,
                  is_active: true,
                }))
              });
            }
          }

          // Current stressors (reset category then bulk insert)
          if (Array.isArray(data?.step2?.currentStressors)) {
            await tx.user_current_stressors.deleteMany({ where: { user_id: userId, stressor_type: 'life_context' } });
            if (data.step2.currentStressors.length > 0) {
              await tx.user_current_stressors.createMany({
                data: data.step2.currentStressors.map((stressorName: string) => ({
                  user_id: userId,
                  stressor_name: stressorName,
                  stressor_type: 'life_context',
                  impact_level: 6,
                  is_active: true,
                }))
              });
            }
          }

          // Step 3: Daily habits (reset category then bulk insert)
          if (Array.isArray(data?.step3?.dailyHabits)) {
            await tx.user_daily_habits.deleteMany({ where: { user_id: userId, habit_category: 'wellness' } });
            if (data.step3.dailyHabits.length > 0) {
              await tx.user_daily_habits.createMany({
                data: data.step3.dailyHabits.map((habitName: string) => ({
                  user_id: userId,
                  habit_name: habitName,
                  habit_category: 'wellness',
                  frequency: 'daily',
                  consistency_level: 5,
                  impact_on_wellbeing: 'positive',
                  is_active: true,
                }))
              });
            }
          }

          // Substance use (reset pattern then bulk insert)
          if (Array.isArray(data?.step3?.substanceUse)) {
            await tx.user_substance_use.deleteMany({ where: { user_id: userId, usage_pattern: 'reported_in_onboarding' } });
            if (data.step3.substanceUse.length > 0) {
              await tx.user_substance_use.createMany({
                data: data.step3.substanceUse.map((substanceName: string) => ({
                  user_id: userId,
                  substance_name: substanceName,
                  usage_pattern: 'reported_in_onboarding',
                  impact_level: 5,
                  is_active: true,
                }))
              });
            }
          }

          // Sleep routine
          if (data?.step3?.sleepRoutine) {
            const hasSleepQuality = Boolean(data?.step1?.sleepQuality);
            const updateData: any = {};
            const createData: any = { user_id: userId };
            if (hasSleepQuality) {
              updateData.sleep_quality_rating = 7;
              updateData.sleep_issues = [data.step1.sleepQuality];
              createData.sleep_quality_rating = 7;
              createData.sleep_issues = [data.step1.sleepQuality];
            } else {
              updateData.sleep_quality_rating = null;
              updateData.sleep_issues = [];
              createData.sleep_quality_rating = null;
              createData.sleep_issues = [];
            }
            await tx.user_sleep_routine.upsert({
              where: { user_id: userId },
              update: updateData,
              create: createData
            });
          }

          // Step 4: Goals
          if (data?.step4?.personalGoals) {
            const title = data.step4.personalGoals;
            const existing = await tx.user_goals.findFirst({ where: { user_id: userId, goal_title: title } });
            if (existing) {
              await tx.user_goals.update({ where: { id: existing.id }, data: { goal_description: title, goal_category: 'personal', priority_level: 1 } });
            } else {
              await tx.user_goals.create({ data: { user_id: userId, goal_title: title, goal_description: title, goal_category: 'personal', priority_level: 1 } });
            }
          }

          // Previous therapy
          if (Array.isArray(data?.step4?.previousTherapy) && data.step4.previousTherapy.includes('Yes')) {
            await tx.user_previous_therapy.create({
              data: {
                user_id: userId,
                therapy_type: data.step4.therapyType || 'Not specified',
                duration: data.step4.therapyDuration || 'Not specified',
                effectiveness_rating: 5
              }
            });
          }

          // Therapy preferences
          if (data?.step4?.preferredTherapyStyle) {
            await tx.user_therapy_preferences.upsert({
              where: { user_id: userId },
              update: { preferred_therapy_styles: data.step4.preferredTherapyStyle, preferred_tone: 'supportive', communication_style: 'conversational' },
              create: { user_id: userId, preferred_therapy_styles: data.step4.preferredTherapyStyle, preferred_tone: 'supportive', communication_style: 'conversational' }
            });
          }

          // Step 5: Core values → themes (reset category then bulk insert)
          if (Array.isArray(data?.step5?.coreValues)) {
            await tx.user_themes.deleteMany({ where: { user_id: userId, theme_category: 'core_value' } });
            if (data.step5.coreValues.length > 0) {
              await tx.user_themes.createMany({
                data: data.step5.coreValues.map((valueName: string) => ({
                  user_id: userId,
                  theme_name: valueName,
                  theme_category: 'core_value',
                  importance_level: 8,
                  is_active: true,
                }))
              });
            }
          }

          // Coping tools from habits (reset category then bulk insert)
          if (Array.isArray(data?.step3?.dailyHabits)) {
            await tx.user_coping_tools.deleteMany({ where: { user_id: userId, tool_category: 'daily_habit' } });
            if (data.step3.dailyHabits.length > 0) {
              await tx.user_coping_tools.createMany({
                data: data.step3.dailyHabits.map((habitName: string) => ({
                  user_id: userId,
                  tool_name: habitName,
                  tool_category: 'daily_habit',
                  effectiveness_rating: 6,
                  description: `Daily habit: ${habitName}`,
                  when_to_use: 'daily',
                  is_active: true,
                }))
              });
            }
          }

          // Value compass
          if (Array.isArray(data?.step5?.coreValues) && data.step5.coreValues.length > 0) {
            await tx.user_value_compass.upsert({
              where: { user_id: userId },
              update: { core_values: data.step5.coreValues, anti_values: [], narrative: data.step5.motivationForJoining || '', last_reflected_at: new Date() },
              create: { user_id: userId, core_values: data.step5.coreValues, anti_values: [], narrative: data.step5.motivationForJoining || '', last_reflected_at: new Date() }
            });
          }

          // User preferences
          await tx.user_preferences.upsert({
            where: { user_id: userId },
            update: { show_text_response: true, play_audio_response: true, preferred_therapist_name: 'Therapist', daily_reminder_time: null, timezone: 'UTC' },
            create: { user_id: userId, show_text_response: true, play_audio_response: true, preferred_therapist_name: 'Therapist', daily_reminder_time: null, timezone: 'UTC' }
          });

          // Emotional trend
          if (data?.step1?.moodScore) {
            await tx.user_mood_trends.create({
              data: {
                user_id: userId,
                recorded_date: new Date(),
                mood_score: data.step1.moodScore,
                notes: `Initial mood from onboarding${data?.step1?.suicidalThoughts && data.step1.suicidalThoughts !== 'Never' ? `; Suicidal thoughts: ${data.step1.suicidalThoughts}` : ''}`
              }
            });
          }

          // Mark onboarding completed
          await tx.users.update({ where: { id: userId }, data: ({ onboarding_completed_at: new Date(), onboarding_skipped: false } as any) });

          // Clear onboarding progress JSON
          await tx.user_onboarding_progress.deleteMany({ where: { user_id: userId } });
        }, { timeout: 60000, maxWait: 15000 });

        logger.info('Onboarding finalized successfully', { userId });
        return { success: true };
      } catch (error) {
        logger.error('Error finalizing onboarding', { userId, error });
        throw new Error('Failed to finalize onboarding');
      }
    }),
}); 