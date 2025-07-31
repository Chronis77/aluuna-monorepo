-- Enable RLS on missing tables flagged by Supabase linter
-- This script addresses the security warnings for:
-- - public.users
-- - public.session_themes  
-- - public.themes

-- ========================================
-- ENABLE RLS ON TABLES
-- ========================================

-- Enable RLS on users table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'users' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE users ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Enable RLS on session_themes table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'session_themes' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE session_themes ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Enable RLS on themes table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'themes' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE themes ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- ========================================
-- RLS POLICIES FOR USERS TABLE
-- ========================================

-- Users can only view their own user record
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'users' 
    AND policyname = 'Users can view their own user record'
  ) THEN
    CREATE POLICY "Users can view their own user record" ON users
      FOR SELECT USING (auth.uid() = id);
  END IF;
END $$;

-- Users can update their own user record
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'users' 
    AND policyname = 'Users can update their own user record'
  ) THEN
    CREATE POLICY "Users can update their own user record" ON users
      FOR UPDATE USING (auth.uid() = id);
  END IF;
END $$;

-- Users can insert their own user record (for registration)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'users' 
    AND policyname = 'Users can insert their own user record'
  ) THEN
    CREATE POLICY "Users can insert their own user record" ON users
      FOR INSERT WITH CHECK (auth.uid() = id);
  END IF;
END $$;

-- Users cannot delete their own user record (for data retention)
-- This policy is intentionally omitted to prevent accidental data loss

-- ========================================
-- RLS POLICIES FOR SESSION_THEMES TABLE
-- ========================================

-- Users can view session_themes for sessions they own
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'session_themes' 
    AND policyname = 'Users can view session_themes for their sessions'
  ) THEN
    CREATE POLICY "Users can view session_themes for their sessions" ON session_themes
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM sessions s
          JOIN session_groups sg ON s.session_group_id = sg.id
          WHERE s.id = session_themes.session_id 
          AND sg.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Users can insert session_themes for sessions they own
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'session_themes' 
    AND policyname = 'Users can insert session_themes for their sessions'
  ) THEN
    CREATE POLICY "Users can insert session_themes for their sessions" ON session_themes
      FOR INSERT WITH CHECK (
        EXISTS (
          SELECT 1 FROM sessions s
          JOIN session_groups sg ON s.session_group_id = sg.id
          WHERE s.id = session_themes.session_id 
          AND sg.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Users can delete session_themes for sessions they own
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'session_themes' 
    AND policyname = 'Users can delete session_themes for their sessions'
  ) THEN
    CREATE POLICY "Users can delete session_themes for their sessions" ON session_themes
      FOR DELETE USING (
        EXISTS (
          SELECT 1 FROM sessions s
          JOIN session_groups sg ON s.session_group_id = sg.id
          WHERE s.id = session_themes.session_id 
          AND sg.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- ========================================
-- RLS POLICIES FOR THEMES TABLE
-- ========================================

-- Themes are shared across all users, so we need a different approach
-- Users can view all themes (they're shared reference data)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'themes' 
    AND policyname = 'Users can view all themes'
  ) THEN
    CREATE POLICY "Users can view all themes" ON themes
      FOR SELECT USING (true);
  END IF;
END $$;

-- Only authenticated users can insert new themes (for system use)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'themes' 
    AND policyname = 'Authenticated users can insert themes'
  ) THEN
    CREATE POLICY "Authenticated users can insert themes" ON themes
      FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
  END IF;
END $$;

-- Only authenticated users can update themes (for system use)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'themes' 
    AND policyname = 'Authenticated users can update themes'
  ) THEN
    CREATE POLICY "Authenticated users can update themes" ON themes
      FOR UPDATE USING (auth.uid() IS NOT NULL);
  END IF;
END $$;

-- Only authenticated users can delete themes (for system use)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'themes' 
    AND policyname = 'Authenticated users can delete themes'
  ) THEN
    CREATE POLICY "Authenticated users can delete themes" ON themes
      FOR DELETE USING (auth.uid() IS NOT NULL);
  END IF;
END $$;

-- ========================================
-- VERIFICATION
-- ========================================

-- Show RLS status for all tables
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('users', 'session_themes', 'themes')
ORDER BY tablename;

-- Show RLS policies for the tables
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
WHERE tablename IN ('users', 'session_themes', 'themes')
ORDER BY tablename, policyname; 