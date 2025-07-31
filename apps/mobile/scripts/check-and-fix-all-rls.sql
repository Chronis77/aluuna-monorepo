-- Comprehensive RLS Check and Fix Script
-- This script will check all tables and fix any RLS issues

-- ========================================
-- CHECK CURRENT RLS STATUS
-- ========================================

-- Show RLS status for all public tables
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled,
  CASE 
    WHEN rowsecurity = true THEN '✅ RLS Enabled'
    ELSE '❌ RLS Disabled'
  END as status
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- ========================================
-- FIX RLS ON SPECIFIC TABLES
-- ========================================

-- Enable RLS on users table (if not already enabled)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'users' 
    AND schemaname = 'public'
    AND rowsecurity = true
  ) THEN
    ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'RLS enabled on users table';
  ELSE
    RAISE NOTICE 'RLS already enabled on users table';
  END IF;
END $$;

-- Enable RLS on session_themes table (if not already enabled)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'session_themes' 
    AND schemaname = 'public'
    AND rowsecurity = true
  ) THEN
    ALTER TABLE public.session_themes ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'RLS enabled on session_themes table';
  ELSE
    RAISE NOTICE 'RLS already enabled on session_themes table';
  END IF;
END $$;

-- Enable RLS on themes table (if not already enabled)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'themes' 
    AND schemaname = 'public'
    AND rowsecurity = true
  ) THEN
    ALTER TABLE public.themes ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'RLS enabled on themes table';
  ELSE
    RAISE NOTICE 'RLS already enabled on themes table';
  END IF;
END $$;

-- ========================================
-- VERIFY POLICIES EXIST
-- ========================================

-- Check if users table has the required policies
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies 
  WHERE tablename = 'users' AND schemaname = 'public';
  
  IF policy_count = 0 THEN
    RAISE NOTICE 'No policies found on users table - creating them now';
    
    -- Create basic policies for users table
    CREATE POLICY "Users can view their own user record" ON public.users
      FOR SELECT USING (auth.uid() = id);
      
    CREATE POLICY "Users can update their own user record" ON public.users
      FOR UPDATE USING (auth.uid() = id);
      
    CREATE POLICY "Users can insert their own user record" ON public.users
      FOR INSERT WITH CHECK (auth.uid() = id);
      
  ELSE
    RAISE NOTICE 'Found % policies on users table', policy_count;
  END IF;
END $$;

-- Check if session_themes table has policies
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies 
  WHERE tablename = 'session_themes' AND schemaname = 'public';
  
  IF policy_count = 0 THEN
    RAISE NOTICE 'No policies found on session_themes table - creating them now';
    
    -- Create basic policies for session_themes table
    CREATE POLICY "Users can view session_themes for their sessions" ON public.session_themes
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM sessions s
          JOIN session_groups sg ON s.session_group_id = sg.id
          WHERE s.id = session_themes.session_id 
          AND sg.user_id = auth.uid()
        )
      );
      
    CREATE POLICY "Users can insert session_themes for their sessions" ON public.session_themes
      FOR INSERT WITH CHECK (
        EXISTS (
          SELECT 1 FROM sessions s
          JOIN session_groups sg ON s.session_group_id = sg.id
          WHERE s.id = session_themes.session_id 
          AND sg.user_id = auth.uid()
        )
      );
      
    CREATE POLICY "Users can delete session_themes for their sessions" ON public.session_themes
      FOR DELETE USING (
        EXISTS (
          SELECT 1 FROM sessions s
          JOIN session_groups sg ON s.session_group_id = sg.id
          WHERE s.id = session_themes.session_id 
          AND sg.user_id = auth.uid()
        )
      );
      
  ELSE
    RAISE NOTICE 'Found % policies on session_themes table', policy_count;
  END IF;
END $$;

-- Check if themes table has policies
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies 
  WHERE tablename = 'themes' AND schemaname = 'public';
  
  IF policy_count = 0 THEN
    RAISE NOTICE 'No policies found on themes table - creating them now';
    
    -- Create basic policies for themes table
    CREATE POLICY "Users can view all themes" ON public.themes
      FOR SELECT USING (true);
      
    CREATE POLICY "Authenticated users can insert themes" ON public.themes
      FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
      
    CREATE POLICY "Authenticated users can update themes" ON public.themes
      FOR UPDATE USING (auth.uid() IS NOT NULL);
      
    CREATE POLICY "Authenticated users can delete themes" ON public.themes
      FOR DELETE USING (auth.uid() IS NOT NULL);
      
  ELSE
    RAISE NOTICE 'Found % policies on themes table', policy_count;
  END IF;
END $$;

-- ========================================
-- FINAL VERIFICATION
-- ========================================

-- Show final RLS status
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled,
  CASE 
    WHEN rowsecurity = true THEN '✅ RLS Enabled'
    ELSE '❌ RLS Disabled'
  END as status
FROM pg_tables 
WHERE schemaname = 'public'
  AND tablename IN ('users', 'session_themes', 'themes')
ORDER BY tablename;

-- Show all policies
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  permissive
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename IN ('users', 'session_themes', 'themes')
ORDER BY tablename, policyname; 