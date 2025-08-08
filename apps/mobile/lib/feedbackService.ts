import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { Feedback } from '../types/database';
import { OpenAIService } from './openaiService';
import { trpcClient } from './trpcClient';

export interface FeedbackSubmission {
  rawFeedback: string;
  feedbackType?: string;
  deviceInfo?: any;
  appVersion?: string;
}

export interface AIProcessedFeedback {
  summary: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  feedbackType: string;
  tags: string[];
  metadata: any;
}

export class FeedbackService {
  /**
   * Submit feedback with AI processing
   */
  static async submitFeedback(
    userId: string, 
    submission: FeedbackSubmission
  ): Promise<Feedback> {
    try {
      console.log('📝 Processing feedback submission for user:', userId);
      
      // Get device information if not provided
      const deviceInfo = submission.deviceInfo || await this.getDeviceInfo();
      const appVersion = submission.appVersion || Constants.expoConfig?.version || '1.0.0';
      
      // Server-side AI analysis and insert via tRPC
      const analyzed = await trpcClient.createFeedbackAnalyzed(
        userId,
        submission.rawFeedback,
        undefined,
        deviceInfo,
        appVersion
      );

      if (!analyzed || !analyzed.success) {
        console.error('❌ Error inserting feedback:', analyzed);
        throw new Error('Failed to save feedback');
      }

      console.log('✅ Feedback submitted successfully:', analyzed.data.id);
      return analyzed.data as any;
      
    } catch (error) {
      console.error('❌ Error in submitFeedback:', error);
      throw error;
    }
  }

