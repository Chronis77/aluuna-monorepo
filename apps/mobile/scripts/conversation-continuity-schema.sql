-- Session Continuity Schema for Aluuna
-- This table tracks session progress and continuity for users returning to sessions

-- Create session_continuity table
CREATE TABLE IF NOT EXISTS session_continuity (
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_session_continuity_user_id ON session_continuity(user_id);
CREATE INDEX IF NOT EXISTS idx_session_continuity_session_group_id ON session_continuity(session_group_id);
CREATE INDEX IF NOT EXISTS idx_session_continuity_last_timestamp ON session_continuity(last_timestamp);
CREATE INDEX IF NOT EXISTS idx_session_continuity_user_session ON session_continuity(user_id, session_group_id);

-- Create unique constraint to ensure one continuity record per session group per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_session_continuity_unique_user_session 
ON session_continuity(user_id, session_group_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_session_continuity_updated_at 
    BEFORE UPDATE ON session_continuity 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to clean up stale sessions (older than 24 hours)
CREATE OR REPLACE FUNCTION cleanup_stale_session_continuity()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM session_continuity 
    WHERE last_timestamp < NOW() - INTERVAL '24 hours';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Create function to get session continuity for a user and session group
CREATE OR REPLACE FUNCTION get_session_continuity(
    p_user_id UUID,
    p_session_group_id UUID
)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    session_group_id UUID,
    last_message_count INTEGER,
    last_session_phase VARCHAR(50),
    last_therapeutic_focus TEXT,
    last_emotional_state VARCHAR(50),
    last_timestamp TIMESTAMPTZ,
    session_duration_minutes INTEGER,
    is_resuming BOOLEAN,
    continuity_context TEXT,
    time_since_last_message_minutes INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sc.id,
        sc.user_id,
        sc.session_group_id,
        sc.last_message_count,
        sc.last_session_phase,
        sc.last_therapeutic_focus,
        sc.last_emotional_state,
        sc.last_timestamp,
        sc.session_duration_minutes,
        sc.is_resuming,
        sc.continuity_context,
        (EXTRACT(EPOCH FROM (NOW() - sc.last_timestamp)) / 60)::INTEGER as time_since_last_message_minutes
    FROM session_continuity sc
    WHERE sc.user_id = p_user_id 
    AND sc.session_group_id = p_session_group_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to upsert session continuity
CREATE OR REPLACE FUNCTION upsert_session_continuity(
    p_user_id UUID,
    p_session_group_id UUID,
    p_last_message_count INTEGER,
    p_last_session_phase VARCHAR(50),
    p_last_therapeutic_focus TEXT,
    p_last_emotional_state VARCHAR(50),
    p_is_resuming BOOLEAN DEFAULT FALSE
)
RETURNS UUID AS $$
DECLARE
    continuity_id UUID;
    previous_timestamp TIMESTAMPTZ;
BEGIN
    -- Get the previous timestamp for duration calculation
    SELECT last_timestamp INTO previous_timestamp
    FROM session_continuity
    WHERE user_id = p_user_id AND session_group_id = p_session_group_id;
    
    -- Upsert the session continuity record
    INSERT INTO session_continuity (
        user_id,
        session_group_id,
        last_message_count,
        last_session_phase,
        last_therapeutic_focus,
        last_emotional_state,
        session_duration_minutes,
        is_resuming,
        continuity_context
    ) VALUES (
        p_user_id,
        p_session_group_id,
        p_last_message_count,
        p_last_session_phase,
        p_last_therapeutic_focus,
        p_last_emotional_state,
        CASE 
            WHEN previous_timestamp IS NOT NULL 
            THEN (EXTRACT(EPOCH FROM (NOW() - previous_timestamp)) / 60)::INTEGER
            ELSE 0
        END,
        p_is_resuming,
        p_last_session_phase || ' | Focus: ' || COALESCE(p_last_therapeutic_focus, 'general') || ' | Emotional State: ' || COALESCE(p_last_emotional_state, 'neutral')
    )
    ON CONFLICT (user_id, session_group_id)
    DO UPDATE SET
        last_message_count = EXCLUDED.last_message_count,
        last_session_phase = EXCLUDED.last_session_phase,
        last_therapeutic_focus = EXCLUDED.last_therapeutic_focus,
        last_emotional_state = EXCLUDED.last_emotional_state,
        last_timestamp = NOW(),
        session_duration_minutes = EXCLUDED.session_duration_minutes,
        is_resuming = EXCLUDED.is_resuming,
        continuity_context = EXCLUDED.continuity_context,
        updated_at = NOW()
    RETURNING id INTO continuity_id;
    
    RETURN continuity_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to end a session (mark as completed)
CREATE OR REPLACE FUNCTION end_session_continuity(
    p_user_id UUID,
    p_session_group_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM session_continuity 
    WHERE user_id = p_user_id AND session_group_id = p_session_group_id;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count > 0;
END;
$$ LANGUAGE plpgsql;

-- Create function to get all active sessions for a user
CREATE OR REPLACE FUNCTION get_user_active_sessions(p_user_id UUID)
RETURNS TABLE (
    session_group_id UUID,
    last_message_count INTEGER,
    last_session_phase VARCHAR(50),
    last_therapeutic_focus TEXT,
    last_emotional_state VARCHAR(50),
    last_timestamp TIMESTAMPTZ,
    time_since_last_message_minutes INTEGER,
    session_title TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sc.session_group_id,
        sc.last_message_count,
        sc.last_session_phase,
        sc.last_therapeutic_focus,
        sc.last_emotional_state,
        sc.last_timestamp,
        (EXTRACT(EPOCH FROM (NOW() - sc.last_timestamp)) / 60)::INTEGER as time_since_last_message_minutes,
        sg.title as session_title
    FROM session_continuity sc
    JOIN session_groups sg ON sc.session_group_id = sg.id
    WHERE sc.user_id = p_user_id
    AND sc.last_timestamp > NOW() - INTERVAL '24 hours'
    ORDER BY sc.last_timestamp DESC;
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security (RLS)
ALTER TABLE session_continuity ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own session continuity" ON session_continuity
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own session continuity" ON session_continuity
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own session continuity" ON session_continuity
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own session continuity" ON session_continuity
    FOR DELETE USING (auth.uid() = user_id);

-- Create a scheduled job to clean up stale sessions (optional - requires pg_cron extension)
-- Uncomment if you have pg_cron installed
-- SELECT cron.schedule('cleanup-stale-sessions', '0 2 * * *', 'SELECT cleanup_stale_session_continuity();');

-- Insert sample data for testing (optional)
-- INSERT INTO session_continuity (user_id, session_group_id, last_message_count, last_session_phase, last_therapeutic_focus, last_emotional_state)
-- VALUES 
--     ('your-user-id-here', 'your-session-group-id-here', 5, 'mid', 'exploration and insight', 'anxious');

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON session_continuity TO authenticated;
GRANT EXECUTE ON FUNCTION get_session_continuity(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION upsert_session_continuity(UUID, UUID, INTEGER, VARCHAR, TEXT, VARCHAR, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION end_session_continuity(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_active_sessions(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_stale_session_continuity() TO authenticated; 