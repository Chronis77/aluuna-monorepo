import { websocketService, StreamingRequest, StreamingMessage } from './websocketService';
import { config } from './config';

export interface StreamingResponse {
  success: boolean;
  response: string;
  structuredData?: any;
  error?: string;
}

export interface StreamingCallbacks {
  onChunk?: (chunk: string, isComplete: boolean) => void;
  onError?: (error: string) => void;
  onComplete?: (response: string, structuredData?: any) => void;
}

export class HybridStreamingService {
  private static instance: HybridStreamingService;
  private websocketEnabled = true;
  private fallbackAttempted = false;

  private constructor() {}

  static getInstance(): HybridStreamingService {
    if (!HybridStreamingService.instance) {
      HybridStreamingService.instance = new HybridStreamingService();
    }
    return HybridStreamingService.instance;
  }

  // Main streaming method that tries WebSocket first, then falls back to API
  async generateStreamingResponse(
    userMessage: string,
    sessionContext: any,
    conversationHistory: any[],
    callbacks: StreamingCallbacks
  ): Promise<StreamingResponse> {
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const sessionId = sessionContext.sessionId || `session_${Date.now()}`;

    const request: StreamingRequest = {
      userMessage,
      sessionContext,
      conversationHistory,
      sessionId,
      messageId,
    };

    // Try WebSocket first if enabled
    if (this.websocketEnabled && !this.fallbackAttempted) {
      try {
        return await this.tryWebSocketStreaming(request, callbacks);
      } catch (error) {
        console.log('🔌 WebSocket streaming failed, falling back to API:', error);
        this.websocketEnabled = false;
        this.fallbackAttempted = true;
      }
    }

    // Fallback to regular API call
    return await this.fallbackToAPI(request, callbacks);
  }

  // Try WebSocket streaming
  private async tryWebSocketStreaming(
    request: StreamingRequest,
    callbacks: StreamingCallbacks
  ): Promise<StreamingResponse> {
    return new Promise((resolve, reject) => {
      let fullResponse = '';
      let structuredData: any = null;
      let hasError = false;

      // Set up message listener
      const messageHandler = (message: StreamingMessage) => {
        if (message.messageId !== request.messageId) return;

        switch (message.type) {
          case 'start':
            console.log('🔌 WebSocket streaming started');
            break;

          case 'chunk':
            if (message.content) {
              fullResponse += message.content;
              callbacks.onChunk?.(message.content, false);
            }
            break;

          case 'end':
            console.log('🔌 WebSocket streaming completed');
            structuredData = message.structuredData;
            callbacks.onChunk?.('', true);
            callbacks.onComplete?.(fullResponse, structuredData);
            resolve({
              success: true,
              response: fullResponse,
              structuredData,
            });
            break;

          case 'error':
            hasError = true;
            const errorMsg = message.error || 'WebSocket streaming error';
            console.error('🔌 WebSocket streaming error:', errorMsg);
            callbacks.onError?.(errorMsg);
            reject(new Error(errorMsg));
            break;
        }
      };

      // Connect and send request
      websocketService
        .connect()
        .then(() => {
          websocketService.onStreamingMessage(messageHandler);
          return websocketService.sendStreamingRequest(request);
        })
        .catch((error) => {
          if (!hasError) {
            reject(error);
          }
        });
    });
  }

