# Memory Processing System Guide

## Overview

The Memory Processing System is a comprehensive solution for processing structured JSON responses from OpenAI and storing relevant therapeutic data across your PostgreSQL database. This system enables Aluuna to build long-term memory profiles, track user progress, and provide more personalized therapeutic experiences.

## 🗃️ Database Storage Operations

The system processes 8 key data points from structured OpenAI responses:

### 1. Session Memory Commit
- **Table**: `sessions`
- **Column**: `summary`
- **Purpose**: Stores immediate session insights
- **Condition**: Updates current session record

### 2. Long-term Memory Commit
- **Table**: `insights`
- **Columns**: `user_id`, `insight_text`, `related_theme`, `importance`, `created_at`
- **Purpose**: Stores deeper user growth and self-awareness insights
- **Default**: `importance: 5`, `related_theme: null`

### 3. Inner Parts Discovery
- **Table**: `inner_parts`
- **Columns**: `user_id`, `name`, `role`, `tone`, `description`, `updated_at`
- **Purpose**: Tracks discovered inner parts (IFS therapy concept)
- **Deduplication**: Only inserts if no existing part with same name for user

### 4. Stuck Points
- **Table**: `memory_profiles`
- **Column**: `stuck_points` (array)
- **Purpose**: Tracks limiting beliefs, behaviors, or patterns
- **Deduplication**: Appends only if not already in array

### 5. Coping Tools
- **Table**: `memory_profiles`
- **Column**: `coping_tools` (array)
- **Purpose**: Tracks tools and strategies user employs
- **Deduplication**: Appends only if not already in array

### 6. Crisis Detection
- **Table**: `crisis_flags`
- **Columns**: `id`, `user_id`, `session_id`, `flag_type`, `triggered_at`, `reviewed`
- **Purpose**: Flags potential crisis situations for review
- **Trigger**: When `crisis_signal: true`

### 7. Value Conflicts
- **Table**: `insights`
- **Special**: `related_theme: "value_conflict"`, `importance: 6`
- **Purpose**: Tracks conflicts between stated values and actions

### 8. Memory Snapshots
- **Table**: `memory_snapshots`
- **Columns**: `user_id`, `summary`, `key_themes`, `created_at`, `generated_by`
- **Purpose**: Creates searchable session summaries with extracted themes

## 🚀 Quick Start

### 1. Basic Usage

```typescript
import { MemoryProcessingService } from './lib/memoryProcessingService';
import { ConversationResponseService as OpenAIService } from './lib/conversationResponseService';

// Process a user message with memory integration
const handleUserMessage = async (userMessage: string, userId: string, sessionId: string) => {
  // Generate structured response
  const { response, structuredData } = await OpenAIService.generateStructuredResponse(
    userMessage,
    sessionContext,
    conversationHistory
  );

  // Process memory if structured data received
  if (structuredData) {
    await MemoryProcessingService.processStructuredResponse(
      structuredData,
      { userId, sessionId }
    );
  }

  return response;
};
```

### 2. Complete Integration Example

```typescript
import { MemoryProcessingExample } from './lib/memoryProcessingExample';

// In your session screen
const handleSendMessage = async () => {
  if (!inputText.trim() || !currentUserId || !currentSessionId) return;

  try {
    const { response, processed } = await MemoryProcessingExample.processUserMessage(
      inputText,
      currentUserId,
      currentSessionId,
      currentSessionGroup.id
    );

    // Add to UI
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      text: response,
      isUser: false,
      timestamp: new Date()
    }]);

    // Show memory processing indicator
    if (processed) {
      showMemoryProcessedIndicator();
    }

  } catch (error) {
    console.error('Error:', error);
    showErrorMessage('Failed to process message');
  }
};
```

## 📊 Expected JSON Structure

The system expects OpenAI to return responses in this format:

```json
{
  "session_memory_commit": "Alex wants to respond instead of snapping in tense moments with Jamie.",
  "long_term_memory_commit": "Alex is gaining awareness of their reactivity triggers and practicing emotional pause techniques.",
  "response": "It's so meaningful that you're noticing the desire to respond rather than react...",
  "wellness_judgement": "growing",
  "new_memory_inference": {
    "inner_parts": {
      "name": "The Defender",
      "role": "Protector",
      "tone": "aggressive",
      "description": "Snaps to protect from feeling powerless or unheard."
    },
    "new_stuck_point": "Alex equates being calm with being weak or invisible.",
    "crisis_signal": false,
    "value_conflict": "Wants emotional honesty but avoids vulnerability to prevent judgment.",
    "coping_tool_used": "breathing"
  }
}
```

