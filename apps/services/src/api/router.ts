import { initTRPC } from '@trpc/server';
import { Context } from './context.js';
import { UserInputSchema, GPTResponseSchema } from '../schemas/index.js';
import { buildMCP } from '../mcp/buildMCP.js';
import { formatMCPForOpenAI } from '../mcp/formatter.js';
import { generateResponse } from '../openai/client.js';
import { logger } from '../utils/logger.js';
import { z } from 'zod';

// Import domain-specific routers
import { authRouter } from './routers/auth.js';
import { memoryRouter } from './routers/memory.js';
import { userProfileRouter } from './routers/userProfile.js';
import { onboardingRouter } from './routers/onboarding.js';
import { conversationRouter } from './routers/conversation.js';
import { userRouter } from './routers/user.js';
import { feedbackRouter } from './routers/feedback.js';
import { insightsRouter } from './routers/insights.js';
import { mantrasRouter } from './routers/mantras.js';
import { innerPartsRouter } from './routers/innerParts.js';

// Import new specialized routers
import { themesRouter } from './routers/themes.js';
import { goalsRouter } from './routers/goals.js';
import { copingToolsRouter } from './routers/copingTools.js';
import { emotionalDataRouter } from './routers/emotionalData.js';
import { lifestyleRouter } from './routers/lifestyle.js';
import { relationshipsRouter } from './routers/relationships.js';
import { riskAssessmentRouter } from './routers/riskAssessment.js';
import { growthRouter } from './routers/growth.js';
import { traumaPatternsRouter } from './routers/traumaPatterns.js';
import { therapyRouter } from './routers/therapy.js';
import { patternsRouter } from './routers/patterns.js';
import { voiceRouter } from './routers/voice.js';
import { debugRouter } from './routers/debug.js';

const t = initTRPC.context<Context>().create();

export const appRouter = t.router({
  // Core domain routers
  auth: authRouter,
  memory: memoryRouter,
  userProfile: userProfileRouter,
  onboarding: onboardingRouter,
  conversation: conversationRouter,
  user: userRouter,
  feedback: feedbackRouter,
  insights: insightsRouter,
  mantras: mantrasRouter,
  innerParts: innerPartsRouter,

  // Specialized data management routers
  themes: themesRouter,
  goals: goalsRouter,
  copingTools: copingToolsRouter,
  emotionalData: emotionalDataRouter,
  lifestyle: lifestyleRouter,
  relationships: relationshipsRouter,
  riskAssessment: riskAssessmentRouter,
  growth: growthRouter,
  traumaPatterns: traumaPatternsRouter,
  therapy: therapyRouter,
  patterns: patternsRouter,
  voice: voiceRouter,
  debug: debugRouter,

  // Core AI response procedure
  respond: t.procedure
    .input(UserInputSchema)
    .output(GPTResponseSchema)
    .mutation(async ({ input, ctx }) => {
      const { user_input, mode, mood_score, session_context } = input;
      
      // For now, we'll use a default user ID - in production this would come from auth
      const userId = 'default-user-id';
      
      logger.info('Processing user input', { 
        userId, 
        mode, 
        moodScore: mood_score,
        inputLength: user_input.length 
      });

      try {
        // Build MCP context
        const mcp = await buildMCP(userId, session_context);
        const mcpContext = formatMCPForOpenAI(mcp);

        if (process.env.LOG_OPENAI === 'true') {
          logger.warn('OpenAI request (router preflight)', {
            userId,
            mode,
            userInput,
            mcpContext,
          } as any);
        }

        // Generate response with OpenAI
        const response = await generateResponse(user_input, mcpContext, userId, mode);

        logger.info('Response generated successfully', { 
          userId, 
          responseLength: response.gpt_response.length,
          insightsCount: response.insights?.length || 0
        });

        return response;

      } catch (error) {
        logger.error('Error processing user input', { userId, error });
        throw new Error(`Failed to process user input: ${error}`);
      }
    }),

  health: t.procedure
    .query(() => {
      return { status: 'ok', timestamp: new Date().toISOString() };
    }),
});

export type AppRouter = typeof appRouter; 