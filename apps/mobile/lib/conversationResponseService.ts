import { AIResponseRulesService } from './aiResponseRules';
import { config, validateConfig } from './config';
import { PromptOptimizer } from './promptOptimizer';
import { websocketService } from './websocketService';
import { ConversationService } from './conversationService';


export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface SessionContext {
  userProfile?: any;
  sessionHistory?: Message[];
  currentContext?: any;
  sessionId?: string;
}

// Cache for prompt optimization to avoid repeated processing
const promptCache = new Map<string, any>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export class ConversationResponseService {

  static async makeRequest(messages: Message[], temperature: number = 0.7): Promise<string> {
    // Force mobile to use server WebSocket path for AI; do not call OpenAI directly
    const sessionContext: any = {};
    const conversationHistory = messages.filter(m => m.role !== 'system');
    const userMessage = messages[messages.length - 1]?.content || '';
    const sessionId = `ws-${Date.now()}`;
    const messageId = `msg-${Date.now()}`;

    const response = await this.generateStreamingResponse(
      userMessage,
      sessionContext,
      conversationHistory,
      sessionId,
      messageId,
      messageId,
      {}
    );
    return response.response;
  }

  // Generate a three-word summary for a session group
  static async generateSessionTitle(messages: Message[], userId?: string): Promise<string> {
    const systemPrompt = `You are a helpful assistant that creates concise, three-word titles for therapy sessions. 
    Based on the conversation, create a title that captures the main theme or focus of the session.
    Return only the three words, separated by spaces, nothing else. No quotes, no punctuation.`;

    const conversationText = messages
      .filter(msg => msg.role === 'user' || msg.role === 'assistant')
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n');

    const userPrompt = `Based on this conversation, create a three-word title:\n\n${conversationText}`;

    try {
      // Use WebSocket for title generation to avoid React Native compatibility issues
      const title = await this.generateViaWebSocket([
        { role: 'user', content: userPrompt }
      ], 0.3, userId, 'title_generation');

      // Clean up the title - remove quotes and extra whitespace
      const cleanTitle = title.trim()
        .replace(/^["']|["']$/g, '') // Remove leading/trailing quotes
        .replace(/["']/g, '') // Remove any remaining quotes
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();

      return cleanTitle;
    } catch (error) {
      console.error('Error generating session title:', error);
      return 'New Session';
    }
  }

  // Generate a summary for a session group
  static async generateSessionSummary(messages: Message[], userId?: string): Promise<string> {
    const systemPrompt = `You are a therapeutic AI assistant. Create a brief, empathetic summary of this therapy session that captures the key themes, emotions, and insights discussed. 
    Focus on the client's experience and any progress or challenges mentioned. Keep it under 50 words.`;

    const conversationText = messages
      .filter(msg => msg.role === 'user' || msg.role === 'assistant')
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n');

    const userPrompt = `Please summarize this therapy session:\n\n${conversationText}`;

    try {
      // Use WebSocket for summary generation to avoid React Native compatibility issues
      const summary = await this.generateViaWebSocket([
        { role: 'user', content: userPrompt }
      ], 0.5, userId, 'summary_generation');

      return summary.trim();
    } catch (error) {
      console.error('Error generating session summary:', error);
      return 'Session summary unavailable';
    }
  }

  // Helper method to generate responses via WebSocket instead of direct API calls
  static async generateViaWebSocket(messages: Message[], temperature: number = 0.7, userId?: string, mode?: string): Promise<string> {
    try {
      // Ensure WebSocket connection
      if (!websocketService.isSocketConnected()) {
        console.log('🔌 Connecting to WebSocket for title/summary generation...');
        await websocketService.connect();
      }

      const messageId = `title-summary-${Date.now()}`;
      let fullResponse = '';
      let hasError = false;

      return new Promise((resolve, reject) => {
        // Set up WebSocket message handler
        const handleStreamingMessage = (message: any) => {
          if (message.messageId !== messageId) return;

          switch (message.type) {
            case 'start':
              console.log('🚀 Title/Summary generation started');
              break;

            case 'token':
              fullResponse += message.token;
              break;

            case 'done':
              console.log('✅ Title/Summary generation completed');
              websocketService.offTrueStreamingMessage(handleStreamingMessage);
              resolve(fullResponse);
              break;

            case 'error':
              hasError = true;
              const errorMsg = message.error || 'Title/Summary generation error';
              console.error('❌ Title/Summary generation error:', errorMsg);
              websocketService.offTrueStreamingMessage(handleStreamingMessage);
              reject(new Error(errorMsg));
              break;
          }
        };

        // Listen for streaming messages
        websocketService.onTrueStreamingMessage(handleStreamingMessage);

        // Prepare WebSocket request
        const wsRequest = {
          userMessage: messages[messages.length - 1].content,
          currentContext: {},
          conversationHistory: messages.slice(0, -1), // All messages except the last one
          sessionId: 'title-summary-session',
          messageId,
          mode,
          temperature,
          maxTokens: 100
        };
        if (userId) (wsRequest as any).userId = userId;

        // Send the request
        websocketService.sendTrueStreamingRequest(wsRequest).catch((error) => {
          if (!hasError) {
            console.error('❌ Failed to send title/summary request:', error);
            websocketService.offTrueStreamingMessage(handleStreamingMessage);
            reject(error);
          }
        });
      });

    } catch (error) {
      console.error('❌ Title/Summary generation service error:', error);
      throw error;
    }
  }

  // Generate AI response for user message
  static async generateResponse(
    userMessage: string, 
    sessionContext: SessionContext,
    conversationHistory: Message[]
  ): Promise<string> {
    // Use optimized prompt for cost reduction
    const optimizedPrompt = await PromptOptimizer.buildOptimizedPrompt(
      sessionContext, 
      userMessage, 
      conversationHistory
    );

    const messages: Message[] = [
      { role: 'system', content: optimizedPrompt.prompt },
      ...conversationHistory,
      { role: 'user', content: userMessage }
    ];

    try {
      // Use WebSocket for response generation to avoid React Native compatibility issues
      const response = await this.generateViaWebSocket(messages, 0.8);
      const trimmedResponse = response.trim();
      
      // Validate response against rules
      const validation = AIResponseRulesService.validateResponse(trimmedResponse);
      if (!validation.isValid) {
        console.warn('Response validation failed:', validation.issues);
      }
      
      return trimmedResponse;
    } catch (error) {
      console.error('Error generating AI response:', error);
      return "I'm having trouble processing that right now. Could you try rephrasing your message?";
    }
  }

  // Check if session should be summarized (after 4 back-and-forth interactions)
  static shouldSummarizeSession(messages: Message[]): boolean {
    const userMessages = messages.filter(msg => msg.role === 'user').length;
    const assistantMessages = messages.filter(msg => msg.role === 'assistant').length;
    
    // Check if we have at least 4 back-and-forth interactions
    return userMessages >= 4 && assistantMessages >= 4;
  }

  // Generate structured AI response with memory processing capabilities
  static async generateStructuredResponse(
    userMessage: string, 
    sessionContext: SessionContext,
    conversationHistory: Message[]
  ): Promise<{ response: string; structuredData?: any }> {
    // Use cached prompt optimization if available
    const cacheKey = `${sessionContext.sessionId}-${userMessage.length}-${conversationHistory.length}`;
    let optimizedPrompt: string;
    
    const cached = promptCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      optimizedPrompt = cached.prompt;
    } else {
      optimizedPrompt = await PromptOptimizer.buildOptimizedStructuredPrompt(
        sessionContext,
        userMessage,
        conversationHistory
      );
      promptCache.set(cacheKey, { prompt: optimizedPrompt, timestamp: Date.now() });
    }

    // Enhanced example that incorporates new onboarding fields
    const enhancedExample = this.buildEnhancedExample(sessionContext);

    const messages: Message[] = [
      { role: 'system', content: optimizedPrompt },
      { role: 'user', content: 'I feel overwhelmed with work lately.' },
      { role: 'assistant', content: enhancedExample },
      ...conversationHistory,
      { role: 'user', content: userMessage }
    ];

    try {
      // Use WebSocket for structured response to avoid React Native compatibility issues
      const response = await this.generateViaWebSocket(messages, 0.3);
      
      // Validate response against rules
      const validation = AIResponseRulesService.validateResponse(response.trim());
      if (!validation.isValid) {
        console.warn('Response validation failed:', validation.issues);
      }

      return {
        response: response.trim()
      };
    } catch (error) {
      console.error('Error generating structured AI response:', error);
      return { response: "I'm having trouble processing that right now. Could you try rephrasing your message?" };
    }
  }

  // Generate streaming AI response via WebSocket
  static async generateStreamingResponse(
    userMessage: string,
    sessionContext: SessionContext,
    conversationHistory: Message[],
    sessionId: string,
    messageId: string,
    sessionRecordId: string,
    callbacks: {
      onStart?: () => void;
      onChunk?: (chunk: string, isComplete: boolean) => void;
      onComplete?: (fullResponse: string, structuredData?: any) => void;
      onError?: (error: string) => void;
      onToolCall?: (toolName: string, toolData?: any) => void;
    }
  ): Promise<{ response: string; structuredData?: any; error?: string }> {
    console.log('🔍 GENERATE STREAMING RESPONSE CALLED - FUNCTION START');
    console.log('🔍 User message:', userMessage);
    console.log('🔍 Session ID:', sessionId);
    console.log('🔍 Message ID:', messageId);
    try {
      // Ensure WebSocket connection
      if (!websocketService.isSocketConnected()) {
        console.log('🔌 Connecting to WebSocket for streaming...');
        await websocketService.connect();
      } else {
        console.log('🔌 WebSocket already connected');
      }

      console.log('🤖 Sending streaming AI request via WebSocket...');

      // Prepare minimal WebSocket request (server builds system prompt + MCP)
      const wsRequest = {
        userMessage,
        currentContext: sessionContext,
        conversationHistory,
        sessionId,
        messageId,
        temperature: 0.3
      };
      // Include userId for server-side MCP building
      (wsRequest as any).userId = sessionContext?.userProfile?.user_id || 'default-user-id';

      console.log('🔍 REACHED WEB SOCKET REQUEST PREPARATION');
      console.log('🔍 WebSocket request being sent:');
      console.log('🔍 Request keys:', Object.keys(wsRequest));
      console.log('🔍 User message:', wsRequest.userMessage);
      console.log('---START OF WEBSOCKET REQUEST---');
      console.log(JSON.stringify(wsRequest, null, 2));
      console.log('---END OF WEBSOCKET REQUEST---');

      let fullResponse = '';
      let userResponse = '';
      let displayContent = ''; // Track content to display in UI
      let metadataFound = false;
      let hasError = false;

      return new Promise((resolve, reject) => {
        // Set up WebSocket message handler
        const handleStreamingMessage = async (message: any) => {
          if (message.messageId !== messageId) return;

          // This is to output the chunks to the console
          //console.log('🔍 RECEIVED MESSAGE:', JSON.stringify(message, null, 2));

          switch (message.type) {
            case 'start':
              console.log('🚀 AI streaming started');
              callbacks.onStart?.();
              break;

            case 'token':
              // Append token and forward to UI without delimiter logic
              const token = typeof message.token === 'string' ? message.token : '';
              fullResponse += token;
              displayContent += token;
              callbacks.onChunk?.(token, false);
              break;

            case 'tool_call':
              console.log('🔧 Tool called:', message.toolName, message.toolData);
              callbacks.onToolCall?.(message.toolName, message.toolData);
              break;

            case 'done':
              console.log('✅ AI streaming completed - DONE CASE REACHED');
              console.log('📝 Full response length:', fullResponse.length);
              console.log('🔍 TEST LOG - CAN YOU SEE THIS?');
              console.log('🔍 Full response type:', typeof fullResponse);
              console.log('🔍 Full response is empty?', fullResponse.length === 0);
              console.log('📝 FULL AI RESPONSE CONTENT:');
              console.log('🔍 ABOUT TO LOG CHUNKS - RESPONSE LENGTH:', fullResponse.length);
              console.log('---START OF RESPONSE---');
              // Log in chunks to avoid truncation
              const chunkSize = 200;
              for (let i = 0; i < fullResponse.length; i += chunkSize) {
                const chunk = fullResponse.substring(i, i + chunkSize);
                console.log(`📝 CHUNK ${Math.floor(i/chunkSize) + 1}:`, chunk);
              }
              console.log('---END OF RESPONSE---');
              // No metadata processing on client; use the full response for saving
              
              callbacks.onChunk?.('', true);
              callbacks.onComplete?.(displayContent || fullResponse);
              
              // Clean up
              websocketService.offTrueStreamingMessage(handleStreamingMessage);
              
              resolve({
                response: displayContent || fullResponse
              });
              break;

            case 'error':
              hasError = true;
              const errorMsg = message.error || 'AI streaming error';
              console.error('❌ AI streaming error:', errorMsg);
              callbacks.onError?.(errorMsg);
              
              // Clean up
              websocketService.offTrueStreamingMessage(handleStreamingMessage);
              reject(new Error(errorMsg));
              break;
          }
        };

        // Listen for streaming messages BEFORE sending the request
        websocketService.onTrueStreamingMessage(handleStreamingMessage);

        // Send the request
        console.log('🔍 ABOUT TO CALL WEBSOCKET SERVICE');
        websocketService.sendTrueStreamingRequest(wsRequest).catch((error) => {
          if (!hasError) {
            console.error('❌ Failed to send AI request:', error);
            websocketService.offTrueStreamingMessage(handleStreamingMessage);
            reject(error);
          }
        });
      });

    } catch (error) {
      console.error('❌ AI streaming service error:', error);
      callbacks.onError?.(error instanceof Error ? error.message : 'Unknown error');
      return {
        response: '',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }



  // Base64 encoding/decoding methods for secure transmission
  private static encodeBase64(text: string): string {
    return btoa(unescape(encodeURIComponent(text)));
  }

  private static decodeBase64(encodedText: string): string {
    return decodeURIComponent(escape(atob(encodedText)));
  }

  // Build enhanced example that incorporates new onboarding fields
  private static buildEnhancedExample(sessionContext: SessionContext): string {
    const userProfile = sessionContext.userProfile || {};
    
    // Build context-aware example based on user's profile
    let exampleContext = "User experiencing work-related stress and overwhelm";
    let therapeuticFocus = "containment";
    let emotionalState = "overwhelmed";
    let sessionTiming = "start";
    
    // Adjust based on user's emotional patterns
    if (userProfile.emotional_patterns && userProfile.emotional_patterns.includes('anxiety_depression_comorbidity')) {
      exampleContext = "User experiencing complex emotional state with anxiety and depression";
      therapeuticFocus = "emotional_regulation";
      emotionalState = "complex_emotional_state";
    }
    
    // Adjust based on relationship dynamics
    if (userProfile.relationship_dynamics && userProfile.relationship_dynamics.includes('limited_social_support')) {
      exampleContext += " with limited social support";
      therapeuticFocus = "support_building";
    }
    
    // Adjust based on risk factors
    if (userProfile.risk_factors && userProfile.risk_factors.includes('acute_suicidal_risk')) {
      exampleContext += " with acute suicidal risk";
      therapeuticFocus = "crisis_containment";
      emotionalState = "crisis";
    }
    
    // Adjust based on strengths
    let strengthReference = "";
    if (userProfile.strengths && userProfile.strengths.includes('high_motivation')) {
      strengthReference = "Building on their high motivation and resilience";
    }
    
    // Adjust based on growth opportunities
    let growthReference = "";
    if (userProfile.growth_opportunities && userProfile.growth_opportunities.includes('self_care_development')) {
      growthReference = "Supporting their self-care development journey";
    }
    
    // Adjust based on therapeutic approach
    let therapeuticApproach = "person_centered";
    if (userProfile.therapeutic_approach) {
      therapeuticApproach = userProfile.therapeutic_approach;
    }

    return `{
  "session_memory_commit": "${exampleContext}",
  "long_term_memory_commit": "Work stress patterns may need attention",
  "response": "I hear that work has been really challenging for you lately. It sounds like you're carrying a heavy load. ${strengthReference} ${growthReference} Can you tell me more about what specifically feels overwhelming at work right now?",
  "wellness_judgement": "${emotionalState}",
  "emotional_state": "${emotionalState}",
  "therapeutic_focus": "${therapeuticFocus}",
  "session_timing": "${sessionTiming}",
  "therapeutic_approach": "${therapeuticApproach}",
  "new_memory_inference": {
    "inner_parts": {
      "name": null,
      "role": "Manager",
      "tone": "overwhelmed",
      "description": "Part managing work responsibilities",
      "needs": "Trying to handle all responsibilities"
    },
    "new_stuck_point": "Work-life balance struggle",
    "crisis_signal": ${userProfile.risk_factors && userProfile.risk_factors.includes('acute_suicidal_risk') ? 'true' : 'false'},
    "value_conflict": null,
    "coping_tool_used": null,
    "new_shadow_theme": null,
    "new_pattern_loop": null,
    "new_mantra": "I am capable of managing my responsibilities with grace and balance",
    "new_relationship": {
      "name": null,
      "role": null,
      "notes": null,
      "attachment_style": null
    },
    "growth_moment": null,
    "therapeutic_theme": "Work stress and overwhelm",
    "emotional_need": "Support and understanding",
    "next_step": "Explore specific sources of overwhelm"
  }
}`;
  }
}


