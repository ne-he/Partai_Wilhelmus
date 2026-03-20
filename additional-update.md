# PARTAI WILHELMUS

> Aplikasi manajemen tugas keluarga dengan tema mafia vintage — dibangun untuk 4 anggota keluarga: Papa, Mama, Nemi, dan Venly.

---

## Deskripsi

**Partai Wilhelmus** adalah web app produktivitas keluarga yang menggabungkan estetika mafia vintage dengan fitur manajemen tugas modern. Setiap anggota keluarga punya ruang kerja personal, dan ada ruang bersama untuk tugas keluarga yang bisa di-assign antar anggota dengan drag & drop.

Nama "Partai Wilhelmus" terinspirasi dari nuansa organisasi rahasia — sidebar menampilkan nama ini sebagai identitas keluarga, dan setiap anggota punya "jabatan" (Boss, Consigliere, Soldato) yang muncul saat drag member di halaman Family.

---

## Tech Stack

| Teknologi | Versi | Kegunaan |
|---|---|---|
| Next.js | 16.1.6 | Framework utama (App Router) |
| React | 19.2.4 | UI library |
| TypeScript | ^5 | Type safety untuk komponen utama |
| Supabase | ^2.99.1 | Database + Auth (PostgreSQL + RLS) |
| Framer Motion | ^12.38.0 | Animasi halaman dan komponen |
| @dnd-kit/core | ^6.3.1 | Drag & drop engine |
| @dnd-kit/sortable | ^10.0.0 | Sortable list dalam kolom kanban |
| Tailwind CSS | ^4 | Utility CSS (dipakai minimal) |
| fast-check | ^4.6.0 | Property-based testing |
| react-icons | ^5.6.0 | Icon library |

---

## Komposisi File

```
Total file kode: 27 file
```

| Tipe | Jumlah | Persentase | Keterangan |
|---|---|---|---|
| `.tsx` | 12 file | **44%** | Komponen TypeScript (drag-drop, animasi, queue) |
| `.js` | 10 file | **37%** | Pages dan komponen legacy (home, login, sidebar, clock) |
| `.ts` | 4 file | **15%** | API routes dan Supabase client |
| `.css` | 1 file | **4%** | Global styles dan CSS variables |

> Komponen baru ditulis dalam TypeScript (`.tsx`), sedangkan halaman awal dan komponen utilitas menggunakan JavaScript (`.js`). Migrasi bertahap ke TypeScript seiring pengembangan.

---

## Struktur Proyek

```
partai-wilhelmus/
├── app/
│   ├── page.tsx                    # Root redirect ke /home
│   ├── layout.tsx                  # Root layout + font import
│   ├── globals.css                 # CSS variables + base styles
│   ├── home/
│   │   └── page.js                 # Halaman utama (jam + greeting)
│   ├── login/
│   │   └── page.js                 # Halaman login
│   ├── personal/
│   │   └── page.tsx                # Kanban personal tasks
│   ├── family/
│   │   └── page.tsx                # Family tasks + drag assign
│   ├── summary/
│   │   └── page.js                 # Activity log
│   ├── spectate/
│   │   └── [user]/page.js          # Lihat tugas anggota lain (read-only)
│   └── api/
│       └── cron/
│           └── daily-reset/
│               └── route.ts        # Cron job reset harian
├── components/
│   ├── Sidebar.js                  # Navigasi sidebar tetap
│   ├── AnalogClock.js              # Jam analog SVG canvas
│   ├── ParticleCanvas.js           # Partikel background homepage
│   ├── GreetingText.js             # Sapaan berdasarkan waktu
│   ├── ThemePicker.js              # Pemilih tema (Vintage/Minimal/Stellar)
│   ├── TaskSummary.js              # Widget ringkasan tugas di homepage
│   ├── PageTransition.tsx          # Animasi transisi halaman
│   ├── DraggableTask.tsx           # Task card yang bisa di-drag (personal)
│   ├── DroppableColumn.tsx         # Kolom kanban sebagai drop target
│   ├── DraggableMember.tsx         # Badge anggota yang bisa di-drag (family)
│   ├── DroppableFamilyTask.tsx     # Family task sebagai drop target
│   ├── TaskQueue.tsx               # Tampilan antrian tugas kemarin
│   ├── CyberParticles.tsx          # Partikel cyber untuk halaman personal
│   └── GlitchText.tsx              # Teks dengan efek glitch saat hover
├── Lib/
│   └── supabaseClient.ts           # Inisialisasi Supabase client
├── public/
│   └── sounds/
│       └── notification.mp3        # Suara notifikasi
├── supabase-migrations-v4.sql      # SQL migrations untuk Supabase
├── vercel.json                     # Konfigurasi Vercel + cron schedule
└── .env.local                      # Environment variables (tidak di-commit)
```

---

## Fitur Lengkap

