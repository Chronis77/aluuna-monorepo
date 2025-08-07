-- Migration script to rename session tables to conversation-focused naming
-- Run this in your Supabase PostgreSQL database

-- Step 1: Rename tables
ALTER TABLE public.session_groups RENAME TO conversations;
ALTER TABLE public.sessions RENAME TO conversation_messages;
ALTER TABLE public.session_continuity RENAME TO conversation_continuity;
ALTER TABLE public.session_themes RENAME TO conversation_themes;

-- Step 2: Rename columns in conversation_messages table
ALTER TABLE public.conversation_messages RENAME COLUMN session_group_id TO conversation_id;

-- Step 3: Rename columns in conversation_continuity table
ALTER TABLE public.conversation_continuity RENAME COLUMN session_group_id TO conversation_id;

-- Step 4: Rename columns in conversation_themes table
ALTER TABLE public.conversation_themes RENAME COLUMN session_id TO conversation_id;

-- Step 5: Update foreign key constraints
-- Drop existing foreign key constraints
ALTER TABLE public.conversation_messages DROP CONSTRAINT IF EXISTS sessions_session_group_id_fkey;
ALTER TABLE public.conversation_continuity DROP CONSTRAINT IF EXISTS session_continuity_session_group_id_fkey;
ALTER TABLE public.conversation_themes DROP CONSTRAINT IF EXISTS session_themes_session_id_fkey;

-- Add new foreign key constraints
ALTER TABLE public.conversation_messages 
ADD CONSTRAINT conversation_messages_conversation_id_fkey 
FOREIGN KEY (conversation_id) REFERENCES public.conversations(id);

ALTER TABLE public.conversation_continuity 
ADD CONSTRAINT conversation_continuity_conversation_id_fkey 
FOREIGN KEY (conversation_id) REFERENCES public.conversations(id);

ALTER TABLE public.conversation_themes 
ADD CONSTRAINT conversation_themes_conversation_id_fkey 
FOREIGN KEY (conversation_id) REFERENCES public.conversations(id);

-- Step 6: Update any indexes (if they exist)
-- You may need to recreate indexes with new names
-- Example:
-- DROP INDEX IF EXISTS idx_sessions_session_group_id;
-- CREATE INDEX idx_conversation_messages_conversation_id ON public.conversation_messages(conversation_id);

-- Step 7: Update RLS policies (if they exist)
-- You'll need to recreate RLS policies with new table names
-- Example:
-- DROP POLICY IF EXISTS "Users can view their own sessions" ON public.sessions;
-- CREATE POLICY "Users can view their own conversation messages" ON public.conversation_messages
--   FOR SELECT USING (auth.uid() = user_id);

-- Step 8: Update any views or functions that reference the old table names
-- (You'll need to identify and update these based on your specific setup)

-- Step 9: Update any triggers (if they exist)
-- (You'll need to identify and update these based on your specific setup)

-- Verification queries to check the migration:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE '%conversation%';
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'conversation_messages';
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'conversations'; 