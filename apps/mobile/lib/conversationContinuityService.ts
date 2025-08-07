import { trpcClient } from './trpcClient';

export interface SessionContinuityData {
  id: string;
  user_id: string;
  session_group_id: string;
  last_message_count: number;
  last_session_phase: string;
  last_therapeutic_focus: string | null;
  last_emotional_state: string | null;
  last_timestamp: string;
  session_duration_minutes: number;
  is_resuming: boolean;
  continuity_context: string | null;
  time_since_last_message_minutes: number;
}

export interface SessionResumeContext {
  isResuming: boolean;
  timeSinceLastMessage: number;
  sessionPhase: string;
  therapeuticFocus: string;
  emotionalState: string;
  continuityGuidance: string;
  sessionProgress: string;
}

export class ConversationContinuityService {
  // Get session continuity for a user and session group
  static async getSessionContinuity(
    userId: string, 
    sessionGroupId: string
  ): Promise<SessionContinuityData | null> {
    try {
      const data = await trpcClient.getSessionContinuity(userId, sessionGroupId);
      return data && data.length > 0 ? data[0] : null;
    } catch (error) {
      console.error('Error getting session continuity:', error);
      return null;
    }
  }

  // Upsert session continuity (insert or update)
  static async upsertSessionContinuity(
    userId: string,
    sessionGroupId: string,
    messageCount: number,
    sessionPhase: string,
    therapeuticFocus: string,
    emotionalState: string,
    isResuming: boolean = false
  ): Promise<string | null> {
    try {
      console.log('🔍 SessionContinuityService.upsertSessionContinuity called with:', {
        userId,
        sessionGroupId,
        messageCount,
        sessionPhase,
        therapeuticFocus,
        emotionalState,
        isResuming
      });
      
      const data = await trpcClient.upsertSessionContinuity(
        userId,
        sessionGroupId,
        messageCount,
        sessionPhase,
        therapeuticFocus,
        emotionalState,
        isResuming
      );
      
      console.log('🔍 SessionContinuityService.upsertSessionContinuity success:', data);
      return data;
    } catch (error) {
      console.error('Error upserting session continuity:', error);
      return null;
    }
  }

  // End a session (delete continuity record)
  static async endSession(userId: string, sessionGroupId: string): Promise<boolean> {
    try {
      const data = await trpcClient.endSessionContinuity(userId, sessionGroupId);
      return data;
    } catch (error) {
      console.error('Error ending session continuity:', error);
      return false;
    }
  }

  // Get all active sessions for a user
  static async getUserActiveSessions(userId: string): Promise<any[]> {
    try {
      const data = await trpcClient.getUserActiveSessions(userId);
      return data || [];
    } catch (error) {
      console.error('Error getting user active sessions:', error);
      return [];
    }
  }

  // Clean up stale sessions (older than 24 hours)
  static async cleanupStaleSessions(): Promise<number> {
    try {
      const data = await trpcClient.cleanupStaleSessionContinuity();
      return data || 0;
    } catch (error) {
      console.error('Error cleaning up stale sessions:', error);
      return 0;
    }
  }

  // Check if user is resuming a session and provide context
  static async checkSessionResume(
    userId: string, 
    sessionGroupId: string
  ): Promise<SessionResumeContext> {
    const continuity = await this.getSessionContinuity(userId, sessionGroupId);
    
    if (!continuity) {
      // New session
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

    const timeSinceLastMessage = continuity.time_since_last_message_minutes;
    const isResuming = timeSinceLastMessage > 5; // Consider resuming if more than 5 minutes have passed
    
    let continuityGuidance = '';
    let sessionProgress = '';

    if (isResuming) {
      continuityGuidance = this.buildResumeGuidance(continuity, timeSinceLastMessage);
      sessionProgress = this.buildResumeProgress(continuity, timeSinceLastMessage);
    } else {
      // Continuing same session
      continuityGuidance = this.buildContinuationGuidance(continuity);
      sessionProgress = this.buildContinuationProgress(continuity);
    }

    return {
      isResuming,
      timeSinceLastMessage,
      sessionPhase: continuity.last_session_phase,
      therapeuticFocus: continuity.last_therapeutic_focus || 'general',
      emotionalState: continuity.last_emotional_state || 'neutral',
      continuityGuidance,
      sessionProgress
    };
  }

  // Build guidance for resuming a session
  private static buildResumeGuidance(continuity: SessionContinuityData, timeSinceLastMessage: number): string {
    const timeDescription = this.getTimeDescription(timeSinceLastMessage);
    
    let guidance = `User is resuming session after ${timeDescription}. `;
    
    switch (continuity.last_session_phase) {
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
  private static buildContinuationGuidance(continuity: SessionContinuityData): string {
    return `Continuing session naturally. User is in ${continuity.last_session_phase} phase with focus on ${continuity.last_therapeutic_focus || 'general'}.`;
  }

  // Build progress description for resuming
  private static buildResumeProgress(continuity: SessionContinuityData, timeSinceLastMessage: number): string {
    const timeDescription = this.getTimeDescription(timeSinceLastMessage);
    return `Resuming ${continuity.last_session_phase} session after ${timeDescription} (Message ${continuity.last_message_count + 1})`;
  }

  // Build progress description for continuing
  private static buildContinuationProgress(continuity: SessionContinuityData): string {
    return `Continuing ${continuity.last_session_phase} session (Message ${continuity.last_message_count + 1})`;
  }

  // Get human-readable time description
  private static getTimeDescription(minutes: number): string {
    if (minutes < 1) return 'a brief moment';
    if (minutes < 60) return `${Math.round(minutes)} minutes`;
    if (minutes < 1440) return `${Math.round(minutes / 60)} hours`;
    return `${Math.round(minutes / 1440)} days`;
  }

  // Track session progress (convenience method)
  static async trackSessionProgress(
    userId: string,
    sessionGroupId: string,
    messageCount: number,
    sessionPhase: string,
    therapeuticFocus: string,
    emotionalState: string
  ): Promise<void> {
    console.log('🔍 SessionContinuityService.trackSessionProgress called with:', {
      userId,
      sessionGroupId,
      messageCount,
      sessionPhase,
      therapeuticFocus,
      emotionalState
    });
    
    const result = await this.upsertSessionContinuity(
      userId,
      sessionGroupId,
      messageCount,
      sessionPhase,
      therapeuticFocus,
      emotionalState,
      false
    );
    
    console.log('🔍 SessionContinuityService.upsertSessionContinuity result:', result);
  }

  // Initialize a new session (creates initial continuity record)
  static async initializeSession(
    userId: string,
    sessionGroupId: string
  ): Promise<void> {
    await this.upsertSessionContinuity(
      userId,
      sessionGroupId,
      0, // No messages yet
      'start',
      'rapport building',
      'neutral',
      false
    );
  }

  // Update session phase
  static async updateSessionPhase(
    userId: string,
    sessionGroupId: string,
    newPhase: string
  ): Promise<void> {
    const continuity = await this.getSessionContinuity(userId, sessionGroupId);
    if (continuity) {
      await this.upsertSessionContinuity(
        userId,
        sessionGroupId,
        continuity.last_message_count,
        newPhase,
        continuity.last_therapeutic_focus || '',
        continuity.last_emotional_state || '',
        continuity.is_resuming
      );
    }
  }
} 