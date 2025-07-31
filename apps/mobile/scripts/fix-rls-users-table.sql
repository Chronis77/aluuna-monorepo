-- Fix RLS on users table - Enable RLS and verify
-- This addresses the "Policy Exists RLS Disabled" error

-- ========================================
-- ENABLE RLS ON USERS TABLE
-- ========================================

-- Force enable RLS on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- ========================================
-- VERIFICATION
-- ========================================

-- Check if RLS is now enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'users';

-- Show existing policies
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
WHERE tablename = 'users'
ORDER BY policyname;

-- Test that RLS is working by checking if a user can see their own data
-- (This will show the current user's ID if authenticated)
SELECT 
  'Current user ID:' as info,
  auth.uid() as user_id; 