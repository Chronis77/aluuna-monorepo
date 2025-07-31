import { ContextService } from './contextService';
import { MemoryProcessingService, ProcessingContext, StructuredResponse } from './memoryProcessingService';
import { Message, OpenAIService } from './openaiService';
import { supabase } from './supabase';

/**
 * Example usage of the Memory Processing Service
 * This demonstrates how to integrate structured responses with memory storage
 */
export class MemoryProcessingExample {
  
  /**
   * Example: Process a user message with full memory integration
   */
  static async processUserMessage(
    userMessage: string,
    userId: string,
    sessionId: string,
    sessionGroupId: string
  ): Promise<{ response: string; processed: boolean }> {
    try {
      console.log('=== PROCESSING USER MESSAGE ===');
      console.log('User ID:', userId);
      console.log('Session ID:', sessionId);
      console.log('Message:', userMessage);

      // 1. Build session context
      const sessionContext = ContextService.buildSessionContext();
      
      // 2. Get conversation history (you would implement this based on your session structure)
      const conversationHistory: Message[] = await this.getConversationHistory(sessionGroupId);
      
      // 3. Generate structured response from OpenAI
      const { response, structuredData } = await OpenAIService.generateStructuredResponse(
        userMessage,
        sessionContext,
        conversationHistory
      );

      // 4. If we got structured data, process it for memory storage
      if (structuredData) {
        const processingContext: ProcessingContext = {
          userId,
          sessionId,
          sessionGroupId,
          currentSessionContext: sessionContext
        };

        await MemoryProcessingService.processStructuredResponse(
          structuredData as StructuredResponse,
          processingContext
        );

        console.log('✅ Memory processing completed successfully');
        return { response, processed: true };
      } else {
        console.log('⚠️ No structured data received, using regular response');
        return { response, processed: false };
      }

    } catch (error) {
      console.error('❌ Error processing user message:', error);
      return { 
        response: "I'm having trouble processing that right now. Could you try again?", 
        processed: false 
      };
    }
  }

  /**
   * Example: Get user's memory profile and insights
   */
  static async getUserMemoryData(userId: string) {
    try {
      console.log('=== FETCHING USER MEMORY DATA ===');
      
      // Get memory profile
      const memoryProfile = await MemoryProcessingService.getMemoryProfile(userId);
      console.log('Memory Profile:', memoryProfile);

      // Get recent insights
      const insights = await MemoryProcessingService.getUserInsights(userId, 5);
      console.log('Recent Insights:', insights);

      // Get inner parts
      const innerParts = await MemoryProcessingService.getUserInnerParts(userId);
      console.log('Inner Parts:', innerParts);

      return {
        memoryProfile,
        insights,
        innerParts
      };
    } catch (error) {
      console.error('❌ Error fetching user memory data:', error);
      throw error;
    }
  }

  /**
   * Example: Process a complete therapy session with memory integration
   */
  static async processCompleteSession(
    sessionMessages: string[],
    userId: string,
    sessionId: string,
    sessionGroupId: string
  ): Promise<{ responses: string[]; memoryInsights: any[] }> {
    const responses: string[] = [];
    const memoryInsights: any[] = [];

    try {
      console.log('=== PROCESSING COMPLETE SESSION ===');
      console.log('Session messages:', sessionMessages.length);

      for (let i = 0; i < sessionMessages.length; i++) {
        const userMessage = sessionMessages[i];
        console.log(`Processing message ${i + 1}/${sessionMessages.length}`);

        const { response, processed } = await this.processUserMessage(
          userMessage,
          userId,
          sessionId,
          sessionGroupId
        );

        responses.push(response);

        if (processed) {
          memoryInsights.push({
            messageIndex: i,
            message: userMessage,
            processed: true
          });
        }
      }

      console.log(`✅ Session processing complete. ${memoryInsights.length} messages processed for memory.`);
      return { responses, memoryInsights };

    } catch (error) {
      console.error('❌ Error processing complete session:', error);
      throw error;
    }
  }

  /**
   * Example: Handle crisis detection
   */
  static async handleCrisisDetection(userId: string, sessionId: string) {
    try {
      console.log('=== HANDLING CRISIS DETECTION ===');
      
      // Check for recent crisis flags
      const { data: crisisFlags, error } = await supabase
        .from('crisis_flags')
        .select('*')
        .eq('user_id', userId)
        .eq('reviewed', false)
        .order('triggered_at', { ascending: false })
        .limit(5);

      if (error) {
        console.error('Error fetching crisis flags:', error);
        return;
      }

      if (crisisFlags && crisisFlags.length > 0) {
        console.log('🚨 Found crisis flags:', crisisFlags);
        
        // Here you would implement your crisis response logic
        // For example:
        // - Send notification to user
        // - Provide crisis resources
        // - Flag for human review
        // - Show crisis intervention UI
        
        console.log('⚠️ Crisis intervention needed for user:', userId);
      } else {
        console.log('✅ No active crisis flags found');
      }

    } catch (error) {
      console.error('❌ Error handling crisis detection:', error);
    }
  }

  /**
   * Example: Generate session summary with memory insights
   */
  static async generateSessionSummaryWithMemory(
    sessionGroupId: string,
    userId: string
  ): Promise<{ summary: string; memoryInsights: any }> {
    try {
      console.log('=== GENERATING SESSION SUMMARY WITH MEMORY ===');

      // Get session messages
      const conversationHistory = await this.getConversationHistory(sessionGroupId);
      
      // Generate summary using OpenAI
      const summary = await OpenAIService.generateSessionSummary(conversationHistory);

      // Get memory insights for this session
      const memoryData = await this.getUserMemoryData(userId);

      return {
        summary,
        memoryInsights: {
          recentInsights: memoryData.insights.slice(0, 3),
          innerPartsDiscovered: memoryData.innerParts.length,
          copingToolsUsed: memoryData.memoryProfile?.coping_tools?.length || 0,
          stuckPointsIdentified: memoryData.memoryProfile?.stuck_points?.length || 0
        }
      };

    } catch (error) {
      console.error('❌ Error generating session summary with memory:', error);
      throw error;
    }
  }

  /**
   * Helper method to get conversation history
   * This would be implemented based on your session structure
   */
  private static async getConversationHistory(sessionGroupId: string): Promise<Message[]> {
    // This is a placeholder - implement based on your session service
    // You would typically fetch from your sessions table
    return [];
  }
}

// Example usage in your session screen:
/*
import { MemoryProcessingExample } from '../lib/memoryProcessingExample';

// In your handleSendMessage function:
const handleSendMessage = async () => {
  if (!inputText.trim() || !currentSessionGroup || !currentUserId) return;

  try {
    const { response, processed } = await MemoryProcessingExample.processUserMessage(
      inputText,
      currentUserId,
      currentSessionId, // You'll need to track this
      currentSessionGroup.id
    );

    // Add response to your UI
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      text: response,
      isUser: false,
      timestamp: new Date()
    }]);

    // Clear input
    setInputText('');

    // If memory was processed, you might want to update UI or show insights
    if (processed) {
      console.log('Memory was processed for this message');
      // Maybe show a subtle indicator or update insights panel
    }

  } catch (error) {
    console.error('Error sending message:', error);
    // Handle error in UI
  }
};
*/ 