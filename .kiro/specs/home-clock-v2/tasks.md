# Implementation Plan: Home Clock V2

## Overview

Implementasi halaman Home (`/home`) sebagai landing page utama setelah login, dengan jam analog SVG, particle canvas, theme picker, greeting personal, dan task summary. Menggunakan Next.js 15 App Router, Supabase, dan CSS variables yang sudah ada.

## Tasks

- [x] 1. Modifikasi login redirect dan sidebar
  - [x] 1.1 Ubah `router.push("/personal")` menjadi `router.push("/home")` di `app/login/page.js`
    - Lokasi: fungsi `handleLogin`, baris setelah insert user ke tabel `users`
    - _Requirements: 1.1_
  - [x] 1.2 Tambahkan item `{ href: "/home", label: "Home", icon: "⌂" }` sebagai entri pertama di array `navItems` di `components/Sidebar.js`
    - Pastikan item Personal, Family, Summary, dan Spectate tetap ada dan urutan relatifnya tidak berubah
    - _Requirements: 9.1, 9.2, 9.3_

- [x] 2. Buat halaman Home dengan auth check dan layout dasar
  - [x] 2.1 Buat file `app/home/page.js` dengan auth check via `supabase.auth.getUser()` dan redirect ke `/login` jika tidak ada sesi
    - Gunakan pola yang sama dengan `app/personal/page.js` (useEffect + init function)
    - Render `<Sidebar user={profile} />` dan layout utama dengan `marginLeft: "220px"`
    - State: `user`, `profile`, `theme`, `reducedMotion`, `showDigital`
    - Baca `localStorage` untuk `home_theme_{userId}` dan `reduced_motion_{userId}` setelah auth
    - Deteksi `window.matchMedia("(prefers-reduced-motion: reduce)")` pada mount
    - _Requirements: 1.2, 1.3, 8.5_
  - [ ]* 2.2 Tulis unit test untuk auth check dan redirect logic
    - Test: unauthenticated user diredirect ke `/login`
    - Test: authenticated user tidak diredirect
    - _Requirements: 1.2, 1.3_

- [x] 3. Buat komponen GreetingText
  - [x] 3.1 Buat file `components/GreetingText.js` dengan logika greeting berdasarkan email dan jam lokal
    - Definisikan `GREETING_MAP` yang memetakan email ke nama panggilan: `papa@example.com` → "Abah", `mama@example.com` → "Emak", `nemi@example.com` → "Tuan Muda", `venly@example.com` → "Penly"
    - Fungsi `getTimePeriod(hour)`: Pagi (5–11), Siang (12–17), Malam (18–20), Tengah Malam (21–4)
    - Fungsi `getGreeting(email, hour)`: kembalikan string greeting lengkap; fallback ke local-part email jika tidak dikenal
    - Gunakan `setInterval` setiap 60000ms untuk memperbarui greeting otomatis saat periode berubah
    - Sertakan `aria-live="polite"` pada elemen wrapper greeting
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 8.2_
  - [ ]* 3.2 Tulis property test untuk getGreeting
    - **Property 1: Setiap email yang dikenal selalu menghasilkan nama panggilan yang benar untuk semua 24 nilai jam**
    - **Validates: Requirements 4.2, 4.3, 4.4, 4.5**
  - [ ]* 3.3 Tulis property test untuk getTimePeriod
    - **Property 2: Setiap jam 0–23 selalu dipetakan ke tepat satu periode waktu (tidak ada overlap, tidak ada gap)**
    - **Validates: Requirements 4.1**

