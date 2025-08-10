// Note: We rely on fetch for streaming; OpenAI client import kept minimal when needed elsewhere
import { buildMCP } from '../mcp/buildMCP.js';
import { buildSystemPrompt } from '../openai/prompt.js';
import { classifyMode } from '../openai/mode.js';
import { logger } from '../utils/logger.js';
import { tools, handleToolCall } from '../tools/index.js';
import { prisma } from '../db/client.js';
import { realTimeToolExecutor } from '../tools/executor.js';
import { ToolRegistry } from '../tools/registry.js';

// Note: We use fetch-based calls for streaming rather than the client instance
// const client = new OpenAI({ apiKey: process.env['OPENAI_API_KEY'] });
const CHAT_MODEL = process.env['OPENAI_CHAT_MODEL'] || 'gpt-4o';

export interface StreamingRequest {
  userId: string;
  userMessage: string;
  sessionId: string;
  messageId: string;
  conversationHistory?: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
  currentContext?: Record<string, any>;
  mode?: string;
  temperature?: number;
}

export async function handleResponsesStreaming(socket: any, req: StreamingRequest) {
  const { userId, userMessage, sessionId, messageId, conversationHistory = [], currentContext = {}, mode, temperature = 0.3 } = req;
  
  // Initialize tool registry for this session
  const toolRegistry = ToolRegistry.getInstance();
  if (!toolRegistry.isInitialized()) {
    await toolRegistry.initialize();
  }
  
  // Clear any previous state for this conversation
  realTimeToolExecutor.clear();
  
  // UUID validation utilities (currently unused but may be needed for future features)
  // const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;
  // const isUuid = (s?: string) => typeof s === 'string' && UUID_REGEX.test(s);
  const effectiveUserId = userId || (currentContext as any)?.userProfile?.user_id || 'default-user-id';
  const mcp = await buildMCP(effectiveUserId, currentContext);
  // Determine mode: prefer client-provided; else classify
  const autoMode = mode || (await classifyMode(userMessage, mcp))?.mode || undefined;
  const systemPrompt = buildSystemPrompt(mcp, autoMode);
  if (process.env['LOG_OPENAI'] === 'true') {
    logger.warn('OpenAI streaming preflight', {
      userId: effectiveUserId,
      mode: autoMode,
      userMessage,
      //systemPrompt,
    });
  }

  socket.emit('true_streaming_message', { type: 'start', sessionId, messageId, mode: autoMode, timestamp: new Date().toISOString() });

  // Get tools from the session-based registry (already converted to JSON Schema)
  const openAITools = toolRegistry.getOpenAITools();

  // DEBUG: Log tool conversion
  if (process.env['LOG_OPENAI'] === 'true') {
    logger.warn('Tool conversion debug', {
      originalToolsCount: tools.length,
      convertedToolsCount: openAITools.length,
      firstToolName: openAITools[0]?.function?.name,
      toolChoiceUsed: 'auto'
    });
  }

  // Deduplicate adjacent duplicate messages in history
  const cleanedHistory: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [];
  for (const m of conversationHistory) {
    const last = cleanedHistory[cleanedHistory.length - 1];
    if (!last || last.role !== m.role || last.content !== m.content) {
      cleanedHistory.push(m);
    }
  }

  // Initial streamed completion with tool awareness enabled
  const payload = {
    model: CHAT_MODEL,
    messages: [{ role: 'system' as const, content: systemPrompt }, ...cleanedHistory, { role: 'user' as const, content: userMessage }],
    tools: openAITools,
    tool_choice: 'auto' as const,
    temperature,
    stream: true,
  } as const;

  if (process.env['LOG_OPENAI'] === 'true') {
    const safePayload = JSON.parse(JSON.stringify(payload));
    logger.warn('OpenAI streaming request', {
      userId: effectiveUserId,
      mode: autoMode,
      payload: "Holding this back for now, as it's a lot of data to log"
      //payload: safePayload,
    });
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env['OPENAI_API_KEY']}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(300000), // 5 minute timeout
  });
  if (!response.ok || !response.body) {
    let details = '';
    try { details = await response.text(); } catch { }
    logger.error('OpenAI streaming HTTP error', { status: response.status, details });
    throw new Error(`OpenAI error ${response.status}${details ? `: ${details.slice(0, 300)}` : ''}`);
  }
  try {
    await prisma.user_prompt_logs.create({
      data: {
        user_id: effectiveUserId,
        // Important: this FK points to user_conversation_messages.id, not conversation id
        session_id: null,
        prompt_text: systemPrompt.slice(0, 4000),
        gpt_model: CHAT_MODEL,
        response_text: null,
      }
    });
  } catch (e) {
    logger.error('Failed to log user_prompt_logs (start)', { error: e });
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let chunkIndex = 0;
  let fullText = '';
  let pendingToolCalls: Array<{ id: string; type: 'function'; function: { name: string; arguments: string } } | undefined> = [];
  const streamedMessages: any[] = [{ role: 'system', content: systemPrompt }, ...cleanedHistory, { role: 'user', content: userMessage }];

  // Note: We intentionally do NOT pre-execute relationship storage here.
  // The model should explicitly call the storeRelationship tool via function-calling.

  // Add timeout for stream reading
  const startTime = Date.now();
  const STREAM_TIMEOUT = 120000; // 2 minutes

  while (true) {
    // Check for timeout
    if (Date.now() - startTime > STREAM_TIMEOUT) {
      logger.error('Stream reading timeout exceeded', {
        duration: Date.now() - startTime,
        chunkIndex,
        fullTextLength: fullText.length,
        sessionId,
        messageId
      });
      break;
    }

    let result;
    try {
      result = await reader.read();
    } catch (readError) {
      logger.error('Stream reader error', {
        error: readError instanceof Error ? readError.message : String(readError),
        chunkIndex,
        sessionId,
        messageId
      });
      break;
    }

    const { done, value } = result;
    if (done) {
      if (process.env['LOG_OPENAI'] === 'true') {
        logger.warn('Stream reader done - exiting loop', {
          chunkIndex,
          fullTextLength: fullText.length,
          pendingToolCallsCount: pendingToolCalls.filter(Boolean).length
        });
      }
      break;
    }
    const chunk = decoder.decode(value, { stream: true });
    buffer += chunk;
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6);
      if (data === '[DONE]') {
        if (process.env['LOG_OPENAI'] === 'true') {
          logger.warn('OpenAI stream [DONE]', {
            chunkIndex,
            fullTextLength: fullText.length,
            pendingToolCallsCount: pendingToolCalls.filter(Boolean).length,
            pendingToolCalls: pendingToolCalls.filter(Boolean).map(tc => ({
              id: tc?.id,
              name: tc?.function?.name,
              argumentsLength: tc?.function?.arguments?.length || 0,
              argumentsComplete: tc?.function?.arguments?.trim().startsWith('{') && tc?.function?.arguments?.trim().endsWith('}'),
              argumentsPreview: tc?.function?.arguments?.slice(0, 100) + ((tc?.function?.arguments?.length || 0) > 100 ? '...' : '')
            }))
          });
        }
        if (process.env['LOG_OPENAI'] === 'true') {
          logger.warn('OpenAI streaming response', {
            userId: effectiveUserId,
            mode: autoMode,
            totalChunks: chunkIndex,
            response: fullText,
          });
        }
        // Log completion (no-tools); do not persist assistant message here to avoid duplicates
        try {
          await prisma.user_prompt_logs.create({
            data: {
              user_id: effectiveUserId,
              session_id: null,
              prompt_text: '(no-tools)',
              gpt_model: CHAT_MODEL,
              response_text: fullText.slice(0, 4000),
            }
          });
        } catch (e) {
          logger.error('Failed to log user_prompt_logs (final no-tools)', { error: e });
        }

        // CRITICAL FIX: Only provide fallback if we have NO content AND NO tool calls
        const hasPendingToolCalls = pendingToolCalls.filter(Boolean).length > 0;
        if ((chunkIndex === 0 || fullText.trim() === '') && !hasPendingToolCalls) {
          logger.warn('Empty response detected with no tool calls, providing fallback', { sessionId, messageId, fullText, hasPendingToolCalls });
          const fallbackMessage = "I sense the depth of what you're sharing. Let me take a moment to process and respond thoughtfully to what you've expressed.";
          socket.emit('true_streaming_message', { type: 'token', sessionId, messageId, token: fallbackMessage, chunkIndex: ++chunkIndex, timestamp: new Date().toISOString() });
          socket.emit('true_streaming_message', { type: 'done', sessionId, messageId, mode: autoMode, totalChunks: chunkIndex, timestamp: new Date().toISOString() });
          return;
        }

        // If we have tool calls, continue to process them (don't return early)
        if (!hasPendingToolCalls) {
          socket.emit('true_streaming_message', { type: 'done', sessionId, messageId, mode: autoMode, totalChunks: chunkIndex, timestamp: new Date().toISOString() });
          return;
        }
      }
      try {
        const parsed = JSON.parse(data);

        // DEBUG: Log what OpenAI is sending us
        if (process.env['LOG_OPENAI'] === 'true') {
          // const choice = parsed.choices?.[0];
          // const delta = choice?.delta;
          // logger.warn('OpenAI stream chunk detailed', {
          //   hasChoices: !!parsed.choices,
          //   choiceCount: parsed.choices?.length || 0,
          //   finishReason: choice?.finish_reason,
          //   hasContent: !!delta?.content,
          //   content: delta?.content,
          //   hasToolCalls: !!delta?.tool_calls,
          //   toolCallsCount: delta?.tool_calls?.length || 0,
          //   toolCalls: delta?.tool_calls
          // });
        }

        const delta = parsed.choices?.[0]?.delta;
        if (!delta) continue;

        // Stream assistant content tokens
        if (delta.content) {
          chunkIndex += 1;
          fullText += delta.content;
          socket.emit('true_streaming_message', { type: 'token', sessionId, messageId, token: delta.content, chunkIndex, timestamp: new Date().toISOString() });
        }

        // Accumulate tool calls if present in stream
        if (delta.tool_calls && Array.isArray(delta.tool_calls)) {
          for (const tc of delta.tool_calls) {
            const index = (tc as any).index ?? 0;
            if (!pendingToolCalls[index]) {
              pendingToolCalls[index] = { id: (tc as any).id || '', type: 'function', function: { name: '', arguments: '' } } as any;
              
              // Add to real-time tool executor for immediate processing
              realTimeToolExecutor.addPendingToolCall({
                id: (tc as any).id || '',
                type: 'function',
                function: { name: '', arguments: '' },
                index
              });
            }
            const func = (tc as any).function || {};
            if (func.name) {
              (pendingToolCalls[index] as any).function.name = func.name;
            }
            if (func.arguments) {
              (pendingToolCalls[index] as any).function.arguments += func.arguments;
              
              // Update real-time tool executor with new arguments
              realTimeToolExecutor.updateToolCallArguments((tc as any).id || '', func.arguments);
            }
            if ((tc as any).id) {
              (pendingToolCalls[index] as any).id = (tc as any).id;
            }
          }

          // Check for complete tool calls and execute them immediately
          const completeToolCalls = realTimeToolExecutor.getCompleteToolCalls();
          if (completeToolCalls.length > 0) {
            logger.info('Found complete tool calls during streaming, executing immediately', {
              count: completeToolCalls.length,
              toolNames: completeToolCalls.map(tc => tc.function.name)
            });

            // Execute complete tools immediately
            const results = await realTimeToolExecutor.executeAllCompleteToolCalls(effectiveUserId);
            
            // Emit results to frontend as they complete
            for (const result of results) {
              if (result.success) {
                socket.emit('true_streaming_message', {
                  type: 'tool_result',
                  sessionId,
                  messageId,
                  toolName: result.toolName,
                  toolResult: result.result,
                  success: true,
                  timestamp: new Date().toISOString()
                });
              } else {
                socket.emit('true_streaming_message', {
                  type: 'tool_error',
                  sessionId,
                  messageId,
                  toolName: result.toolName,
                  error: result.error,
                  success: false,
                  timestamp: new Date().toISOString()
                });
              }
            }
          }

          // Debug log the current state of tool call accumulation
          if (process.env['LOG_OPENAI'] === 'true') {
            logger.warn('Tool call accumulation progress', {
              toolCallsCount: pendingToolCalls.filter(Boolean).length,
              toolCalls: pendingToolCalls.filter(Boolean).map(tc => ({
                id: tc?.id,
                name: tc?.function?.name,
                argumentsLength: tc?.function?.arguments?.length || 0,
                argumentsPreview: tc?.function?.arguments?.slice(0, 50) + ((tc?.function?.arguments?.length || 0) > 50 ? '...' : '')
              }))
            });
          }
        }
      } catch (parseError) {
        // ignore partials - but log if it's more than just JSON parsing issues
        if (process.env['LOG_OPENAI'] === 'true') {
          logger.warn('Ignored partial JSON in stream', {
            data: data.slice(0, 100),
            error: parseError instanceof Error ? parseError.message : String(parseError)
          });
        }
      }
    }
  }

  // Fallback completion if stream ends without [DONE]
  if (process.env['LOG_OPENAI'] === 'true') {
    logger.warn('Stream ended without [DONE] - triggering fallback completion', {
      chunkIndex,
      fullTextLength: fullText.length,
      pendingToolCallsCount: pendingToolCalls.filter(Boolean).length,
      sessionId,
      messageId
    });
  }

  // Check for incomplete tool calls that need completion
  const hasPendingToolCalls = pendingToolCalls.filter(Boolean).length > 0;

  if (hasPendingToolCalls) {
    // Check if any tool calls have incomplete JSON
    const incompleteToolCalls = pendingToolCalls.filter(tc => {
      if (!tc || !tc.function.arguments) return false;
      try {
        JSON.parse(tc.function.arguments);
        return false; // Valid JSON
      } catch {
        return true; // Incomplete JSON
      }
    });

    if (incompleteToolCalls.length > 0) {
      logger.warn('Stream ended with incomplete tool calls', {
        incompleteCount: incompleteToolCalls.length,
        totalToolCalls: pendingToolCalls.filter(Boolean).length,
        sessionId,
        messageId,
        incompleteArguments: incompleteToolCalls.map(tc => ({
          id: tc?.id,
          name: tc?.function.name,
          argumentsLength: tc?.function.arguments?.length || 0,
          argumentsPreview: tc?.function.arguments?.slice(0, 100) || ''
        }))
      });
    }
  }

  // If no tool calls and we have content, send completion
  if (!hasPendingToolCalls && fullText.trim()) {
    socket.emit('true_streaming_message', {
      type: 'done',
      sessionId,
      messageId,
      mode: autoMode,
      totalChunks: chunkIndex,
      timestamp: new Date().toISOString()
    });
    return;
  }
  
  // If tool calls were requested, execute them and then do a follow-up non-streaming completion
  if (pendingToolCalls && pendingToolCalls.filter(Boolean).length > 0) {
    try {
      // Give a small delay to ensure all streaming data has been processed
      await new Promise(resolve => setTimeout(resolve, 100));

      // Check again for incomplete tool calls after delay
      const stillIncompleteToolCalls = pendingToolCalls.filter(tc => {
        if (!tc || !tc.function.arguments) return false;
        try {
          JSON.parse(tc.function.arguments);
          return false; // Valid JSON
        } catch {
          return true; // Incomplete JSON
        }
      });

      if (stillIncompleteToolCalls.length > 0) {
        logger.error('Cannot execute incomplete tool calls - stream was truncated', {
          incompleteCount: stillIncompleteToolCalls.length,
          sessionId,
          messageId
        });

        // Send error response to client
        socket.emit('true_streaming_message', {
          type: 'error',
          content: 'I encountered a technical issue while processing your request. Please try again.',
          sessionId,
          messageId,
          mode: autoMode,
          totalChunks: chunkIndex,
          timestamp: new Date().toISOString()
        });
        return;
      }

      const compactCalls = (pendingToolCalls.filter(Boolean) as any[]).map((c, idx) => ({ ...c, index: idx }));

      // Validate tool call arguments are complete JSON before processing
      const validatedCalls = compactCalls.filter((tc: any) => {
        try {
          if (!tc.function.arguments) {
            logger.warn('Tool call missing arguments', { toolName: tc.function.name, id: tc.id });
            return false;
          }

          // Ensure the arguments string looks complete (basic heuristics)
          const args = tc.function.arguments.trim();
          if (!args.startsWith('{') || !args.endsWith('}')) {
            logger.warn('Tool call arguments appear incomplete (missing braces)', {
              toolName: tc.function.name,
              id: tc.id,
              arguments: args,
              startsWithBrace: args.startsWith('{'),
              endsWithBrace: args.endsWith('}')
            });
            return false;
          }

          // Test if arguments is valid JSON
          const parsed = JSON.parse(tc.function.arguments);

          // Additional validation: ensure it's an object (not a primitive)
          if (typeof parsed !== 'object' || parsed === null) {
            logger.warn('Tool call arguments are not a valid object', {
              toolName: tc.function.name,
              id: tc.id,
              parsedType: typeof parsed
            });
            return false;
          }

          logger.info('Tool call validation successful', {
            toolName: tc.function.name,
            id: tc.id,
            argumentsLength: tc.function.arguments.length
          });

          return true;
        } catch (e) {
          logger.error('Tool call has invalid JSON arguments', {
            toolName: tc.function.name,
            id: tc.id,
            arguments: tc.function.arguments,
            argumentsLength: tc.function.arguments?.length || 0,
            error: e instanceof Error ? e.message : String(e)
          });
          return false;
        }
      });

      if (validatedCalls.length === 0) {
        logger.warn('No valid tool calls found, skipping tool execution', {
          totalCalls: compactCalls.length,
          sessionId,
          messageId
        });
        socket.emit('true_streaming_message', {
          type: 'done',
          sessionId,
          messageId,
          mode: autoMode,
          totalChunks: chunkIndex,
          timestamp: new Date().toISOString()
        });
        return;
      }

      const assistantMessage = { role: 'assistant' as const, content: fullText, tool_calls: validatedCalls } as any;
      
      // Check if any tools were already executed in real-time during streaming
      const alreadyExecutedTools = realTimeToolExecutor.getStatus().completedToolNames;
      const toolsToExecute = validatedCalls.filter(tc => !alreadyExecutedTools.includes(tc.function.name));
      
      let toolResults: any[] = [];
      
      if (toolsToExecute.length === 0) {
        logger.info('All tools were already executed in real-time during streaming', {
          totalTools: validatedCalls.length,
          alreadyExecuted: alreadyExecutedTools
        });
        
        // Create tool results from already executed tools
        toolResults = alreadyExecutedTools.map(toolName => {
          const toolCall = validatedCalls.find(tc => tc.function.name === toolName);
          if (toolCall) {
            return { role: 'tool' as const, tool_call_id: toolCall.id, content: 'Already executed in real-time' };
          }
          return null;
        }).filter(Boolean);
        
        // Continue with the rest of the flow
      } else {
        logger.info('Executing remaining tools that were not completed during streaming', {
          totalTools: validatedCalls.length,
          alreadyExecuted: alreadyExecutedTools,
          remainingToExecute: toolsToExecute.map(tc => tc.function.name)
        });
        
            // Execute only the remaining tools SEQUENTIALLY to avoid overlapping updates downstream
            toolResults = [] as any[];
            for (const tc of toolsToExecute as any[]) {
          // Parse arguments and inject actual user ID if it's set to placeholder FIRST
          let parsedArgs = JSON.parse(tc.function.arguments);

          // ALWAYS log the userId value for debugging
          logger.warn('DEBUG: Tool call userId check', {
            toolName: tc.function.name,
            originalUserId: parsedArgs.userId,
            userIdType: typeof parsedArgs.userId,
            userIdLength: parsedArgs.userId?.length,
            effectiveUserId
          });

          if (parsedArgs.userId === 'uuid' || parsedArgs.userId === 'user_id' || parsedArgs.userId === 'user' || !parsedArgs.userId || typeof parsedArgs.userId !== 'string' || parsedArgs.userId.length < 10) {
            parsedArgs.userId = effectiveUserId;
            logger.warn('✅ Replaced placeholder userId with actual userId', {
              toolName: tc.function.name,
              originalUserId: tc.function.arguments,
              effectiveUserId
            });
          } else {
            logger.warn('❌ Did NOT replace userId - seemed valid', {
              toolName: tc.function.name,
              userId: parsedArgs.userId,
              effectiveUserId
            });
          }

          // ✅ CORRECT ORDER: Emit to frontend AFTER fixing userId
          socket.emit('true_streaming_message', {
            type: 'tool_call',
            sessionId,
            messageId,
            toolName: tc.function.name,
            toolData: JSON.stringify(parsedArgs),  // ← Use the FIXED arguments
            timestamp: new Date().toISOString()
          });

              // eslint-disable-next-line no-await-in-loop
              const result = await handleToolCall({
            id: tc.id,
            type: 'function',
            function: {
              name: tc.function.name,
              arguments: JSON.stringify(parsedArgs)
            }
          });
              toolResults.push({ role: 'tool' as const, tool_call_id: tc.id, content: JSON.stringify(result) });
            }
      }
      
      const postToolMessages = [...streamedMessages, assistantMessage, ...toolResults];

      if (process.env['LOG_OPENAI'] === 'true') {
        logger.warn('OpenAI streaming post-tools request', {
          userId: effectiveUserId,
          mode: autoMode,
          totalToolCalls: pendingToolCalls.length,
          validatedToolCalls: validatedCalls.length
        });
      }
      
      const finalResp = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env['OPENAI_API_KEY']}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ model: CHAT_MODEL, messages: postToolMessages, temperature }),
      });
      
      const finalJson = await finalResp.json();
      const finalText = finalJson?.choices?.[0]?.message?.content || '';
      if (finalText) {
        socket.emit('true_streaming_message', { type: 'token', sessionId, messageId, token: finalText, chunkIndex: ++chunkIndex, timestamp: new Date().toISOString() });
      }

      // Log completion (post-tools); do not persist assistant message here to avoid duplicates
      try {
        await prisma.user_prompt_logs.create({
          data: {
            user_id: effectiveUserId,
            session_id: null,
            prompt_text: '(post-tools)',
            gpt_model: CHAT_MODEL,
            response_text: (finalText || '').slice(0, 4000),
          }
        });
      } catch (e) {
        logger.error('Failed to log user_prompt_logs (post-tools)', { error: e });
      }
    } catch (e) {
      logger.error('Streaming tool call handling error', {
        error: e instanceof Error ? e.message : String(e),
        stack: e instanceof Error ? e.stack : undefined,
        sessionId,
        messageId
      });

      // Send error response to client if tool execution fails
      socket.emit('true_streaming_message', {
        type: 'error',
        content: 'I encountered an issue while processing your request. Please try again.',
        sessionId,
        messageId,
        mode: autoMode,
        totalChunks: chunkIndex,
        timestamp: new Date().toISOString()
      });
      return; // Don't send the final 'done' if there was an error
    }
  }

  // Done - final completion
  if (process.env['LOG_OPENAI'] === 'true') {
    logger.info('Sending final completion message', {
      sessionId,
      messageId,
      totalChunks: chunkIndex,
      mode: autoMode
    });
  }
  socket.emit('true_streaming_message', { type: 'done', sessionId, messageId, mode: autoMode, totalChunks: chunkIndex, timestamp: new Date().toISOString() });
}