import { config, validateConfig } from './config';
import { MemoryUpdateService } from './memoryUpdateService';
import { PromptOptimizer } from './promptOptimizer';

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

export class DirectStreamingService {
  // Cache for prompt optimization to avoid repeated processing
  private static promptCache = new Map<string, any>();
  private static CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  // Generate streaming AI response directly from OpenAI
  static async generateStreamingResponse(
    userMessage: string,
    sessionContext: SessionContext,
    conversationHistory: Message[],
    onChunk: (chunk: string, isComplete: boolean) => void,
    onError: (error: string) => void
  ): Promise<{ response: string; structuredData?: any }> {
    try {
      if (!validateConfig()) {
        throw new Error('OpenAI API key not configured');
      }

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

      let fullResponse = '';
      let structuredData: any = null;

      // Create streaming request to OpenAI
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.openai.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages,
          temperature: 0.3,
          max_tokens: 1000,
          stream: true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
      }

      // React Native doesn't support ReadableStream properly, so we use text() instead
      console.log('📡 React Native detected - using response.text() instead of streaming');
      const responseText = await response.text();
      
      // Parse the streaming response manually
      const lines = responseText.split('\n');
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          
          if (data === '[DONE]') {
            // Stream complete
            onChunk('', true);
            
            // Try to parse structured data from full response
            try {
              const jsonMatch = fullResponse.match(/\{[\s\S]*\}/);
              if (jsonMatch) {
                structuredData = JSON.parse(this.cleanJsonResponse(jsonMatch[0]));
              }
            } catch (parseError) {
              console.log('Could not parse structured data from response');
            }

            // Update user's memory profile asynchronously
            if (sessionContext.userProfile?.user_id && structuredData) {
              MemoryUpdateService.processStructuredResponse(
                sessionContext.userProfile.user_id,
                structuredData
              ).catch(error => {
                console.error('Error updating memory profile:', error);
              });
            }

            return {
              response: fullResponse,
              structuredData
            };
          }

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices[0]?.delta?.content;
            
            if (content) {
              fullResponse += content;
              onChunk(content, false);
            }
          } catch (parseError) {
            // Ignore parsing errors for incomplete chunks
          }
        }
      }

      return {
        response: fullResponse,
        structuredData
      };

    } catch (error) {
      console.error('Error generating streaming AI response:', error);
      onError('Failed to generate response. Please try again.');
      return { response: "I'm having trouble processing that right now. Could you try rephrasing your message?" };
    }
  }

  // Clean JSON response
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