  /**
   * Process feedback with AI to generate summary, priority, and categorization
   */
  private static async processFeedbackWithAI(rawFeedback: string): Promise<AIProcessedFeedback> {
    try {
      const systemPrompt = `You are an AI assistant that analyzes user feedback for Aluuna, a mental health and therapeutic journaling app. 

Your task is to analyze user feedback and provide structured insights. Consider the context of a mental health app that focuses on:
- Therapeutic journaling and self-reflection
- Memory building and emotional processing
- AI-powered therapeutic conversations
- User experience and interface design
- App functionality and features

Please analyze the feedback and provide:

1. A concise, professional summary (2-3 sentences) that captures the essence of the feedback
2. Priority level based on impact and urgency:
   - 'critical': App crashes, data loss, security issues, accessibility problems
   - 'high': Major functionality broken, significant UX issues, core feature requests
   - 'medium': Minor bugs, feature requests, UI improvements, general suggestions
   - 'low': Cosmetic issues, minor suggestions, general feedback
3. Feedback type categorization:
   - 'bug': Technical issues, crashes, errors
   - 'feature_request': New functionality requests
   - 'ui_ux': Interface, design, user experience issues
   - 'performance': Speed, responsiveness, resource usage
   - 'content': Therapeutic content, AI responses, guidance
   - 'onboarding': Registration, setup, first-time user experience
   - 'general': General feedback, suggestions, comments
4. Relevant tags (3-5 tags) for categorization
5. Additional metadata insights

Respond in valid JSON format only:
{
  "summary": "Brief professional summary",
  "priority": "low|medium|high|critical",
  "feedbackType": "bug|feature_request|ui_ux|performance|content|onboarding|general",
  "tags": ["tag1", "tag2", "tag3"],
  "metadata": {
    "sentiment": "positive|negative|neutral",
    "urgency": "immediate|soon|later",
    "impact": "high|medium|low",
    "userType": "new|returning|power",
    "therapeuticRelevance": "high|medium|low"
  }
}`;

      const userPrompt = `Please analyze this user feedback for the Aluuna mental health app:

"${rawFeedback}"

Provide your analysis in the specified JSON format.`;

      console.log('=== AI FEEDBACK PROCESSING ===');
      console.log('Raw Feedback:', rawFeedback);
      console.log('System Prompt Length:', systemPrompt.length);
      console.log('User Prompt Length:', userPrompt.length);
      console.log('================================');

      // Use WebSocket for feedback processing to avoid React Native compatibility issues
      const response = await OpenAIService.generateViaWebSocket([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ], 0.3);

      console.log('AI Response:', response);

      // Parse the JSON response
      const cleanedResponse = OpenAIService.cleanJsonResponse(response);
      let aiAnalysis;
      
      try {
        aiAnalysis = JSON.parse(cleanedResponse);
      } catch (parseError) {
        console.error('Failed to parse AI response as JSON:', parseError);
        console.error('Cleaned response:', cleanedResponse);
        throw new Error('AI response was not valid JSON');
      }
      
      console.log('Parsed AI Analysis:', JSON.stringify(aiAnalysis, null, 2));
      
      // Validate required fields
      if (!aiAnalysis.summary || !aiAnalysis.priority || !aiAnalysis.feedbackType) {
        throw new Error('AI response missing required fields: summary, priority, or feedbackType');
      }
      
      // Validate priority value
      const validPriorities = ['low', 'medium', 'high', 'critical'];
      if (!validPriorities.includes(aiAnalysis.priority)) {
        console.warn(`Invalid priority value: ${aiAnalysis.priority}, defaulting to medium`);
        aiAnalysis.priority = 'medium';
      }
      
      // Validate feedback type
      const validTypes = ['bug', 'feature_request', 'ui_ux', 'performance', 'content', 'onboarding', 'general'];
      if (!validTypes.includes(aiAnalysis.feedbackType)) {
        console.warn(`Invalid feedback type: ${aiAnalysis.feedbackType}, defaulting to general`);
        aiAnalysis.feedbackType = 'general';
      }
      
      return {
        summary: aiAnalysis.summary,
        priority: aiAnalysis.priority,
        feedbackType: aiAnalysis.feedbackType,
        tags: aiAnalysis.tags || ['feedback'],
        metadata: aiAnalysis.metadata || {}
      };
      
    } catch (error) {
      console.error('❌ Error processing feedback with AI:', error);
      
      // Fallback to basic processing if AI fails
      return {
        summary: `User feedback: ${rawFeedback.substring(0, 100)}${rawFeedback.length > 100 ? '...' : ''}`,
        priority: 'medium',
        feedbackType: 'general',
        tags: ['feedback', 'user_input'],
        metadata: {
          sentiment: 'neutral',
          urgency: 'later',
          impact: 'medium',
          aiProcessingFailed: true,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  /**
   * Get device information for feedback context
   */
  private static async getDeviceInfo(): Promise<any> {
    try {
      return {
        platform: Platform.OS,
        version: Platform.Version,
        appVersion: Constants.expoConfig?.version || '1.0.0',
        buildNumber: Constants.expoConfig?.ios?.buildNumber || Constants.expoConfig?.android?.versionCode || '1',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting device info:', error);
      return {
        error: 'Failed to get device info',
        timestamp: new Date().toISOString()
      };
    }
  }



  /**
   * Get user's feedback history
   */
  static async getUserFeedback(userId: string, limit: number = 50): Promise<Feedback[]> {
    try {
      const feedback = await trpcClient.getFeedback(userId, limit);
      return feedback || [];
      
    } catch (error) {
      console.error('❌ Error in getUserFeedback:', error);
      throw error;
    }
  }

  /**
   * Update feedback status
   */
  static async updateFeedbackStatus(
    feedbackId: string, 
    status: 'pending' | 'processed' | 'resolved' | 'ignored'
  ): Promise<void> {
    try {
      // TODO: Implement feedback status update with tRPC
      console.log('✅ Feedback status updated:', feedbackId, status);
      
    } catch (error) {
      console.error('❌ Error in updateFeedbackStatus:', error);
      throw error;
    }
  }

  /**
   * Get feedback statistics for a user
   */
  static async getUserFeedbackStats(userId: string): Promise<{
    total: number;
    byPriority: Record<string, number>;
    byType: Record<string, number>;
    byStatus: Record<string, number>;
  }> {
    try {
      const feedback = await trpcClient.getFeedback(userId, 1000); // Get all feedback for stats

      const stats = {
        total: feedback?.length || 0,
        byPriority: {} as Record<string, number>,
        byType: {} as Record<string, number>,
        byStatus: {} as Record<string, number>
      };

      feedback?.forEach((item: any) => {
        // Count by priority
        const priority = item.priority || 'unknown';
        stats.byPriority[priority] = (stats.byPriority[priority] || 0) + 1;

        // Count by type
        const type = item.feedback_type || 'unknown';
        stats.byType[type] = (stats.byType[type] || 0) + 1;

        // Count by status
        const status = item.status || 'unknown';
        stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;
      });

      return stats;
      
    } catch (error) {
      console.error('❌ Error in getUserFeedbackStats:', error);
      throw error;
    }
  }
} 