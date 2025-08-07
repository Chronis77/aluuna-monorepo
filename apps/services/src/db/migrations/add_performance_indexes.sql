-- Add performance indexes to prevent slow queries that cause connection timeouts

-- Index for memory_snapshots queries (the slow query culprit)
CREATE INDEX IF NOT EXISTS idx_memory_snapshots_user_created 
ON memory_snapshots(user_id, created_at DESC);

-- Index for memory_profiles queries
CREATE INDEX IF NOT EXISTS idx_memory_profiles_user_id 
ON memory_profiles(user_id);

-- Index for inner_parts queries
CREATE INDEX IF NOT EXISTS idx_inner_parts_user_id 
ON inner_parts(user_id);

-- Index for insights queries
CREATE INDEX IF NOT EXISTS idx_insights_user_created 
ON insights(user_id, created_at DESC);

-- Index for mantras queries
CREATE INDEX IF NOT EXISTS idx_mantras_user_created 
ON mantras(user_id, created_at DESC);

-- Index for emotional_trends queries
CREATE INDEX IF NOT EXISTS idx_emotional_trends_user_recorded 
ON emotional_trends(user_id, recorded_at DESC);

-- Index for conversation_messages queries
CREATE INDEX IF NOT EXISTS idx_conversation_messages_user_created 
ON conversation_messages(user_id, created_at DESC);

-- Index for conversations queries
CREATE INDEX IF NOT EXISTS idx_conversations_user_started 
ON conversations(user_id, started_at DESC);

-- Composite index for memory_snapshots with better selectivity
CREATE INDEX IF NOT EXISTS idx_memory_snapshots_user_id_created_at_id 
ON memory_snapshots(user_id, created_at DESC, id);

-- Partial index for active conversations only
CREATE INDEX IF NOT EXISTS idx_conversations_user_active 
ON conversations(user_id, started_at DESC) 
WHERE ended_at IS NULL; 