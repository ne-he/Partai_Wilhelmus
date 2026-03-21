# Implementation Plan: Bible Page

## Overview

Mengganti konten halaman `/summary` dengan tampilan ayat Alkitab harian. Implementasi dibagi menjadi dua file: utility `Lib/utils/bibleApi.ts` untuk fetch dan cache, serta `app/summary/page.js` untuk UI.

## Tasks

- [x] 1. Buat Lib/utils/bibleApi.ts
  - [x] 1.1 Definisikan interface `Verse` dan array `VERSE_REFS`
    - Buat file `Lib/utils/bibleApi.ts`
    - Definisikan `interface Verse { reference, text, translation, cachedAt }`
    - Definisikan array `VERSE_REFS` berisi 20 referensi ayat populer
    - _Requirements: 2.2, 2.3_

  - [x] 1.2 Implementasi `fetchRandomVerse()`
    - Pilih referensi acak dari `VERSE_REFS` menggunakan `Math.random()`
    - Fetch ke `https://bible-api.com/{encodeURIComponent(ref)}`
    - Throw error jika `!res.ok` atau network gagal
    - Map response ke `Verse` interface dengan `cachedAt` berisi tanggal hari ini
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x] 1.3 Implementasi `getDailyVerse()`
    - Hitung `today` dengan `new Date().toLocaleDateString('en-CA')` → format `YYYY-MM-DD`
    - Baca `localStorage.getItem('daily_verse_' + today)`
    - Validasi cache: harus punya field `text`, `reference`, dan `cachedAt` — jika tidak valid, fetch ulang
    - Jika cache valid → parse dan return; jika tidak → panggil `fetchRandomVerse()`, simpan ke localStorage, return
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 10.2_

  - [ ]* 1.4 Tulis property test: round-trip cache integrity (Property 1)
    - **Property 1: Cache Round-Trip Integrity**
    - **Validates: Requirements 10.1**
    - Generate arbitrary `Verse` objects dengan `fc.record()`
    - Verifikasi `JSON.parse(JSON.stringify(verse))` menghasilkan objek ekuivalen

  - [ ]* 1.5 Tulis property test: cache key isolation (Property 2)
    - **Property 2: Cache Key Isolation**
    - **Validates: Requirements 3.6**
    - Generate dua `fc.date()` arbitrary
    - Verifikasi dua tanggal berbeda menghasilkan key berbeda, tanggal sama menghasilkan key sama

  - [ ]* 1.6 Tulis property test: invalid cache rejection (Property 3)
    - **Property 3: Invalid Cache Rejection**
    - **Validates: Requirements 10.2**
    - Generate objek dengan salah satu field wajib (`text`, `reference`, `cachedAt`) dihilangkan
    - Verifikasi `getDailyVerse()` tidak menggunakan data tersebut (fetch ulang dipanggil)

- [x] 2. Checkpoint — Pastikan bibleApi.ts tidak ada error TypeScript
  - Ensure semua types benar dan tidak ada compile error, tanya user jika ada pertanyaan.

- [x] 3. Ganti konten app/summary/page.js dengan BiblePage
  - [x] 3.1 Buat skeleton BiblePage dengan auth check dan state
    - Ganti seluruh konten `app/summary/page.js`
    - Tambahkan `"use client"` dan import: `supabase`, `useRouter`, `Sidebar`, `getDailyVerse`
    - Definisikan state: `verse`, `loading`, `error`, `visible`, `profile`
    - Implementasi `init()` dengan pola auth yang sama dengan halaman lain: `supabase.auth.getUser()` → redirect `/login` jika tidak ada sesi → load profil user
    - _Requirements: 1.1, 1.2, 1.3, 8.1, 8.2, 8.3_

  - [x] 3.2 Implementasi LoadingScreen dan ErrorState
    - Buat komponen `LoadingScreen` dengan teks `MEMUAT AYAT...`, warna `var(--accent)`, letter-spacing 4px — konsisten dengan pola halaman lain
    - Buat komponen `ErrorState` dengan pesan error informatif dalam bahasa Indonesia dan tombol "Coba Lagi"
    - Tombol "Coba Lagi" memanggil ulang `getDailyVerse()` dan menampilkan `LoadingScreen` selama proses
    - _Requirements: 4.1, 4.2, 4.3, 5.1, 5.2, 5.3, 5.4_

  - [x] 3.3 Implementasi VerseCard dengan glassmorphism
    - Buat komponen `VerseCard` yang menerima prop `verse` dan `visible`
    - Glassmorphism styles: `background: rgba(36,32,24,0.7)`, `backdropFilter: blur(20px)`, `border: 1px solid rgba(200,169,110,0.2)`, `borderRadius: 16px`, `maxWidth: 680px`
    - Tampilkan ornamen atas `✦ ─── ✦`, label tanggal (huruf kapital, letter-spacing 3px, warna `var(--text-muted)`)
    - Tampilkan label `📖 AYAT RENUNGAN HARIAN` dengan warna `var(--accent)`
    - Tampilkan teks ayat dengan font Playfair Display italic, font-size 1.4rem–1.6rem, warna `var(--text-main)`
    - Tampilkan ornamen pemisah `◆`, referensi ayat dengan warna `var(--accent)`, badge terjemahan
    - Tampilkan ornamen bawah `✦ ─── ✦`
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

  - [x] 3.4 Implementasi animasi fade-in dengan prefers-reduced-motion
    - Cek `window.matchMedia('(prefers-reduced-motion: reduce)').matches` saat init
    - Jika `prefersReduced` true → set `visible = true` langsung tanpa delay
    - Jika false → gunakan `setTimeout(() => setVisible(true), 50)` setelah `verse` di-set
    - Apply style pada VerseCard: `opacity: visible ? 1 : 0`, `transform: visible ? 'translateY(0)' : 'translateY(12px)'`, `transition: 'opacity 0.6s ease, transform 0.6s ease'`
    - _Requirements: 7.1, 7.2, 7.3_

  - [x] 3.5 Implementasi layout utama dengan Sidebar dan responsivitas
    - Buat layout `div` flex dengan `background: var(--bg-main)`, `minHeight: 100vh`
    - Render `<Sidebar user={profile} />` tanpa modifikasi apapun
    - Buat `<main>` dengan `marginLeft: 220px`, padding `2.5rem 3rem`
    - Tambahkan header section: label `SCRIPTURE` (text-muted, letter-spacing 3px) dan judul `Daily Verse`
    - Render `VerseCard` di tengah dengan `display: flex`, `justifyContent: center`
    - _Requirements: 1.2, 1.4, 9.1, 9.2, 9.3_

- [x] 4. Final Checkpoint — Pastikan semua berjalan
  - Ensure semua tests pass, tidak ada error TypeScript/ESLint, tanya user jika ada pertanyaan.
  - Verifikasi `app/layout.tsx`, `components/Sidebar.js`, dan `app/globals.css` tidak dimodifikasi.

## Notes

- Tasks bertanda `*` bersifat opsional dan dapat dilewati untuk MVP yang lebih cepat
- Setiap task mereferensikan requirements spesifik untuk traceability
- `bibleApi.ts` menggunakan TypeScript; `page.js` tetap JavaScript (`.js`) agar konsisten dengan file lain
- Property tests menggunakan `fast-check` yang sudah ada di `devDependencies`
- Sidebar dan layout global tidak boleh dimodifikasi dalam kondisi apapun
