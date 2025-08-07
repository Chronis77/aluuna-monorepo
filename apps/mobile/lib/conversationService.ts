import { trpcClient } from './trpcClient';

// Session service using tRPC
export class ConversationService {
  // Test database connection
  static async testDatabaseConnection() {
    try {
      console.log('🔍 Testing database connection via tRPC...');
      const result = await trpcClient.testConnection();
      if (result.success) {
        console.log('✅ Database connection test successful');
        return result;
      } else {
        console.error('❌ Database connection test failed:', result.error);
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('❌ Error testing database connection:', error);
      throw error;
    }
  }

  // Get latest conversation for a user
  static async getLatestConversation(userId: string, token?: string) {
    try {
      const conversations = await trpcClient.getConversations(userId);
      if (conversations && conversations.length > 0) {
        // Return the most recent conversation (assuming they're ordered by creation date)
        return conversations[0];
      }
      return null;
    } catch (error) {
      console.error('Error getting latest conversation:', error);
      throw error;
    }
  }

  // Test RLS policies
  static async testRLSPolicies(conversationId: string) {
    try {
      console.log('🔍 Testing RLS policies for conversation:', conversationId);
      // For now, just log that we're testing RLS policies
      // This could be expanded to actually test database permissions
      console.log('✅ RLS policy test completed (placeholder)');
      return true;
    } catch (error) {
      console.error('❌ Error testing RLS policies:', error);
      throw error;
    }
  }

  // Create a new conversation message
  static async createConversationMessage(messageData: any, token?: string) {
    try {
      return await trpcClient.createConversationMessage(messageData.user_id, messageData.conversation_id, messageData.title, messageData.initial_message, messageData.metadata);
    } catch (error) {
      console.error('Error creating conversation message:', error);
      throw error;
    }
  }

  // Get all conversation messages for a user
  static async getConversationMessages(userId: string, token?: string) {
    try {
      return await trpcClient.getConversationMessages(userId);
    } catch (error) {
      console.error('Error getting conversation messages:', error);
      throw error;
    }
  }

  // Get a specific conversation message
  static async getConversationMessage(messageId: string, token?: string) {
    try {
      return await trpcClient.getConversationMessage(messageId);
    } catch (error) {
      console.error('Error getting conversation message:', error);
      throw error;
    }
  }

  // Update a conversation message
  static async updateConversationMessage(messageId: string, updates: any, token?: string) {
    try {
      return await trpcClient.updateConversationMessage(messageId, updates);
    } catch (error) {
      console.error('Error updating conversation message:', error);
      throw error;
    }
  }

  // Get current user
  static async getCurrentUser(token?: string) {
    try {
      return await trpcClient.getCurrentUser(token);
    } catch (error) {
      console.error('Error getting current user:', error);
      throw error;
    }
  }

  // Get conversations for a user
  static async getConversations(userId: string, token?: string) {
    try {
      return await trpcClient.getConversations(userId);
    } catch (error) {
      console.error('Error getting conversations:', error);
      throw error;
    }
  }

  // Get conversation messages for a specific conversation
  static async getConversationMessagesForConversation(conversationId: string, token?: string) {
    try {
      return await trpcClient.getConversationMessages(conversationId);
    } catch (error) {
      console.error('Error getting conversation messages:', error);
      throw error;
    }
  }

  // Get a specific conversation
  static async getConversation(conversationId: string, token?: string) {
    try {
      return await trpcClient.getConversation(conversationId);
    } catch (error) {
      console.error('Error getting conversation:', error);
      throw error;
    }
  }

  // Create a conversation - updated signature to match how it's called
  static async createConversation(userId: string, title?: string, metadata?: any, token?: string) {
    try {
      return await trpcClient.createSessionGroup(userId, title, undefined, metadata);
    } catch (error) {
      console.error('Error creating conversation:', error);
      throw error;
    }
  }

  // Update conversation
  static async updateConversation(conversationId: string, updates: any, token?: string) {
    try {
      return await trpcClient.updateConversation(conversationId, updates);
    } catch (error) {
      console.error('Error updating conversation:', error);
      throw error;
    }
  }

  // Mark conversation message as read
  static async markConversationMessageAsRead(messageId: string, token?: string) {
    try {
      return await trpcClient.updateConversationMessage(messageId, { read: true });
    } catch (error) {
      console.error('Error marking conversation message as read:', error);
      throw error;
    }
  }

  // Get conversation count
  static async getConversationCount(userId: string, token?: string) {
    try {
      const conversations = await trpcClient.getConversations(userId);
      return conversations.length;
    } catch (error) {
      console.error('Error getting conversation count:', error);
      throw error;
    }
  }

  // Delete a conversation message
  static async deleteConversationMessage(messageId: string, token?: string) {
    try {
      return await trpcClient.deleteConversationMessage(messageId);
    } catch (error) {
      console.error('Error deleting conversation message:', error);
      throw error;
    }
  }

  // Get conversation analytics
  static async getConversationAnalytics(userId: string, token?: string) {
    try {
      return await trpcClient.getSessionAnalytics(userId);
    } catch (error) {
      console.error('Error getting conversation analytics:', error);
      throw error;
    }
  }

  // Add a new conversation message
  static async addConversationMessage(conversationId: string, userId: string, inputTranscript?: string, gptResponse?: string, token?: string) {
    try {
      return await trpcClient.createConversationMessage(userId, conversationId, undefined, inputTranscript, {
        gpt_response: gptResponse
      });
    } catch (error) {
      console.error('Error adding conversation message:', error);
      throw error;
    }
  }

  // Update conversation message with AI response
  static async updateConversationMessageWithResponse(messageId: string, aiResponse: string, token?: string) {
    try {
      return await trpcClient.updateConversationMessage(messageId, {
        gpt_response: aiResponse
      });
    } catch (error) {
      console.error('Error updating conversation message with response:', error);
      throw error;
    }
  }
} 