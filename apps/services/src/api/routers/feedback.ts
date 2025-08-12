import { initTRPC } from '@trpc/server';
import { Context } from '../context.js';
import { logger } from '../../utils/logger.js';
import { z } from 'zod';
import { protectedProcedure } from '../middleware/auth.js';

const t = initTRPC.context<Context>().create();

export const feedbackRouter = t.router({
  getFeedback: protectedProcedure
    .input(z.object({
      user_id: z.string(),
      limit: z.number().optional()
    }))
    .query(async ({ input, ctx }) => {
      try {
        logger.info('Getting feedback', { userId: input.user_id });
        
        const feedback = await ctx.prisma.feedback.findMany({
          where: { user_id: input.user_id },
          orderBy: { created_at: 'desc' },
          take: input.limit || 50
        });
        
        logger.info('Retrieved feedback', { userId: input.user_id, count: feedback.length });
        return feedback;
      } catch (error) {
        logger.error('Error fetching feedback', { userId: input.user_id, error });
        throw new Error('Failed to fetch feedback');
      }
    }),

  createFeedback: protectedProcedure
    .input(z.object({
      user_id: z.string(),
      session_id: z.string().optional(),
      rating: z.number(),
      feedback_text: z.string().optional(),
      feedback_type: z.string().optional()
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        logger.info('Creating feedback', { input });
        
        // Create main feedback entry
        const feedback = await ctx.prisma.feedback.create({
          data: {
            user_id: input.user_id,
            raw_feedback: input.feedback_text || '',
            feedback_type: input.feedback_type || 'general',
            priority: 'medium',
            status: 'pending'
          }
        });
        
        // Create feedback log entry if session_id is provided
        if (input.session_id) {
          await ctx.prisma.user_feedback_log.create({
            data: {
              user_id: input.user_id,
              session_id: input.session_id ?? null,
              rating: input.rating,
              comment: input.feedback_text ?? null
            }
          });
        }
        
        logger.info('Feedback created successfully', { feedbackId: feedback.id });
        return { success: true, message: 'Feedback created', data: feedback };
      } catch (error) {
        logger.error('Error creating feedback', { input, error });
        throw new Error('Failed to create feedback');
      }
    }),

  // Create feedback with server-side AI analysis (no client OpenAI needed)
  createFeedbackAnalyzed: protectedProcedure
    .input(z.object({
      user_id: z.string(),
      feedback_text: z.string().min(1),
      session_id: z.string().optional(),
      device_info: z.any().optional(),
      app_version: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        logger.info('Creating analyzed feedback', { userId: input.user_id });

        // Prepare prompts
        const systemPrompt = `You are an assistant that analyzes app user feedback and returns JSON with fields: summary, priority (low|medium|high|critical), feedbackType (bug|feature_request|ui_ux|performance|content|onboarding|general), tags (3-5), metadata (object). Output JSON only.`;
        const userPrompt = `Analyze this feedback and return JSON only.\n\n${input.feedback_text}`;

        // Call OpenAI
        const apiKey = process.env['OPENAI_API_KEY'];
        if (!apiKey) {
          throw new Error('Missing OPENAI_API_KEY');
        }

        const resp = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: process.env['OPENAI_FEEDBACK_MODEL'] || 'gpt-4o-mini',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
          }),
        });

        let priority: 'low'|'medium'|'high'|'critical' = 'medium';
        let feedbackType: string = 'general';
        let aiSummary: string | null = null;
        let tags: string[] = [];
        let metadata: Record<string, any> | null = null;
        if (resp.ok) {
          const data = await resp.json();
          const content = data.choices?.[0]?.message?.content || '';
          try {
            const parsed = JSON.parse(content);
            const validPriorities = ['low','medium','high','critical'];
            const validTypes = ['bug','feature_request','ui_ux','performance','content','onboarding','general'];
            if (parsed && typeof parsed === 'object') {
              if (validPriorities.includes(parsed.priority)) priority = parsed.priority;
              if (validTypes.includes(parsed.feedbackType)) feedbackType = parsed.feedbackType;
              if (typeof parsed.summary === 'string') aiSummary = parsed.summary;
              if (Array.isArray(parsed.tags)) tags = parsed.tags.filter((t: any) => typeof t === 'string').slice(0, 8);
              if (parsed.metadata && typeof parsed.metadata === 'object') metadata = parsed.metadata;
            }
          } catch (e) {
            logger.warn('AI analysis not JSON, falling back', { error: e });
          }
        } else {
          const err = await resp.text();
          logger.warn('OpenAI feedback analysis failed', { status: resp.status, err });
        }

        // Insert feedback row with analyzed fields
        const feedback = await ctx.prisma.feedback.create({
          data: {
            user_id: input.user_id,
            raw_feedback: input.feedback_text,
            feedback_type: feedbackType,
            priority,
            status: 'processed',
            ai_summary: aiSummary ?? null,
            device_info: input.device_info ?? undefined,
            app_version: input.app_version ?? null,
            tags,
            metadata: metadata ?? undefined as any,
            processed_at: new Date(),
          }
        });

        // Optional: create feedback log with rating placeholder
        if (input.session_id) {
          await ctx.prisma.user_feedback_log.create({
            data: {
              user_id: input.user_id,
              session_id: input.session_id ?? null,
              rating: 5,
              comment: input.feedback_text ?? null,
            }
          });
        }

        logger.info('Analyzed feedback created', { feedbackId: feedback.id });
        return { success: true, message: 'Feedback created', data: feedback };
      } catch (error) {
        logger.error('Error creating analyzed feedback', { input: { user_id: input.user_id }, error });
        throw new Error('Failed to create analyzed feedback');
      }
    }),

  getCrisisFlags: protectedProcedure
    .input(z.object({
      user_id: z.string()
    }))
    .query(async ({ input, ctx }) => {
      try {
        logger.info('Getting crisis flags', { userId: input.user_id });
        
        const crisisFlags = await ctx.prisma.user_crisis_flags.findMany({
          where: { user_id: input.user_id },
          orderBy: { triggered_at: 'desc' },
          include: {
            session: {
              select: {
                id: true,
                input_transcript: true,
                gpt_response: true,
                created_at: true
              }
            }
          }
        });
        
        logger.info('Retrieved crisis flags', { userId: input.user_id, count: crisisFlags.length });
        return crisisFlags;
      } catch (error) {
        logger.error('Error fetching crisis flags', { userId: input.user_id, error });
        throw new Error('Failed to fetch crisis flags');
      }
    }),

  // Create crisis flag
  createCrisisFlag: protectedProcedure
    .input(z.object({
      user_id: z.string(),
      session_id: z.string().optional(),
      flag_type: z.string(),
      reviewed: z.boolean().default(false)
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        logger.info('Creating crisis flag', { input });
        
        const crisisFlag = await ctx.prisma.user_crisis_flags.create({
          data: {
            user_id: input.user_id,
            session_id: input.session_id ?? null,
            flag_type: input.flag_type,
            reviewed: input.reviewed
          }
        });
        
        logger.info('Crisis flag created successfully', { flagId: crisisFlag.id });
        return { success: true, message: 'Crisis flag created', data: crisisFlag };
      } catch (error) {
        logger.error('Error creating crisis flag', { input, error });
        throw new Error('Failed to create crisis flag');
      }
    }),

  // Mark crisis flag as reviewed
  markCrisisFlagReviewed: protectedProcedure
    .input(z.object({
      flag_id: z.string()
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        logger.info('Marking crisis flag as reviewed', { flagId: input.flag_id });
        
        const crisisFlag = await ctx.prisma.user_crisis_flags.update({
          where: { id: input.flag_id },
          data: { reviewed: true }
        });
        
        logger.info('Crisis flag marked as reviewed', { flagId: crisisFlag.id });
        return { success: true, message: 'Crisis flag marked as reviewed', data: crisisFlag };
      } catch (error) {
        logger.error('Error marking crisis flag as reviewed', { flagId: input.flag_id, error });
        throw new Error('Failed to mark crisis flag as reviewed');
      }
    }),

  // Get feedback statistics
  getFeedbackStats: protectedProcedure
    .input(z.object({
      user_id: z.string()
    }))
    .query(async ({ input, ctx }) => {
      try {
        logger.info('Getting feedback stats', { userId: input.user_id });
        
        const [
          totalFeedback,
          pendingFeedback,
          processedFeedback,
          averageRating
        ] = await Promise.all([
          ctx.prisma.feedback.count({ where: { user_id: input.user_id } }),
          ctx.prisma.feedback.count({ where: { user_id: input.user_id, status: 'pending' } }),
          ctx.prisma.feedback.count({ where: { user_id: input.user_id, status: 'processed' } }),
          ctx.prisma.user_feedback_log.aggregate({
            where: { user_id: input.user_id },
            _avg: { rating: true }
          })
        ]);
        
        const stats = {
          total_feedback: totalFeedback,
          pending_feedback: pendingFeedback,
          processed_feedback: processedFeedback,
          average_rating: averageRating._avg.rating || 0
        };
        
        logger.info('Retrieved feedback stats', { userId: input.user_id, stats });
        return stats;
      } catch (error) {
        logger.error('Error getting feedback stats', { userId: input.user_id, error });
        throw new Error('Failed to get feedback stats');
      }
    })
}); 