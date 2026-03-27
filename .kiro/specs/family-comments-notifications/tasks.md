# Tasks — v8: Family Comments & Notifications

## Task List

- [x] 1.1 db: add task_comments table and RLS policies
- [x] 1.2 db: add push_subscriptions table
- [x] 1.3 db: add triggers for notification events
- [x] 2.1 feat: create TaskDetailModal component
- [x] 2.2 feat: display comments in TaskDetailModal with pagination
- [x] 2.3 feat: add comment form with emoji picker
- [x] 2.4 feat: allow edit/delete comments with role-based access
- [x] 2.5 feat: real-time comments with Supabase Realtime
- [x] 3.1 feat: in-app toast notifications for family events
- [x] 3.2 feat: add notification permission UI and subscription storage
- [x] 3.3 feat: add service worker and VAPID setup
- [x] 3.4 feat: edge function for sending push notifications
- [x] 3.5 feat: trigger push notifications from database events
- [x] 3.6 feat: daily deadline reminder notifications
- [x] 4.1 feat: open comment modal from family task card
- [x] 4.2 feat: add loading and error states for comment section
- [x] 4.3 test: end-to-end testing for comments and notifications
- [ ] 4.4 docs: update README and changelog for v8

---

## Task Details

### 1.1 db: add task_comments table and RLS policies

Buat migration SQL untuk tabel `task_comments` beserta RLS policies.

**Files**:
- `supabase-migrations-v8.sql` (baru)

**Checklist**:
- [ ] CREATE TABLE task_comments dengan semua kolom (id, task_id, user_id, content, created_at, updated_at)
- [ ] Foreign key task_id → family_tasks(id) ON DELETE CASCADE
- [ ] Foreign key user_id → users(id)
- [ ] ALTER TABLE ENABLE ROW LEVEL SECURITY
- [ ] Policy SELECT: authenticated users
- [ ] Policy INSERT: user_id = auth.uid()
- [ ] Policy UPDATE: own OR role IN ('papa','mama')
- [ ] Policy DELETE: own OR role IN ('papa','mama')
- [ ] CREATE INDEX idx_task_comments_task_id ON task_comments(task_id, created_at)
- [ ] ALTER TABLE family_tasks ADD COLUMN IF NOT EXISTS deadline TIMESTAMPTZ

**Validates**: Requirements 1.1–1.10, 14.5

---

### 1.2 db: add push_subscriptions table

Buat tabel `push_subscriptions` dengan RLS.

**Files**:
- `supabase-migrations-v8.sql` (append)

**Checklist**:
- [ ] CREATE TABLE push_subscriptions (id, user_id, endpoint UNIQUE, keys JSONB, created_at)
- [ ] Foreign key user_id → users(id) ON DELETE CASCADE
- [ ] ENABLE ROW LEVEL SECURITY
- [ ] Policy SELECT: user_id = auth.uid()
- [ ] Policy INSERT: user_id = auth.uid()
- [ ] Policy DELETE: user_id = auth.uid()

**Validates**: Requirements 2.1–2.7

---

### 1.3 db: add triggers for notification events

Buat fungsi trigger PostgreSQL yang memanggil Edge Function `send-push-notification`.

**Files**:
- `supabase-migrations-v8.sql` (append)

**Checklist**:
- [ ] Fungsi helper `call_push_notification(payload JSONB)` menggunakan `net.http_post`
- [ ] Trigger `on_family_task_insert` → kirim ke semua user kecuali pembuat
- [ ] Trigger `on_comment_insert` → kirim ke assigned_to + BOSS/CONSIGLIERE kecuali pembuat
- [ ] Trigger `on_task_assignment` → kirim ke user yang baru di-assign
- [ ] Error handling: RAISE WARNING, tidak gagalkan transaksi utama

**Validates**: Requirements 3.1–3.6, 13.1–13.5

---

### 2.1 feat: create TaskDetailModal component

Buat komponen modal untuk menampilkan detail task.

