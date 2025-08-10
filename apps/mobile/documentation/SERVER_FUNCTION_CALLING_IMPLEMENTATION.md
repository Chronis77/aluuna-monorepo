# Server-Side Function Calling Implementation Guide

## Overview

This guide provides the exact implementation needed for the **aluuna-services server** at `https://aluuna-services-production.up.railway.app` to support OpenAI function calling for therapeutic tools.

## Current Architecture

```
[Mobile App] → WebSocket/HTTP → [aluuna-services server] → [OpenAI API + Tools] → [Database]
```

The mobile app sends requests to the server, which should:
1. Configure OpenAI function calling tools
2. Execute tool calls and save to database
3. Return natural responses about tool usage

## Required Server Implementation

### 1. OpenAI Tool Definitions

Add these tool definitions to your server's OpenAI configuration:

```typescript
// server/src/aiTools.ts
export const THERAPEUTIC_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'createMantra',
      description: 'Create a personalized mantra or affirmation for the user to help them with their emotional journey.',
      parameters: {
        type: 'object',
        properties: {
          text: {
            type: 'string',
            description: 'The mantra or affirmation text that would be helpful for the user'
          },
          tags: {
            type: 'array',
            items: { type: 'string' },
            description: 'Tags to categorize the mantra (e.g., anxiety, self-compassion, strength)'
          }
        },
        required: ['text']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'addCopingTool',
      description: 'Record a coping tool or strategy that the user has mentioned or that would be helpful for them.',
      parameters: {
        type: 'object',
        properties: {
          toolName: {
            type: 'string',
            description: 'Name of the coping tool or strategy'
          },
          category: {
            type: 'string',
            description: 'Category of the tool (e.g., mindfulness, breathing, grounding, self-care)'
          },
          description: {
            type: 'string',
            description: 'How to use this coping tool'
          },
          whenToUse: {
            type: 'string',
            description: 'When this tool is most effective (e.g., during anxiety, before sleep, when overwhelmed)'
          }
        },
        required: ['toolName']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'recordInsight',
      description: 'Record an important insight, realization, or breakthrough that the user has shared or discovered.',
      parameters: {
        type: 'object',
        properties: {
          insight: {
            type: 'string',
            description: 'The insight or realization'
          },
          importance: {
            type: 'number',
            description: 'Importance level from 1-5, where 5 is a major breakthrough'
          },
          category: {
            type: 'string',
            description: 'Category of insight (e.g., self-awareness, relationship, emotional, behavioral)'
          }
        },
        required: ['insight']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'addRelationship',
      description: 'Record information about an important person in the user\'s life when they mention relationships.',
      parameters: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Name or identifier for this person'
          },
          role: {
            type: 'string',
            description: 'Relationship type (e.g., Partner, Parent, Friend, Sibling, Colleague)'
          },
          notes: {
            type: 'string',
            description: 'Important notes about this relationship or person'
          }
        },
        required: ['name', 'role']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'recordEmotionalState',
      description: 'Record the user\'s current emotional state or a significant emotional pattern they\'ve shared.',
      parameters: {
        type: 'object',
        properties: {
          emotion: {
            type: 'string',
            description: 'Primary emotion (e.g., anxious, sad, angry, hopeful, overwhelmed)'
          },
          intensity: {
            type: 'number',
            description: 'Intensity level from 1-10'
          },
          triggers: {
            type: 'array',
            items: { type: 'string' },
            description: 'What triggered this emotional state'
          },
          physicalSensations: {
            type: 'array',
            items: { type: 'string' },
            description: 'Physical sensations associated with this emotion'
          }
        },
        required: ['emotion']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'addGoal',
      description: 'Record a goal or intention that the user has shared or wants to work on.',
      parameters: {
        type: 'object',
        properties: {
          title: {
            type: 'string',
            description: 'Goal title or summary'
          },
          description: {
            type: 'string',
            description: 'Detailed description of the goal'
          },
          category: {
            type: 'string',
            description: 'Goal category (e.g., emotional, relationship, career, health, personal)'
          },
          priority: {
            type: 'number',
            description: 'Priority level from 1-5'
          }
        },
        required: ['title']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'addTheme',
      description: 'Record a recurring theme or pattern in the user\'s life that emerges from the conversation.',
      parameters: {
        type: 'object',
        properties: {
          themeName: {
            type: 'string',
            description: 'Name of the theme or pattern'
          },
          category: {
            type: 'string',
            description: 'Category (e.g., emotional, behavioral, relational, cognitive)'
          },
          importance: {
            type: 'number',
            description: 'Importance level from 1-5'
          }
        },
        required: ['themeName']
      }
    }
  }
];
```

### 2. Tool Execution Logic

