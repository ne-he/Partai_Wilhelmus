-- Family App V4 Database Migrations
-- Run this SQL in your Supabase SQL Editor

-- ============================================
-- 1. Create focus_sessions table
-- ============================================

CREATE TABLE IF NOT EXISTS focus_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  task_id UUID REFERENCES personal_tasks(id) ON DELETE SET NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  duration INTEGER NOT NULL, -- in minutes
  session_type VARCHAR(10) NOT NULL CHECK (session_type IN ('work', 'break')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for focus_sessions
CREATE INDEX IF NOT EXISTS idx_focus_sessions_user_id ON focus_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_focus_sessions_created_at ON focus_sessions(created_at);
CREATE INDEX IF NOT EXISTS idx_focus_sessions_task_id ON focus_sessions(task_id);

-- Enable RLS on focus_sessions
ALTER TABLE focus_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for focus_sessions
CREATE POLICY "Users can view own focus sessions"
  ON focus_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own focus sessions"
  ON focus_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 2. Create task_queue table
-- ============================================

CREATE TABLE IF NOT EXISTS task_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'in_progress', 'done')),
  original_created_at TIMESTAMPTZ NOT NULL,
  queued_at TIMESTAMPTZ DEFAULT NOW(),
  "order" INTEGER NOT NULL DEFAULT 0
);

-- Create indexes for task_queue
CREATE INDEX IF NOT EXISTS idx_task_queue_user_id ON task_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_task_queue_queued_at ON task_queue(queued_at);

-- Enable RLS on task_queue
ALTER TABLE task_queue ENABLE ROW LEVEL SECURITY;

-- RLS Policies for task_queue
CREATE POLICY "Users can view own queue"
  ON task_queue FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own queue"
  ON task_queue FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own queue"
  ON task_queue FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own queue"
  ON task_queue FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 3. Update personal_tasks table
-- ============================================

-- Add order column if it doesn't exist
ALTER TABLE personal_tasks ADD COLUMN IF NOT EXISTS "order" INTEGER DEFAULT 0;

-- Create indexes for personal_tasks
CREATE INDEX IF NOT EXISTS idx_personal_tasks_user_status ON personal_tasks(user_id, status);
CREATE INDEX IF NOT EXISTS idx_personal_tasks_order ON personal_tasks("order");

-- ============================================
-- Verification Queries
-- ============================================

-- Verify focus_sessions table
SELECT 
  table_name, 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'focus_sessions'
ORDER BY ordinal_position;

-- Verify task_queue table
SELECT 
  table_name, 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'task_queue'
ORDER BY ordinal_position;

-- Verify personal_tasks order column
SELECT 
  column_name, 
  data_type, 
  column_default
FROM information_schema.columns
WHERE table_name = 'personal_tasks' AND column_name = 'order';