**Files**:
- `components/TaskDetailModal.tsx` (baru)

**Checklist**:
- [ ] Props: task, users, profile, onClose
- [ ] AnimatePresence dengan scale 0.9→1.0 + opacity 0→1 (Framer Motion)
- [ ] Tampilkan: judul task, status badge (warna dari statusConfig), assignee alias (DISPLAY_NAME_MAP), tanggal dibuat
- [ ] Tombol tutup (✕) di pojok kanan atas
- [ ] Klik backdrop → onClose
- [ ] useEffect: lock/unlock body scroll
- [ ] Layout responsif: centered modal desktop, full-screen bottom sheet mobile (useBreakpoint)
- [ ] Slot untuk CommentSection (placeholder dulu, diisi di task 2.2)
- [ ] Tema mafia vintage: bg-card, border, accent, Playfair Display

**Validates**: Requirements 4.1–4.7

---

### 2.2 feat: display comments in TaskDetailModal with pagination

Implementasi `useRealtimeComments` hook dan `CommentList` + `CommentItem`.

**Files**:
- `Lib/hooks/useRealtimeComments.ts` (baru)
- `components/CommentList.tsx` (baru)
- `components/CommentItem.tsx` (baru)
- `components/CommentSection.tsx` (baru)
- `Lib/types.ts` (baru — shared types)

