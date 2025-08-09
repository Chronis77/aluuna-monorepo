import { initTRPC } from '@trpc/server';
import { z } from 'zod';
import { Context } from '../context.js';
import { buildMCP } from '../../mcp/buildMCP.js';
import { buildSystemPrompt } from '../../openai/prompt.js';
import { tools } from '../../tools/index.js';

const t = initTRPC.context<Context>().create();

export const debugRouter = t.router({
  getOpenAIPayload: t.procedure
    .input(z.object({
      user_id: z.string(),
      user_input: z.string(),
      mode: z.string().optional(),
      session_context: z.record(z.any()).optional(),
    }))
    .query(async ({ input }) => {
      const model = process.env.OPENAI_CHAT_MODEL || 'gpt-4o';
      const mcp = await buildMCP(input.user_id, input.session_context || {});
      const systemPrompt = buildSystemPrompt(mcp as any, input.mode);
      const messages = [
        { role: 'system' as const, content: systemPrompt },
        { role: 'user' as const, content: input.user_input },
      ];

      // Ensure serializable tools
      const safeTools = JSON.parse(JSON.stringify(tools));

      return {
        model,
        tool_choice: 'auto' as const,
        temperature: 0.3,
        max_tokens: 2000,
        messages,
        tools: safeTools,
        meta: {
          systemPromptLength: systemPrompt.length,
          userInputLength: input.user_input.length,
        },
      };
    }),
});


