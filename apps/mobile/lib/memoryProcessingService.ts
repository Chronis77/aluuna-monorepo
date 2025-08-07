import { trpcClient } from './trpcClient';

// Memory processing service using tRPC
export class MemoryProcessingService {
  // Process inner parts from session
  static async processInnerParts(sessionId: string, userId: string, innerParts: any[]) {
    try {
      // TODO: Implement inner parts processing with tRPC
      console.log('Processing inner parts:', { sessionId, userId, innerParts });
      for (const part of innerParts) {
        console.log('Inner part:', part);
        // await trpcClient.createInnerPart({ user_id: userId, session_id: sessionId, ...part });
      }
    } catch (error) {
      console.error('Error processing inner parts:', error);
      throw error;
    }
  }

  // Process stuck points from session
  static async processStuckPoints(sessionId: string, userId: string, stuckPoints: string[]) {
    try {
      // TODO: Implement stuck points processing with tRPC
      console.log('Processing stuck points:', { sessionId, userId, stuckPoints });
      for (const point of stuckPoints) {
        console.log('Stuck point:', point);
        // await trpcClient.createStuckPoint({ user_id: userId, session_id: sessionId, description: point });
      }
    } catch (error) {
      console.error('Error processing stuck points:', error);
      throw error;
    }
  }

  // Process coping tools from session
  static async processCopingTools(sessionId: string, userId: string, copingTools: any[]) {
    try {
      // TODO: Implement coping tools processing with tRPC
      console.log('Processing coping tools:', { sessionId, userId, copingTools });
      for (const tool of copingTools) {
        console.log('Coping tool:', tool);
        // await trpcClient.createCopingTool({ user_id: userId, session_id: sessionId, ...tool });
      }
    } catch (error) {
      console.error('Error processing coping tools:', error);
      throw error;
    }
  }

  // Process shadow themes from session
  static async processShadowThemes(sessionId: string, userId: string, shadowThemes: string[]) {
    try {
      // TODO: Implement shadow themes processing with tRPC
      console.log('Processing shadow themes:', { sessionId, userId, shadowThemes });
      for (const theme of shadowThemes) {
        console.log('Shadow theme:', theme);
        // await trpcClient.createShadowTheme({ user_id: userId, session_id: sessionId, theme });
      }
    } catch (error) {
      console.error('Error processing shadow themes:', error);
      throw error;
    }
  }

  // Process pattern loops from session
  static async processPatternLoops(sessionId: string, userId: string, patternLoops: any[]) {
    try {
      // TODO: Implement pattern loops processing with tRPC
      console.log('Processing pattern loops:', { sessionId, userId, patternLoops });
      for (const loop of patternLoops) {
        console.log('Pattern loop:', loop);
        // await trpcClient.createPatternLoop({ user_id: userId, session_id: sessionId, ...loop });
      }
    } catch (error) {
      console.error('Error processing pattern loops:', error);
      throw error;
    }
  }

  // Process mantras from session
  static async processMantras(sessionId: string, userId: string, mantras: any[]) {
    try {
      // TODO: Implement mantras processing with tRPC
      console.log('Processing mantras:', { sessionId, userId, mantras });
      for (const mantra of mantras) {
        console.log('Mantra:', mantra);
        // await trpcClient.createMantra({ user_id: userId, session_id: sessionId, ...mantra });
      }
    } catch (error) {
      console.error('Error processing mantras:', error);
      throw error;
    }
  }

  // Process relationships from session
  static async processRelationships(sessionId: string, userId: string, relationships: any[]) {
    try {
      // TODO: Implement relationships processing with tRPC
      console.log('Processing relationships:', { sessionId, userId, relationships });
      for (const relationship of relationships) {
        console.log('Relationship:', relationship);
        // await trpcClient.createRelationship({ user_id: userId, session_id: sessionId, ...relationship });
      }
    } catch (error) {
      console.error('Error processing relationships:', error);
      throw error;
    }
  }

  // Process insights from session
  static async processInsights(sessionId: string, userId: string, insights: any[]) {
    try {
      // TODO: Implement insights processing with tRPC
      console.log('Processing insights:', { sessionId, userId, insights });
      for (const insight of insights) {
        console.log('Insight:', insight);
        // await trpcClient.createInsight({ user_id: userId, session_id: sessionId, ...insight });
      }
    } catch (error) {
      console.error('Error processing insights:', error);
      throw error;
    }
  }

  // Process emotional trends from session
  static async processEmotionalTrends(sessionId: string, userId: string, emotionalTrends: any[]) {
    try {
      for (const trend of emotionalTrends) {
        await trpcClient.createEmotionalTrend(
          userId,
          trend.mood_score,
          trend.mood_label,
          new Date().toISOString(),
          trend.notes
        );
      }
    } catch (error) {
      console.error('Error processing emotional trends:', error);
      throw error;
    }
  }

  // Update memory profile with new insights
  static async updateMemoryProfile(userId: string, updates: any) {
    try {
      await trpcClient.upsertMemoryProfile({
        user_id: userId,
        ...updates
      });
    } catch (error) {
      console.error('Error updating memory profile:', error);
      throw error;
    }
  }

  // Get current memory profile
  static async getMemoryProfile(userId: string) {
    try {
      return await trpcClient.getMemoryProfile(userId);
    } catch (error) {
      console.error('Error getting memory profile:', error);
      throw error;
    }
  }

  // Get user insights
  static async getUserInsights(userId: string, limit?: number) {
    try {
      const response = await trpcClient.getInsights(userId);
      // The tRPC response returns { success: true, insights: [] }
      return response.insights || [];
    } catch (error) {
      console.error('Error getting user insights:', error);
      throw error;
    }
  }

  // Get user inner parts
  static async getUserInnerParts(userId: string) {
    try {
      const response = await trpcClient.getInnerParts(userId);
      // The tRPC response returns { success: true, innerParts: [] }
      return response.innerParts || [];
    } catch (error) {
      console.error('Error getting user inner parts:', error);
      throw error;
    }
  }

  // Get user mantras
  static async getUserMantras(userId: string) {
    try {
      const response = await trpcClient.getMantras(userId);
      // The tRPC response returns { success: true, mantras: [] }
      return response.mantras || [];
    } catch (error) {
      console.error('Error getting user mantras:', error);
      throw error;
    }
  }
} 