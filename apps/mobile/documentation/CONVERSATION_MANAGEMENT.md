# Session Management System

This document describes the comprehensive session management system implemented in Aluuna.

## Overview

The session management system provides:
- **Session Groups**: Organize conversations into logical groups
- **Database Integration**: Persistent storage of all conversations
- **AI-Powered Summaries**: Automatic generation of session titles and summaries
- **Context Management**: Intelligent context injection for better AI responses
- **User Profile Integration**: Personalized therapeutic experience

## Database Schema

### Session Groups Table
```sql
session_groups (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  started_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITHOUT TIME ZONE NULL,
  title TEXT NULL,
  context_summary TEXT NULL,
  mood_at_start INTEGER NULL,
  mood_at_end INTEGER NULL,
  context_json JSON NULL
)
```

### Sessions Table
```sql
sessions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  session_group_id UUID REFERENCES session_groups(id),
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  input_type TEXT NULL,
  input_transcript TEXT NULL,
  gpt_response TEXT NULL,
  audio_response_url TEXT NULL,
  summary TEXT NULL,
  mood_at_time INTEGER NULL,
  flagged BOOLEAN DEFAULT false,
  tags ARRAY
)
```

## Key Features

### 1. Session Group Management
- **Automatic Creation**: New session groups are created when users start fresh conversations
- **Smart Naming**: Session titles are generated based on date ("Today's Session", "Yesterday's Session") or AI-generated three-word summaries
- **Context Preservation**: Each session group maintains context for intelligent AI responses

### 2. AI-Powered Summaries
- **Title Generation**: After 4 back-and-forth interactions, OpenAI generates a three-word title
- **Summary Generation**: Concurrently generates a brief summary of the session
- **Automatic Updates**: Session metadata is updated in real-time

### 3. Context Management
- **User Profiles**: Editable JSON file (`data/userContext.json`) contains user preferences and therapeutic context
- **Session Context**: Each session group maintains conversation history and context
- **Intelligent Injection**: Context is automatically injected into OpenAI prompts for personalized responses

### 4. Database Integration
- **Row Level Security**: Users can only access their own session data
- **Cascade Deletion**: Deleting a session group removes all associated sessions
- **Performance Optimization**: Indexes on frequently queried columns

## File Structure

```
lib/
├── sessionService.ts      # Database operations for sessions
├── conversationResponseService.ts       # OpenAI API integration
├── contextService.ts      # Context management
└── config.ts             # Configuration management

types/
└── database.ts           # TypeScript types for database schema

data/
└── userContext.json      # User context and preferences

scripts/
└── setup-database.sql    # Database migration script
```

## Usage

### Creating a New Session
```typescript
const newSessionGroup = await SessionService.createSessionGroup(
  userId, 
  title, 
  contextJson
);
```

### Adding Messages
```typescript
// User message
const sessionRecord = await SessionService.addSession(sessionGroupId, userId, inputTranscript);

// AI response
await SessionService.updateSessionWithResponse(sessionRecord.id, gptResponse);
```

### Generating AI Response
```typescript
const response = await ConversationResponseService.generateResponse(
  userMessage,
  sessionContext,
  conversationHistory
);
```

### Updating Session Metadata
```typescript
if (ConversationResponseService.shouldSummarizeSession(conversationHistory)) {
  const [title, summary] = await Promise.all([
    ConversationResponseService.generateSessionTitle(conversationHistory),
    ConversationResponseService.generateSessionSummary(conversationHistory)
  ]);
  
  await SessionService.updateSessionGroup(sessionGroupId, { title, summary });
}
```

## Context System

### User Context JSON Structure
```json
{
  "defaultContext": {
    "therapeuticApproach": "person-centered",
    "communicationStyle": "empathetic and supportive",
    "sessionGoals": [...],
    "boundaries": [...]
  },
  "userProfiles": {
    "template": {
      "name": "",
      "themes": [],
      "people": [],
      "coping_tools": [],
      "emotional_trends": {},
      "recent_insights": [],
      "ongoing_goals": [],
      "preferences": {...}
    }
  }
}
```

### Context Injection
The system automatically injects:
- User profile information
- Session history (last 10 messages)
- Current session context
- Default therapeutic approach
- User preferences and boundaries

## Security Features

### Row Level Security (RLS)
- Users can only access their own session groups and sessions
- Automatic user ID validation on all operations
- Cascade deletion ensures data consistency

### Data Validation
- Input sanitization for all user messages
- Type safety with TypeScript interfaces
- Error handling for all database operations

## Performance Considerations

### Database Indexes
- `session_groups(user_id, started_at DESC)` for user session lists
- `sessions(session_group_id, created_at)` for message retrieval
- `sessions(user_id)` for user-specific queries

### Caching Strategy
- Session groups are cached in component state
- Messages are loaded on-demand for each session group
- Context is built dynamically from current state

## Error Handling

### Database Errors
- Graceful fallbacks for connection issues
- User-friendly error messages
- Automatic retry logic for transient failures

### OpenAI Errors
- Fallback responses when API is unavailable
- Rate limiting protection
- Error logging for debugging

## Future Enhancements

### Planned Features
- [ ] Session export functionality
- [ ] Advanced analytics and insights
- [ ] Session templates and prompts
- [ ] Multi-user therapy sessions
- [ ] Integration with external therapy platforms

### Performance Improvements
- [ ] Message pagination for large conversations
- [ ] Real-time updates with WebSockets
- [ ] Offline message queuing
- [ ] Advanced caching strategies

## Setup Instructions

1. **Database Setup**
   ```bash
   # Run the migration script in your Supabase SQL editor
   # Copy contents of scripts/setup-database.sql
   ```

2. **Environment Variables**
   ```bash
   EXPO_PUBLIC_OPENAI_API_KEY=your_openai_api_key
   ```

3. **Configuration**
   - Update `data/userContext.json` with your therapeutic approach
   - Customize prompts and session templates as needed

## Testing

### Unit Tests
- Test all service functions with mock data
- Validate context injection logic
- Test error handling scenarios

### Integration Tests
- Test database operations with real Supabase instance
- Validate OpenAI API integration
- Test session group lifecycle

### User Acceptance Tests
- Test session creation and management
- Validate AI response quality
- Test context preservation across sessions 