### 1. Autentikasi
- Login dengan email + password via Supabase Auth
- 4 akun tetap: Papa, Mama, Nemi, Venly — masing-masing punya role berbeda
- Auto-redirect ke `/login` jika belum login
- Auto-create row di tabel `users` saat pertama login
- **File:** `app/login/page.js`, `Lib/supabaseClient.ts`

---

### 2. Homepage — Jam & Greeting
- **Jam Analog SVG** — dibuat dari scratch tanpa library, dengan jarum jam/menit/detik yang bergerak smooth via `requestAnimationFrame`. Punya 3 tema visual: Vintage (emas), Minimal (putih), Stellar (biru)
- **Jam Digital** — toggle antara analog dan digital, format `HH:MM:SS` locale Indonesia
- **Greeting Text** — sapaan berdasarkan waktu hari (Selamat Pagi/Siang/Sore/Malam)
- **Task Summary Widget** — ringkasan jumlah tugas hari ini, klik untuk ke halaman Personal
- **Particle Canvas** — partikel mengambang di background, 180 partikel desktop / 80 mobile, dengan efek repulsi mouse. 3 mode: Vintage (emas), Minimal (abu), Stellar (bintang berkelip)
- **Theme Picker** — tombol fixed di kanan bawah, pilihan tema tersimpan di `localStorage` per user
- **Reduce Motion** — toggle untuk mematikan animasi (aksesibilitas), tersimpan di `localStorage`
- **File:** `app/home/page.js`, `components/AnalogClock.js`, `components/ParticleCanvas.js`, `components/GreetingText.js`, `components/ThemePicker.js`, `components/TaskSummary.js`

---

### 3. Personal Tasks — Kanban Board
- **3 kolom status:** Pending → In Progress → Done
- **Drag & Drop** antar kolom dan dalam kolom menggunakan `@dnd-kit`
  - `PointerSensor` dengan activation distance 8px (mencegah drag tidak sengaja)
  - `KeyboardSensor` untuk aksesibilitas
  - `pointerWithin` collision detection untuk akurasi drop
  - `DragOverlay` menampilkan ghost card saat drag
- **Tambah tugas** via form input dengan animasi focus glow
- **Hapus tugas** via tombol `[DEL]` yang muncul saat hover
- **Stat Cards** — Total, Selesai, Tersisa + progress bar animasi
- **Task Queue** — tugas dari hari sebelumnya yang belum selesai, bisa dipindah ke hari ini
- **Glassmorphism** — semua card pakai `backdrop-filter: blur` dengan background semi-transparan
- **Paper texture** — overlay noise SVG di background untuk kesan vintage
- **File:** `app/personal/page.tsx`, `components/DraggableTask.tsx`, `components/DroppableColumn.tsx`, `components/TaskQueue.tsx`

---

### 4. Family Tasks — Assign dengan Drag & Drop
- **Daftar tugas keluarga** yang bisa dilihat semua anggota
- **Drag member ke task** — Papa/Mama bisa drag badge anggota (Papa, Mama, Nemi, Venly) dan drop ke task untuk assign. Task otomatis berubah status ke `in_progress`
- **Badge anggota bergaya mafia:**
  - Papa = emas `#c8a96e` · label BOSS · simbol ♦
  - Mama = coklat emas · label CONSIGLIERE · simbol ♠
  - Nemi/Venly = abu emas · label SOLDATO · simbol ♣
  - Font Playfair Display untuk nama dan inisial
- **Drop animation smooth** — card task scale naik + gold shimmer line di atas card saat hover, badge assigned user muncul dengan spring animation
- **Template tugas** — tombol cepat untuk tugas rumah umum (Cuci baju, Setrika, dll)
- **Status selector** — dropdown untuk ubah status task
- **Role-based access** — hanya Papa dan Mama yang bisa tambah/hapus/assign tugas
- **File:** `app/family/page.tsx`, `components/DraggableMember.tsx`, `components/DroppableFamilyTask.tsx`

---

### 5. Daily Reset — Cron Job Otomatis
- Setiap pergantian hari, cron job berjalan otomatis via Vercel Cron
- **Tugas `done`** → dihapus permanen
- **Tugas `pending` dan `in_progress`** → dipindah ke tabel `task_queue` (antrian)
- Antrian muncul di bagian bawah halaman Personal Tasks
- User bisa klik "→ Hari Ini" untuk memindah tugas dari queue ke hari ini
- Endpoint juga bisa dipanggil manual via `POST /api/cron/daily-reset` dengan header `Authorization: Bearer <CRON_SECRET>` untuk testing
- **File:** `app/api/cron/daily-reset/route.ts`, `vercel.json`

---

### 6. Spectate — Lihat Tugas Anggota Lain
- Setiap anggota bisa lihat tugas personal anggota lain (read-only)
- URL: `/spectate/papa`, `/spectate/mama`, `/spectate/nemi`, `/spectate/venly`
- Menampilkan stat (Total, Done, Remaining) dan daftar semua task dengan status
- **File:** `app/spectate/[user]/page.js`

