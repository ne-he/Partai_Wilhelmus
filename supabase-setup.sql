-- ============================================================
-- FIX RLS POLICIES
-- ============================================================

-- USERS: drop policy lama, ganti biar semua yg login bisa baca
DROP POLICY IF EXISTS "Users can view own profile" ON users;
CREATE POLICY "Authenticated can read all users"
  ON users FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- PERSONAL TASKS: drop policy select lama, ganti biar bisa spectate
DROP POLICY IF EXISTS "Users can view own personal tasks" ON personal_tasks;
CREATE POLICY "Authenticated can read all personal tasks"
  ON personal_tasks FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- TASK LOGS: drop policy lama, ganti biar semua bisa baca & insert
DROP POLICY IF EXISTS "Users can view own logs" ON task_logs;
CREATE POLICY "Authenticated can read logs"
  ON task_logs FOR SELECT
  USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated can insert logs"
  ON task_logs FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================
-- INSERT USER PROFILES (dari Auth ke tabel users)
-- Jalankan ini supaya profile Papa/Mama/Nemi/Venly ada di tabel
-- Ganti email placeholder di bawah dengan email akun Auth masing-masing
-- sebelum dijalankan (email asli sengaja tidak disimpan di repo publik)
-- ============================================================

INSERT INTO users (id, username, email, role)
SELECT au.id, 'Papa', au.email, 'papa'
FROM auth.users au
WHERE au.email = 'papa@example.com'
ON CONFLICT (id) DO UPDATE SET username = 'Papa', role = 'papa';

INSERT INTO users (id, username, email, role)
SELECT au.id, 'Mama', au.email, 'mama'
FROM auth.users au
WHERE au.email = 'mama@example.com'
ON CONFLICT (id) DO UPDATE SET username = 'Mama', role = 'mama';

INSERT INTO users (id, username, email, role)
SELECT au.id, 'Nemi', au.email, 'nemi'
FROM auth.users au
WHERE au.email = 'nemi@example.com'
ON CONFLICT (id) DO UPDATE SET username = 'Nemi', role = 'nemi';

INSERT INTO users (id, username, email, role)
SELECT au.id, 'Venly', au.email, 'venly'
FROM auth.users au
WHERE au.email = 'venly@example.com'
ON CONFLICT (id) DO UPDATE SET username = 'Venly', role = 'venly';

-- ============================================================
-- VERIFIKASI (jalankan ini terpisah untuk cek hasilnya)
-- SELECT * FROM users;
-- ============================================================
