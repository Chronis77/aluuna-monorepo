import { initTRPC } from '@trpc/server';
import { Context } from '../context.js';
import { logger } from '../../utils/logger.js';
import { z } from 'zod';
import { prisma, forceConnectionReset } from '../../db/client.js';
import { protectedProcedure, publicProcedure } from '../middleware/auth.js';

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
        // TODO: Implement with actual database
        logger.info('Getting session continuity', { input });
        return [];
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
        // TODO: Implement with actual database
        logger.info('Upserting session continuity', { input });
        return 'session-continuity-id';
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
        // TODO: Implement with actual database
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
        // TODO: Implement with actual database
        logger.info('Getting user active sessions', { userId: input.p_user_id });
        return [];
      } catch (error) {
        logger.error('Error fetching user active sessions', { userId: input.p_user_id, error });
        throw new Error('Failed to fetch user active sessions');
      }
    }),

  cleanupStaleSessionContinuity: t.procedure
    .mutation(async () => {
      try {
        // TODO: Implement with actual database
        logger.info('Cleaning up stale session continuity');
        return 0;
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
        
        const session = await prisma.conversation_messages.create({
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
        
        const sessions = await prisma.conversation_messages.findMany({
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
        
        const session = await prisma.conversation_messages.findUnique({
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
        
        const session = await prisma.conversation_messages.update({
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
        
        await prisma.conversation_messages.delete({
          where: {
            id: input.session_id
          }
        });
        
        logger.info('Deleted session', { id: input.session_id });
        return { success: true };
      } catch (error) {
        logger.error('Error deleting session', { input, error });
        throw new Error('Failed to delete session');
      }
    }),

  // Session groups procedures
  createSessionGroup: protectedProcedure
    .input(z.object({
      user_id: z.string(),
      title: z.string().optional(),
      description: z.string().optional(),
      metadata: z.any().optional()
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        logger.info('Creating session group', { input, userId: ctx.user?.id });
        
        // Verify the user is creating their own session group
        if (ctx.user?.id !== input.user_id) {
          throw new Error('Unauthorized access to create session group');
        }
        
        const sessionGroup = await prisma.conversations.create({
          data: {
            user_id: input.user_id,
            title: input.title || null,
            description: input.description || null,
            context_json: input.metadata || null,
            created_at: new Date(),
            started_at: new Date()
          }
        });
        
        logger.info('Created session group', { id: sessionGroup.id });
        return sessionGroup;
      } catch (error) {
        logger.error('Error creating session group', { input, error });
        throw new Error('Failed to create session group');
      }
    }),

  getConversations: protectedProcedure
    .input(z.object({
      user_id: z.string()
    }))
    .query(async ({ input, ctx }) => {
      try {
        logger.info('Getting conversations', { input, userId: ctx.user?.id });
        
        // Verify the user is requesting their own conversations
        if (ctx.user?.id !== input.user_id) {
          throw new Error('Unauthorized access to conversations');
        }
        
        const conversations = await prisma.conversations.findMany({
          where: {
            user_id: input.user_id
          },
          orderBy: {
            created_at: 'desc'
          },
          include: {
            conversation_messages: {
              orderBy: {
                created_at: 'desc'
              },
              take: 5 // Limit to recent messages for performance
            }
          }
        });
        
        logger.info('Retrieved conversations', { count: conversations.length });
        return conversations;
      } catch (error: any) {
        logger.error('Error fetching conversations', { input, error });
        
        // Check if it's a prepared statement error
        if (error?.message?.includes('prepared statement') && error?.message?.includes('already exists')) {
          logger.error('Prepared statement error in getConversations, attempting to reconnect...');
          
          try {
            // Only reset connection if we have persistent errors
            console.log('🔄 Attempting retry with connection reset...');
            await forceConnectionReset();
            
            // Wait a bit before retrying
            await new Promise(resolve => setTimeout(resolve, 200));
            
            // Retry the operation
            const conversations = await prisma.conversations.findMany({
              where: {
                user_id: input.user_id
              },
              orderBy: {
                created_at: 'desc'
              },
              include: {
                conversation_messages: {
                  orderBy: {
                    created_at: 'desc'
                  },
                  take: 5 // Limit to recent messages for performance
                }
              }
            });
            
            logger.info('Retrieved conversations after retry', { count: conversations.length });
            return conversations;
          } catch (retryError) {
            logger.error('Retry failed for getConversations', { retryError });
            throw new Error('Failed to fetch conversations after retry');
          }
        }
        
        throw new Error('Failed to fetch conversations');
      }
    }),

  getConversation: protectedProcedure
    .input(z.object({
      conversation_id: z.string()
    }))
    .query(async ({ input }) => {
      try {
        logger.info('Getting conversation', { input });
        
        const conversation = await prisma.conversations.findUnique({
          where: {
            id: input.conversation_id
          }
        });
        
        logger.info('Retrieved conversation', { id: conversation?.id });
        return conversation;
      } catch (error) {
        logger.error('Error fetching conversation', { input, error });
        throw new Error('Failed to fetch conversation');
      }
    }),

  getConversationMessages: protectedProcedure
    .input(z.object({
      conversation_id: z.string()
    }))
    .query(async ({ input }) => {
      try {
        logger.info('Getting conversation messages', { input });
        
        const messages = await prisma.conversation_messages.findMany({
          where: {
            conversation_id: input.conversation_id
          },
          orderBy: {
            created_at: 'asc'
          }
        });
        
        logger.info('Retrieved conversation messages', { count: messages.length });
        return messages;
      } catch (error) {
        logger.error('Error fetching conversation messages', { input, error });
        throw new Error('Failed to fetch conversation messages');
      }
    }),

  updateConversation: protectedProcedure
    .input(z.object({
      conversation_id: z.string(),
      updates: z.any()
    }))
    .mutation(async ({ input }) => {
      try {
        logger.info('Updating conversation', { input });
        
        const conversation = await prisma.conversations.update({
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

  createConversationMessage: protectedProcedure
    .input(z.object({
      user_id: z.string(),
      conversation_id: z.string().optional(),
      title: z.string().optional(),
      initial_message: z.string().optional(),
      metadata: z.any().optional()
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        logger.info('Creating conversation message', { input, userId: ctx.user?.id });
        
        // Verify the user is creating their own message
        if (ctx.user?.id !== input.user_id) {
          throw new Error('Unauthorized access to create conversation message');
        }
        
        const message = await prisma.conversation_messages.create({
          data: {
            user_id: input.user_id,
            conversation_id: input.conversation_id || null,
            input_transcript: input.initial_message || null,
            tags: input.metadata?.tags || []
          }
        });
        
        logger.info('Created conversation message', { id: message.id });
        return message;
      } catch (error) {
        logger.error('Error creating conversation message', { input, error });
        throw new Error('Failed to create conversation message');
      }
    }),

  getConversationMessage: protectedProcedure
    .input(z.object({
      message_id: z.string()
    }))
    .query(async ({ input }) => {
      try {
        logger.info('Getting conversation message', { input });
        
        const message = await prisma.conversation_messages.findUnique({
          where: {
            id: input.message_id
          },
          include: {
            conversation: true
          }
        });
        
        logger.info('Retrieved conversation message', { found: !!message });
        return message;
      } catch (error) {
        logger.error('Error fetching conversation message', { input, error });
        throw new Error('Failed to fetch conversation message');
      }
    }),

  updateConversationMessage: protectedProcedure
    .input(z.object({
      message_id: z.string(),
      updates: z.any()
    }))
    .mutation(async ({ input }) => {
      try {
        logger.info('Updating conversation message', { input });
        
        const message = await prisma.conversation_messages.update({
          where: {
            id: input.message_id
          },
          data: input.updates
        });
        
        logger.info('Updated conversation message', { id: message.id });
        return message;
      } catch (error) {
        logger.error('Error updating conversation message', { input, error });
        throw new Error('Failed to update conversation message');
      }
    }),

  deleteConversationMessage: protectedProcedure
    .input(z.object({
      message_id: z.string()
    }))
    .mutation(async ({ input }) => {
      try {
        logger.info('Deleting conversation message', { input });
        
        await prisma.conversation_messages.delete({
          where: {
            id: input.message_id
          }
        });
        
        logger.info('Deleted conversation message', { id: input.message_id });
        return { success: true };
      } catch (error) {
        logger.error('Error deleting conversation message', { input, error });
        throw new Error('Failed to delete conversation message');
      }
    }),

  // Session analytics
  getSessionAnalytics: t.procedure
    .input(z.object({
      user_id: z.string()
    }))
    .query(async ({ input }) => {
      try {
        // TODO: Implement with actual database
        logger.info('Getting session analytics', { input });
        return {
          total_sessions: 0,
          total_duration: 0,
          average_session_length: 0,
          sessions_this_week: 0,
          sessions_this_month: 0
        };
      } catch (error) {
        logger.error('Error fetching session analytics', { input, error });
        throw new Error('Failed to fetch session analytics');
      }
    }),
}); 