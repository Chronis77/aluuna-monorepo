import { config, validateConfig } from './config';
import { MemoryUpdateService } from './memoryUpdateService';
import { PromptOptimizer } from './promptOptimizer';
import { StreamingMessage, StreamingRequest, websocketService } from './websocketService';

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

export interface StreamingResponse {
  response: string;
  structuredData?: any;
  isComplete: boolean;
}

export class StreamingOpenAIService {
  // Cache for prompt optimization to avoid repeated processing
  private static promptCache = new Map<string, any>();
  private static CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  // Generate streaming AI response with real-time updates
  static async generateStreamingResponse(
    userMessage: string,
    sessionContext: SessionContext,
    conversationHistory: Message[],
    onChunk: (chunk: string, isComplete: boolean) => void,
    onError: (error: string) => void
  ): Promise<{ response: string; structuredData?: any }> {
    try {
      // Use cached prompt optimization if available
      const cacheKey = `${sessionContext.sessionId}-${userMessage.length}-${conversationHistory.length}`;
      let optimizedPrompt: string;
      
      const cached = this.promptCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
        optimizedPrompt = cached.prompt;
      } else {
        optimizedPrompt = await PromptOptimizer.buildOptimizedStructuredPrompt(
          sessionContext,
          userMessage,
          conversationHistory
        );
        this.promptCache.set(cacheKey, { prompt: optimizedPrompt, timestamp: Date.now() });
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

      // Check if WebSocket is available, fallback to regular API if not
      if (!websocketService.isSocketConnected()) {
        console.log('WebSocket not available, falling back to regular API');
        return await this.fallbackToRegularAPI(messages, sessionContext);
      }

      // Generate unique message ID for this streaming session
      const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Prepare streaming request
      const streamingRequest: StreamingRequest = {
        userMessage,
        sessionContext,
        conversationHistory,
        sessionId: sessionContext.sessionId || 'default',
        messageId
      };

      let fullResponse = '';
      let structuredData: any = null;
      let isComplete = false;

      // Set up streaming message listener
      const handleStreamingMessage = (message: StreamingMessage) => {
        if (message.messageId !== messageId) return;

        switch (message.type) {
          case 'start':
            console.log('Streaming response started');
            break;
          
          case 'chunk':
            if (message.content) {
              fullResponse += message.content;
              onChunk(message.content, false);
            }
            break;
          
          case 'end':
            isComplete = true;
            if (message.structuredData) {
              structuredData = message.structuredData;
            }
            onChunk('', true);
            
            // Update user's memory profile asynchronously
            if (sessionContext.userProfile?.user_id && structuredData) {
              MemoryUpdateService.processStructuredResponse(
                sessionContext.userProfile.user_id,
                structuredData
              ).catch(error => {
                console.error('Error updating memory profile:', error);
              });
            }
            break;
          
          case 'error':
            onError(message.error || 'Streaming error occurred');
            break;
        }
      };

      // Listen for streaming messages
      websocketService.onStreamingMessage(handleStreamingMessage);

      try {
        // Send streaming request
        await websocketService.sendStreamingRequest(streamingRequest);

        // Wait for completion or timeout
        await this.waitForCompletion(() => isComplete, 30000); // 30 second timeout

        // Clean up listener
        websocketService.offStreamingMessage(handleStreamingMessage);

        if (!isComplete) {
          throw new Error('Streaming response timed out');
        }

        return {
          response: fullResponse,
          structuredData
        };

      } catch (error) {
        // Clean up listener on error
        websocketService.offStreamingMessage(handleStreamingMessage);
        throw error;
      }

    } catch (error) {
      console.error('Error generating streaming AI response:', error);
      onError('Failed to generate response. Please try again.');
      return { response: "I'm having trouble processing that right now. Could you try rephrasing your message?" };
    }
  }

  // Fallback to regular API when WebSocket is not available
  private static async fallbackToRegularAPI(
    messages: Message[],
    sessionContext: SessionContext
  ): Promise<{ response: string; structuredData?: any }> {
    if (!validateConfig()) {
      throw new Error('OpenAI API key not configured');
    }

    const requestBody = {
      model: 'gpt-4',
      messages,
      temperature: 0.3,
      max_tokens: 1000,
    };

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.openai.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const responseText = data.choices[0]?.message?.content || '';

    // Try to parse structured data from response
    let structuredData;
    try {
      const cleanedResponse = this.cleanJsonResponse(responseText.trim());
      structuredData = JSON.parse(cleanedResponse);
    } catch (parseError) {
      // If parsing fails, return regular response
      return { response: responseText.trim() };
    }

    return {
      response: structuredData.response || responseText.trim(),
      structuredData
    };
  }

  // Wait for completion with timeout
  private static async waitForCompletion(
    checkComplete: () => boolean,
    timeoutMs: number
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      const check = () => {
        if (checkComplete()) {
          resolve();
        } else if (Date.now() - startTime > timeoutMs) {
          reject(new Error('Operation timed out'));
        } else {
          setTimeout(check, 100); // Check every 100ms
        }
      };
      
      check();
    });
  }

  // Clean JSON response (copied from OpenAIService)
  private static cleanJsonResponse(response: string): string {
    const jsonStart = response.indexOf('{');
    if (jsonStart > 0) {
      response = response.substring(jsonStart);
    }
    
    const jsonEnd = response.lastIndexOf('}');
    if (jsonEnd !== -1 && jsonEnd < response.length - 1) {
      response = response.substring(0, jsonEnd + 1);
    }
    
    response = response
      .replace(/,\s*}/g, '}')
      .replace(/,\s*]/g, ']')
      .replace(/true or false/g, 'false')
      .replace(/null or ".*?"/g, 'null')
      .replace(/"null"/g, 'null')
      .replace(/"true"/g, 'true')
      .replace(/"false"/g, 'false');
    
    return response;
  }

  // Build enhanced example (copied from OpenAIService)
  private static buildEnhancedExample(sessionContext: SessionContext): string {
    const userProfile = sessionContext.userProfile || {};
    
    let exampleContext = "User experiencing work-related stress and overwhelm";
    let therapeuticFocus = "containment";
    let emotionalState = "overwhelmed";
    let sessionTiming = "start";
    
    if (userProfile.emotional_patterns && userProfile.emotional_patterns.includes('anxiety_depression_comorbidity')) {
      exampleContext = "User experiencing complex emotional state with anxiety and depression";
      therapeuticFocus = "emotional_regulation";
      emotionalState = "complex_emotional_state";
    }
    
    if (userProfile.relationship_dynamics && userProfile.relationship_dynamics.includes('limited_social_support')) {
      exampleContext += " with limited social support";
      therapeuticFocus = "support_building";
    }
    
    if (userProfile.risk_factors && userProfile.risk_factors.includes('acute_suicidal_risk')) {
      exampleContext += " with acute suicidal risk";
      therapeuticFocus = "crisis_containment";
      emotionalState = "crisis";
    }
    
    let strengthReference = "";
    if (userProfile.strengths && userProfile.strengths.includes('high_motivation')) {
      strengthReference = "Building on their high motivation and resilience";
    }
    
    let growthReference = "";
    if (userProfile.growth_opportunities && userProfile.growth_opportunities.includes('self_care_development')) {
      growthReference = "Supporting their self-care development journey";
    }
    
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