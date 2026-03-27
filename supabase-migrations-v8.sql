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

-- ============================================
-- 7. Triggers untuk Notifikasi Push
-- ============================================

-- Fungsi helper untuk memanggil Edge Function send-push-notification
-- Menggunakan pg_net extension (sudah tersedia di Supabase)
CREATE OR REPLACE FUNCTION call_push_notification(payload JSONB)
RETURNS void AS $$
BEGIN
  PERFORM net.http_post(
    url     := current_setting('app.edge_function_url', true) || '/send-push-notification',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || current_setting('app.service_role_key', true)
    ),
    body    := payload::text
  );
EXCEPTION WHEN OTHERS THEN
  -- Jangan gagalkan transaksi utama jika push notification gagal
  RAISE WARNING 'Push notification failed: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- -----------------------------------------------
-- Trigger 1: Task baru di family_tasks
-- -----------------------------------------------
CREATE OR REPLACE FUNCTION notify_on_family_task_insert()
RETURNS TRIGGER AS $$
DECLARE
  recipient RECORD;
BEGIN
  FOR recipient IN
    SELECT id FROM users WHERE id != NEW.created_by
  LOOP
    PERFORM call_push_notification(jsonb_build_object(
      'user_id', recipient.id,
      'title',   'Tugas Baru',
      'body',    NEW.title,
      'data',    jsonb_build_object('task_id', NEW.id, 'url', '/family')
    ));
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_family_task_insert
  AFTER INSERT ON family_tasks
  FOR EACH ROW EXECUTE FUNCTION notify_on_family_task_insert();

-- -----------------------------------------------
-- Trigger 2: Komentar baru di task_comments
-- -----------------------------------------------
CREATE OR REPLACE FUNCTION notify_on_comment_insert()
RETURNS TRIGGER AS $$
DECLARE
  task_record RECORD;
  recipient   RECORD;
BEGIN
  SELECT * INTO task_record FROM family_tasks WHERE id = NEW.task_id;

  FOR recipient IN
    SELECT DISTINCT u.id FROM users u
    WHERE u.id != NEW.user_id
      AND (
        u.id = task_record.assigned_to
        OR u.role IN ('papa', 'mama')
      )
  LOOP
    PERFORM call_push_notification(jsonb_build_object(
      'user_id', recipient.id,
      'title',   'Komentar Baru',
      'body',    LEFT(NEW.content, 50),
      'data',    jsonb_build_object('task_id', NEW.task_id, 'url', '/family')
    ));
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_comment_insert
  AFTER INSERT ON task_comments
  FOR EACH ROW EXECUTE FUNCTION notify_on_comment_insert();

-- -----------------------------------------------
-- Trigger 3: Assignment berubah di family_tasks
-- -----------------------------------------------
CREATE OR REPLACE FUNCTION notify_on_assignment()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.assigned_to IS NOT NULL
     AND NEW.assigned_to IS DISTINCT FROM OLD.assigned_to THEN
    PERFORM call_push_notification(jsonb_build_object(
      'user_id', NEW.assigned_to,
      'title',   'Kamu Ditugaskan',
      'body',    NEW.title,
      'data',    jsonb_build_object('task_id', NEW.id, 'url', '/family')
    ));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_task_assignment
  AFTER UPDATE OF assigned_to ON family_tasks
  FOR EACH ROW EXECUTE FUNCTION notify_on_assignment();

-- ============================================
-- 8. Konfigurasi app settings untuk trigger
-- ============================================
-- Jalankan perintah ini di Supabase SQL Editor setelah deploy Edge Function:
--
-- SET app.edge_function_url = 'https://<project-ref>.supabase.co/functions/v1';
-- SET app.service_role_key = '<your-service-role-key>';
--
-- Atau gunakan Supabase Dashboard > Settings > Database > Extensions
-- Aktifkan extension pg_net jika belum aktif:

CREATE EXTENSION IF NOT EXISTS pg_net;

-- ============================================
-- 9. Verifikasi triggers
-- ============================================
-- Cek triggers yang sudah dibuat:
-- SELECT trigger_name, event_manipulation, event_object_table
-- FROM information_schema.triggers
-- WHERE trigger_schema = 'public'
-- ORDER BY event_object_table;