**Checklist**:
- [ ] Type `Comment` di `Lib/types.ts`
- [ ] `useRealtimeComments`: fetch 10 komentar pertama (ascending created_at), state: comments, loading, error, hasMore, loadingMore
- [ ] `useRealtimeComments`: fungsi loadMore (fetch 10 berikutnya, append)
- [ ] `useRealtimeComments`: fungsi addComment, editComment, deleteComment
- [ ] `CommentList`: render daftar CommentItem, skeleton (Skeleton variant='task-list' count=3) saat loading, empty state, error state + retry, tombol "Muat lebih banyak"
- [ ] `CommentItem`: avatar inisial (2 huruf), alias dari DISPLAY_NAME_MAP, timestamp relatif (formatRelativeTime helper), teks komentar
- [ ] `CommentItem`: warna avatar sesuai role (papa #c8a96e, mama #b8956a, anak #9c8a72)
- [ ] `CommentSection`: orchestrator, inisialisasi useRealtimeComments, render CommentList + CommentForm
- [ ] Integrasi CommentSection ke TaskDetailModal

**Validates**: Requirements 5.1–5.7, 8.1

---

### 2.3 feat: add comment form with emoji picker

Implementasi `CommentForm` dengan emoji picker.

**Files**:
- `components/CommentForm.tsx` (baru)
- `package.json` (tambah `emoji-picker-react`)

**Checklist**:
- [ ] Install `emoji-picker-react` (npm install emoji-picker-react)
- [ ] Textarea dengan placeholder "Tulis komentar..."
- [ ] Tombol emoji 🙂 → toggle popup EmojiPicker
- [ ] Klik emoji → insert ke posisi kursor textarea
- [ ] Tombol "Kirim" disabled saat textarea kosong atau loading
- [ ] Keyboard shortcut: Ctrl+Enter / Cmd+Enter → submit
- [ ] Loading state: spinner di tombol Kirim, textarea disabled
- [ ] Setelah submit berhasil: kosongkan textarea, tutup emoji picker
- [ ] Styling konsisten dengan tema mafia vintage

**Validates**: Requirements 6.1–6.9

---

### 2.4 feat: allow edit/delete comments with role-based access

Implementasi inline edit dan delete dengan ConfirmModal.

**Files**:
- `components/CommentItem.tsx` (update)
- `Lib/hooks/useRealtimeComments.ts` (update — editComment, deleteComment)

**Checklist**:
- [ ] Three-dots menu (⋯) hanya tampil jika: user_id = profile.id ATAU profile.role IN ('papa','mama')
- [ ] Dropdown menu: opsi "Edit" dan "Hapus"
- [ ] Mode edit: ganti teks dengan textarea pre-filled, tombol "Simpan" dan "Batal"
- [ ] Simpan: UPDATE task_comments SET content=?, updated_at=now() WHERE id=?
- [ ] Setelah edit berhasil: tampilkan tanda "(diedit)" di samping timestamp
- [ ] Hapus: tampilkan ConfirmModal "Hapus komentar ini?"
- [ ] Konfirmasi hapus: DELETE FROM task_comments WHERE id=?
- [ ] Error handling: toast error untuk gagal edit/hapus

**Validates**: Requirements 7.1–7.9

---

### 2.5 feat: real-time comments with Supabase Realtime

Aktifkan Supabase Realtime subscription di `useRealtimeComments`.

**Files**:
- `Lib/hooks/useRealtimeComments.ts` (update)

**Checklist**:
- [ ] Subscribe ke channel `comments:${taskId}` dengan filter `task_id=eq.${taskId}`
- [ ] Handle event INSERT: append komentar baru ke state (jika bukan dari user sendiri, tampilkan toast "Komentar baru dari [alias]")
- [ ] Handle event UPDATE: update komentar in-place di state
- [ ] Handle event DELETE: hapus komentar dari state dengan AnimatePresence exit
- [ ] useEffect cleanup: unsubscribe saat unmount (supabase.removeChannel)
- [ ] Pastikan tidak ada duplicate subscription

**Validates**: Requirements 8.1–8.7

---

### 3.1 feat: in-app toast notifications for family events

Implementasi `useNotifications` hook untuk in-app toast.

**Files**:
- `Lib/hooks/useNotifications.ts` (baru)
- `app/family/page.tsx` (update — tambah useNotifications)

**Checklist**:
- [ ] `useNotifications(userId, showToast)`: subscribe ke channel `family-events` (broadcast)
- [ ] Subscribe ke channel `user-${userId}` (private)
- [ ] Handle event `new_task`: toast info "Tugas baru: [judul]"
- [ ] Handle event `new_comment`: toast info "Komentar baru dari [alias] pada [judul task]"
- [ ] Handle event `assignment`: toast info "Kamu ditugaskan ke: [judul task]"
- [ ] Handle event `deadline_warning`: toast warning "Deadline besok: [judul task]"
- [ ] useEffect cleanup: unsubscribe semua channel saat unmount
- [ ] Integrasi ke `family/page.tsx`: panggil useNotifications dengan profile.id dan showToast

**Validates**: Requirements 9.1–9.7

---

### 3.2 feat: add notification permission UI and subscription storage

Buat halaman Settings dengan toggle notifikasi browser.

**Files**:
- `app/settings/page.tsx` (baru)
- `components/Navigation.tsx` (update — tambah link Settings)

**Checklist**:
- [ ] Halaman `/settings` dengan layout mafia vintage (PageTransition, Sidebar)
- [ ] Toggle "Aktifkan Notifikasi Browser"
- [ ] Tampilkan status izin saat ini: Aktif / Nonaktif / Ditolak
- [ ] Klik toggle ON: panggil `Notification.requestPermission()`
- [ ] Jika granted: register service worker, buat PushSubscription dengan VAPID public key
- [ ] Simpan endpoint + keys ke `push_subscriptions` via Supabase
- [ ] Klik toggle OFF: unsubscribe dari PushManager, hapus dari `push_subscriptions`
- [ ] Jika browser tidak support: disable toggle + pesan informatif
- [ ] Jika permission denied: pesan "Aktifkan melalui pengaturan browser"
- [ ] Guard: cek `typeof window !== 'undefined'` untuk SSR safety

**Validates**: Requirements 10.1–10.8

---

### 3.3 feat: add service worker and VAPID setup

Buat service worker dan konfigurasi VAPID.

**Files**:
- `public/sw.js` (baru)
- `.env.local` (update — tambah VAPID keys)
- `README.md` (update — instruksi generate VAPID)

**Checklist**:
- [ ] `public/sw.js`: event listener `push` → `showNotification` dengan title, body, icon, data
- [ ] `public/sw.js`: event listener `notificationclick` → tutup notifikasi, buka/fokus tab aplikasi ke URL dari data
- [ ] Tambah `NEXT_PUBLIC_VAPID_PUBLIC_KEY` ke `.env.local` (placeholder)
- [ ] Tambah `VAPID_PRIVATE_KEY` ke `.env.local` (placeholder, server-only)
- [ ] Tambah `VAPID_SUBJECT` ke `.env.local`
- [ ] Pastikan `VAPID_PRIVATE_KEY` tidak ada di `NEXT_PUBLIC_*`

**Validates**: Requirements 11.1–11.6

---

### 3.4 feat: edge function for sending push notifications

Buat Supabase Edge Function `send-push-notification`.

**Files**:
- `supabase/functions/send-push-notification/index.ts` (baru)
- `supabase/functions/send-push-notification/deno.json` (baru)

**Checklist**:
- [ ] Validasi Authorization header (service role key)
- [ ] Parse payload: user_id, title, body, data
- [ ] Query `push_subscriptions` WHERE user_id = payload.user_id
- [ ] Untuk setiap endpoint: kirim via `web-push` dengan VAPID credentials dari env
- [ ] Jika endpoint return 410: DELETE dari push_subscriptions
- [ ] Return HTTP 200 dengan `{ sent, failed }`
- [ ] Return HTTP 500 jika semua endpoint gagal
- [ ] Import `web-push` via esm.sh (Deno compatible)

**Validates**: Requirements 12.1–12.7

---

### 3.5 feat: trigger push notifications from database events

Aktifkan trigger database yang sudah dibuat di task 1.3 dan verifikasi end-to-end.

**Files**:
- `supabase-migrations-v8.sql` (verifikasi)
- `supabase/functions/send-push-notification/index.ts` (verifikasi)

**Checklist**:
- [ ] Set `app.edge_function_url` di Supabase project settings
- [ ] Set `app.service_role_key` di Supabase project settings
- [ ] Test trigger task baru: insert family_task → push terkirim ke semua user kecuali pembuat
- [ ] Test trigger komentar: insert task_comment → push terkirim ke assigned_to + BOSS/CONSIGLIERE
- [ ] Test trigger assignment: update assigned_to → push terkirim ke user yang di-assign
- [ ] Verifikasi: pembuat event tidak menerima notifikasi sendiri

**Validates**: Requirements 13.1–13.5

---

### 3.6 feat: daily deadline reminder notifications

Buat Edge Function terjadwal untuk reminder deadline H-1.

**Files**:
- `supabase/functions/deadline-reminder/index.ts` (baru)
- `vercel.json` (update — tambah cron job)

**Checklist**:
- [ ] Edge Function `deadline-reminder`: query tasks dengan deadline dalam window [now+20h, now+28h] dan status != 'done'
- [ ] Untuk setiap task: kirim notifikasi ke assigned_to (jika ada) dengan title "Deadline Besok"
- [ ] Untuk setiap task: kirim notifikasi ke semua BOSS/CONSIGLIERE dengan body berisi judul task + nama assignee
- [ ] Return log: jumlah task diproses + jumlah notifikasi terkirim
- [ ] Tambah cron di `vercel.json`: `"0 0 * * *"` (00:00 UTC = 07:00 WIB) → `/api/cron/deadline-reminder`
- [ ] Buat `app/api/cron/deadline-reminder/route.ts` yang memanggil Edge Function

**Validates**: Requirements 14.1–14.6

---

### 4.1 feat: open comment modal from family task card

Integrasi TaskDetailModal ke `family/page.tsx`.

**Files**:
- `app/family/page.tsx` (update)
- `components/DroppableFamilyTask.tsx` (update — tambah onClick prop)

**Checklist**:
- [ ] State `selectedTask: FamilyTask | null` di family/page.tsx
- [ ] Tambah prop `onClick?: (task: FamilyTask) => void` ke DroppableFamilyTask
- [ ] DroppableFamilyTask: panggil onClick saat klik (bukan saat drag — threshold 5px sudah ada di PointerSensor)
- [ ] Mobile card: tambah onClick handler yang sama
- [ ] Render `<TaskDetailModal task={selectedTask} ... onClose={() => setSelectedTask(null)} />`
- [ ] Teruskan `users` dan `profile` ke TaskDetailModal

**Validates**: Requirements 15.1–15.5

---

### 4.2 feat: add loading and error states for comment section

Polish loading dan error states di seluruh comment flow.

**Files**:
- `components/CommentList.tsx` (update)
- `components/CommentForm.tsx` (update)
- `components/CommentItem.tsx` (update)
- `Lib/hooks/useRealtimeComments.ts` (update)

**Checklist**:
- [ ] CommentList: 3 skeleton items (Skeleton variant='task-list') saat initial loading
- [ ] CommentList: spinner/skeleton di bawah list saat loadingMore
- [ ] CommentList: error state dengan tombol "Coba Lagi" yang trigger retry fetch
- [ ] CommentForm: pertahankan teks textarea saat submit gagal (jangan kosongkan)
- [ ] CommentItem: pertahankan inline edit terbuka saat edit gagal
- [ ] CommentItem: komentar tetap tampil saat delete gagal
- [ ] useRealtimeComments: gunakan AbortController atau isMounted flag untuk cancel async saat unmount

**Validates**: Requirements 16.1–16.7

---

### 4.3 test: end-to-end testing for comments and notifications

Tulis property-based tests dan unit tests.

**Files**:
- `__tests__/properties/family-comments-notifications.test.ts` (baru)
- `__tests__/unit/CommentForm.test.tsx` (baru)
- `__tests__/unit/CommentItem.test.tsx` (baru)
- `__tests__/unit/CommentList.test.tsx` (baru)

**Checklist**:
- [ ] Property 1: Comment Insert Round-Trip (fast-check, 100 runs)
- [ ] Property 2: updated_at Invariant (fast-check, 100 runs)
- [ ] Property 3: Cascade Delete No Orphan (fast-check, 100 runs)
- [ ] Property 4: RLS SOLDATO Own Only (fast-check, 100 runs)
- [ ] Property 5: RLS BOSS/CONSIGLIERE All (fast-check, 100 runs)
- [ ] Property 6: RLS INSERT Matching user_id (fast-check, 100 runs)
- [ ] Property 7: Pagination First Load ≤ 10 (fast-check, 100 runs)
- [ ] Property 8: Comment Rendering Required Fields (fast-check, 100 runs)
- [ ] Property 9: Empty Input Rejection (fast-check, 100 runs)
- [ ] Property 10: Realtime State Consistency (fast-check, 100 runs)
- [ ] Property 11: Push Subscription Round-Trip (fast-check, 100 runs)
- [ ] Property 12: Error Preservation Textarea (fast-check, 100 runs)
- [ ] Property 13: Deadline Query Window (fast-check, 100 runs)
- [ ] Unit: CommentForm render, submit, disabled state, Ctrl+Enter
- [ ] Unit: CommentItem role-based three-dots visibility
- [ ] Unit: CommentList empty state, skeleton, error state

**Validates**: Requirements 17.1–17.5, semua Correctness Properties

---

### 4.4 docs: update README and changelog for v8

Update dokumentasi.

**Files**:
- `README.md` (update)
- `lastUpdate.md` (update)

**Checklist**:
- [ ] README: tambah seksi "v8 Features" dengan deskripsi singkat
- [ ] README: instruksi generate VAPID keys (`npx web-push generate-vapid-keys`)
- [ ] README: instruksi deploy Edge Functions (`supabase functions deploy`)
- [ ] README: instruksi jalankan migration `supabase-migrations-v8.sql`
- [ ] lastUpdate.md: changelog v8 dengan daftar fitur dan breaking changes (kolom deadline baru)

**Validates**: —
