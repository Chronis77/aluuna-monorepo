import { config } from './config';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

class TRPCClient {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = config.server.url;
    this.apiKey = config.server.apiKey;
    console.log(`🔧 tRPC Client initialized with URL: ${this.baseUrl}`);
    console.log(`🔑 API Key configured: ${this.apiKey ? 'Yes' : 'No'}`);
  }

  // Test connection to server
  async testConnection() {
    try {
      console.log(`🧪 Testing connection to: ${this.baseUrl}/health`);
      console.log(`🔍 Network details: Platform=${Platform.OS}, URL=${this.baseUrl}`);
      
      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      console.log(`📡 Health check response status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Health check successful:`, data);
        return { success: true, data };
      } else {
        const errorText = await response.text();
        console.error(`❌ Health check failed: ${response.status} - ${errorText}`);
        return { success: false, error: `HTTP ${response.status}: ${errorText}` };
      }
    } catch (error) {
      console.error(`❌ Connection test failed:`, error);
      console.error(`🔍 Error details:`, {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace',
        url: `${this.baseUrl}/health`
      });
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: errorMessage };
    }
  }

  private async request(procedure: string, input: any) {
    try {
      console.log(`🔗 Making tRPC request to: ${this.baseUrl}/api/trpc/${procedure}`);
      console.log(`📤 Request input:`, input);
      console.log(`🔑 Using API key: ${this.apiKey ? 'Configured' : 'Missing'}`);
      
      // Get JWT token from AsyncStorage
      const token = await AsyncStorage.getItem('authToken');
      console.log(`🔐 JWT token available: ${token ? 'Yes' : 'No'}`);
      
      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey,
      };
      
      // Add JWT token if available
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`${this.baseUrl}/api/trpc/${procedure}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(input),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      console.log(`📥 Response status: ${response.status}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ HTTP error ${response.status}:`, errorText);
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }

      const data = await response.json();
      console.log(`✅ tRPC response:`, data);
      return data;
    } catch (error) {
      console.error(`❌ tRPC request failed for ${procedure}:`, error);
      throw error;
    }
  }

  // Authentication procedures (legacy - now using direct API calls)
  async login(email: string, password: string) {
    return this.request('auth.login', { email, password });
  }

  async register(email: string, password: string, name?: string) {
    return this.request('auth.register', { email, password, name });
  }

  async getCurrentUser(token?: string) {
    return this.request('auth.getCurrentUser', { token });
  }

  async signUp(email: string, password: string, name?: string) {
    return this.request('auth.signUp', { email, password, name });
  }

  async signOut() {
    return this.request('auth.signOut', {});
  }

  // Memory profile procedures
  async getMemoryProfile(userId: string) {
    return this.request('memory.getMemoryProfile', { userId });
  }

  async upsertMemoryProfile(data: any) {
    return this.request('memory.upsertMemoryProfile', data);
  }

  // Mantras
  async getMantras(userId: string) {
    return this.request('mantras.getMantras', { userId });
  }

  async createMantra(data: {
    id?: string;
    user_id: string;
    text: string;
    source?: string;
    is_favorite?: boolean;
    tags?: string[] | null;
    is_pinned?: boolean;
  }) {
    return this.request('mantras.createMantra', data);
  }

  async updateMantra(id: string, data: { text?: string; is_pinned?: boolean }) {
    return this.request('mantras.updateMantra', { id, ...data });
  }

  async deleteMantra(id: string) {
    return this.request('mantras.deleteMantra', { id });
  }

  // Insights
  async getInsights(userId: string) {
    return this.request('insights.getInsights', { userId });
  }

  async updateInsight(id: string, insight_text: string, importance: number) {
    return this.request('insights.updateInsight', {
      id,
      insight_text,
      importance,
      updated_at: new Date().toISOString()
    });
  }

  async deleteInsight(id: string) {
    return this.request('insights.deleteInsight', { id });
  }

  // Memory Snapshots
  async getMemorySnapshots(userId: string) {
    return this.request('memory.getMemorySnapshots', { userId });
  }

  async updateMemorySnapshot(id: string, content: string) {
    return this.request('memory.updateMemorySnapshot', { id, content });
  }

  async deleteMemorySnapshot(id: string) {
    return this.request('memory.deleteMemorySnapshot', { id });
  }

  // Inner Parts
  async getInnerParts(userId: string) {
    return this.request('innerParts.getInnerParts', { userId });
  }

  async updateInnerPart(id: string, role: string, description: string) {
    return this.request('innerParts.updateInnerPart', { id, role, description });
  }

  async deleteInnerPart(id: string) {
    return this.request('innerParts.deleteInnerPart', { id });
  }

  // Stuck Points
  async updateStuckPoint(userId: string, index: number, content: string) {
    return this.request('memory.updateStuckPoint', { userId, index, content });
  }

  async deleteStuckPoint(userId: string, index: number) {
    return this.request('memory.deleteStuckPoint', { userId, index });
  }

  async addStuckPoint(userId: string, content: string) {
    return this.request('memory.addStuckPoint', { userId, content });
  }

  // Coping Tools
  async updateCopingTool(userId: string, index: number, content: string) {
    return this.request('memory.updateCopingTool', { userId, index, content });
  }

  async deleteCopingTool(userId: string, index: number) {
    return this.request('memory.deleteCopingTool', { userId, index });
  }

  async addCopingTool(userId: string, content: string) {
    return this.request('memory.addCopingTool', { userId, content });
  }

  // Shadow Themes
  async updateShadowTheme(userId: string, index: number, content: string) {
    return this.request('memory.updateShadowTheme', { userId, index, content });
  }

  async deleteShadowTheme(userId: string, index: number) {
    return this.request('memory.deleteShadowTheme', { userId, index });
  }

  async addShadowTheme(userId: string, content: string) {
    return this.request('memory.addShadowTheme', { userId, content });
  }

  // Pattern Loops
  async updatePatternLoop(userId: string, index: number, content: string) {
    return this.request('memory.updatePatternLoop', { userId, index, content });
  }

  async deletePatternLoop(userId: string, index: number) {
    return this.request('memory.deletePatternLoop', { userId, index });
  }

  async addPatternLoop(userId: string, content: string) {
    return this.request('memory.addPatternLoop', { userId, content });
  }

  // Relationships
  async getRelationships(userId: string) {
    return this.request('memory.getRelationships', { userId });
  }

  async createRelationship(data: {
    id: string;
    user_id: string;
    name: string;
    role: string;
    notes?: string | null;
    is_active?: boolean;
  }) {
    return this.request('memory.createRelationship', data);
  }

  async updateRelationship(id: string, name: string, role: string, notes?: string | null) {
    return this.request('memory.updateRelationship', { id, name, role, notes });
  }

  async deleteRelationship(id: string) {
    return this.request('memory.deleteRelationship', { id });
  }

  // Onboarding procedures
  async getOnboardingProgress(userId: string) {
    return this.request('onboarding.getOnboardingProgress', { user_id: userId });
  }

  async upsertOnboardingProgress(userId: string, updatedAt: string, onboardingData: any) {
    return this.request('onboarding.upsertOnboardingProgress', {
      user_id: userId,
      onboarding_data: onboardingData,
      updated_at: updatedAt
    });
  }

  async deleteOnboardingProgress(userId: string) {
    return this.request('onboarding.deleteOnboardingProgress', { user_id: userId });
  }

  // Value compass procedures
  async upsertValueCompass(userId: string, coreValues: string[], antiValues?: string[], narrative?: string) {
    return this.request('user.upsertValueCompass', {
      user_id: userId,
      core_values: coreValues,
      anti_values: antiValues || [],
      narrative: narrative || '',
      last_reflected_at: new Date().toISOString()
    });
  }

  // User preferences procedures
  async upsertUserPreferences(userId: string, preferences: {
    show_text_response?: boolean;
    play_audio_response?: boolean;
    preferred_therapist_name?: string;
    daily_reminder_time?: string | null;
    timezone?: string;
  }) {
    return this.request('user.upsertUserPreferences', {
      user_id: userId,
      ...preferences
    });
  }

  // Emotional trends procedures
  async createEmotionalTrend(userId: string, moodScore: number, emotionalStates: string[], suicidalThoughts?: string, notes?: string) {
    return this.request('user.createEmotionalTrend', {
      user_id: userId,
      mood_score: moodScore,
      emotional_states: emotionalStates,
      suicidal_thoughts: suicidalThoughts,
      notes: notes
    });
  }

  // Session continuity procedures
  async getSessionContinuity(userId: string, sessionGroupId: string) {
    return this.request('conversation.getSessionContinuity', {
      p_user_id: userId,
      p_session_group_id: sessionGroupId
    });
  }

  async upsertSessionContinuity(userId: string, sessionGroupId: string, messageCount: number, sessionPhase: string, therapeuticFocus: string, emotionalState: string, isResuming: boolean) {
    return this.request('conversation.upsertSessionContinuity', {
      p_user_id: userId,
      p_session_group_id: sessionGroupId,
      p_last_message_count: messageCount,
      p_last_session_phase: sessionPhase,
      p_last_therapeutic_focus: therapeuticFocus,
      p_last_emotional_state: emotionalState,
      p_is_resuming: isResuming
    });
  }

  async endSessionContinuity(userId: string, sessionGroupId: string) {
    return this.request('conversation.endSessionContinuity', {
      p_user_id: userId,
      p_session_group_id: sessionGroupId
    });
  }

  async getUserActiveSessions(userId: string) {
    return this.request('conversation.getUserActiveSessions', {
      p_user_id: userId
    });
  }

  async cleanupStaleSessionContinuity() {
    return this.request('conversation.cleanupStaleSessionContinuity', {});
  }

  // Session management procedures
  async createSession(userId: string, sessionGroupId?: string, title?: string, initialMessage?: string, metadata?: any) {
    return this.request('conversation.createSession', {
      user_id: userId,
      session_group_id: sessionGroupId,
      title,
      initial_message: initialMessage,
      metadata
    });
  }

  async getSessions(userId: string, limit?: number) {
    return this.request('conversation.getSessions', {
      user_id: userId,
      limit
    });
  }

  async getSession(sessionId: string) {
    return this.request('conversation.getSession', {
      session_id: sessionId
    });
  }

  async updateSession(sessionId: string, updates: any) {
    return this.request('conversation.updateSession', {
      session_id: sessionId,
      updates
    });
  }

  async deleteSession(sessionId: string) {
    return this.request('conversation.deleteSession', {
      session_id: sessionId
    });
  }

  // Session groups procedures
  async createSessionGroup(userId: string, title?: string, description?: string, metadata?: any) {
    return this.request('conversation.createSessionGroup', {
      user_id: userId,
      title,
      description,
      metadata
    });
  }

  async getConversations(userId: string) {
    return this.request('conversation.getConversations', {
      user_id: userId
    });
  }

  async getConversation(conversationId: string) {
    return this.request('conversation.getConversation', {
      conversation_id: conversationId
    });
  }

  async getConversationMessages(conversationId: string) {
    return this.request('conversation.getConversationMessages', {
      conversation_id: conversationId
    });
  }

  async createConversationMessage(userId: string, conversationId?: string, title?: string, initialMessage?: string, metadata?: any) {
    return this.request('conversation.createConversationMessage', {
      user_id: userId,
      conversation_id: conversationId,
      title,
      initial_message: initialMessage,
      metadata
    });
  }

  async getConversationMessage(messageId: string) {
    return this.request('conversation.getConversationMessage', {
      message_id: messageId
    });
  }

  async updateConversationMessage(messageId: string, updates: any) {
    return this.request('conversation.updateConversationMessage', {
      message_id: messageId,
      updates
    });
  }

  async deleteConversationMessage(messageId: string) {
    return this.request('conversation.deleteConversationMessage', {
      message_id: messageId
    });
  }

  async updateConversation(conversationId: string, updates: any) {
    return this.request('conversation.updateConversation', {
      conversation_id: conversationId,
      updates
    });
  }

  // Session analytics
  async getSessionAnalytics(userId: string) {
    return this.request('conversation.getSessionAnalytics', {
      user_id: userId
    });
  }

  // Data cleanup procedures
  async deleteUserData(userId: string) {
    return this.request('user.deleteUserData', { user_id: userId });
  }

  // Feedback procedures
  async getFeedback(userId: string, limit?: number) {
    return this.request('feedback.getFeedback', { user_id: userId, limit });
  }

  async createFeedback(userId: string, rating: number, feedbackText?: string, sessionId?: string, feedbackType?: string) {
    return this.request('feedback.createFeedback', {
      user_id: userId,
      session_id: sessionId,
      rating,
      feedback_text: feedbackText,
      feedback_type: feedbackType
    });
  }

  // Crisis flags procedures
  async getCrisisFlags(userId: string) {
    return this.request('feedback.getCrisisFlags', { user_id: userId });
  }

  // Core response procedure
  async respond(input: any) {
    return this.request('respond', input);
  }

  // Health check
  async health() {
    return this.request('health', {});
  }
}

export const trpcClient = new TRPCClient(); 