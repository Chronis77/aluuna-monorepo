import { initTRPC } from '@trpc/server';
import { Context } from './context.js';
import { UserInputSchema, GPTResponseSchema } from '../schemas/index.js';
import { buildMCP, formatMCPForOpenAI } from '../mcp/buildMCP.js';
import { generateResponse } from '../openai/client.js';
import { logger } from '../utils/logger.js';
import { z } from 'zod';

// Import domain-specific routers
import { authRouter } from './routers/auth.js';
import { memoryRouter } from './routers/memory.js';
import { memoryProfileRouter } from './routers/memoryProfile.js';
import { onboardingRouter } from './routers/onboarding.js';
import { conversationRouter } from './routers/conversation.js';
import { userRouter } from './routers/user.js';
import { feedbackRouter } from './routers/feedback.js';
import { insightsRouter } from './routers/insights.js';
import { mantrasRouter } from './routers/mantras.js';
import { innerPartsRouter } from './routers/innerParts.js';

const t = initTRPC.context<Context>().create();

export const appRouter = t.router({
  // Domain-specific routers
  auth: authRouter,
  memory: memoryRouter,
  memoryProfile: memoryProfileRouter,
  onboarding: onboardingRouter,
  conversation: conversationRouter,
  user: userRouter,
  feedback: feedbackRouter,
  insights: insightsRouter,
  mantras: mantrasRouter,
  innerParts: innerPartsRouter,

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