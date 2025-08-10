# Function Calling Architecture for Therapeutic Tools

## Overview

The AI therapeutic tools (mantras, coping tools, insights, relationships, etc.) are implemented using **OpenAI function calling** on the **server side**. The mobile app does not handle function calling directly.

## Architecture Flow

```
[Mobile App] → [Server] → [OpenAI API + Tools] → [Server] → [Mobile App]
```

### 1. Mobile App Responsibilities
- Send user messages via WebSocket/HTTP to the server
- Receive AI responses with tool results already processed
- Display tool confirmations to the user (e.g., "I've added this mantra to your collection...")
- Handle UI updates for mantras, coping tools, etc.

### 2. Server Responsibilities (NOT in mobile repo)
- Configure OpenAI function calling tools
- Execute tool calls (createMantra, addCopingTool, etc.)
- Make tRPC calls to save data to the database
- Return processed responses to the mobile app

## Available Therapeutic Tools

The AI has access to these function calling tools on the server:

### Core Tools
- `createMantra(text, tags)` - Create personalized mantras/affirmations
- `addCopingTool(toolName, category, description, whenToUse)` - Record helpful strategies
- `recordInsight(insight, importance, category)` - Capture breakthroughs
- `addRelationship(name, role, notes)` - Record important people
- `recordEmotionalState(emotion, intensity, triggers)` - Track emotional patterns
- `addGoal(title, description, category, priority)` - Set intentions
- `addTheme(themeName, category, importance)` - Identify recurring patterns

### Tool Usage Patterns
The AI should use these tools naturally during conversation:
- When creating a helpful mantra for the user
- When they mention a coping strategy that works
- When they have an important realization
- When discussing relationships
- When expressing strong emotions
- When setting goals or intentions
- When recurring patterns emerge

## Mobile App Implementation

### Current Status ✅
- ❌ Removed client-side metadata parsing system
- ❌ Removed `aiTools.ts` (moved to server)
- ✅ Updated AI prompts to mention function calling
- ✅ Configured to route all AI requests through server
- ✅ tRPC endpoints exist for all data operations

### Integration Points

#### 1. AI Response Rules (`lib/aiResponseRules.ts`)
- Updated to instruct AI about available function calling tools
- Removed metadata template requirements
- Added guidance on natural tool usage

#### 2. Conversation Service (`lib/conversationResponseService.ts`)
- Removed metadata parsing logic
- Routes all AI requests through WebSocket to server
- Server handles tool calling and returns final response

#### 3. tRPC Client (`lib/trpcClient.ts`)
- Contains all necessary endpoints for tool data:
  - `createMantra()`, `getMantras()`
  - `addCopingTool()`, `addGoal()`
  - `createRelationship()`, `getRelationships()`
  - `addTheme()`, `getInsights()`
  - etc.

## Server Implementation Required

The server needs to implement:

```typescript
// Example server-side tool definition
const tools = [
  {
    type: 'function',
    function: {
      name: 'createMantra',
      description: 'Create a personalized mantra for the user',
      parameters: {
        type: 'object',
        properties: {
          text: { type: 'string', description: 'The mantra text' },
          tags: { type: 'array', items: { type: 'string' } }
        },
        required: ['text']
      }
    }
  },
  // ... other tools
];

// Server handles OpenAI API call with tools
const response = await openai.chat.completions.create({
  model: 'gpt-4',
  messages: conversation,
  tools: tools,
  tool_choice: 'auto'
});

// Server executes tool calls
if (response.choices[0].message.tool_calls) {
  for (const toolCall of response.choices[0].message.tool_calls) {
    const result = await executeToolCall(userId, toolCall);
    // Save to database via tRPC/direct DB calls
  }
}
```

## Benefits of This Architecture

1. **Security**: API keys and sensitive operations stay on server
2. **Performance**: Mobile app stays lightweight
3. **Reliability**: Server can handle retries, error handling
4. **Scalability**: Server can optimize OpenAI usage
5. **Consistency**: Single source of truth for tool implementations
6. **Debugging**: Easier to monitor and debug tool usage

## User Experience

When the AI wants to help the user, it will:

1. **Call a tool** (e.g., `createMantra("I am capable and strong")`)
2. **Server executes** the tool and saves to database  
3. **AI responds naturally**: "I've added the mantra 'I am capable and strong' to your collection. You can find it in your Mantras section when you need that reminder of your inner strength."
4. **User sees** the tool result immediately in their collection

This creates a seamless experience where the AI actively builds the user's therapeutic toolkit in real-time.
