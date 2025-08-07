import { trpc } from './trpc.js';
import { config } from './config.js';
import { logger } from './logger.js';

export interface AIResponse {
  gpt_response: string;
  insights?: string[];
  tts_url?: string;
  metadata?: Record<string, any>;
}

export interface UserInput {
  user_input: string;
  mode?: 'free_journaling' | 'daily_check_in' | 'crisis_support' | 'insight_generation';
  mood_score?: number;
  session_context?: Record<string, any>;
}

export class AIService {
  /**
   * Send user input to the server and get AI response
   */
  static async respond(input: UserInput): Promise<AIResponse> {
    try {
      logger.info('Sending user input to server', { 
        mode: input.mode, 
        moodScore: input.mood_score,
        inputLength: input.user_input.length 
      });

      const response = await trpc.respond.mutate(input);
      
      logger.info('Received AI response', { 
        responseLength: response.gpt_response.length,
        insightsCount: response.insights?.length || 0
      });

      return response;
    } catch (error) {
      logger.error('Error getting AI response', { error });
      throw new Error(`Failed to get AI response: ${error}`);
    }
  }

  /**
   * Get memory profile for a user
   */
  static async getMemoryProfile(userId: string) {
    try {
      logger.info('Getting memory profile', { userId });
      
      const response = await trpc.getMemoryProfile.query({ userId });
      
      logger.info('Received memory profile', { 
        userId,
        hasMemoryProfile: !!response.memoryProfile,
        innerPartsCount: response.innerParts.length,
        insightsCount: response.insights.length,
        emotionalTrendsCount: response.emotionalTrends.length
      });

      return response;
    } catch (error) {
      logger.error('Error getting memory profile', { userId, error });
      throw new Error(`Failed to get memory profile: ${error}`);
    }
  }

  /**
   * Check server health
   */
  static async checkHealth() {
    try {
      const response = await trpc.health.query();
      logger.info('Server health check', { status: response.status, version: response.version });
      return response;
    } catch (error) {
      logger.error('Server health check failed', { error });
      throw new Error(`Server health check failed: ${error}`);
    }
  }
} 