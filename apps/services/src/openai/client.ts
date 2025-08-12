import OpenAI from 'openai';
import { logger } from '../utils/logger.js';
import { tools, handleToolCall } from '../tools/index.js';
import { GPTResponse, GPTResponseSchema } from '../schemas/index.js';
import { buildMCP } from '../mcp/buildMCP.js';
import { buildSystemPrompt } from './prompt.js';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { withTemperatureIfSupported } from './modelCaps.js';

const openai = new OpenAI({
  apiKey: process.env['OPENAI_API_KEY'],
});

const CHAT_MODEL = process.env['OPENAI_CHAT_MODEL'] || 'gpt-4o';

export async function generateResponse(
  userInput: string,
  mcpOrContext: string | { userId: string; flags?: Record<string, any> },
  userId: string,
  mode?: string
): Promise<GPTResponse> {
  logger.debug?.('Generating OpenAI response', { userId, mode });
  // Build MCP if needed
  const mcp = typeof mcpOrContext === 'string'
    ? null
    : await buildMCP(mcpOrContext.userId, mcpOrContext.flags);
  const effectiveMcp = mcp ?? await buildMCP(userId, {});
  const systemPrompt = buildSystemPrompt(effectiveMcp as any, mode);
  
  const messages = [
    { role: 'system' as const, content: systemPrompt },
    { role: 'user' as const, content: userInput }
  ];

  try {
    if (process.env['LOG_OPENAI'] === 'true') {
      logger.warn('OpenAI generateResponse preflight', {
        userId,
        mode,
        systemPromptLength: systemPrompt.length,
        userInputLength: userInput.length,
      });
    }
    if (process.env['LOG_OPENAI'] === 'true') {
      const requestPayload = {
        model: CHAT_MODEL,
        messages,
        tools,
        tool_choice: 'auto' as const,
        ...withTemperatureIfSupported(CHAT_MODEL, 0.3),
        max_tokens: 2000,
      };
      logger.warn('OpenAI request', {
        userId,
        mode,
        payload: JSON.parse(JSON.stringify(requestPayload)),
      });
    }

    // Convert tools to OpenAI-compatible JSON Schema format
    const openAITools = tools.map((tool: any) => {
      if (tool.type === 'function') {
        return {
          type: 'function' as const,
          function: {
            name: tool.function.name,
            description: tool.function.description,
            parameters: zodToJsonSchema(tool.function.parameters, { target: 'openApi3' })
          }
        };
      }
      return tool;
    });

    const completion = await openai.chat.completions.create({
      model: CHAT_MODEL,
      messages,
      tools: openAITools,
      tool_choice: 'auto',
      ...withTemperatureIfSupported(CHAT_MODEL, 0.3),
      max_tokens: 2000,
    });

    const response = completion.choices[0]?.message;
    
    if (!response) {
      throw new Error('No response from OpenAI');
    }

    // Handle tool calls if any
    if (response.tool_calls && response.tool_calls.length > 0) {
      logger.debug?.('Processing tool calls', { count: response.tool_calls.length });
      
      const toolResults = await Promise.all(
        response.tool_calls.map(async (toolCall) => {
          const result = await handleToolCall(toolCall);
          return {
            tool_call_id: toolCall.id,
            role: 'tool' as const,
            content: JSON.stringify(result),
          };
        })
      );

      // Add tool results to messages and get final response
      const messagesWithTools = [
        ...messages,
        response,
        ...toolResults
      ];

      if (process.env['LOG_OPENAI'] === 'true') {
        const postToolsPayload = {
          model: CHAT_MODEL,
          messages: messagesWithTools,
          ...withTemperatureIfSupported(CHAT_MODEL, 0.3),
          max_tokens: 2000,
        };
        logger.warn('OpenAI request (post-tools)', {
          userId,
          mode,
          payload: JSON.parse(JSON.stringify(postToolsPayload)),
        });
      }

      const finalCompletion = await openai.chat.completions.create({
        model: CHAT_MODEL,
        messages: messagesWithTools,
        ...withTemperatureIfSupported(CHAT_MODEL, 0.3),
        max_tokens: 2000,
      });

      const finalResponse = finalCompletion.choices[0]?.message?.content;
      if (process.env['LOG_OPENAI'] === 'true') {
        const safeFinal = JSON.parse(JSON.stringify(finalCompletion));
        logger.warn('OpenAI response (post-tools)', {
          userId,
          mode,
          response: safeFinal,
        });
      }
      
      if (!finalResponse) {
        throw new Error('No final response from OpenAI after tool calls');
      }

      return GPTResponseSchema.parse({
        gpt_response: finalResponse,
        insights: extractInsights(finalResponse),
        metadata: {
          tool_calls_used: response.tool_calls.length,
          mode,
          userId
        }
      });
    }

    // No tool calls, return direct response
    const parsed = GPTResponseSchema.parse({
      gpt_response: response.content || '',
      insights: extractInsights(response.content || ''),
      metadata: {
        tool_calls_used: 0,
        mode,
        userId
      }
    });
    if (process.env['LOG_OPENAI'] === 'true') {
      const safeCompletion = JSON.parse(JSON.stringify(completion));
      logger.warn('OpenAI response', {
        userId,
        mode,
        response: safeCompletion,
      });
      logger.warn('OpenAI parsed response', parsed);
    }
    return parsed;

  } catch (error) {
    logger.error('OpenAI API error', { error, userId });
    throw new Error(`Failed to generate response: ${error}`);
  }
}

// Using centralized buildSystemPrompt from ./prompt.ts

function extractInsights(response: string): string[] {
  // Simple insight extraction - look for patterns that might indicate insights
  const insights: string[] = [];
  
  // Look for sentences that might be insights
  const sentences = response.split(/[.!?]+/).filter(s => s.trim().length > 10);
  
  for (const sentence of sentences) {
    const trimmed = sentence.trim();
    
    // Look for insight indicators
    if (
      trimmed.includes('seems like') ||
      trimmed.includes('appears to') ||
      trimmed.includes('might be') ||
      trimmed.includes('could be') ||
      trimmed.includes('suggests') ||
      trimmed.includes('indicates') ||
      trimmed.includes('pattern') ||
      trimmed.includes('theme') ||
      trimmed.includes('insight') ||
      trimmed.includes('realization')
    ) {
      insights.push(trimmed);
    }
  }
  
  return insights.slice(0, 3); // Limit to 3 insights
} 