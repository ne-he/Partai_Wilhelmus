# Requirements — Partai Wilhelmus App

Dokumen ini menggabungkan requirements dari tiga fitur utama aplikasi:
1. **Home Clock V2** — Halaman Home dengan jam analog, greeting, particle canvas, theme picker
2. **Family App V4** — Page transitions, drag-and-drop tasks, Pomodoro timer, daily reset & queue
3. **Bible Page (Daily Verse)** — Halaman `/summary` sebagai Daily Verse dengan API Alkitab

---

## BAGIAN 1: HOME CLOCK V2

### Introduction

Fitur ini menambahkan halaman Home (`/home`) ke aplikasi to-do list keluarga "Partai Wilhelmus". Setelah login, pengguna diarahkan ke `/home` sebagai landing page utama. Halaman ini menampilkan jam analog photorealistic, greeting personal berdasarkan akun dan waktu, background interaktif berbasis Canvas, theme picker, dan ringkasan tugas.

### Glossary

- **Home_Page**: Halaman Next.js di route `/home` (`app/home/page.js`)
- **Analog_Clock**: Komponen jam analog berbasis SVG/Canvas real-time
- **Digital_Clock**: Komponen fallback teks HH:MM:SS
- **Particle_Canvas**: Canvas dengan sistem partikel interaktif sebagai background
- **Theme_Picker**: Komponen UI untuk memilih tema; disimpan di `localStorage`
- **Task_Summary**: Ringkasan jumlah tugas dari tabel `personal_tasks` di Supabase
- **Greeting**: Teks sapaan personal berdasarkan akun dan waktu hari
- **Reduced_Motion**: Preferensi aksesibilitas yang menonaktifkan animasi

### Requirements

#### Req 1.1 — Redirect Pasca-Login ke /home
- Login berhasil → redirect ke `/home`
- Akses `/home` tanpa sesi → redirect ke `/login`

#### Req 1.2 — Jam Analog Photorealistic
- SVG/Canvas dengan jarum jam, menit, detik
- 12 angka + 60 tick marks, drop shadow
- `requestAnimationFrame` untuk smooth sweep
- Fallback `setInterval(1000)` jika `reducedMotion`
- Palet warna per tema: Vintage, Minimal, Stellar

#### Req 1.3 — Digital Clock Fallback
- Format HH:MM:SS, update setiap 1000ms
- Default aktif jika `reducedMotion` aktif
- Toggle manual via tombol

#### Req 1.4 — Greeting Personal
- Periode: Pagi (05–11), Siang (12–17), Malam (18–20), Tengah Malam (21–04)
- Email map: `papa` → Abah, `mama` → Emak, `nemi` → Tuan Muda, `venly` → Penly
- Update otomatis saat periode berubah tanpa reload

#### Req 1.5 — Particle Canvas
- Canvas fixed fullscreen, z-index 0, pointer-events none
- 80 partikel, repulsi radius 120px dari kursor
- Palet per tema, static jika `reducedMotion`

#### Req 1.6 — Theme Picker
- 3 tema: Vintage (default), Minimal, Stellar
- Simpan ke `localStorage` key `home_theme_{userId}`
- Perubahan instan tanpa reload

#### Req 1.7 — Task Summary
- Fetch `personal_tasks` by `user_id`
- Tampilkan: total, done, remaining
- Klik → navigate ke `/personal`

#### Req 1.8 — Aksesibilitas
- `aria-live="polite"` untuk jam dan greeting
- Toggle Reduced Motion via keyboard
- `aria-pressed` pada theme picker buttons

#### Req 1.9 — Sidebar
- Tambah item "Home" (href `/home`, icon `⌂`) sebagai entri pertama

---

## BAGIAN 2: FAMILY APP V4

### Introduction

Enhancement aplikasi family task management dengan fitur: page transitions (Framer Motion), drag-and-drop task management (@dnd-kit), Pomodoro timer, dan daily task reset dengan queue management.

### Glossary

- **Personal_Task**: Tugas pribadi milik seorang User
- **Family_Task**: Tugas keluarga yang dapat di-assign ke anggota
- **Queue**: Daftar tugas belum selesai dari hari sebelumnya
- **Pomodoro_Session**: Sesi fokus 25 menit
- **Daily_Reset**: Proses otomatis setiap hari pukul 00:00
- **Parent_User**: User dengan role "papa" atau "mama"
- **Child_User**: User dengan role selain papa/mama

### Requirements

#### Req 2.1 — Page Transitions
- Animasi fade-out/fade-in saat navigasi antar halaman
- Durasi 0.3s, cubic-bezier lembut, menggunakan Framer Motion
- Cegah navigasi ganda selama transisi

