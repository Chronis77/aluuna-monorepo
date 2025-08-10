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
      console.log('Processing coping tools:', { sessionId, userId, copingTools });
      for (const tool of copingTools) {
        if (tool && tool.tool_name) {
          console.log('Creating coping tool:', tool);
          await trpcClient.addCopingTool({ 
            user_id: userId, 
            tool_name: tool.tool_name,
            tool_category: tool.tool_category,
            effectiveness_rating: tool.effectiveness_rating,
            description: tool.description,
            when_to_use: tool.when_to_use
          });
        }
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
      console.log('Processing mantras:', { sessionId, userId, mantras });
      for (const mantra of mantras) {
        if (mantra && typeof mantra === 'string' && mantra.trim()) {
          console.log('Creating mantra:', mantra);
          await trpcClient.createMantra({ 
            user_id: userId, 
            text: mantra.trim(),
            source: 'ai_generated',
            is_favorite: false,
            tags: ['therapy_session'],
            is_pinned: false
          });
        }
      }
    } catch (error) {
      console.error('Error processing mantras:', error);
      throw error;
    }
  }

  // Process relationships from session
  static async processRelationships(sessionId: string, userId: string, relationships: any[]) {
    try {
      console.log('Processing relationships:', { sessionId, userId, relationships });
      for (const relationship of relationships) {
        if (relationship && relationship.name) {
          console.log('Creating relationship:', relationship);
          await trpcClient.createRelationship(
            userId,
            relationship.name,
            relationship.role || 'Other',
            relationship.notes || null
          );
        }
      }
    } catch (error) {
      console.error('Error processing relationships:', error);
      throw error;
    }
  }

  // Fetch relationships for a user
  static async getUserRelationships(userId: string) {
    try {
      const response = await trpcClient.getRelationships(userId);
      // Server returns array of rows; keep as-is for screen mapping
      return Array.isArray(response) ? response : (response?.relationships || []);
    } catch (error) {
      console.error('Error getting user relationships:', error);
      throw error;
    }
  }

  // Process insights from session
  static async processInsights(sessionId: string, userId: string, insights: any[]) {
    try {
      console.log('Processing insights:', { sessionId, userId, insights });
      // Insights would be handled by the memory profile system
      // For now, just log them as they need a different structure
      for (const insight of insights) {
        console.log('Insight captured:', insight);
      }
    } catch (error) {
      console.error('Error processing insights:', error);
      throw error;
    }
  }

  // Main method to process structured AI response metadata
  static async processStructuredResponse(userId: string, structuredData: any) {
    try {
      console.log('🧠 Processing structured AI response data for user:', userId);
      console.log('📊 Structured data:', JSON.stringify(structuredData, null, 2));

      if (!structuredData.new_memory_inference) {
        console.log('⚠️ No new_memory_inference found in structured data');
        return;
      }

      const inference = structuredData.new_memory_inference;
      const sessionId = `session-${Date.now()}`;

      // Process new mantra
      if (inference.new_mantra && typeof inference.new_mantra === 'string') {
        console.log('💫 Processing new mantra:', inference.new_mantra);
        await this.processMantras(sessionId, userId, [inference.new_mantra]);
      }

      // Process new relationship
      if (inference.new_relationship && inference.new_relationship.name) {
        console.log('👥 Processing new relationship:', inference.new_relationship);
        await this.processRelationships(sessionId, userId, [inference.new_relationship]);
      }

      // Process coping tool used
      if (inference.coping_tool_used && typeof inference.coping_tool_used === 'string') {
        console.log('🛠️ Processing coping tool:', inference.coping_tool_used);
        const copingTool = {
          tool_name: inference.coping_tool_used,
          tool_category: 'ai_suggested',
          effectiveness_rating: 5, // Default positive rating for AI suggested tools
          description: `Tool suggested during therapy session`,
          when_to_use: 'During emotional processing'
        };
        await this.processCopingTools(sessionId, userId, [copingTool]);
      }

      console.log('✅ Structured response processing completed');
    } catch (error) {
      console.error('❌ Error processing structured response:', error);
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
      // No direct upsertMemoryProfile method exists with the new normalized schema.
      // Caller should route updates to the appropriate specific procedures.
      console.warn('updateMemoryProfile is deprecated with the new schema. Route updates to specific trpcClient methods.');
      return;
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