-- Fix Function Search Path Warnings
-- This script addresses the "Function Search Path Mutable" warnings
-- by adding explicit search_path parameters to functions

-- ========================================
-- FIX update_updated_at_column FUNCTION
-- ========================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- ========================================
-- FIX cleanup_stale_session_continuity FUNCTION
-- ========================================

CREATE OR REPLACE FUNCTION cleanup_stale_session_continuity()
RETURNS INTEGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM session_continuity 
    WHERE last_timestamp < NOW() - INTERVAL '24 hours';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$;

-- ========================================
-- FIX get_session_continuity FUNCTION
-- ========================================

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
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- ========================================
-- FIX upsert_session_continuity FUNCTION
-- ========================================

CREATE OR REPLACE FUNCTION upsert_session_continuity(
    p_user_id UUID,
    p_session_group_id UUID,
    p_last_message_count INTEGER,
    p_last_session_phase VARCHAR(50),
    p_last_therapeutic_focus TEXT,
    p_last_emotional_state VARCHAR(50),
    p_is_resuming BOOLEAN DEFAULT FALSE
)
RETURNS UUID 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- ========================================
-- FIX end_session_continuity FUNCTION
-- ========================================

CREATE OR REPLACE FUNCTION end_session_continuity(
    p_user_id UUID,
    p_session_group_id UUID
)
RETURNS BOOLEAN 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM session_continuity 
    WHERE user_id = p_user_id AND session_group_id = p_session_group_id;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count > 0;
END;
$$;

-- ========================================
-- FIX get_user_active_sessions FUNCTION
-- ========================================

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
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- ========================================
-- VERIFICATION
-- ========================================

-- Check that all functions now have explicit search_path
SELECT 
    p.proname as function_name,
    p.prosecdef as security_definer,
    p.proconfig as search_path_config
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname IN (
    'update_updated_at_column',
    'cleanup_stale_session_continuity',
    'get_session_continuity',
    'upsert_session_continuity',
    'end_session_continuity',
    'get_user_active_sessions'
  )
ORDER BY p.proname;

-- Show function definitions to verify search_path is set
SELECT 
    p.proname as function_name,
    pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname IN (
    'update_updated_at_column',
    'cleanup_stale_session_continuity',
    'get_session_continuity',
    'upsert_session_continuity',
    'end_session_continuity',
    'get_user_active_sessions'
  )
ORDER BY p.proname; 