## 🔧 Configuration

### OpenAI Service Configuration

The `generateStructuredResponse` method uses a specific system prompt that instructs the AI to return structured JSON. The prompt includes:

- Therapeutic personality guidelines
- User context integration
- Strict JSON format requirements
- Memory inference instructions

### Error Handling

The system includes comprehensive error handling:

- **JSON Parsing**: Falls back to regular response if structured parsing fails
- **Database Errors**: Logs errors and continues processing other operations
- **Missing Data**: Gracefully handles null/undefined values
- **Deduplication**: Prevents duplicate entries across all storage operations

## 📈 Advanced Features

### 1. Memory Profile Retrieval

```typescript
// Get user's complete memory profile
const memoryProfile = await MemoryProcessingService.getMemoryProfile(userId);

// Get recent insights
const insights = await MemoryProcessingService.getUserInsights(userId, 10);

// Get inner parts
const innerParts = await MemoryProcessingService.getUserInnerParts(userId);
```

### 2. Crisis Detection

```typescript
// Check for active crisis flags
const { data: crisisFlags } = await supabase
  .from('crisis_flags')
  .select('*')
  .eq('user_id', userId)
  .eq('reviewed', false);

if (crisisFlags.length > 0) {
  // Implement crisis intervention logic
  showCrisisIntervention();
}
```

### 3. Session Summary with Memory

```typescript
const { summary, memoryInsights } = await MemoryProcessingExample
  .generateSessionSummaryWithMemory(sessionGroupId, userId);

console.log('Session Summary:', summary);
console.log('Memory Insights:', memoryInsights);
```

## 🛠️ Implementation Steps

### 1. Database Setup

Ensure your PostgreSQL database has all required tables:

```sql
-- Check that these tables exist:
-- sessions, insights, inner_parts, memory_profiles, 
-- crisis_flags, memory_snapshots
```

### 2. Service Integration

1. **Import Services**: Add imports to your session handling code
2. **Update Message Flow**: Replace regular OpenAI calls with structured responses
3. **Add Context Tracking**: Ensure you're tracking session IDs and user IDs
4. **Error Handling**: Add appropriate error handling and user feedback

### 3. UI Updates

Consider adding UI elements to show:
- Memory processing status
- Recent insights
- Discovered inner parts
- Crisis alerts (if applicable)

## 🔍 Monitoring and Debugging

### Console Logs

The system provides detailed console logging:

```
=== MEMORY PROCESSING START ===
Processing structured response for user: user-123
✅ Stored session memory commit: Alex wants to respond...
✅ Stored long term memory commit: Alex is gaining awareness...
✅ Stored new inner part: The Defender
✅ Stored new stuck point: Alex equates being calm...
✅ Stored new coping tool: breathing
✅ Stored value conflict insight: Wants emotional honesty...
✅ Stored memory snapshot with themes: ["growing", "breathing", "The Defender"]
=== MEMORY PROCESSING COMPLETE ===
```

### Database Queries

Monitor your database for:
- New insights being created
- Memory profile updates
- Crisis flags (review regularly)
- Inner parts discovery

## 🚨 Important Considerations

### 1. Privacy and Security
- All data is stored in your Supabase database
- Ensure proper user authentication
- Consider data retention policies
- Implement proper access controls

### 2. Performance
- Memory processing runs in parallel for better performance
- Consider rate limiting for high-volume usage
- Monitor database query performance

### 3. Therapeutic Boundaries
- The system doesn't replace human therapists
- Crisis flags should be reviewed by humans
- Consider implementing escalation procedures

### 4. Data Quality
- Validate structured responses before processing
- Implement fallback mechanisms for malformed data
- Regular data cleanup and maintenance

## 🔮 Future Enhancements

Potential improvements to consider:

1. **Theme Inference**: Automatically categorize insights by theme
2. **Emotional Trend Analysis**: Track mood patterns over time
3. **Relationship Mapping**: Connect insights to specific relationships
4. **Goal Tracking**: Link insights to user-defined goals
5. **Export Functionality**: Allow users to export their data
6. **Advanced Analytics**: Provide insights into therapeutic progress

## 📞 Support

For questions or issues with the memory processing system:

1. Check console logs for detailed error information
2. Verify database table structure matches schema
3. Ensure proper Supabase configuration
4. Review OpenAI API key and quota status

The memory processing system is designed to be robust and self-healing, but always monitor for unexpected behavior and have fallback mechanisms in place. 