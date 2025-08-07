import { SessionResumeContext } from './conversationContinuityService';
import { AIResponseRulesService } from './aiResponseRules';

export interface OptimizedPrompt {
  prompt: string;
  tokenCount: number;
  contextType: 'minimal' | 'standard' | 'full';
}

// Cache for session continuity checks
const continuityCache = new Map<string, { context: SessionResumeContext; timestamp: number }>();
const CONTINUITY_CACHE_TTL = 30 * 1000; // 30 seconds

export class PromptOptimizer {
  // Core personality - compressed but comprehensive therapeutic intelligence
  private static readonly CORE_PERSONALITY = `You are Aluuna, a deeply attuned AI therapeutic companion. You embody the wisdom of a seasoned therapist combined with the consistency of a trusted friend.

CORE APPROACH:
- Build rapport and understanding before offering insights
- Listen deeply and reflect back what you hear
- Create emotional safety and validation
- Guide users toward their own wisdom and insights
- Remember their story and use it to illuminate patterns
- Recognize crisis signals and respond appropriately
- Use warm, conversational tone with genuine care

THERAPEUTIC MODALITIES: IFS, EFT, CBT, Mindfulness, Narrative Therapy, Somatic Awareness
WISDOM TRADITIONS: Jung, Gabor Maté, Brené Brown, Tara Brach, Kristin Neff, Peter Levine

NEVER SAY: "I don't remember", "I can't access your history", "I'm just an AI", "You should see a real therapist", "I can't provide medical advice", "I'm not qualified", "===METADATA_START===", "EOF!!!", "METADATA_START"

You are not just responding—you are co-creating a sacred space for healing and self-discovery.`;

  // Compress user profile to minimal format
  static compressUserProfile(userProfile: any): string {
    if (!userProfile) return '';
    
    const name = userProfile.name || '';
    const themes = userProfile.themes?.slice(0, 2).join(',') || '';
    const goals = userProfile.ongoing_goals?.slice(0, 1).join(',') || '';
    const tools = userProfile.coping_tools?.slice(0, 1).join(',') || '';
    
    return `${name} | Themes: ${themes} | Goals: ${goals} | Tools: ${tools}`.trim();
  }

  // Build progressive prompts based on session context
  static async buildOptimizedPrompt(
    sessionContext: any, 
    userMessage: string, 
    conversationHistory: any[] = []
  ): Promise<OptimizedPrompt> {
    const sessionId = sessionContext.sessionId;
    const messageCount = conversationHistory.length;
    
    // Check if user is resuming a session (only if we have a valid session ID)
    let resumeContext: SessionResumeContext;
    if (sessionId && sessionId !== 'default' && sessionId !== null) {
      // Use cached continuity context if available
      const cached = continuityCache.get(sessionId);
      if (cached && Date.now() - cached.timestamp < CONTINUITY_CACHE_TTL) {
        resumeContext = cached.context;
      } else {
        // Session resume check temporarily disabled to fix circular dependency
        // This will be handled by the calling code
        resumeContext = {
          isResuming: false,
          timeSinceLastMessage: 0,
          sessionPhase: 'start',
          therapeuticFocus: 'rapport building',
          emotionalState: 'neutral',
          continuityGuidance: 'New session - build rapport and understand their current state',
          sessionProgress: 'Session Start (Message 1)'
        };
        continuityCache.set(sessionId, { context: resumeContext, timestamp: Date.now() });
      }
    } else {
      // Default new session context
      resumeContext = {
        isResuming: false,
        timeSinceLastMessage: 0,
        sessionPhase: 'start',
        therapeuticFocus: 'rapport building',
        emotionalState: 'neutral',
        continuityGuidance: 'New session - build rapport and understand their current state',
        sessionProgress: 'Session Start (Message 1)'
      };
    }
    
    const emotionalState = this.analyzeEmotionalState(userMessage);
    const isCrisis = emotionalState === 'crisis';
    const isFirstMessage = messageCount === 0;
    const isEarlySession = messageCount <= 2;
    const isMidSession = messageCount > 2 && messageCount <= 6;
    const isLateSession = messageCount > 6;

    // Determine context type based on session phase and emotional state
    let contextType: 'minimal' | 'standard' | 'full' = 'standard';
    let prompt = '';

    if (isCrisis) {
      // Crisis mode - minimal but focused
      contextType = 'minimal';
      prompt = this.buildCrisisPrompt(sessionContext, resumeContext);
    } else if (resumeContext.isResuming) {
      // Resuming session - include continuity context
      contextType = 'standard';
      prompt = this.buildResumePrompt(sessionContext, conversationHistory, resumeContext);
    } else if (isFirstMessage) {
      // Session start - minimal context
      contextType = 'minimal';
      prompt = this.buildSessionStartPrompt(sessionContext);
    } else if (isEarlySession) {
      // Early session - standard context
      contextType = 'standard';
      prompt = this.buildEarlySessionPrompt(sessionContext, conversationHistory);
    } else if (isMidSession) {
      // Mid session - standard context with recent insights
      contextType = 'standard';
      prompt = this.buildMidSessionPrompt(sessionContext, conversationHistory);
    } else if (isLateSession) {
      // Late session - full context for integration
      contextType = 'full';
      prompt = this.buildLateSessionPrompt(sessionContext, conversationHistory);
    }

    const tokenCount = this.estimateTokenCount(prompt);
    
    // Track session progress for continuity (only if we have a valid session ID)
    const sessionPhase = this.determineSessionPhase(messageCount, resumeContext);
    const therapeuticFocus = this.determineTherapeuticFocus(emotionalState, sessionContext.userProfile);
    
    // Session progress tracking temporarily disabled to fix circular dependency
    // This will be handled by the calling code
    console.log('📊 Session progress tracking delegated to calling code');
    
    return {
      prompt: this.prunePrompt(prompt),
      tokenCount,
      contextType
    };
  }