- [x] 4. Buat komponen AnalogClock
  - [x] 4.1 Buat file `components/AnalogClock.js` sebagai SVG analog clock dengan `requestAnimationFrame`
    - Render SVG dengan viewBox `0 0 200 200`, lingkaran wajah jam, 60 tick marks, dan angka 1–12
    - Tiga jarum: hour (tebal, pendek), minute (sedang), second (tipis, merah/aksen)
    - Hitung rotasi jarum dari `new Date()`: detik → `s*6`, menit → `m*6 + s*0.1`, jam → `h*30 + m*0.5`
    - Gunakan `requestAnimationFrame` untuk smooth sweep; fallback ke `setInterval(1000)` jika `reducedMotion === true`
    - Drop shadow via SVG `<filter>` dengan `feDropShadow`
    - Props: `theme` (untuk palet warna), `reducedMotion`
    - Palet per tema: Vintage (`--accent` earth-tone), Minimal (flat dark `#1a1a1a`/`#e0e0e0`), Stellar (space `#050510`/`#7090e0`)
    - Sertakan `aria-label` dinamis: "Jam {H} lewat {M} menit {S} detik"
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 8.6_
  - [ ]* 4.2 Tulis property test untuk kalkulasi rotasi jarum
    - **Property 3: Rotasi jarum detik untuk detik ke-S selalu = S × 6 derajat (0–354), tidak pernah negatif atau ≥ 360**
    - **Validates: Requirements 2.3**
  - [ ]* 4.3 Tulis property test untuk aria-label
    - **Property 4: aria-label selalu mengandung nilai jam, menit, dan detik yang valid untuk sembarang objek Date**
    - **Validates: Requirements 8.6**

- [x] 5. Buat komponen ParticleCanvas
  - [x] 5.1 Buat file `components/ParticleCanvas.js` sebagai Canvas particle system di layer background
    - Canvas dengan `position: fixed`, `top: 0`, `left: 0`, `width: 100vw`, `height: 100vh`, `zIndex: 0`, `pointerEvents: none`
    - Inisialisasi array partikel (jumlah: 80) dengan posisi acak, kecepatan acak, dan radius 1–3px
    - Loop animasi via `requestAnimationFrame`: update posisi, wrap di tepi canvas, render
    - Mouse move handler: hitung jarak partikel ke kursor; jika < 120px, terapkan repulsi (dorong menjauh)
    - Resize handler: update `canvas.width` dan `canvas.height` ke `window.innerWidth/Height`
    - Props: `theme`, `reducedMotion`
    - Palet per tema: Vintage (earth-tone `#c8a96e`/`#9c8a72`), Stellar (putih/biru muda `#c8d8f0`), Minimal (abu gelap `rgba(80,80,80,0.4)`)
    - Jika `reducedMotion === true`: hentikan RAF, render partikel sebagai titik statis sekali saja
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9_
  - [ ]* 5.2 Tulis property test untuk repulsi partikel
    - **Property 5: Setelah repulsi diterapkan, jarak partikel dari titik kursor selalu ≥ jarak sebelumnya (partikel tidak bergerak mendekati kursor)**
    - **Validates: Requirements 5.3**

- [x] 6. Buat komponen ThemePicker
  - [x] 6.1 Buat file `components/ThemePicker.js` dengan tiga tombol tema
    - Tiga tombol: "Vintage", "Minimal", "Stellar"
    - Props: `theme` (aktif), `onThemeChange`, `userId`
    - `onThemeChange(newTheme)`: panggil `localStorage.setItem("home_theme_{userId}", newTheme)` lalu update state di parent
    - Tombol aktif: border `1px solid var(--accent)` + background highlight
    - Setiap tombol memiliki `aria-pressed={theme === name}` untuk aksesibilitas screen reader
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 8.7_
  - [ ]* 6.2 Tulis unit test untuk ThemePicker
    - Test: klik tombol tema memanggil `onThemeChange` dengan nilai yang benar
    - Test: tombol aktif memiliki `aria-pressed="true"`, tombol lain `aria-pressed="false"`
    - _Requirements: 6.4, 6.5, 8.7_

