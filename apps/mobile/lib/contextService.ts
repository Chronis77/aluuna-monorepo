import userContextData from '../data/userContext.json';

export interface UserProfile {
  name: string;
  age?: number;
  themes: string[];
  people: string[];
  coping_tools: string[];
  emotional_trends: Record<string, number>;
  recent_insights: string[];
  ongoing_goals: string[];
  triggers: string[];
  strengths: string[];
  preferences: {
    communication_style: string;
    session_length: string;
    focus_areas: string[];
  };
}

export interface SessionContext {
  userProfile?: UserProfile;
  sessionHistory?: any[];
  currentContext?: any;
  isFirstSession?: boolean;
  focus?: string;
}

export class ContextService {
  // Get default context from JSON file
  static getDefaultContext() {
    return userContextData.defaultContext;
  }

  // Get user profile template
  static getUserProfileTemplate(): UserProfile {
    const template = userContextData.userProfiles.template;
    return {
      ...template,
      age: template.age || undefined
    };
  }

  // Get session templates
  static getSessionTemplates() {
    return userContextData.sessionTemplates;
  }

  // Get prompts for different session types
  static getPrompts() {
    return userContextData.prompts;
  }

  // Generate session title based on date
  static generateSessionTitle(date: Date = new Date()): string {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today's Session";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday's Session";
    } else {
      // Format as "26 July" style
      const day = date.getDate();
      const month = date.toLocaleDateString('en-US', { month: 'long' });
      return `${day} ${month}`;
    }
  }

  // Build context for OpenAI based on user profile and session history
  static buildSessionContext(
    userProfile?: UserProfile,
    sessionHistory?: any[],
    currentContext?: any
  ): SessionContext {
    return {
      userProfile,
      sessionHistory,
      currentContext,
      ...this.getDefaultContext()
    };
  }

  // Get appropriate greeting based on session type and user profile
  static getSessionGreeting(sessionContext: SessionContext): string {
    const { userProfile, isFirstSession } = sessionContext;
    
    if (isFirstSession) {
      return "Hello! I'm Aluuna, your therapeutic AI companion. I'm here to provide a safe space for you to explore your thoughts and feelings. How are you feeling today?";
    }

    if (userProfile?.name) {
      return `Welcome back, ${userProfile.name}! How are you feeling today?`;
    }

    return "Hello! How are you feeling today?";
  }

  // Update user profile with new information
  static updateUserProfile(
    currentProfile: UserProfile,
    updates: Partial<UserProfile>
  ): UserProfile {
    return {
      ...currentProfile,
      ...updates
    };
  }

  // Extract themes from conversation
  static extractThemesFromConversation(messages: string[]): string[] {
    const commonThemes = [
      'anxiety', 'depression', 'stress', 'relationships', 'work', 'family',
      'grief', 'trauma', 'self-esteem', 'boundaries', 'communication',
      'anger', 'fear', 'loneliness', 'change', 'growth', 'healing'
    ];

    const conversationText = messages.join(' ').toLowerCase();
    const foundThemes = commonThemes.filter(theme => 
      conversationText.includes(theme)
    );

    return foundThemes;
  }

  // Build context JSON for session group
  static buildContextJson(
    userProfile?: UserProfile,
    sessionHistory?: any[],
    currentContext?: any
  ): any {
    return {
      userProfile,
      sessionHistory: sessionHistory?.slice(-10), // Keep last 10 messages for context
      currentContext,
      defaultContext: this.getDefaultContext(),
      timestamp: new Date().toISOString()
    };
  }
} 