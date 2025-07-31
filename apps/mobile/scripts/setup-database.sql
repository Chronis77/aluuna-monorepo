-- Database Setup Script for Aluuna
-- This script only adds missing indexes and policies to existing tables
-- All tables already exist in the database

-- ========================================
-- SESSION_GROUPS TABLE
-- ========================================
-- Table already exists with structure:
-- id uuid NOT NULL,
-- user_id uuid,
-- started_at timestamp without time zone DEFAULT now(),
-- ended_at timestamp without time zone,
-- title text,
-- context_summary text,
-- mood_at_start integer,
-- mood_at_end integer,
-- context_json json

-- Add UUID default if missing (for future inserts)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'session_groups' 
    AND column_name = 'id' 
    AND column_default IS NOT NULL
  ) THEN
    ALTER TABLE session_groups ALTER COLUMN id SET DEFAULT gen_random_uuid();
  END IF;
END $$;

-- Add missing indexes (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_session_groups_user_id ON session_groups(user_id);
CREATE INDEX IF NOT EXISTS idx_session_groups_started_at ON session_groups(started_at DESC);

-- ========================================
-- SESSIONS TABLE
-- ========================================
-- Table already exists with structure:
-- id uuid NOT NULL,
-- user_id uuid,
-- session_group_id uuid,
-- created_at timestamp without time zone DEFAULT now(),
-- input_type text,
-- input_transcript text,
-- gpt_response text,
-- audio_response_url text,
-- summary text,
-- mood_at_time integer,
-- flagged boolean DEFAULT false,
-- tags ARRAY

-- Add UUID default if missing (for future inserts)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sessions' 
    AND column_name = 'id' 
    AND column_default IS NOT NULL
  ) THEN
    ALTER TABLE sessions ALTER COLUMN id SET DEFAULT gen_random_uuid();
  END IF;
END $$;

-- Add missing indexes (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_sessions_session_group_id ON sessions(session_group_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON sessions(created_at);

-- ========================================
-- ROW LEVEL SECURITY (RLS)
-- ========================================
-- Enable RLS on session_groups (only if not already enabled)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'session_groups' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE session_groups ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Enable RLS on sessions (only if not already enabled)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'sessions' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- ========================================
-- RLS POLICIES
-- ========================================
-- Only create policies if they don't already exist

-- Session Groups Policies
DO $$
BEGIN
  -- Users can view their own session groups
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'session_groups' 
    AND policyname = 'Users can view their own session groups'
  ) THEN
    CREATE POLICY "Users can view their own session groups" ON session_groups
      FOR SELECT USING (auth.uid() = user_id);
  END IF;

  -- Users can insert their own session groups
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'session_groups' 
    AND policyname = 'Users can insert their own session groups'
  ) THEN
    CREATE POLICY "Users can insert their own session groups" ON session_groups
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;

  -- Users can update their own session groups
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'session_groups' 
    AND policyname = 'Users can update their own session groups'
  ) THEN
    CREATE POLICY "Users can update their own session groups" ON session_groups
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;

  -- Users can delete their own session groups
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'session_groups' 
    AND policyname = 'Users can delete their own session groups'
  ) THEN
    CREATE POLICY "Users can delete their own session groups" ON session_groups
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- Sessions Policies
DO $$
BEGIN
  -- Users can view sessions in their session groups
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'sessions' 
    AND policyname = 'Users can view sessions in their session groups'
  ) THEN
    CREATE POLICY "Users can view sessions in their session groups" ON sessions
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM session_groups 
          WHERE session_groups.id = sessions.session_group_id 
          AND session_groups.user_id = auth.uid()
        )
      );
  END IF;

  -- Users can insert sessions in their session groups
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'sessions' 
    AND policyname = 'Users can insert sessions in their session groups'
  ) THEN
    CREATE POLICY "Users can insert sessions in their session groups" ON sessions
      FOR INSERT WITH CHECK (
        EXISTS (
          SELECT 1 FROM session_groups 
          WHERE session_groups.id = sessions.session_group_id 
          AND session_groups.user_id = auth.uid()
        )
      );
  END IF;

  -- Users can update sessions in their session groups
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'sessions' 
    AND policyname = 'Users can update sessions in their session groups'
  ) THEN
    CREATE POLICY "Users can update sessions in their session groups" ON sessions
      FOR UPDATE USING (
        EXISTS (
          SELECT 1 FROM session_groups 
          WHERE session_groups.id = sessions.session_group_id 
          AND session_groups.user_id = auth.uid()
        )
      );
  END IF;

  -- Users can delete sessions in their session groups
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'sessions' 
    AND policyname = 'Users can delete sessions in their session groups'
  ) THEN
    CREATE POLICY "Users can delete sessions in their session groups" ON sessions
      FOR DELETE USING (
        EXISTS (
          SELECT 1 FROM session_groups 
          WHERE session_groups.id = sessions.session_group_id 
          AND session_groups.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- ========================================
-- VERIFICATION
-- ========================================
-- This will show you what was created
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename IN ('session_groups', 'sessions')
AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- Show RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename IN ('session_groups', 'sessions')
ORDER BY tablename, policyname; 