-- Family App V8 Database Migrations
-- v8: Family Comments & Notifications
-- Run this SQL in your Supabase SQL Editor

-- ============================================
-- 1. Create task_comments table
-- ============================================

CREATE TABLE IF NOT EXISTS task_comments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id    UUID NOT NULL REFERENCES family_tasks(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES users(id),
  content    TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 2. Enable Row Level Security
-- ============================================

ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 3. RLS Policies
-- ============================================

-- SELECT: semua authenticated user bisa baca
CREATE POLICY "Authenticated can read comments"
  ON task_comments FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- INSERT: hanya bisa insert dengan user_id = auth.uid()
CREATE POLICY "Users can insert own comments"
  ON task_comments FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- UPDATE: milik sendiri ATAU role papa/mama
CREATE POLICY "Users can update comments"
  ON task_comments FOR UPDATE
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('papa', 'mama')
    )
  );

-- DELETE: milik sendiri ATAU role papa/mama
CREATE POLICY "Users can delete comments"
  ON task_comments FOR DELETE
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('papa', 'mama')
    )
  );

-- ============================================
-- 4. Index untuk performa query per task
-- ============================================

CREATE INDEX IF NOT EXISTS idx_task_comments_task_id ON task_comments(task_id, created_at);

-- ============================================
-- 5. Add deadline column to family_tasks
-- ============================================

ALTER TABLE family_tasks ADD COLUMN IF NOT EXISTS deadline TIMESTAMPTZ;

-- ============================================
-- 6. Create push_subscriptions table
-- ============================================

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  endpoint   TEXT NOT NULL UNIQUE,
  keys       JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- SELECT: user hanya bisa baca miliknya sendiri
CREATE POLICY "Users can read own subscriptions"
  ON push_subscriptions FOR SELECT
  USING (user_id = auth.uid());

-- INSERT: user hanya bisa insert miliknya sendiri
CREATE POLICY "Users can insert own subscriptions"
  ON push_subscriptions FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- DELETE: user hanya bisa hapus miliknya sendiri
CREATE POLICY "Users can delete own subscriptions"
  ON push_subscriptions FOR DELETE
  USING (user_id = auth.uid());
