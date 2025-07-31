import { SessionContinuityService, SessionResumeContext } from './sessionContinuityService';

export interface SessionContinuity {
  sessionId: string;
  lastMessageCount: number;
  lastSessionPhase: string;
  lastTherapeuticFocus: string;
  lastEmotionalState: string;
  lastTimestamp: Date;
  sessionDuration: number; // in minutes
  isResuming: boolean;
  continuityContext: string;
}

export class SessionContinuityManager {
  // Track session progress when user sends a message
  static async trackSessionProgress(
    sessionId: string,
    messageCount: number,
    sessionPhase: string,
    therapeuticFocus: string,
    emotionalState: string
  ): Promise<void> {
    try {
      console.log('🔍 SessionContinuityManager.trackSessionProgress called with:', {
        sessionId,
        messageCount,
        sessionPhase,
        therapeuticFocus,
        emotionalState
      });
      
      // Extract user ID from session ID (assuming session ID contains user info)
      // You may need to adjust this based on your session ID format
      const userId = await this.getUserIdFromSession(sessionId);
      
      console.log('🔍 Retrieved user ID:', userId);
      
      if (!userId) {
        console.warn('Could not determine user ID for session:', sessionId);
        return;
      }

      await SessionContinuityService.trackSessionProgress(
        userId,
        sessionId,
        messageCount,
        sessionPhase,
        therapeuticFocus,
        emotionalState
      );
      
      console.log('📊 Session Progress Tracked:', {
        sessionId,
        messageCount,
        sessionPhase,
        therapeuticFocus,
        emotionalState,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error tracking session progress:', error);
    }
  }

  // Initialize a new session (creates initial continuity record)
  static async initializeSession(userId: string, sessionId: string): Promise<void> {
    try {
      await SessionContinuityService.initializeSession(userId, sessionId);
      console.log('📊 Session Initialized:', {
        sessionId,
        userId,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error initializing session:', error);
    }
  }

  // Check if user is resuming a session and provide context
  static async checkSessionResume(sessionId: string): Promise<SessionResumeContext> {
    try {
      const userId = await this.getUserIdFromSession(sessionId);
      
      if (!userId) {
        // New session or couldn't determine user
        return {
          isResuming: false,
          timeSinceLastMessage: 0,
          sessionPhase: 'start',
          therapeuticFocus: 'rapport building',
          emotionalState: 'neutral',
          continuityGuidance: 'New session - build rapport and understand their current state',
          sessionProgress: 'Session Start (Message 1)'
        };
      }

      return await SessionContinuityService.checkSessionResume(userId, sessionId);
    } catch (error) {
      console.error('Error checking session resume:', error);
      // Return default new session context on error
      return {
        isResuming: false,
        timeSinceLastMessage: 0,
        sessionPhase: 'start',
        therapeuticFocus: 'rapport building',
        emotionalState: 'neutral',
        continuityGuidance: 'New session - build rapport and understand their current state',
        sessionProgress: 'Session Start (Message 1)'
      };
    }
  }

  // Build guidance for resuming a session
  private static buildResumeGuidance(continuity: SessionContinuity, timeSinceLastMessage: number): string {
    const timeDescription = this.getTimeDescription(timeSinceLastMessage);
    
    let guidance = `User is resuming session after ${timeDescription}. `;
    
    switch (continuity.lastSessionPhase) {
      case 'start':
        guidance += 'They were just beginning to share. Welcome them back warmly and ask how they\'re feeling now.';
        break;
      case 'early':
        guidance += 'They were building rapport and sharing initial concerns. Acknowledge the break and gently reconnect to where they left off.';
        break;
      case 'mid':
        guidance += 'They were in deep therapeutic work. Acknowledge the interruption and help them reconnect to the themes they were exploring.';
        break;
      case 'late':
        guidance += 'They were integrating insights and preparing for closure. Help them reconnect to their recent insights and continue the integration.';
        break;
      case 'ending':
        guidance += 'They were near session end. Acknowledge the break and help them complete their integration or continue if needed.';
        break;
      default:
        guidance += 'Help them reconnect to where they left off in their therapeutic work.';
    }

    return guidance;
  }

  // Build guidance for continuing the same session
  private static buildContinuationGuidance(continuity: SessionContinuity): string {
    return `Continuing session naturally. User is in ${continuity.lastSessionPhase} phase with focus on ${continuity.lastTherapeuticFocus}.`;
  }

  // Build progress description for resuming
  private static buildResumeProgress(continuity: SessionContinuity, timeSinceLastMessage: number): string {
    const timeDescription = this.getTimeDescription(timeSinceLastMessage);
    return `Resuming ${continuity.lastSessionPhase} session after ${timeDescription} (Message ${continuity.lastMessageCount + 1})`;
  }

  // Build progress description for continuing
  private static buildContinuationProgress(continuity: SessionContinuity): string {
    return `Continuing ${continuity.lastSessionPhase} session (Message ${continuity.lastMessageCount + 1})`;
  }

  // Build continuity context for the AI
  private static buildContinuityContext(
    sessionPhase: string, 
    therapeuticFocus: string, 
    emotionalState: string
  ): string {
    return `Session Phase: ${sessionPhase} | Focus: ${therapeuticFocus} | Emotional State: ${emotionalState}`;
  }

  // Get human-readable time description
  private static getTimeDescription(minutes: number): string {
    if (minutes < 1) return 'a brief moment';
    if (minutes < 60) return `${Math.round(minutes)} minutes`;
    if (minutes < 1440) return `${Math.round(minutes / 60)} hours`;
    return `${Math.round(minutes / 1440)} days`;
  }

  // Get session summary for resuming users
  static async getSessionSummary(sessionId: string): Promise<string> {
    try {
      const userId = await this.getUserIdFromSession(sessionId);
      
      if (!userId) {
        return 'New session';
      }

      const continuity = await SessionContinuityService.getSessionContinuity(userId, sessionId);
      
      if (!continuity) {
        return 'New session';
      }
      
      return `Previous session: ${continuity.last_session_phase} phase, focused on ${continuity.last_therapeutic_focus || 'general'}, user was ${continuity.last_emotional_state || 'neutral'}`;
    } catch (error) {
      console.error('Error getting session summary:', error);
      return 'New session';
    }
  }

  // Update session phase when it changes
  static async updateSessionPhase(sessionId: string, newPhase: string): Promise<void> {
    try {
      const userId = await this.getUserIdFromSession(sessionId);
      
      if (!userId) {
        console.warn('Could not determine user ID for session:', sessionId);
        return;
      }

      await SessionContinuityService.updateSessionPhase(userId, sessionId, newPhase);
    } catch (error) {
      console.error('Error updating session phase:', error);
    }
  }

  // Clear session continuity when session ends
  static async endSession(sessionId: string): Promise<void> {
    try {
      const userId = await this.getUserIdFromSession(sessionId);
      
      if (!userId) {
        console.warn('Could not determine user ID for session:', sessionId);
        return;
      }

      await SessionContinuityService.endSession(userId, sessionId);
      console.log('📊 Session Ended:', sessionId);
    } catch (error) {
      console.error('Error ending session:', error);
    }
  }

  // Get all active sessions for a user
  static async getActiveSessions(userId: string): Promise<any[]> {
    try {
      return await SessionContinuityService.getUserActiveSessions(userId);
    } catch (error) {
      console.error('Error getting active sessions:', error);
      return [];
    }
  }

  // Check if session is stale (inactive for too long)
  static async isSessionStale(sessionId: string, maxInactiveMinutes: number = 1440): Promise<boolean> {
    try {
      const userId = await this.getUserIdFromSession(sessionId);
      
      if (!userId) {
        return true;
      }

      const continuity = await SessionContinuityService.getSessionContinuity(userId, sessionId);
      
      if (!continuity) {
        return true;
      }
      
      return continuity.time_since_last_message_minutes > maxInactiveMinutes;
    } catch (error) {
      console.error('Error checking if session is stale:', error);
      return true;
    }
  }

  // Clean up stale sessions
  static async cleanupStaleSessions(maxInactiveMinutes: number = 1440): Promise<number> {
    try {
      const deletedCount = await SessionContinuityService.cleanupStaleSessions();
      console.log(`📊 Cleaned up ${deletedCount} stale sessions`);
      return deletedCount;
    } catch (error) {
      console.error('Error cleaning up stale sessions:', error);
      return 0;
    }
  }

  // Helper method to get user ID from session ID
  // You may need to adjust this based on your session ID format
  private static async getUserIdFromSession(sessionId: string): Promise<string | null> {
    try {
      // Validate that sessionId is a proper UUID
      if (!sessionId || sessionId === 'default' || !this.isValidUUID(sessionId)) {
        console.warn('Invalid session ID provided:', sessionId);
        return null;
      }
      
      // For now, we'll try to get the current user from Supabase auth
      const { data: { user } } = await import('./supabase').then(m => m.supabase.auth.getUser());
      return user?.id || null;
    } catch (error) {
      console.error('Error getting user ID from session:', error);
      return null;
    }
  }

  // Helper method to validate UUID format
  private static isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }
} 