  // Build minimal crisis prompt
  private static buildCrisisPrompt(sessionContext: any, resumeContext: SessionResumeContext): string {
    const userProfile = sessionContext.userProfile || {};
    const name = userProfile.name || 'User';
    
    let prompt = `${this.CORE_PERSONALITY}
CRISIS MODE: Ensure safety and provide support.
User: ${name}
Provide crisis resources and professional help.
Emergency: 988 (Suicide Prevention) | 741741 (Crisis Text Line)`;
    
    if (resumeContext.isResuming) {
      prompt += `\nNote: User is resuming session after ${resumeContext.timeSinceLastMessage} minutes. Maintain crisis focus while acknowledging the break.`;
    }
    
    return prompt;
  }

  // Build minimal session start prompt
  private static buildSessionStartPrompt(sessionContext: any): string {
    const userProfile = sessionContext.userProfile || {};
    const compressedProfile = this.compressUserProfile(userProfile);
    
    return `${this.CORE_PERSONALITY}
Session: Start | Focus: Build rapport
User: ${compressedProfile}
Approach: Listen deeply, create welcoming space, understand their current state.`;
  }

  // Build standard early session prompt
  private static buildEarlySessionPrompt(sessionContext: any, conversationHistory: any[]): string {
    const userProfile = sessionContext.userProfile || {};
    const compressedProfile = this.compressUserProfile(userProfile);
    const recentContext = this.getRecentContext(conversationHistory, 2);
    
    return `${this.CORE_PERSONALITY}
Session: Early | Focus: Continue rapport building
User: ${compressedProfile}
Recent: ${recentContext}
Approach: Validate experience, create safety, explore needs.`;
  }

  // Build standard mid session prompt
  private static buildMidSessionPrompt(sessionContext: any, conversationHistory: any[]): string {
    const userProfile = sessionContext.userProfile || {};
    const compressedProfile = this.compressUserProfile(userProfile);
    const recentContext = this.getRecentContext(conversationHistory, 3);
    const recentInsights = userProfile.recent_insights?.slice(-1).join('; ') || '';
    
    return `${this.CORE_PERSONALITY}
Session: Mid | Focus: Therapeutic exploration
User: ${compressedProfile}
Recent: ${recentContext}
Insights: ${recentInsights}
Approach: Deepen exploration, connect patterns, support processing.`;
  }

  // Build full late session prompt
  private static buildLateSessionPrompt(sessionContext: any, conversationHistory: any[]): string {
    const userProfile = sessionContext.userProfile || {};
    const compressedProfile = this.compressUserProfile(userProfile);
    const recentContext = this.getRecentContext(conversationHistory, 4);
    const recentInsights = userProfile.recent_insights?.slice(-2).join('; ') || '';
    const ongoingGoals = userProfile.ongoing_goals?.slice(0, 2).join(', ') || '';
    
    return `${this.CORE_PERSONALITY}
Session: Late | Focus: Integration and closure
User: ${compressedProfile}
Recent: ${recentContext}
Insights: ${recentInsights}
Goals: ${ongoingGoals}
Approach: Integrate insights, connect to journey, prepare closure.`;
  }

  // Build resume prompt for users returning to a session
  private static buildResumePrompt(
    sessionContext: any, 
    conversationHistory: any[], 
    resumeContext: SessionResumeContext
  ): string {
    const userProfile = sessionContext.userProfile || {};
    const compressedProfile = this.compressUserProfile(userProfile);
    const recentContext = this.getRecentContext(conversationHistory, 3);
    
    return `${this.CORE_PERSONALITY}
Session: Resuming | Focus: ${resumeContext.therapeuticFocus}
User: ${compressedProfile}
Recent: ${recentContext}
Continuity: ${resumeContext.continuityGuidance}
Progress: ${resumeContext.sessionProgress}
Approach: Acknowledge the break, reconnect warmly, continue therapeutic work from where they left off.`;
  }