---

### 7. Summary — Activity Log
- Menampilkan log aktivitas task (created, updated, checked, deleted) dari tabel `task_logs`
- Dikelompokkan per hari, urut dari terbaru
- Warna berbeda per jenis aksi
- **File:** `app/summary/page.js`

---

### 8. Navigasi & Layout
- **Sidebar tetap** di kiri (220px) dengan navigasi ke semua halaman
- Menampilkan nama user yang login + role badge
- Section "SPECTATE" untuk lihat tugas anggota lain
- Tombol logout
- **Page Transition** — animasi fade saat berpindah halaman via Framer Motion
- **File:** `components/Sidebar.js`, `components/PageTransition.tsx`

---

### 9. Visual & Animasi
- **Tema warna utama (Vintage):**
  - Background: `#1a1612` (coklat sangat gelap)
  - Card: `#242018`
  - Aksen: `#c8a96e` (emas vintage)
  - Teks: `#f0e6d3` (krem)
  - Muted: `#9c8a72`
- **Font:** Georgia / Playfair Display (serif eksentrik untuk judul dan angka)
- **Glassmorphism** — `backdrop-filter: blur(12-16px)` pada semua card
- **Framer Motion** — animasi masuk halaman, progress bar, badge assign, shimmer effect
- **CyberParticles** — partikel canvas dengan karakter `0 1 > $ #`, garis koneksi cyan, repulsi mouse (khusus halaman Personal)
- **GlitchText** — efek glitch merah+cyan saat hover pada teks judul
- **File:** `app/globals.css`, `components/CyberParticles.tsx`, `components/GlitchText.tsx`

---

## Database Schema (Supabase)

```sql
-- Tabel utama
users           (id, email, username, role)
personal_tasks  (id, user_id, title, status, order, created_at, updated_at)
family_tasks    (id, title, status, created_by, assigned_to, created_at)
task_queue      (id, user_id, title, status, original_created_at, queued_at, order)
task_logs       (id, task_id, user_id, action, timestamp)
focus_sessions  (id, user_id, task_id, start_time, end_time, duration, session_type)
```

Row Level Security (RLS) aktif di semua tabel — setiap user hanya bisa akses data miliknya sendiri. Cron job menggunakan `SUPABASE_SERVICE_ROLE_KEY` untuk bypass RLS.

---

## Setup & Instalasi

### 1. Clone dan install dependencies

```bash
git clone https://github.com/username/partai-wilhelmus.git
cd partai-wilhelmus
npm install
```

### 2. Setup environment variables

Buat file `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
CRON_SECRET=your_random_secret_string
```

### 3. Jalankan SQL migrations

Buka Supabase SQL Editor, jalankan isi file `supabase-migrations-v4.sql`.

### 4. Jalankan development server

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000)

---

## Deployment (Vercel)

1. Push ke GitHub
2. Connect repo ke Vercel
3. Tambahkan semua environment variables di Vercel dashboard
4. Cron job sudah dikonfigurasi di `vercel.json`:

```json
{
  "crons": [{
    "path": "/api/cron/daily-reset",
    "schedule": "0 0 * * *"
  }]
}
```

Cron berjalan setiap tengah malam UTC. Untuk testing manual:

```bash
curl -X POST https://your-app.vercel.app/api/cron/daily-reset \
  -H "Authorization: Bearer your_cron_secret"
```

---

## Anggota Keluarga

| Nama | Role | Jabatan Mafia | Akses |
|---|---|---|---|
| Papa | `papa` | BOSS ♦ | Full access — bisa tambah/hapus/assign semua tugas |
| Mama | `mama` | CONSIGLIERE ♠ | Full access — sama seperti Papa |
| Nemi | `nemi` | SOLDATO ♣ | Bisa lihat dan kelola tugas personal sendiri |
| Venly | `venly` | SOLDATO ♣ | Bisa lihat dan kelola tugas personal sendiri |

---

## Catatan Teknis

- **Drag & Drop:** Menggunakan `@dnd-kit` bukan `react-beautiful-dnd` karena kompatibel dengan React 19 dan tidak ada masalah dengan `StrictMode`. `DraggableMember` menggunakan `useDraggable` (bukan `useSortable`) karena tidak perlu sorting — hanya drag ke drop target.
- **Particle Canvas:** Dibuat dari scratch dengan Canvas API, tidak menggunakan `tsparticles` atau library eksternal untuk menghindari konflik dengan Next.js SSR.
- **Cron Job:** Menggunakan Vercel Cron (gratis di Hobby plan, 1 job). Service role key dipakai agar bisa bypass RLS saat reset data semua user.
- **TypeScript:** File `.tsx` untuk komponen yang kompleks (drag-drop, animasi), `.js` untuk halaman yang lebih sederhana. Tidak ada strict mode TypeScript untuk mempercepat development.
