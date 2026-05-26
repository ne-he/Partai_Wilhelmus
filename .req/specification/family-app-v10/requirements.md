# Requirements Document

## Introduction

Family App v10 adalah update fitur untuk aplikasi keluarga "Partai Wilhelmus" yang berjalan di Next.js 16 (App Router), React 19, TypeScript + JavaScript, dengan Supabase sebagai backend. Update ini mencakup lima fitur: (1) tombol terjemahan ayat harian ke Bahasa Indonesia, (2) penghapusan elemen teks "WEB" dari halaman summary, (3) penggantian label anggota keluarga di halaman family, (4) perbaikan tampilan Task Queue agar kontras di semua tema, dan (5) perbaikan logika daily reset cron job. Update ini bersifat additive dan tidak mengubah struktur database, RLS, autentikasi, atau drag-and-drop yang sudah ada.

---

## Glossary

- **System**: Aplikasi Family App v10 secara keseluruhan
- **Summary_Page**: Halaman `app/summary/page.js` yang menampilkan ayat harian
- **Family_Page**: Halaman `app/family/page.tsx` yang menampilkan tugas keluarga
- **Personal_Page**: Halaman `app/personal/page.tsx` yang menampilkan kanban tugas pribadi
- **TranslateButton**: Komponen baru `components/TranslateButton.tsx` untuk tombol terjemahan
- **Translate_API**: Route baru `app/api/translate/route.js` yang memanggil MyMemory API
- **MyMemory_API**: Layanan terjemahan eksternal di `https://api.mymemory.translated.net/get`
- **TaskQueue**: Komponen `components/TaskQueue.tsx` yang menampilkan tugas dari hari sebelumnya
- **Daily_Reset**: Cron job di `app/api/cron/daily-reset/route.ts` yang berjalan setiap tengah malam
- **task_queue**: Tabel Supabase yang menyimpan tugas pending/in_progress dari hari sebelumnya
- **personal_tasks**: Tabel Supabase yang menyimpan tugas pribadi aktif
- **CSS_Variables**: Variabel CSS global di `app/globals.css` seperti `var(--text-main)`, `var(--bg-card)`, `var(--border)`
- **localStorage**: Web Storage API untuk menyimpan cache terjemahan di browser
- **Verse_ID**: Identifikasi unik ayat berdasarkan field `reference` dari objek verse
- **Toast**: Komponen `components/Toast.tsx` untuk notifikasi sementara
- **Framer_Motion**: Library animasi yang sudah terpasang di project

---

## Requirements

### Requirement 1: Tombol Terjemahan Ayat Harian

**User Story:** Sebagai anggota keluarga, saya ingin menerjemahkan ayat harian ke Bahasa Indonesia, sehingga saya dapat memahami ayat yang ditampilkan dalam bahasa yang lebih mudah dimengerti.

#### Acceptance Criteria

1. THE Summary_Page SHALL menampilkan tombol "Terjemahkan" di antara tombol "Bagikan" dan "Ayat Baru" dalam baris action buttons.
2. WHEN pengguna mengklik tombol "Terjemahkan" untuk pertama kali, THE TranslateButton SHALL menampilkan loading spinner dan memanggil Translate_API untuk menerjemahkan teks ayat.
3. WHEN terjemahan berhasil diterima, THE TranslateButton SHALL menampilkan teks terjemahan di bawah teks ayat asli dengan animasi fade-in menggunakan Framer_Motion (`opacity: 0 → 1`, durasi 0.4s).
4. WHEN pengguna mengklik tombol "Terjemahkan" untuk kedua kali saat terjemahan sedang ditampilkan, THE TranslateButton SHALL menyembunyikan teks terjemahan (toggle off).
5. WHEN terjemahan untuk suatu ayat sudah pernah diambil, THE TranslateButton SHALL membaca dari localStorage dengan key `translated_<verse_reference>` tanpa memanggil API kembali.
6. WHEN terjemahan berhasil diambil dari API, THE TranslateButton SHALL menyimpan hasil terjemahan ke localStorage dengan key `translated_<verse_reference>`.
7. WHEN Translate_API tidak merespons dalam 10 detik, THE Translate_API SHALL mengembalikan error timeout.
8. IF Translate_API mengembalikan error atau timeout, THEN THE Summary_Page SHALL menampilkan toast error dengan pesan "Gagal menerjemahkan, coba lagi nanti".
9. WHILE Translate_API sedang memproses permintaan, THE TranslateButton SHALL menampilkan loading spinner dan menonaktifkan tombol agar tidak bisa diklik ulang.
10. THE Translate_API SHALL memanggil endpoint `https://api.mymemory.translated.net/get?q={text}&langpair=en|id` dengan metode GET.
11. THE TranslateButton SHALL menggunakan `var(--text-muted)` untuk warna teks terjemahan dan `var(--border)` untuk garis pemisah antara teks asli dan terjemahan.

---

### Requirement 2: Hapus Elemen Teks "WEB"

**User Story:** Sebagai pengguna, saya ingin tampilan halaman summary yang bersih tanpa teks "WEB" yang tidak relevan, sehingga halaman terlihat lebih rapi.

#### Acceptance Criteria