- [x] 7. Buat komponen TaskSummary
  - [x] 7.1 Buat file `components/TaskSummary.js` yang fetch data dari Supabase
    - Props: `userId`, `router`
    - Fetch `personal_tasks` dengan filter `user_id = userId` via Supabase client
    - Hitung: `total`, `done` (status === "done"), `remaining` (status !== "done")
    - State loading: tampilkan teks "Memuat tugas..."
    - State error: tampilkan "Gagal memuat tugas" tanpa angka
    - Wrapper `div` dengan `onClick={() => router.push("/personal")}` dan `cursor: pointer`
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_
  - [ ]* 7.2 Tulis property test untuk kalkulasi task summary
    - **Property 6: Untuk sembarang array tasks, `done + remaining === total` selalu berlaku**
    - **Validates: Requirements 7.2**

- [x] 8. Checkpoint — Pastikan semua komponen dapat dirender tanpa error
  - Pastikan semua komponen (GreetingText, AnalogClock, ParticleCanvas, ThemePicker, TaskSummary) dapat diimport tanpa error
  - Pastikan semua tests pass, tanyakan ke user jika ada pertanyaan

- [x] 9. Integrasi semua komponen di Home page
  - [x] 9.1 Update `app/home/page.js` untuk mengimport dan merender semua komponen
    - Layout: `<ParticleCanvas>` di background (z-index 0), konten utama di z-index 1
    - Urutan render: GreetingText → AnalogClock → ThemePicker → TaskSummary
    - Pass props `theme` dan `reducedMotion` ke AnalogClock dan ParticleCanvas
    - Pass `userId` dan `router` ke TaskSummary
    - Pass `theme`, `onThemeChange`, `userId` ke ThemePicker
    - Pass `email` dan `reducedMotion` ke GreetingText
    - _Requirements: 1.2, 1.3, 6.3, 6.4_
  - [x] 9.2 Implementasi tombol toggle Digital Clock dan Reduced Motion di `app/home/page.js`
    - Tombol "Digital/Analog" toggle state `showDigital`; jika `reducedMotion` aktif, default ke digital
    - Tombol "Reduced Motion" toggle state `reducedMotion`, simpan ke `localStorage("reduced_motion_{userId}")`
    - Kedua tombol focusable dan operable via Enter/Space
    - _Requirements: 3.2, 3.3, 8.3, 8.4_
  - [x] 9.3 Implementasi Digital Clock fallback di `app/home/page.js`
    - Komponen inline atau fungsi kecil yang render `HH:MM:SS` via `setInterval(1000)`
    - Tampilkan jika `showDigital === true` atau `reducedMotion === true`
    - Sertakan `aria-live="polite"` yang diperbarui setiap menit untuk screen reader
    - _Requirements: 3.1, 3.2, 3.4, 8.1_

- [x] 10. Terapkan palet tema ke CSS variables
  - [x] 10.1 Di `app/home/page.js`, terapkan tema aktif dengan mengubah inline style pada wrapper utama
    - Vintage: gunakan CSS variables yang sudah ada (tidak perlu override)
    - Minimal: override `--bg-main: #0d0d0d`, `--text-main: #e0e0e0`, `--accent: #ffffff`
    - Stellar: override `--bg-main: #050510`, `--text-main: #c8d8f0`, `--accent: #7090e0`
    - Gunakan `style={{ "--bg-main": ..., "--text-main": ..., "--accent": ... }}` pada wrapper div
    - _Requirements: 6.6, 6.7, 6.8_

- [x] 11. Final checkpoint — Pastikan semua tests pass
  - Pastikan semua tests pass, tanyakan ke user jika ada pertanyaan

## Notes

- Tasks bertanda `*` bersifat opsional dan dapat dilewati untuk MVP yang lebih cepat
- Setiap task mereferensikan requirement spesifik untuk traceability
- Pola auth mengikuti `app/personal/page.js` yang sudah ada
- CSS variables sudah didefinisikan di `app/globals.css`, tidak perlu file CSS baru
- Supabase client diimport dari `../../Lib/supabaseClient`
- Property tests mengvalidasi correctness properties universal, bukan hanya contoh spesifik
