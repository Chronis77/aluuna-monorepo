# Database Session Continuity Implementation Guide

## 🗄️ **Database Schema for Session Continuity**

I've created a comprehensive SQL schema that stores session continuity data in Supabase, ensuring persistence across app restarts and proper multi-user support.

## 📋 **SQL Schema Overview**

### **Main Table: `session_continuity`**
```sql
CREATE TABLE session_continuity (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_group_id UUID NOT NULL REFERENCES session_groups(id) ON DELETE CASCADE,
    last_message_count INTEGER NOT NULL DEFAULT 0,
    last_session_phase VARCHAR(50) NOT NULL DEFAULT 'start',
    last_therapeutic_focus TEXT,
    last_emotional_state VARCHAR(50),
    last_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    session_duration_minutes INTEGER DEFAULT 0,
    is_resuming BOOLEAN DEFAULT FALSE,
    continuity_context TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### **Key Features**
- **User Isolation**: Each user only sees their own session continuity
- **Session Group Tracking**: Links to existing session_groups table
- **Automatic Timestamps**: Tracks when sessions were last active
- **Duration Calculation**: Automatically calculates session duration
- **Context Preservation**: Stores therapeutic focus and emotional state

## 🔧 **Database Functions**

### **1. `get_session_continuity(user_id, session_group_id)`**
Returns session continuity data with calculated time since last message.

### **2. `upsert_session_continuity(...)`**
Inserts or updates session continuity, automatically calculating duration.

### **3. `end_session_continuity(user_id, session_group_id)`**
Removes session continuity when session ends.

### **4. `get_user_active_sessions(user_id)`**
Returns all active sessions for a user with session titles.

### **5. `cleanup_stale_session_continuity()`**
Removes sessions older than 24 hours.

## 🛡️ **Security Features**

### **Row Level Security (RLS)**
```sql
-- Users can only access their own session continuity
CREATE POLICY "Users can view their own session continuity" ON session_continuity
    FOR SELECT USING (auth.uid() = user_id);
```

### **Unique Constraints**
```sql
-- One continuity record per session group per user
CREATE UNIQUE INDEX idx_session_continuity_unique_user_session 
ON session_continuity(user_id, session_group_id);
```

## 🚀 **Implementation Steps**

### **Step 1: Run the SQL Schema**
Execute the SQL in `scripts/session-continuity-schema.sql` in your Supabase SQL editor.

### **Step 2: Update TypeScript Services**
The services have been updated to use the database:

#### **SessionContinuityService** (`lib/sessionContinuityService.ts`)
- Handles all database operations
- Provides async methods for CRUD operations
- Includes error handling and logging

#### **SessionContinuityManager** (`lib/sessionContinuityManager.ts`)
- High-level interface for session continuity
- Integrates with the database service
- Provides fallback behavior for errors

### **Step 3: Update PromptOptimizer**
The PromptOptimizer now:
- Uses async session continuity checks
- Tracks progress in the database
- Provides continuity-aware prompts

### **Step 4: Update OpenAIService**
The OpenAIService now:
- Uses async prompt optimization
- Integrates session continuity into AI responses
- Maintains cost optimization

## 📊 **Data Flow**

### **When User Sends a Message**
1. **Check Continuity**: `SessionContinuityManager.checkSessionResume()`
2. **Build Prompt**: `PromptOptimizer.buildOptimizedPrompt()` with continuity context
3. **Generate Response**: `OpenAIService.generateResponse()` with continuity awareness
4. **Track Progress**: `SessionContinuityManager.trackSessionProgress()` to database

### **When User Returns to Session**
1. **Database Query**: Get last session state from `session_continuity`
2. **Time Calculation**: Determine if user is resuming (>5 minutes) or continuing
3. **Context Building**: Include previous session phase and focus in prompt
4. **AI Response**: AI acknowledges break and reconnects appropriately

## 🎯 **Example Database Operations**

### **Creating Session Continuity**
```typescript
await SessionContinuityService.upsertSessionContinuity(
  userId,
  sessionGroupId,
  messageCount,
  'mid',
  'exploration and insight',
  'anxious',
  false
);
```

### **Checking Session Resume**
```typescript
const resumeContext = await SessionContinuityService.checkSessionResume(
  userId,
  sessionGroupId
);