#### Req 2.2 — Drag-and-Drop Personal Tasks
- 3 kolom: Pending, In Progress, Done
- Drag antar kolom → update status di database
- Drag dalam kolom → reorder
- Visual feedback: opacity 0.5 saat drag, cursor grab/grabbing
- Rollback jika gagal

#### Req 2.3 — Drag-and-Drop Assignment Family Tasks
- Drag nama anggota ke family task → update `assigned_to`
- Auto-update status ke `in_progress` saat di-assign
- Hanya Parent_User yang bisa drag assignment
- Visual feedback saat hover

#### Req 2.4 — Pomodoro Timer
- Work session: 25 menit, Break: 5 menit
- Auto-transition work → break
- Tombol: start, pause, reset
- Simpan sesi ke tabel `focus_sessions`
- Notifikasi suara saat selesai
- Timer tetap berjalan saat pindah halaman (localStorage)

#### Req 2.5 — Daily Task Reset & Queue
- Cron job setiap 00:00: hapus task `done`, pindahkan `pending`/`in_progress` ke `task_queue`
- UI: kolom "Today's Tasks" dan "Queue"
- Tombol "Move to Today" per task di queue
- Drag dari Queue ke Today

#### Req 2.6 — Database Schema
- Tabel `focus_sessions`: id, user_id, task_id, start_time, end_time, duration, session_type
- Tabel `task_queue`: id, user_id, title, status, original_created_at, queued_at, order
- Update `personal_tasks`: tambah kolom `order`

#### Req 2.7 — UI Theme Consistency
- Warna: bg gelap (#2C1A0E, #3E2C1B), teks krem (#F5E6D3), aksen emas (#C9A53B)
- Font: Playfair Display (heading), Inter (body)
- Border-radius 10–12px, border tipis emas

#### Req 2.8 — Audio Notification
- Notifikasi suara saat timer selesai (Web Audio API / HTML5 Audio)
- Fallback visual jika browser blokir autoplay
- Toggle mute/unmute

---

## BAGIAN 3: BIBLE PAGE (DAILY VERSE)

### Introduction

Halaman `/summary` diganti kontennya menjadi halaman Daily Verse yang menampilkan satu ayat Alkitab per hari, diambil dari API bible-api.com dan di-cache di localStorage. Desain mengikuti estetika mafia-themed: glassmorphism, dark mode, font Playfair Display, ornamen dekoratif.

### Glossary

- **Bible_Page**: Halaman `/summary` dengan konten ayat Alkitab harian
- **Daily_Verse**: Satu ayat yang ditampilkan selama satu hari penuh
- **Verse_Cache**: Data ayat di localStorage dengan key berbasis tanggal
- **Verse_Fetcher**: Modul `Lib/utils/bibleApi.ts`
- **Verse_Card**: Komponen visual utama dengan glassmorphism

### Requirements

#### Req 3.1 — Penggantian Halaman Summary
- Ganti seluruh konten `/summary` dengan Daily Verse
- Sidebar dan layout global tidak diubah
- Gunakan CSS variables yang sudah ada

#### Req 3.2 — Fetch dari Bible API
- Endpoint: `https://bible-api.com/?random=1`
- Response: `{ reference, text, translation_id }`
- Throw error jika HTTP bukan 200 atau network gagal

#### Req 3.3 — Cache Harian di localStorage
- Key: `dailyVerse` + `dailyVerseDate`
- Jika tanggal sama → return cache
- Jika berbeda → fetch baru, simpan ke cache

#### Req 3.4 — Loading State
- Spinner dengan border gold, animasi spin
- Teks "MEMUAT AYAT..." dengan warna `var(--accent)`

#### Req 3.5 — Error State
- Pesan error dalam bahasa Indonesia
- Tombol "Coba Lagi" yang memanggil ulang fetch

#### Req 3.6 — Verse Card (Glassmorphism)
- Background `rgba(0,0,0,0.4)`, `backdrop-filter: blur(20px)`
- Border `rgba(212,175,55,0.2)`, border-radius 20px
- Ornamen `❦` di sudut, tanda kutip besar, ornamen `✦ ◆ ✦`
- Font Playfair Display italic untuk teks ayat
- Referensi dengan warna gold, badge terjemahan

#### Req 3.7 — Interaksi
- Tombol Copy: salin teks + referensi + terjemahan ke clipboard
- Tombol Share: Web Share API, fallback ke copy
- Tombol Refresh: fetch ayat baru tanpa menyimpan ke cache harian

#### Req 3.8 — Animasi Fade-In
- Opacity 0 → 1, translateY 16px → 0, durasi 0.7s
- Skip animasi jika `prefers-reduced-motion`

#### Req 3.9 — Auth & Responsivitas
- Cek sesi Supabase saat mount, redirect ke `/login` jika tidak ada
- Layout responsif minimal 320px
- Footer motto: "Keluarga adalah Kekuatan, Iman adalah Senjata"