1. THE Summary_Page SHALL tidak menampilkan elemen apapun yang berisi teks "WEB" setelah perubahan diterapkan.
2. THE System SHALL mempertahankan semua elemen lain di Summary_Page yang tidak berkaitan dengan teks "WEB".

---

### Requirement 3: Ganti Label Anggota Keluarga

**User Story:** Sebagai anggota keluarga, saya ingin melihat nama panggilan yang benar untuk setiap anggota di halaman family, sehingga identitas setiap anggota sesuai dengan sebutan dalam keluarga.

#### Acceptance Criteria

1. THE Family_Page SHALL menampilkan label "Abi" sebagai pengganti "Papa" untuk anggota dengan username `papa`.
2. THE Family_Page SHALL menampilkan label "Umi" sebagai pengganti "Mama" untuk anggota dengan username `mama`.
3. THE Family_Page SHALL menampilkan label "Baginda" sebagai pengganti "Nemi" untuk anggota dengan username `nemi`.
4. THE Family_Page SHALL menampilkan label "Mbah" sebagai pengganti "Venly" untuk anggota dengan username `venly`.
5. THE Family_Page SHALL menampilkan badge role yang sesuai dengan mapping label baru untuk setiap anggota.
6. THE System SHALL tidak mengubah nilai username, role, atau data apapun di tabel `users` di database.
7. THE System SHALL tidak mengubah logika autentikasi, permission check (`isEditor`), atau drag-and-drop assignment yang sudah ada.

---

### Requirement 4: Perbaikan Tampilan Task Queue (Tema Light & Minimal)

**User Story:** Sebagai pengguna yang menggunakan tema terang (light atau minimal), saya ingin teks di Task Queue tetap terbaca dengan jelas, sehingga saya tidak kesulitan membaca daftar tugas dari hari sebelumnya.

#### Acceptance Criteria

1. THE TaskQueue SHALL menggunakan `var(--text-main)` untuk semua teks judul tugas, menggantikan nilai warna hardcoded.
2. THE TaskQueue SHALL menggunakan `var(--bg-card)` untuk background container utama TaskQueue, menggantikan nilai `rgba(15,14,11,0.6)` yang hardcoded.
3. THE TaskQueue SHALL menggunakan `var(--border)` untuk warna border container dan border kartu tugas individual, menggantikan nilai `rgba(201,165,59,0.12)` yang hardcoded.
4. THE TaskQueue SHALL menggunakan `var(--bg-card2)` untuk background kartu tugas individual, menggantikan nilai `rgba(22,20,16,0.7)` yang hardcoded.
5. THE TaskQueue SHALL menggunakan `var(--text-muted)` untuk teks sekunder seperti label "dari X hari lalu", menggantikan nilai warna hardcoded.
6. WHEN tema light atau minimal aktif, THE TaskQueue SHALL menampilkan teks dengan kontras yang cukup terhadap background sehingga terbaca tanpa kesulitan.
7. WHEN tema vintage atau stellar aktif, THE TaskQueue SHALL mempertahankan tampilan visual yang konsisten dengan tema gelap.

---

### Requirement 5: Perbaikan Logika Daily Reset

**User Story:** Sebagai pengguna, saya ingin tugas yang belum selesai otomatis dipindahkan ke task queue setiap tengah malam, sehingga saya tidak kehilangan tugas yang tertunda dan dapat melanjutkannya keesokan harinya.

#### Acceptance Criteria

1. WHEN cron job Daily_Reset dijalankan, THE Daily_Reset SHALL memproses semua user yang terdaftar di tabel `users` secara berurutan.
2. WHEN memproses seorang user, THE Daily_Reset SHALL memindahkan semua tugas dengan status `pending` atau `in_progress` dari tabel `personal_tasks` ke tabel `task_queue`.
3. WHEN memproses seorang user, THE Daily_Reset SHALL menghapus semua tugas dengan status `done` dari tabel `personal_tasks`.
4. WHEN sebuah tugas dengan judul yang sama dan `user_id` yang sama sudah ada di `task_queue` dengan `queued_at` pada hari yang sama, THE Daily_Reset SHALL melewati tugas tersebut untuk menghindari duplikasi.
5. IF terjadi error saat memproses seorang user, THEN THE Daily_Reset SHALL mencatat error tersebut dengan `console.error` dan melanjutkan proses ke user berikutnya tanpa menghentikan seluruh cron job.
6. THE Daily_Reset SHALL mencatat log dengan `console.log` di awal eksekusi, setelah setiap user diproses, dan di akhir eksekusi dengan ringkasan hasil.
7. THE Daily_Reset SHALL mengembalikan response JSON yang berisi `totalUsers`, `successCount`, `errorCount`, dan array `results` per user.
8. THE vercel.json SHALL menggunakan jadwal cron `0 17 * * *` (UTC) yang setara dengan pukul 00:00 WIB (UTC+7).
9. IF request ke Daily_Reset tidak menyertakan header `Authorization: Bearer {CRON_SECRET}`, THEN THE Daily_Reset SHALL mengembalikan HTTP 401 Unauthorized.
10. WHEN proses pemindahan tugas ke `task_queue` berhasil, THE Daily_Reset SHALL menghapus tugas tersebut dari `personal_tasks` dalam operasi yang sama untuk menjaga konsistensi data.
