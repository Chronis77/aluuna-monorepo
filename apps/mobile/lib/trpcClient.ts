import { config } from './config';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

class TRPCClient {
  private baseUrl: string;
  private apiKey: string;
  
  private sanitizeForLogging(input: any) {
    const MAX_INLINE = 200;
    const redactKeys = ['audio_base64', 'file', 'blob', 'binary', 'data'];
    const seen = new WeakSet();
    const replacer = (key: string, value: any) => {
      if (value && typeof value === 'object') {
        if (seen.has(value)) return undefined;
        seen.add(value);
      }
      if (typeof value === 'string') {
        const lowerKey = key.toLowerCase();
        if (redactKeys.some(k => lowerKey.includes(k)) || value.length > MAX_INLINE) {
          return `<redacted:${value.length} chars>`;
        }
      }
      return value;
    };
    try {
      return JSON.parse(JSON.stringify(input, replacer));
    } catch {
      return '<redacted>';
    }
  }

  constructor() {
    this.baseUrl = config.server.url;
    this.apiKey = config.server.apiKey;
    console.log(`🔧 tRPC Client initialized with URL: ${this.baseUrl}`);
    console.log(`🔑 API Key configured: ${this.apiKey ? 'Yes' : 'No'}`);
  }

  private getTimeoutMsForProcedure(procedure: string): number {
    if (procedure === 'voice.transcribeFromUrl') return 120_000; // 120s for long transcriptions
    if (procedure === 'voice.transcribeQuick') return 45_000;    // 45s for short clips
    if (procedure === 'voice.createJob') return 15_000;
    if (procedure === 'voice.getJobStatus') return 10_000;
    return 10_000; // default
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
      console.log(`📤 Request input:`, this.sanitizeForLogging(input));
      console.log(`🔑 Using API key: ${this.apiKey ? 'Configured' : 'Missing'}`);
      
      // Get JWT token from AsyncStorage
      const token = await AsyncStorage.getItem('authToken');
      console.log(`🔐 JWT token available: ${token ? 'Yes' : 'No'}`);
      if (token) {
        console.log(`🔐 JWT token length: ${token.length}`);
        console.log(`🔐 JWT token preview: ${token.substring(0, 20)}...`);
      }
      
      // Create AbortController for timeout (longer for voice procedures)
      const controller = new AbortController();
      const timeoutMs = this.getTimeoutMsForProcedure(procedure);
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      
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

  // Individual memory item procedures
  async addTheme(data: {
    user_id: string;
    theme_name: string;
    theme_category?: string;
    importance_level?: number;
  }) {
    return this.request('memory.addTheme', {
      userId: data.user_id,
      themeName: data.theme_name,
      themeCategory: data.theme_category,
      importanceLevel: data.importance_level
    });
  }

  async addGoal(data: {
    user_id: string;
    goal_title: string;
    goal_description?: string;
    goal_category?: string;
    priority_level?: number;
  }) {
    return this.request('memory.addGoal', {
      userId: data.user_id,
      goalTitle: data.goal_title,
      goalDescription: data.goal_description,
      goalCategory: data.goal_category,
      priorityLevel: data.priority_level
    });
  }

  async addCopingTool(data: {
    user_id: string;
    tool_name: string;
    tool_category?: string;
    effectiveness_rating?: number;
    description?: string;
    when_to_use?: string;
  }) {
    return this.request('memory.addCopingTool', {
      userId: data.user_id,
      toolName: data.tool_name,
      toolCategory: data.tool_category,
      effectivenessRating: data.effectiveness_rating,
      description: data.description,
      whenToUse: data.when_to_use
    });
  }

  async addStrength(data: {
    user_id: string;
    strength_name: string;
    strength_category?: string;
    confidence_level?: number;
    how_developed?: string;
    how_utilized?: string;
  }) {
    return this.request('memory.addStrength', {
      userId: data.user_id,
      strengthName: data.strength_name,
      strengthCategory: data.strength_category,
      confidenceLevel: data.confidence_level,
      howDeveloped: data.how_developed,
      howUtilized: data.how_utilized
    });
  }

  // New methods for comprehensive onboarding data storage
  async addRelationshipStatus(data: {
    user_id: string;
    current_status: string;
    partner_name?: string;
    relationship_duration?: string;
    satisfaction_level?: number;
    challenges?: string[];
    strengths?: string[];
  }) {
    return this.request('memory.addRelationshipStatus', {
      userId: data.user_id,
      currentStatus: data.current_status,
      partnerName: data.partner_name,
      relationshipDuration: data.relationship_duration,
      satisfactionLevel: data.satisfaction_level,
      challenges: data.challenges,
      strengths: data.strengths
    });
  }

  async addLivingSituation(data: {
    user_id: string;
    living_arrangement: string;
    location?: string;
    housemates?: string[];
    financial_stability?: string;
    housing_satisfaction?: number;
  }) {
    return this.request('memory.addLivingSituation', {
      userId: data.user_id,
      livingArrangement: data.living_arrangement,
      location: data.location,
      housemates: data.housemates,
      financialStability: data.financial_stability,
      housingSatisfaction: data.housing_satisfaction
    });
  }

  async addSupportSystem(data: {
    user_id: string;
    person_name: string;
    relationship_type?: string;
    support_type?: string[];
    reliability_level?: number;
    contact_info?: string;
  }) {
    return this.request('memory.addSupportSystem', {
      userId: data.user_id,
      personName: data.person_name,
      relationshipType: data.relationship_type,
      supportType: data.support_type,
      reliabilityLevel: data.reliability_level,
      contactInfo: data.contact_info
    });
  }

  async addCurrentStressor(data: {
    user_id: string;
    stressor_name: string;
    stressor_type?: string;
    impact_level?: number;
    duration?: string;
    coping_strategies?: string[];
  }) {
    return this.request('memory.addCurrentStressor', {
      userId: data.user_id,
      stressorName: data.stressor_name,
      stressorType: data.stressor_type,
      impactLevel: data.impact_level,
      duration: data.duration,
      copingStrategies: data.coping_strategies
    });
  }

  async addDailyHabit(data: {
    user_id: string;
    habit_name: string;
    habit_category?: string;
    frequency?: string;
    consistency_level?: number;
    impact_on_wellbeing?: string;
  }) {
    return this.request('memory.addDailyHabit', {
      userId: data.user_id,
      habitName: data.habit_name,
      habitCategory: data.habit_category,
      frequency: data.frequency,
      consistencyLevel: data.consistency_level,
      impactOnWellbeing: data.impact_on_wellbeing
    });
  }

  async addSubstanceUse(data: {
    user_id: string;
    substance_name: string;
    usage_pattern?: string;
    frequency?: string;
    impact_level?: number;
    triggers?: string[];
    harm_reduction_strategies?: string[];
  }) {
    return this.request('memory.addSubstanceUse', {
      userId: data.user_id,
      substanceName: data.substance_name,
      usagePattern: data.usage_pattern,
      frequency: data.frequency,
      impactLevel: data.impact_level,
      triggers: data.triggers,
      harmReductionStrategies: data.harm_reduction_strategies
    });
  }

  async addSleepRoutine(data: {
    user_id: string;
    bedtime?: string;
    wake_time?: string;
    sleep_duration_hours?: number;
    sleep_quality_rating?: number;
    sleep_hygiene_practices?: string[];
    sleep_issues?: string[];
  }) {
    return this.request('memory.addSleepRoutine', {
      userId: data.user_id,
      bedtime: data.bedtime,
      wakeTime: data.wake_time,
      sleepDurationHours: data.sleep_duration_hours,
      sleepQualityRating: data.sleep_quality_rating,
      sleepHygienePractices: data.sleep_hygiene_practices,
      sleepIssues: data.sleep_issues
    });
  }

  async addPreviousTherapy(data: {
    user_id: string;
    therapy_type: string;
    therapist_name?: string;
    duration?: string;
    effectiveness_rating?: number;
    key_insights?: string;
    termination_reason?: string;
  }) {
    return this.request('memory.addPreviousTherapy', {
      userId: data.user_id,
      therapyType: data.therapy_type,
      therapistName: data.therapist_name,
      duration: data.duration,
      effectivenessRating: data.effectiveness_rating,
      keyInsights: data.key_insights,
      terminationReason: data.termination_reason
    });
  }

  async addTherapyPreferences(data: {
    user_id: string;
    preferred_therapy_styles?: string[];
    preferred_tone?: string;
    communication_style?: string;
    feedback_frequency?: string;
    session_length_preference?: number;
  }) {
    return this.request('memory.addTherapyPreferences', {
      userId: data.user_id,
      preferredTherapyStyles: data.preferred_therapy_styles,
      preferredTone: data.preferred_tone,
      communicationStyle: data.communication_style,
      feedbackFrequency: data.feedback_frequency,
      sessionLengthPreference: data.session_length_preference
    });
  }

  async addProfileSummary(data: {
    user_id: string;
    spiritual_connection_level?: number;
    personal_agency_level?: number;
    boundaries_awareness?: number;
    self_development_capacity?: number;
    hard_truths_tolerance?: number;
    awareness_level?: number;
    suicidal_risk_level?: number; // 0-4: Never=0, Rarely=1, Sometimes=2, Often=3, Currently=4
    sleep_quality?: string;
    mood_score_initial?: number;
    biggest_challenge?: string;
    biggest_obstacle?: string;
    motivation_for_joining?: string;
    hopes_to_achieve?: string;
  }) {
    return this.request('memory.addProfileSummary', {
      userId: data.user_id,
      spiritualConnectionLevel: data.spiritual_connection_level,
      personalAgencyLevel: data.personal_agency_level,
      boundariesAwareness: data.boundaries_awareness,
      selfDevelopmentCapacity: data.self_development_capacity,
      hardTruthsTolerance: data.hard_truths_tolerance,
      awarenessLevel: data.awareness_level,
      suicidalRiskLevel: data.suicidal_risk_level,
      sleepQuality: data.sleep_quality,
      moodScoreInitial: data.mood_score_initial,
      biggestChallenge: data.biggest_challenge,
      biggestObstacle: data.biggest_obstacle,
      motivationForJoining: data.motivation_for_joining,
      hopesToAchieve: data.hopes_to_achieve
    });
  }

  async addEmotionalState(data: {
    user_id: string;
    state_name: string;
    state_description?: string;
    physical_sensations?: string[];
    thoughts_patterns?: string[];
    behaviors?: string[];
    intensity_level?: number;
  }) {
    return this.request('memory.addEmotionalState', {
      userId: data.user_id,
      stateName: data.state_name,
      stateDescription: data.state_description,
      physicalSensations: data.physical_sensations,
      thoughtsPatterns: data.thoughts_patterns,
      behaviors: data.behaviors,
      intensityLevel: data.intensity_level
    });
  }

  async addSuicidalThought(data: {
    user_id: string;
    thought_date: string;
    thought_content?: string;
    intensity_level?: number;
    risk_level?: number;
    protective_factors?: string[];
    safety_plan_activated?: boolean;
    professional_help_sought?: boolean;
  }) {
    return this.request('memory.addSuicidalThought', {
      userId: data.user_id,
      thoughtDate: data.thought_date,
      thoughtContent: data.thought_content,
      intensityLevel: data.intensity_level,
      riskLevel: data.risk_level,
      protectiveFactors: data.protective_factors,
      safetyPlanActivated: data.safety_plan_activated,
      professionalHelpSought: data.professional_help_sought
    });
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

  async checkOnboardingStatus(userId: string) {
    return this.request('onboarding.checkOnboardingStatus', { user_id: userId });
  }

  async markOnboardingSkipped(userId: string) {
    return this.request('onboarding.markOnboardingSkipped', { user_id: userId });
  }

  async markOnboardingCompleted(userId: string, completedAt?: string) {
    return this.request('onboarding.markOnboardingCompleted', { user_id: userId, completed_at: completedAt });
  }

  async finalizeOnboarding(userId: string, onboardingData: any) {
    return this.request('onboarding.finalizeOnboarding', {
      user_id: userId,
      onboarding_data: onboardingData,
    });
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

  async createFeedbackAnalyzed(userId: string, feedbackText: string, sessionId?: string, deviceInfo?: any, appVersion?: string) {
    return this.request('feedback.createFeedbackAnalyzed', {
      user_id: userId,
      feedback_text: feedbackText,
      session_id: sessionId,
      device_info: deviceInfo,
      app_version: appVersion,
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

  // Voice procedures
  async voiceTranscribeQuick(userId: string, audioBase64: string, mimeType?: string, model?: string) {
    return this.request('voice.transcribeQuick', {
      user_id: userId,
      audio_base64: audioBase64,
      mime_type: mimeType,
      model,
    });
  }

  async voiceGetPresignedUpload(userId: string, fileName?: string, contentType?: string, maxMb?: number) {
    return this.request('voice.getPresignedUpload', {
      user_id: userId,
      file_name: fileName,
      content_type: contentType,
      max_mb: maxMb,
    });
  }

  async voiceCreateJob(userId: string, audioUrl: string, options?: { language?: string; model?: string; conversation_id?: string }) {
    return this.request('voice.createJob', {
      user_id: userId,
      audio_url: audioUrl,
      language: options?.language,
      model: options?.model,
      conversation_id: options?.conversation_id,
    });
  }

  async voiceGetJobStatus(jobId: string) {
    return this.request('voice.getJobStatus', { job_id: jobId });
  }

  async voiceTranscribeFromUrl(userId: string, audioUrl: string, mimeType?: string, model?: string) {
    return this.request('voice.transcribeFromUrl', {
      user_id: userId,
      audio_url: audioUrl,
      mime_type: mimeType,
      model,
    });
  }
}

export const trpcClient = new TRPCClient(); 