  // Fallback to regular API call
  private async fallbackToAPI(
    request: StreamingRequest,
    callbacks: StreamingCallbacks
  ): Promise<StreamingResponse> {
    console.log('📡 Using API fallback for streaming response');

    try {
      // Prepare messages for OpenAI
      const messages = [
        {
          role: 'system',
          content: this.buildSystemPrompt(request.sessionContext),
        },
        ...request.conversationHistory,
        { role: 'user', content: request.userMessage },
      ];

      // Make API call to your services backend
      let response = await fetch(`${config.tts.serverUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Authorization header should be attached by higher-level API clients; avoid bundling API keys
        },
        body: JSON.stringify({
          messages,
          model: 'gpt-4',
          temperature: 0.3,
          max_tokens: 1000,
        }),
      });

      if (!response.ok && response.status === 401) {
        try {
          const { refreshTokens } = await import('./authService');
          const ok = await refreshTokens();
          if (ok) {
            const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
            const token = await AsyncStorage.getItem('authToken');
            const authHeaders: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
            response = await fetch(`${config.tts.serverUrl}/api/chat`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', ...authHeaders } as any,
              body: JSON.stringify({ messages, model: 'gpt-4', temperature: 0.3, max_tokens: 1000 }),
            });
          }
        } catch {}
      }

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      const aiResponse = data.choices?.[0]?.message?.content || '';

      // Simulate streaming by sending chunks
      if (aiResponse) {
        const chunks = this.simulateStreamingChunks(aiResponse);
        for (const chunk of chunks) {
          callbacks.onChunk?.(chunk, false);
          await new Promise(resolve => setTimeout(resolve, 50)); // 50ms delay between chunks
        }
        callbacks.onChunk?.('', true);
      }

      // Try to parse structured data
      let structuredData = null;
      try {
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          structuredData = JSON.parse(this.cleanJsonResponse(jsonMatch[0]));
        }
      } catch (parseError) {
        console.warn('Could not parse structured data from API response');
      }

      callbacks.onComplete?.(aiResponse, structuredData);

      return {
        success: true,
        response: aiResponse,
        structuredData,
      };
    } catch (error) {
      const errorMsg = `API fallback failed: ${error}`;
      console.error(errorMsg);
      callbacks.onError?.(errorMsg);
      return {
        success: false,
        response: '',
        error: errorMsg,
      };
    }
  }

  // Build system prompt
  private buildSystemPrompt(sessionContext: any): string {
    return `You are Aluuna, a therapeutic AI companion. Build rapport first, then offer insights. Remember their story and care about their journey.

RESPONSE FORMAT - Return ONLY this JSON:
{
  "session_memory_commit": "Brief insight from this interaction",
  "long_term_memory_commit": "Significant growth or pattern to remember",
  "response": "Your empathetic therapeutic response",
  "wellness_judgement": "stable|growing|anxious|overwhelmed|crisis|n/a",
  "emotional_state": "calm|anxious|sad|angry|excited|numb|overwhelmed|hopeful|confused|n/a",
  "therapeutic_focus": "validation|exploration|challenge|containment|integration|celebration|n/a",
  "session_timing": "start|early|mid|late|ending",
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
}`;
  }

  // Simulate streaming by breaking response into chunks
  private simulateStreamingChunks(response: string): string[] {
    const words = response.split(' ');
    const chunks: string[] = [];
    
    for (let i = 0; i < words.length; i += 2) {
      chunks.push(words.slice(i, i + 2).join(' ') + ' ');
    }
    
    return chunks;
  }

  // Clean JSON response
  private cleanJsonResponse(response: string): string {
    const jsonStart = response.indexOf('{');
    if (jsonStart > 0) {
      response = response.substring(jsonStart);
    }
    
    const jsonEnd = response.lastIndexOf('}');
    if (jsonEnd !== -1 && jsonEnd < response.length - 1) {
      response = response.substring(0, jsonEnd + 1);
    }
    
    return response
      .replace(/,\s*}/g, '}')
      .replace(/,\s*]/g, ']')
      .replace(/true or false/g, 'false')
      .replace(/null or ".*?"/g, 'null')
      .replace(/"null"/g, 'null')
      .replace(/"true"/g, 'true')
      .replace(/"false"/g, 'false');
  }

  // Reset fallback state
  resetFallbackState(): void {
    this.websocketEnabled = true;
    this.fallbackAttempted = false;
  }

  // Get service status
  getStatus(): {
    websocketEnabled: boolean;
    fallbackAttempted: boolean;
  } {
    return {
      websocketEnabled: this.websocketEnabled,
      fallbackAttempted: this.fallbackAttempted,
    };
  }
}

// Export singleton instance
export const hybridStreamingService = HybridStreamingService.getInstance(); 