if (resumeContext.isResuming) {
  // User is returning after a break
  console.log(`User resuming after ${resumeContext.timeSinceLastMessage} minutes`);
}
```

### **Getting Active Sessions**
```typescript
const activeSessions = await SessionContinuityService.getUserActiveSessions(userId);
// Returns: [{ session_group_id, last_message_count, last_session_phase, session_title, ... }]
```

## 🔄 **Session Continuity Scenarios**

### **Scenario 1: New Session**
```sql
-- No existing record in session_continuity
-- AI receives: "New session - build rapport and understand their current state"
```

### **Scenario 2: Brief Pause (< 5 minutes)**
```sql
-- Record exists, time_since_last_message < 5
-- AI receives: "Continuing session naturally. User is in mid phase..."
```

### **Scenario 3: Session Resume (> 5 minutes)**
```sql
-- Record exists, time_since_last_message > 5
-- AI receives: "User is resuming session after 30 minutes. They were in deep therapeutic work..."
```

### **Scenario 4: Stale Session (> 24 hours)**
```sql
-- Record exists but is older than 24 hours
-- cleanup_stale_session_continuity() removes it
-- Treated as new session
```

## 📈 **Performance Optimizations**

### **Indexes**
```sql
-- Fast lookups by user and session
CREATE INDEX idx_session_continuity_user_session ON session_continuity(user_id, session_group_id);

-- Fast timestamp queries for cleanup
CREATE INDEX idx_session_continuity_last_timestamp ON session_continuity(last_timestamp);
```

### **Automatic Cleanup**
```sql
-- Optional: Scheduled cleanup (requires pg_cron extension)
SELECT cron.schedule('cleanup-stale-sessions', '0 2 * * *', 'SELECT cleanup_stale_session_continuity();');
```

## 🔍 **Monitoring and Debugging**

### **Database Queries for Monitoring**
```sql
-- Check active sessions
SELECT * FROM session_continuity WHERE last_timestamp > NOW() - INTERVAL '1 hour';

-- Check session distribution by phase
SELECT last_session_phase, COUNT(*) FROM session_continuity GROUP BY last_session_phase;

-- Check for stale sessions
SELECT COUNT(*) FROM session_continuity WHERE last_timestamp < NOW() - INTERVAL '24 hours';
```

### **Logging**
The services include comprehensive logging:
- Session progress tracking
- Resume detection
- Database operation results
- Error handling

## 🚨 **Error Handling**

### **Graceful Degradation**
- If database operations fail, system falls back to new session behavior
- No blocking of AI responses due to continuity issues
- Comprehensive error logging for debugging

### **Fallback Scenarios**
```typescript
// If user ID can't be determined
if (!userId) {
  return {
    isResuming: false,
    sessionPhase: 'start',
    // ... default values
  };
}

// If database query fails
catch (error) {
  console.error('Error checking session resume:', error);
  return defaultNewSessionContext;
}
```

## 🔮 **Future Enhancements**

### **Advanced Features**
- **Cross-Session Themes**: Connect themes across multiple sessions
- **Session Summaries**: AI-generated summaries of previous work
- **Progress Tracking**: Visual indicators of therapeutic progress
- **Smart Reminders**: Gentle prompts to continue important work

### **Analytics**
- **Session Duration Patterns**: Understand typical session lengths
- **Resume Frequency**: Track how often users return to sessions
- **Therapeutic Focus Trends**: Analyze what users work on most
- **Emotional State Tracking**: Monitor emotional patterns over time

This database implementation ensures that session continuity is persistent, secure, and scalable across multiple users and app restarts. 