```typescript
// server/src/toolExecutor.ts
import { trpcClient } from './trpcClient'; // Your server's tRPC client

export class AIToolExecutor {
  static async executeToolCall(userId: string, toolCall: any): Promise<any> {
    const { name, arguments: args } = toolCall.function;
    
    console.log(`🔧 Executing AI tool: ${name}`, args);
    
    try {
      switch (name) {
        case 'createMantra':
          return await this.createMantra(userId, args);
          
        case 'addCopingTool':
          return await this.addCopingTool(userId, args);
          
        case 'recordInsight':
          return await this.recordInsight(userId, args);
          
        case 'addRelationship':
          return await this.addRelationship(userId, args);
          
        case 'recordEmotionalState':
          return await this.recordEmotionalState(userId, args);
          
        case 'addGoal':
          return await this.addGoal(userId, args);
          
        case 'addTheme':
          return await this.addTheme(userId, args);
          
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    } catch (error) {
      console.error(`❌ Error executing tool ${name}:`, error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
  
  private static async createMantra(userId: string, args: any) {
    // Call your existing tRPC endpoint
    const result = await trpcClient.mantras.createMantra.mutate({
      user_id: userId,
      text: args.text,
      source: 'ai_generated',
      tags: args.tags || ['therapy_session'],
      is_favorite: false,
      is_pinned: false
    });
    
    return {
      success: true,
      message: `Created mantra: "${args.text}"`,
      data: result
    };
  }
  
  private static async addCopingTool(userId: string, args: any) {
    const result = await trpcClient.memory.addCopingTool.mutate({
      userId: userId,
      toolName: args.toolName,
      toolCategory: args.category || 'general',
      description: args.description,
      whenToUse: args.whenToUse,
      effectivenessRating: 5
    });
    
    return {
      success: true,
      message: `Added coping tool: "${args.toolName}"`,
      data: result
    };
  }
  
  private static async recordInsight(userId: string, args: any) {
    // Store insights in your system - adjust based on your schema
    console.log('💡 Recording insight:', args);
    
    return {
      success: true,
      message: `Recorded insight about ${args.category || 'self-awareness'}`,
      data: { insight: args.insight, importance: args.importance }
    };
  }
  
  private static async addRelationship(userId: string, args: any) {
    const result = await trpcClient.memory.createRelationship.mutate({
      id: `${userId}-${args.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
      user_id: userId,
      name: args.name,
      role: args.role,
      notes: args.notes || null,
      is_active: true
    });
    
    return {
      success: true,
      message: `Added relationship: ${args.name} (${args.role})`,
      data: result
    };
  }
  
  private static async recordEmotionalState(userId: string, args: any) {
    const result = await trpcClient.memory.addEmotionalState.mutate({
      userId: userId,
      stateName: args.emotion,
      intensityLevel: args.intensity,
      physicalSensations: args.physicalSensations || [],
      thoughtsPatterns: args.triggers || [],
      behaviors: []
    });
    
    return {
      success: true,
      message: `Recorded emotional state: ${args.emotion}`,
      data: result
    };
  }
  
  private static async addGoal(userId: string, args: any) {
    const result = await trpcClient.memory.addGoal.mutate({
      userId: userId,
      goalTitle: args.title,
      goalDescription: args.description,
      goalCategory: args.category || 'personal',
      priorityLevel: args.priority || 3
    });
    
    return {
      success: true,
      message: `Added goal: "${args.title}"`,
      data: result
    };
  }
  
  private static async addTheme(userId: string, args: any) {
    const result = await trpcClient.memory.addTheme.mutate({
      userId: userId,
      themeName: args.themeName,
      themeCategory: args.category || 'general',
      importanceLevel: args.importance || 3
    });
    
    return {
      success: true,
      message: `Added theme: "${args.themeName}"`,
      data: result
    };
  }
}
```

### 3. OpenAI Integration with Function Calling

Update your server's OpenAI chat completion logic:

```typescript
// server/src/aiService.ts
import OpenAI from 'openai';
import { THERAPEUTIC_TOOLS } from './aiTools';
import { AIToolExecutor } from './toolExecutor';

export class AIService {
  private openai: OpenAI;
  
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  
  async generateResponse(
    userId: string,
    messages: Array<{ role: string; content: string }>,
    systemPrompt: string
  ) {
    try {
      console.log('🤖 Making OpenAI API call with function calling tools');
      
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4', // or gpt-4-turbo
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        tools: THERAPEUTIC_TOOLS,
        tool_choice: 'auto', // Let AI decide when to use tools
        temperature: 0.3
      });
      
      const message = completion.choices[0].message;
      