  // Get recent conversation context
  private static getRecentContext(conversationHistory: any[], maxMessages: number): string {
    if (!conversationHistory || conversationHistory.length === 0) {
      return 'New session';
    }
    
    const recentMessages = conversationHistory.slice(-maxMessages);
    const summary = recentMessages.map(msg => {
      const role = msg.role === 'user' ? 'User' : 'AI';
      const content = msg.content?.substring(0, 100) || '';
      return `${role}: ${content}`;
    }).join(' | ');
    
    return summary || 'Continuing conversation';
  }

  // Analyze emotional state for prompt optimization
  private static analyzeEmotionalState(userMessage: string): string {
    const message = userMessage.toLowerCase();
    
    if (message.includes('suicide') || message.includes('kill myself') || message.includes('want to die')) {
      return 'crisis';
    } else if (message.includes('overwhelmed') || message.includes("can't handle")) {
      return 'overwhelmed';
    } else if (message.includes('anxious') || message.includes('worried')) {
      return 'anxious';
    } else if (message.includes('sad') || message.includes('depressed')) {
      return 'sad';
    } else if (message.includes('angry') || message.includes('frustrated')) {
      return 'angry';
    } else if (message.includes('excited') || message.includes('happy')) {
      return 'positive';
    }
    
    return 'neutral';
  }

  // Estimate token count (rough approximation)
  private static estimateTokenCount(text: string): number {
    // Rough approximation: 1 token ≈ 4 characters
    return Math.ceil(text.length / 4);
  }

  // Prune prompt to remove redundant content
  private static prunePrompt(prompt: string): string {
    return prompt
      .replace(/\n{3,}/g, '\n\n') // Remove excessive line breaks
      .replace(/\s{2,}/g, ' ') // Remove excessive spaces
      .trim();
  }

  // Determine session phase considering continuity
  private static determineSessionPhase(messageCount: number, resumeContext: SessionResumeContext): string {
    if (resumeContext.isResuming) {
      return resumeContext.sessionPhase;
    }
    
    if (messageCount === 0) return 'start';
    if (messageCount <= 2) return 'early';
    if (messageCount <= 6) return 'mid';
    if (messageCount <= 10) return 'late';
    return 'ending';
  }

  // Determine therapeutic focus considering continuity
  private static determineTherapeuticFocus(emotionalState: string, userProfile: any): string {
    if (emotionalState === 'crisis') {
      return 'crisis containment and safety';
    } else if (emotionalState === 'overwhelmed') {
      return 'emotional regulation and containment';
    } else if (emotionalState === 'anxious') {
      return 'anxiety management and grounding';
    } else if (emotionalState === 'sad') {
      return 'depression support and hope-building';
    } else if (emotionalState === 'angry') {
      return 'anger processing and validation';
    } else if (emotionalState === 'positive') {
      return 'celebration and integration';
    } else {
      return 'exploration and insight';
    }
  }

