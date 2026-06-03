-- ============================================================================
--  Cleanup migration — buang sisa fitur Pomodoro (legacy)
--  Tabel focus_sessions dibuat di supabase-migrations-v4.sql tapi tidak lagi
--  dipakai oleh kode aplikasi mana pun. Aman untuk di-drop.
--
--  CARA PAKAI: buka Supabase SQL Editor, paste isi file ini, Run.
--  CASCADE ikut menghapus index & RLS policy yang menempel pada tabel.
-- ============================================================================

DROP TABLE IF EXISTS focus_sessions CASCADE;