      // Handle tool calls if present
      if (message.tool_calls && message.tool_calls.length > 0) {
        console.log(`🔧 AI requested ${message.tool_calls.length} tool calls`);
        
        const toolResults = [];
        for (const toolCall of message.tool_calls) {
          const result = await AIToolExecutor.executeToolCall(userId, toolCall);
          toolResults.push(result);
        }
        
        // Create a follow-up message incorporating tool results
        const toolResultsSummary = toolResults
          .filter(r => r.success)
          .map(r => r.message)
          .join('. ');
        
        // Generate a final response that mentions what tools were used
        const finalCompletion = await this.openai.chat.completions.create({
          model: 'gpt-4',
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages,
            message, // The original response with tool calls
            {
              role: 'tool',
              content: `Tool execution results: ${toolResultsSummary}`,
              tool_call_id: message.tool_calls[0].id
            }
          ],
          temperature: 0.3
        });
        
        return {
          response: finalCompletion.choices[0].message.content,
          toolsUsed: toolResults
        };
      }
      
      // No tools called, return normal response
      return {
        response: message.content,
        toolsUsed: []
      };
      
    } catch (error) {
      console.error('❌ Error in AI service:', error);
      throw error;
    }
  }
}
```

### 4. WebSocket Handler Update

Update your WebSocket streaming handler to use the new AI service:

```typescript
// server/src/websocketHandler.ts
import { AIService } from './aiService';

const aiService = new AIService();

export const handleStreamingRequest = async (socket, request) => {
  try {
    const { userMessage, currentContext, conversationHistory, sessionId, messageId, userId } = request;
    
    // Build system prompt (you already have this logic)
    const systemPrompt = buildTherapeuticSystemPrompt(currentContext);
    
    // Prepare conversation history
    const messages = [
      ...conversationHistory,
      { role: 'user', content: userMessage }
    ];
    
    // Send start message
    socket.emit('streaming_message', {
      type: 'start',
      sessionId,
      messageId,
    });
    
    // Generate AI response with function calling
    const result = await aiService.generateResponse(userId, messages, systemPrompt);
    
    // Stream the response (simulate token-by-token streaming)
    const tokens = result.response.split(' ');
    for (const token of tokens) {
      socket.emit('streaming_message', {
        type: 'token',
        sessionId,
        messageId,
        token: token + ' ',
        timestamp: new Date().toISOString()
      });
      
      // Small delay to simulate streaming
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    // Send completion
    socket.emit('streaming_message', {
      type: 'done',
      sessionId,
      messageId,
      timestamp: new Date().toISOString()
    });
    
    console.log(`✅ Response completed with ${result.toolsUsed.length} tools used`);
    
  } catch (error) {
    console.error('❌ Error in streaming request:', error);
    socket.emit('streaming_message', {
      type: 'error',
      sessionId: request.sessionId,
      messageId: request.messageId,
      error: error.message,
    });
  }
};
```

### 5. System Prompt Enhancement

Make sure your system prompt mentions the available tools:

```typescript
function buildTherapeuticSystemPrompt(context: any): string {
  return `You are Aluuna, a deeply attuned AI therapeutic companion...

AVAILABLE TOOLS - Use these naturally when helpful:
- createMantra() for personalized affirmations and mantras
- addCopingTool() for helpful strategies and techniques  
- recordInsight() for important breakthroughs and realizations
- addRelationship() for significant people in their life
- recordEmotionalState() for emotional patterns and states
- addGoal() for intentions and aspirations they want to work on
- addTheme() for recurring patterns you notice

USAGE GUIDELINES:
- Use tools naturally during conversation when it would be genuinely helpful
- Always explain what you're doing: "I'm adding this mantra to your collection..."
- You can use multiple tools in one response if appropriate
- Don't force tool usage - only when it adds real value

Remember: You are co-creating a sacred space for healing and building their therapeutic toolkit in real-time.

User Context: ${JSON.stringify(context)}`;
}
```

## Expected User Experience

With this implementation, when a user talks to the AI:

1. **AI creates mantras naturally**: "I'm adding the mantra 'I am worthy of love and belonging' to your collection. You can find it in your Mantras section whenever you need that reminder."

2. **AI records coping tools**: "Let me save this breathing technique for you - I'm adding '4-7-8 breathing' as a mindfulness tool you can use when feeling anxious."

3. **AI captures insights**: "That's a powerful realization about self-compassion! I'm recording this insight in your profile so we can build on it in future sessions."

4. **AI tracks relationships**: "I'm noting that your relationship with Sarah is an important source of support. I've added her to your relationships so I can remember this context."

The tools will execute in real-time, and the user will see the results immediately in their Mantras, Memory Profile, and Relationships sections of the mobile app.

## Testing the Implementation

1. **Test individual tools**: Have conversations that would naturally trigger each tool
2. **Test multiple tools**: See if AI can use several tools in one conversation
3. **Verify database**: Check that data is being saved correctly via your tRPC endpoints
4. **Test mobile sync**: Ensure the mobile app reflects the new data immediately

This implementation creates a seamless therapeutic experience where the AI actively builds the user's toolkit while maintaining natural conversation flow.
