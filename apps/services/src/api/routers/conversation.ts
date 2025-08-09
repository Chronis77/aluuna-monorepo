import { initTRPC } from '@trpc/server';
import { Context } from '../context.js';
import { logger } from '../../utils/logger.js';
import { z } from 'zod';
import { prisma } from '../../db/client.js';
import { protectedProcedure } from '../middleware/auth.js';

const t = initTRPC.context<Context>().create();

export const conversationRouter = t.router({
  // Session continuity procedures
  getSessionContinuity: t.procedure
    .input(z.object({
      p_user_id: z.string(),
      p_session_group_id: z.string()
    }))
    .query(async ({ input }) => {
      try {
        const continuity = await prisma.user_conversation_continuity.findFirst({
          where: {
            user_id: input.p_user_id,
            conversation_id: input.p_session_group_id
          }
        });
        
        logger.info('Getting session continuity', { input, found: !!continuity });
        return continuity;
      } catch (error) {
        logger.error('Error fetching session continuity', { input, error });
        throw new Error('Failed to fetch session continuity');
      }
    }),

  upsertSessionContinuity: t.procedure
    .input(z.object({
      p_user_id: z.string(),
      p_session_group_id: z.string(),
      p_last_message_count: z.number(),
      p_last_session_phase: z.string(),
      p_last_therapeutic_focus: z.string(),
      p_last_emotional_state: z.string(),
      p_is_resuming: z.boolean()
    }))
    .mutation(async ({ input }) => {
      try {
        const continuity = await prisma.user_conversation_continuity.upsert({
          where: { id: `${input.p_user_id}:${input.p_session_group_id}` },
          update: {
            last_message_count: input.p_last_message_count,
            last_session_phase: input.p_last_session_phase,
            last_therapeutic_focus: input.p_last_therapeutic_focus,
            last_emotional_state: input.p_last_emotional_state,
            is_resuming: input.p_is_resuming,
            last_timestamp: new Date()
          },
          create: {
            id: `${input.p_user_id}:${input.p_session_group_id}`,
            user_id: input.p_user_id,
            conversation_id: input.p_session_group_id,
            last_message_count: input.p_last_message_count,
            last_session_phase: input.p_last_session_phase,
            last_therapeutic_focus: input.p_last_therapeutic_focus,
            last_emotional_state: input.p_last_emotional_state,
            is_resuming: input.p_is_resuming
          }
        });
        
        logger.info('Upserting session continuity', { input, id: continuity.id });
        return continuity.id;
      } catch (error) {
        logger.error('Error upserting session continuity', { input, error });
        throw new Error('Failed to upsert session continuity');
      }
    }),

  endSessionContinuity: t.procedure
    .input(z.object({
      p_user_id: z.string(),
      p_session_group_id: z.string()
    }))
    .mutation(async ({ input }) => {
      try {
        await prisma.user_conversation_continuity.deleteMany({
          where: {
            user_id: input.p_user_id,
            conversation_id: input.p_session_group_id
          }
        });
        
        logger.info('Ending session continuity', { input });
        return true;
      } catch (error) {
        logger.error('Error ending session continuity', { input, error });
        throw new Error('Failed to end session continuity');
      }
    }),

  getUserActiveSessions: t.procedure
    .input(z.object({
      p_user_id: z.string()
    }))
    .query(async ({ input }) => {
      try {
        const activeSessions = await prisma.user_conversation_continuity.findMany({
          where: {
            user_id: input.p_user_id,
            is_resuming: true
          },
          include: {
            conversation: true
          }
        });
        
        logger.info('Getting user active sessions', { userId: input.p_user_id, count: activeSessions.length });
        return activeSessions;
      } catch (error) {
        logger.error('Error fetching user active sessions', { userId: input.p_user_id, error });
        throw new Error('Failed to fetch user active sessions');
      }
    }),

  cleanupStaleSessionContinuity: t.procedure
    .mutation(async () => {
      try {
        const staleDate = new Date();
        staleDate.setHours(staleDate.getHours() - 24); // 24 hours ago
        
        const result = await prisma.user_conversation_continuity.deleteMany({
          where: {
            last_timestamp: {
              lt: staleDate
            }
          }
        });
        
        logger.info('Cleaning up stale session continuity', { deleted: result.count });
        return result.count;
      } catch (error) {
        logger.error('Error cleaning up stale session continuity', { error });
        throw new Error('Failed to cleanup stale session continuity');
      }
    }),

  // Session management procedures
  createSession: protectedProcedure
    .input(z.object({
      user_id: z.string(),
      session_group_id: z.string().optional(),
      title: z.string().optional(),
      initial_message: z.string().optional(),
      metadata: z.any().optional()
    }))
    .mutation(async ({ input }) => {
      try {
        logger.info('Creating session', { input });
        
        const session = await prisma.user_conversation_messages.create({
          data: {
            user_id: input.user_id,
            conversation_id: input.session_group_id || null,
            input_transcript: input.initial_message || null,
            tags: input.metadata?.tags || []
          }
        });
        
        logger.info('Created session', { id: session.id });
        return session;
      } catch (error) {
        logger.error('Error creating session', { input, error });
        throw new Error('Failed to create session');
      }
    }),

  getSessions: t.procedure
    .input(z.object({
      user_id: z.string(),
      limit: z.number().optional()
    }))
    .query(async ({ input }) => {
      try {
        logger.info('Getting sessions', { input });
        
        const sessions = await prisma.user_conversation_messages.findMany({
          where: {
            user_id: input.user_id
          },
          orderBy: {
            created_at: 'desc'
          },
          take: input.limit || 50
        });
        
        logger.info('Retrieved sessions', { count: sessions.length });
        return sessions;
      } catch (error) {
        logger.error('Error fetching sessions', { input, error });
        throw new Error('Failed to fetch sessions');
      }
    }),

  getSession: t.procedure
    .input(z.object({
      session_id: z.string()
    }))
    .query(async ({ input }) => {
      try {
        logger.info('Getting session', { input });
        
        const session = await prisma.user_conversation_messages.findUnique({
          where: {
            id: input.session_id
          },
          include: {
            conversation: true
          }
        });
        
        logger.info('Retrieved session', { found: !!session });
        return session;
      } catch (error) {
        logger.error('Error fetching session', { input, error });
        throw new Error('Failed to fetch session');
      }
    }),

  updateSession: t.procedure
    .input(z.object({
      session_id: z.string(),
      updates: z.any()
    }))
    .mutation(async ({ input }) => {
      try {
        logger.info('Updating session', { input });
        
        const session = await prisma.user_conversation_messages.update({
          where: {
            id: input.session_id
          },
          data: input.updates
        });
        
        logger.info('Updated session', { id: session.id });
        return session;
      } catch (error) {
        logger.error('Error updating session', { input, error });
        throw new Error('Failed to update session');
      }
    }),

  deleteSession: t.procedure
    .input(z.object({
      session_id: z.string()
    }))
    .mutation(async ({ input }) => {
      try {
        logger.info('Deleting session', { input });
        
        await prisma.user_conversation_messages.delete({
          where: {
            id: input.session_id
          }
        });
        
        logger.info('Deleted session', { id: input.session_id });
        return true;
      } catch (error) {
        logger.error('Error deleting session', { input, error });
        throw new Error('Failed to delete session');
      }
    }),

  // Title & Summary generation (server-side, persists to conversation)
  generateTitleAndSummary: t.procedure
    .input(z.object({
      user_id: z.string(),
      conversation_id: z.string().optional(),
      messages: z.array(z.object({ role: z.enum(['user','assistant']), content: z.string() })).optional(),
      max_chars: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const { user_id, conversation_id, messages, max_chars = 12000 } = input;
      try {
        // Gather messages either from DB by conversation_id or from provided list
        let history: Array<{ role: 'user'|'assistant'; content: string }> = [];
        if (conversation_id) {
          const rows = await prisma.user_conversation_messages.findMany({
            where: { user_id, conversation_id },
            orderBy: { created_at: 'asc' },
            select: { input_type: true, input_transcript: true, gpt_response: true },
          });
          for (const r of rows) {
            if (r.input_type === 'user' && r.input_transcript) history.push({ role: 'user', content: r.input_transcript });
            if (r.input_type === 'assistant' && r.gpt_response) history.push({ role: 'assistant', content: r.gpt_response });
          }
        } else if (Array.isArray(messages)) {
          history = messages.filter(m => m && (m.role === 'user' || m.role === 'assistant')) as any;
        }

        // Adjacent dedupe
        const deduped: typeof history = [];
        for (const m of history) {
          const last = deduped[deduped.length - 1];
          if (!last || last.role !== m.role || last.content !== m.content) {
            deduped.push(m);
          }
        }

        // Build transcript text with cap
        const transcript = deduped
          .map(m => `${m.role}: ${m.content}`)
          .join('\n')
          .slice(0, max_chars);

        // Add logging to debug the issue
        logger.info('Title generation input', { 
          conversation_id, 
          historyLength: history.length, 
          dedupedLength: deduped.length,
          transcriptPreview: transcript.slice(0, 200) + '...'
        });

        // Prepare prompts - make them more explicit to prevent hallucination
        const titleSystem = 'You must create a title based ONLY on the conversation provided. Read the conversation carefully and create a 3-5 word title that reflects the actual content discussed. Return ONLY the title in Title Case, no punctuation, no quotes, no extra text.';
        const titleUser = `Based on this EXACT conversation below, create a 3-5 word title that reflects what was actually discussed:\n\n${transcript}\n\nTitle:`;

        const summarySystem = 'You must summarize ONLY the conversation provided. Read carefully and write a 1-2 sentence summary (max 45 words) that reflects the actual content discussed. Start directly with the content, no preambles like "In this session". Be accurate to what was actually said.';
        const summaryUser = `Summarize this EXACT conversation in 1-2 sentences (max 45 words). Base your summary only on what was actually discussed:\n\n${transcript}\n\nSummary:`;

        const model = process.env['OPENAI_CHAT_MODEL'] || 'gpt-4o';

        // Call OpenAI sequentially for clarity
        const titlePayload = { model, temperature: 0.2, messages: [ { role: 'system', content: titleSystem }, { role: 'user', content: titleUser } ]};
        
        logger.info('Sending title request to OpenAI', { 
          model, 
          systemPrompt: titleSystem,
          userPromptPreview: titleUser.slice(0, 100) + '...'
        });
        
        const titleResp = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${process.env['OPENAI_API_KEY']}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(titlePayload),
        });
        const titleJson = await titleResp.json();
        let titleRaw: string = titleJson?.choices?.[0]?.message?.content || '';
        
        logger.info('OpenAI title response', { 
          titleRaw, 
          fullResponse: titleJson 
        });
        // Post-process title: strip quotes, punctuation, collapse spaces, cap at 5 words
        const title = (titleRaw || 'New Session')
          .trim()
          .replace(/^\s*["']|["']\s*$/g, '')
          .replace(/["'.,;:!?\-]+/g, '')
          .replace(/\s+/g, ' ')
          .split(' ')
          .slice(0, 3)
          .join(' ');

        const summaryPayload = { model, temperature: 0.2, messages: [ { role: 'system', content: summarySystem }, { role: 'user', content: summaryUser } ]};
        
        logger.info('Sending summary request to OpenAI', { 
          model, 
          systemPrompt: summarySystem,
          userPromptPreview: summaryUser.slice(0, 100) + '...'
        });
        
        const summaryResp = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${process.env['OPENAI_API_KEY']}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(summaryPayload),
        });
        const summaryJson = await summaryResp.json();
        let summary = (summaryJson?.choices?.[0]?.message?.content || '').trim();
        
        logger.info('OpenAI summary response', { 
          summaryRaw: summary, 
          fullResponse: summaryJson 
        });
        // Remove common preambles
        summary = summary.replace(/^\s*(in this session|this session|we (discussed|talked about)|the conversation)[:,]?\s*/i, '');
        // Enforce max ~45 words
        const words = summary.split(/\s+/);
        if (words.length > 45) summary = words.slice(0, 45).join(' ');
        // Ensure ending punctuation
        if (!/[.!?]$/.test(summary)) summary += '.';

        // Persist to conversation if id provided
        if (conversation_id) {
          await prisma.user_conversations.update({
            where: { id: conversation_id },
            data: { title, context_summary: summary },
          });
        }

        // Log prompt events (session_id null; FK is to user_conversation_messages)
        try {
          await prisma.user_prompt_logs.create({ data: { user_id, session_id: null, prompt_text: '(title_generation)', gpt_model: model, response_text: title.slice(0, 4000) }});
          await prisma.user_prompt_logs.create({ data: { user_id, session_id: null, prompt_text: '(summary_generation)', gpt_model: model, response_text: summary.slice(0, 4000) }});
        } catch (e) {
          logger.error('Failed to log title/summary generation', { error: e });
        }

        return { title, summary };
      } catch (error) {
        logger.error('Error generating title/summary', { input: { user_id, conversation_id }, error });
        throw new Error('Failed to generate title and summary');
      }
    }),

  // Conversation management procedures
  createConversation: protectedProcedure
    .input(z.object({
      user_id: z.string(),
      title: z.string().optional(),
      context_summary: z.string().optional(),
      mood_at_start: z.number().optional(),
      metadata: z.any().optional()
    }))
    .mutation(async ({ input }) => {
      try {
        logger.info('Creating conversation', { input });
        
        const conversation = await prisma.user_conversations.create({
          data: {
            user_id: input.user_id,
            title: input.title ?? null,
            context_summary: input.context_summary ?? null,
            mood_at_start: input.mood_at_start ?? null,
            context_json: input.metadata || {}
          }
        });
        
        logger.info('Created conversation', { id: conversation.id });
        return conversation;
      } catch (error) {
        logger.error('Error creating conversation', { input, error });
        throw new Error('Failed to create conversation');
      }
    }),

  createSessionGroup: protectedProcedure
    .input(z.object({
      user_id: z.string(),
      title: z.string().optional(),
      description: z.string().optional(),
      metadata: z.any().optional()
    }))
    .mutation(async ({ input }) => {
      try {
        logger.info('Creating session group', { input });
        
        const sessionGroup = await prisma.user_conversations.create({
          data: {
            user_id: input.user_id,
            title: input.title || 'New Session',
            description: input.description ?? null,
            context_json: input.metadata || {}
          }
        });
        
        logger.info('Created session group', { id: sessionGroup.id });
        return sessionGroup;
      } catch (error) {
        logger.error('Error creating session group', { input, error });
        throw new Error('Failed to create session group');
      }
    }),

  getConversations: t.procedure
    .input(z.object({
      user_id: z.string(),
      limit: z.number().optional()
    }))
    .query(async ({ input }) => {
      try {
        logger.info('Getting conversations', { input });
        
        const conversations = await prisma.user_conversations.findMany({
          where: {
            user_id: input.user_id
          },
          orderBy: {
            started_at: 'desc'
          },
          take: input.limit || 50,
          include: {
            user_conversation_messages: {
              orderBy: {
                created_at: 'asc'
              }
            }
          }
        });
        
        logger.info('Retrieved conversations', { count: conversations.length });
        return conversations;
      } catch (error) {
        logger.error('Error fetching conversations', { input, error });
        throw new Error('Failed to fetch conversations');
      }
    }),

  getConversation: t.procedure
    .input(z.object({
      conversation_id: z.string()
    }))
    .query(async ({ input }) => {
      try {
        logger.info('Getting conversation', { input });
        
        const conversation = await prisma.user_conversations.findUnique({
          where: {
            id: input.conversation_id
          },
          include: {
            user_conversation_messages: {
              orderBy: {
                created_at: 'asc'
              }
            }
          }
        });
        
        logger.info('Retrieved conversation', { found: !!conversation });
        return conversation;
      } catch (error) {
        logger.error('Error fetching conversation', { input, error });
        throw new Error('Failed to fetch conversation');
      }
    }),

  updateConversation: t.procedure
    .input(z.object({
      conversation_id: z.string(),
      updates: z.any()
    }))
    .mutation(async ({ input }) => {
      try {
        logger.info('Updating conversation', { input });
        
        const conversation = await prisma.user_conversations.update({
          where: {
            id: input.conversation_id
          },
          data: input.updates
        });
        
        logger.info('Updated conversation', { id: conversation.id });
        return conversation;
      } catch (error) {
        logger.error('Error updating conversation', { input, error });
        throw new Error('Failed to update conversation');
      }
    }),

  endConversation: t.procedure
    .input(z.object({
      conversation_id: z.string(),
      mood_at_end: z.number().optional()
    }))
    .mutation(async ({ input }) => {
      try {
        logger.info('Ending conversation', { input });
        
        const conversation = await prisma.user_conversations.update({
          where: {
            id: input.conversation_id
          },
          data: {
            ended_at: new Date(),
            mood_at_end: input.mood_at_end ?? null
          }
        });
        
        logger.info('Ended conversation', { id: conversation.id });
        return conversation;
      } catch (error) {
        logger.error('Error ending conversation', { input, error });
        throw new Error('Failed to end conversation');
      }
    }),

  // Message management procedures
  // Alias to support existing mobile client path
  updateConversationMessage: protectedProcedure
    .input(z.object({
      message_id: z.string(),
      updates: z.any()
    }))
    .mutation(async ({ input }) => {
      try {
        logger.info('Updating message (alias)', { input });
        const message = await prisma.user_conversation_messages.update({
          where: { id: input.message_id },
          data: input.updates
        });
        logger.info('Updated message (alias)', { id: message.id });
        return message;
      } catch (error) {
        logger.error('Error updating message (alias)', { input, error });
        throw new Error('Failed to update message');
      }
    }),
  // Alias to support existing mobile client path
  createConversationMessage: protectedProcedure
    .input(z.object({
      user_id: z.string(),
      conversation_id: z.string().optional(),
      title: z.string().optional(),
      initial_message: z.string().optional(),
      metadata: z.any().optional()
    }))
    .mutation(async ({ input }) => {
      try {
        logger.info('Creating conversation message (alias)', { input });
        const message = await prisma.user_conversation_messages.create({
          data: {
            user_id: input.user_id,
            conversation_id: input.conversation_id ?? null,
            input_transcript: input.initial_message ?? null,
            gpt_response: input.metadata?.gpt_response ?? null,
            tags: input.metadata?.tags ?? [],
            summary: input.metadata?.summary ?? null,
          }
        });
        logger.info('Created conversation message (alias)', { id: message.id });
        return message;
      } catch (error) {
        logger.error('Error creating conversation message (alias)', { input, error });
        throw new Error('Failed to create conversation message');
      }
    }),
  addMessage: protectedProcedure
    .input(z.object({
      user_id: z.string(),
      conversation_id: z.string().optional(),
      input_type: z.string().optional(),
      input_transcript: z.string().optional(),
      gpt_response: z.string().optional(),
      audio_response_url: z.string().optional(),
      summary: z.string().optional(),
      mood_at_time: z.number().optional(),
      tags: z.array(z.string()).optional()
    }))
    .mutation(async ({ input }) => {
      try {
        logger.info('Adding message', { input });
        
        const message = await prisma.user_conversation_messages.create({
          data: {
            user_id: input.user_id,
            conversation_id: input.conversation_id ?? null,
            input_type: input.input_type ?? null,
            input_transcript: input.input_transcript ?? null,
            gpt_response: input.gpt_response ?? null,
            audio_response_url: input.audio_response_url ?? null,
            summary: input.summary ?? null,
            mood_at_time: input.mood_at_time ?? null,
            tags: input.tags || []
          }
        });
        
        logger.info('Added message', { id: message.id });
        return message;
      } catch (error) {
        logger.error('Error adding message', { input, error });
        throw new Error('Failed to add message');
      }
    }),

  getMessages: t.procedure
    .input(z.object({
      conversation_id: z.string(),
      limit: z.number().optional()
    }))
    .query(async ({ input }) => {
      try {
        logger.info('Getting messages', { input });
        
        const messages = await prisma.user_conversation_messages.findMany({
          where: {
            conversation_id: input.conversation_id
          },
          orderBy: {
            created_at: 'asc'
          },
          take: input.limit || 100
        });
        
        logger.info('Retrieved messages', { count: messages.length });
        return messages;
      } catch (error) {
        logger.error('Error fetching messages', { input, error });
        throw new Error('Failed to fetch messages');
      }
    }),

  // Alias to support existing mobile client path
  getConversationMessages: t.procedure
    .input(z.object({
      conversation_id: z.string(),
      limit: z.number().optional()
    }))
    .query(async ({ input }) => {
      try {
        logger.info('Getting messages (alias)', { input });
        const messages = await prisma.user_conversation_messages.findMany({
          where: { conversation_id: input.conversation_id },
          orderBy: { created_at: 'asc' },
          take: input.limit || 100,
        });
        logger.info('Retrieved messages (alias)', { count: messages.length });
        return messages;
      } catch (error) {
        logger.error('Error fetching messages (alias)', { input, error });
        throw new Error('Failed to fetch messages');
      }
    }),

  flagMessage: t.procedure
    .input(z.object({
      message_id: z.string(),
      flagged: z.boolean()
    }))
    .mutation(async ({ input }) => {
      try {
        logger.info('Flagging message', { input });
        
        const message = await prisma.user_conversation_messages.update({
          where: {
            id: input.message_id
          },
          data: {
            flagged: input.flagged
          }
        });
        
        logger.info('Flagged message', { id: message.id, flagged: message.flagged });
        return message;
      } catch (error) {
        logger.error('Error flagging message', { input, error });
        throw new Error('Failed to flag message');
      }
    }),

  // Crisis management procedures
  createCrisisFlag: protectedProcedure
    .input(z.object({
      user_id: z.string(),
      session_id: z.string().optional(),
      flag_type: z.string()
    }))
    .mutation(async ({ input }) => {
      try {
        logger.info('Creating crisis flag', { input });
        
        const crisisFlag = await prisma.user_crisis_flags.create({
          data: {
            user_id: input.user_id,
            session_id: input.session_id ?? null,
            flag_type: input.flag_type
          }
        });
        
        logger.info('Created crisis flag', { id: crisisFlag.id });
        return crisisFlag;
      } catch (error) {
        logger.error('Error creating crisis flag', { input, error });
        throw new Error('Failed to create crisis flag');
      }
    }),

  getCrisisFlags: t.procedure
    .input(z.object({
      user_id: z.string(),
      reviewed: z.boolean().optional()
    }))
    .query(async ({ input }) => {
      try {
        logger.info('Getting crisis flags', { input });
        
        const crisisFlags = await prisma.user_crisis_flags.findMany({
          where: {
            user_id: input.user_id,
            ...(input.reviewed !== undefined && { reviewed: input.reviewed })
          },
          orderBy: {
            triggered_at: 'desc'
          }
        });
        
        logger.info('Retrieved crisis flags', { count: crisisFlags.length });
        return crisisFlags;
      } catch (error) {
        logger.error('Error fetching crisis flags', { input, error });
        throw new Error('Failed to fetch crisis flags');
      }
    }),

  markCrisisFlagReviewed: t.procedure
    .input(z.object({
      flag_id: z.string()
    }))
    .mutation(async ({ input }) => {
      try {
        logger.info('Marking crisis flag as reviewed', { input });
        
        const crisisFlag = await prisma.user_crisis_flags.update({
          where: {
            id: input.flag_id
          },
          data: {
            reviewed: true
          }
        });
        
        logger.info('Marked crisis flag as reviewed', { id: crisisFlag.id });
        return crisisFlag;
      } catch (error) {
        logger.error('Error marking crisis flag as reviewed', { input, error });
        throw new Error('Failed to mark crisis flag as reviewed');
      }
    })
}); 