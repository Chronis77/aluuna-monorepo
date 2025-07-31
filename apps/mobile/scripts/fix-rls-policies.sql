-- Fix RLS Policies for session_groups table
-- This script fixes the UPDATE policy that might be causing issues

-- Drop existing UPDATE policy
DROP POLICY IF EXISTS "Users can update their own session groups" ON session_groups;

-- Create new UPDATE policy with both USING and WITH CHECK
CREATE POLICY "Users can update their own session groups" ON session_groups
  FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Also create a more permissive policy for testing
CREATE POLICY "Users can update their own session groups permissive" ON session_groups
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Verify the policies
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
WHERE tablename = 'session_groups'
AND policyname LIKE '%update%'
ORDER BY policyname; 