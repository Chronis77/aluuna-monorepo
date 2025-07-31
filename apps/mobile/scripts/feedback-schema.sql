-- Feedback System Database Schema
-- This creates a table to store user feedback with AI processing

CREATE TABLE IF NOT EXISTS feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  raw_feedback TEXT NOT NULL,
  ai_summary TEXT,
  priority VARCHAR(20) CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  feedback_type VARCHAR(50) DEFAULT 'general',
  device_info JSONB,
  app_version VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'resolved', 'ignored')),
  tags TEXT[],
  metadata JSONB
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at);
CREATE INDEX IF NOT EXISTS idx_feedback_priority ON feedback(priority);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback(status);
CREATE INDEX IF NOT EXISTS idx_feedback_type ON feedback(feedback_type);

-- Enable Row Level Security (RLS)
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own feedback" ON feedback
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own feedback" ON feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own feedback" ON feedback
  FOR UPDATE USING (auth.uid() = user_id);

-- Create a function to automatically set processed_at when status changes to 'processed'
CREATE OR REPLACE FUNCTION update_feedback_processed_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'processed' AND OLD.status != 'processed' THEN
    NEW.processed_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update processed_at
CREATE TRIGGER trigger_update_feedback_processed_at
  BEFORE UPDATE ON feedback
  FOR EACH ROW
  EXECUTE FUNCTION update_feedback_processed_at();

-- Add comments for documentation
COMMENT ON TABLE feedback IS 'Stores user feedback with AI processing for bug reports and feature requests';
COMMENT ON COLUMN feedback.raw_feedback IS 'The original user feedback text';
COMMENT ON COLUMN feedback.ai_summary IS 'AI-generated summary of the feedback';
COMMENT ON COLUMN feedback.priority IS 'AI-determined priority level';
COMMENT ON COLUMN feedback.feedback_type IS 'Type of feedback (bug, feature, general, etc.)';
COMMENT ON COLUMN feedback.device_info IS 'Device information when feedback was submitted';
COMMENT ON COLUMN feedback.app_version IS 'App version when feedback was submitted';
COMMENT ON COLUMN feedback.status IS 'Current status of the feedback';
COMMENT ON COLUMN feedback.tags IS 'AI-generated tags for categorization';
COMMENT ON COLUMN feedback.metadata IS 'Additional metadata about the feedback'; 