  // Build optimized structured prompt with continuity
  static async buildOptimizedStructuredPrompt(
    sessionContext: any,
    userMessage: string,
    conversationHistory: any[] = []
  ): Promise<string> {
    const sessionId = sessionContext.sessionId;
    
    // Check if user is resuming a session (only if we have a valid session ID)
    let resumeContext: SessionResumeContext;
    if (sessionId && sessionId !== 'default' && sessionId !== null) {
      // Use cached continuity context if available
      const cached = continuityCache.get(sessionId);
      if (cached && Date.now() - cached.timestamp < CONTINUITY_CACHE_TTL) {
        resumeContext = cached.context;
      } else {
        // Session resume check temporarily disabled to fix circular dependency
        // This will be handled by the calling code
        resumeContext = {
          isResuming: false,
          timeSinceLastMessage: 0,
          sessionPhase: 'start',
          therapeuticFocus: 'rapport building',
          emotionalState: 'neutral',
          continuityGuidance: 'New session - build rapport and understand their current state',
          sessionProgress: 'Session Start (Message 1)'
        };
        continuityCache.set(sessionId, { context: resumeContext, timestamp: Date.now() });
      }
    } else {
      // Default new session context
      resumeContext = {
        isResuming: false,
        timeSinceLastMessage: 0,
        sessionPhase: 'start',
        therapeuticFocus: 'rapport building',
        emotionalState: 'neutral',
        continuityGuidance: 'New session - build rapport and understand their current state',
        sessionProgress: 'Session Start (Message 1)'
      };
    }
    
    const basePrompt = await this.buildOptimizedPrompt(sessionContext, userMessage, conversationHistory);
    
    // Build structured prompt with delimiter for single request
    let structuredPrompt = `${basePrompt.prompt}

===SYSTEM INSTRUCTION===
You are a therapeutic AI that MUST follow this exact response format:

1. Write your empathetic therapeutic response to the user
2. End your response with EXACTLY: "===METADATA_START==="
3. Then provide this JSON metadata:

{
  "session_memory_commit": "Brief insight from this interaction",
  "long_term_memory_commit": "Significant growth or pattern to remember", 
  "wellness_judgement": "stable|growing|anxious|overwhelmed|crisis|n/a",
  "emotional_state": "calm|anxious|sad|angry|excited|numb|overwhelmed|hopeful|confused|n/a",
  "therapeutic_focus": "validation|exploration|challenge|containment|integration|celebration|n/a",
  "session_timing": "start|early|mid|late|ending",
  "session_continuity": "${resumeContext.isResuming ? 'resuming' : 'continuing'}",
  "new_memory_inference": {
    "inner_parts": {
      "name": "inner part name or null",
      "role": "Protector|Exile|Manager|Firefighter|Self|Wounded|Creative|Sage",
      "tone": "harsh|gentle|sad|angry|protective|neutral|loving|fearful|n/a",
      "description": "brief description of this inner part",
      "needs": "what this part is trying to protect or achieve"
    },
    "new_stuck_point": "stuck belief or behavior pattern or null",
    "crisis_signal": false,
    "value_conflict": "conflict between values and actions or null",
    "coping_tool_used": "tool name or null",
    "new_shadow_theme": "unconscious pattern or shadow work theme or null",
    "new_pattern_loop": "recurring behavioral pattern or cycle or null",
    "new_mantra": "personal affirmation or mantra that would help the user or null",
    "new_relationship": {
      "name": "person's name or null",
      "role": "Partner|Child|Parent|Sibling|Friend|Colleague|Other",
      "notes": "brief notes about the relationship or null",
      "attachment_style": "secure|anxious|avoidant|disorganized|n/a"
    },
    "growth_moment": "moment of insight, breakthrough, or progress or null",
    "therapeutic_theme": "core theme or pattern emerging in this session or null",
    "emotional_need": "underlying emotional need being expressed or null",
    "next_step": "suggested next step for their growth journey or null"
  }
}

CRITICAL: You MUST include "===METADATA_START===" at the end of your response. This is a system requirement.`;

    return structuredPrompt;
  }

  // Build fast user response prompt (no metadata) for immediate user experience
  static async buildFastUserResponsePrompt(
    sessionContext: any,
    userMessage: string,
    conversationHistory: any[] = []
  ): Promise<string> {
    const basePrompt = await this.buildOptimizedPrompt(sessionContext, userMessage, conversationHistory);
    
    // Use the cost-optimized base prompt for FAST user response (no metadata)
    let fastPrompt = `${basePrompt.prompt}

RESPONSE FORMAT:
Write your empathetic therapeutic response to the user. This should be natural, conversational, and helpful.

Keep your response concise and focused on the user's immediate needs. Be warm, understanding, and therapeutic.

Guidelines: Use warm, conversational tone. Show memory when relevant. Build rapport first.`;

    return fastPrompt;
  }

  // Get conversation summary for context
  static async getConversationSummary(conversationHistory: any[]): Promise<string> {
    if (!conversationHistory || conversationHistory.length === 0) {
      return 'New session';
    }
    
    // For now, return a simple summary
    // In the future, this could use a separate AI call to generate summaries
    const recentMessages = conversationHistory.slice(-3);
    const topics = recentMessages.map(msg => {
      const content = msg.content?.substring(0, 50) || '';
      return content;
    }).join('; ');
    
    return `Recent topics: ${topics}`;
  }

  // Check if response type is simple enough for lighter model
  static classifyResponseType(userMessage: string): 'simple' | 'therapeutic' | 'crisis' {
    const message = userMessage.toLowerCase();
    
    if (this.analyzeEmotionalState(userMessage) === 'crisis') {
      return 'crisis';
    }
    
    // Simple greetings or acknowledgments
    if (message.includes('hello') || message.includes('hi') || message.includes('thanks') || message.includes('thank you')) {
      return 'simple';
    }
    
    return 'therapeutic';
  }

  // Get cost estimate for different prompt types
  static getCostEstimate(prompt: OptimizedPrompt): { tokens: number; estimatedCost: number } {
    const tokens = prompt.tokenCount;
    const costPer1kTokens = 0.005; // GPT-4o input cost per 1k tokens (much cheaper!)
    const estimatedCost = (tokens / 1000) * costPer1kTokens;
    
    return {
      tokens,
      estimatedCost
    };
  }
} 