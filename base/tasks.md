# Tasks — Partai Wilhelmus App

Dokumen ini menggabungkan implementation tasks dari tiga fitur utama:
1. **Home Clock V2** — Halaman Home dengan jam, greeting, particles, themes
2. **Family App V4** — DnD tasks, Pomodoro, daily reset, page transitions
3. **Bible Page (Daily Verse)** — Halaman `/summary` sebagai Daily Verse

---

## BAGIAN 1: HOME CLOCK V2

- [x] 1.1 Ubah login redirect ke `/home` di `app/login/page.js`
- [x] 1.2 Tambah item "Home" sebagai entri pertama di `components/Sidebar.js`
- [x] 1.3 Buat `app/home/page.js` dengan auth check, state, dan layout dasar
- [x] 1.4 Buat `components/GreetingText.js` dengan GREETING_MAP dan getTimePeriod
- [x] 1.5 Buat `components/AnalogClock.js` dengan SVG, requestAnimationFrame, dan palet per tema
- [x] 1.6 Buat `components/ParticleCanvas.js` dengan sistem partikel dan repulsi kursor
- [x] 1.7 Buat `components/ThemePicker.js` dengan 3 tema dan localStorage persistence
- [x] 1.8 Buat `components/TaskSummary.js` dengan fetch Supabase dan navigasi ke /personal
- [x] 1.9 Integrasi semua komponen di `app/home/page.js`
- [x] 1.10 Implementasi toggle Digital Clock dan Reduced Motion
- [x] 1.11 Terapkan palet tema via inline CSS variable overrides

---

## BAGIAN 2: FAMILY APP V4

- [x] 2.1 Install dependencies: framer-motion, @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities
- [x] 2.2 Setup `vercel.json` dengan cron schedule `0 0 * * *`
- [x] 2.3 Database: buat tabel `focus_sessions` dengan RLS policies
- [x] 2.4 Database: buat tabel `task_queue` dengan RLS policies
- [x] 2.5 Database: tambah kolom `order` ke `personal_tasks`
- [x] 2.6 Buat `components/PageTransition.tsx` dengan Framer Motion variants
- [x] 2.7 Integrasikan PageTransition ke app layout
- [x] 2.8 Buat `components/DraggableTask.tsx` dengan useSortable dan visual feedback
- [x] 2.9 Buat `components/DroppableColumn.tsx` dengan useDroppable dan highlight
- [x] 2.10 Implementasi DndContext di personal tasks page dengan handleDragEnd
- [x] 2.11 Implementasi status change + reorder logic dengan Supabase update
- [x] 2.12 Buat `components/DraggableMember.tsx` dengan useDraggable, disabled untuk child
- [x] 2.13 Buat `components/DroppableFamilyTask.tsx` dengan useDroppable
- [x] 2.14 Implementasi assignment DndContext di family page
- [x] 2.15 Implementasi update `assigned_to` + auto-status `in_progress`
- [x] 2.16 Buat custom hook `usePomodoro` dengan timer state dan localStorage persistence
- [x] 2.17 Implementasi session completion: auto-transition work→break, save ke focus_sessions
- [x] 2.18 Buat UI PomodoroTimer dengan countdown, tombol start/pause/reset
- [x] 2.19 Buat audio utility dan playNotificationSound dengan Web Audio API
- [x] 2.20 Tambah toggle mute/unmute untuk notifikasi suara
- [x] 2.21 Buat `app/api/cron/daily-reset/route.ts` dengan cron secret verification
- [x] 2.22 Implementasi performUserReset: delete done, queue pending/in_progress
- [x] 2.23 Buat `components/TaskQueue.tsx` dengan "Move to Today" button
- [x] 2.24 Integrasi queue dengan drag-and-drop ke Today column
- [x] 2.25 Wire Pomodoro timer ke personal tasks page dengan task selector

---

## BAGIAN 3: BIBLE PAGE (DAILY VERSE)

- [x] 3.1 Buat `Lib/utils/bibleApi.ts` dengan interface Verse, getDailyVerse, fetchRandomVerse
- [x] 3.2 Ganti konten `app/summary/page.js` dengan DailyVersePage
- [x] 3.3 Implementasi auth check + Sidebar integration
- [x] 3.4 Implementasi LoadingScreen (spinner gold + teks)
- [x] 3.5 Implementasi ErrorState dengan tombol "Coba Lagi"
- [x] 3.6 Implementasi VerseCard dengan glassmorphism, ornamen ❦, tanda kutip besar
- [x] 3.7 Implementasi tombol Copy, Share (Web Share API), Refresh (tanpa cache)
- [x] 3.8 Implementasi animasi fade-in dengan prefers-reduced-motion support
- [x] 3.9 Tambah footer motto mafia
- [x] 3.10 Update Sidebar: label "Summary" → "Daily Verse"
- [x] 3.11 Tambah keyframes `spin` dan `fadeIn` ke `app/globals.css`
