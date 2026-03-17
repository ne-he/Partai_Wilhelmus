# Requirements Document

## Introduction

Fitur "Verse of The Day" menggantikan halaman Summary yang ada (`app/summary/page.js`) dengan halaman baru di `app/verse/page.js`. Halaman ini menampilkan satu ayat Alkitab harian yang diambil dari Beeble Indonesia API (versi Terjemahan Baru / TB). Ayat dipilih secara acak namun stabil per hari menggunakan date seed, sehingga tidak berubah setiap kali halaman di-refresh. Tampilan menggunakan gaya mini Bible / book card dengan bordered container dan scripture style. Sidebar navigasi diperbarui untuk mengganti link Summary dengan link Verse.

---

## Glossary

- **VersePage**: Halaman Next.js di `app/verse/page.js` yang menampilkan ayat harian.
- **BeebleAPI**: Layanan API eksternal di `https://beeble.vercel.app/api/v1/` yang menyediakan data kitab dan isi pasal Alkitab.
- **DateSeed**: Nilai numerik yang diturunkan dari tanggal kalender (tahun, bulan, hari) dan digunakan sebagai seed untuk pemilihan acak yang deterministik.
- **SeededRandom**: Fungsi pseudo-random number generator (PRNG) berbasis DateSeed yang menghasilkan nilai yang sama untuk seed yang sama.
- **BookList**: Daftar semua kitab Alkitab yang dikembalikan oleh endpoint `GET /passage/list` dari BeebleAPI.
- **Passage**: Objek yang berisi daftar ayat dari satu pasal kitab tertentu, dikembalikan oleh endpoint `GET /passage/{abbr}/{chapter}?ver=tb`.
- **Verse**: Satu ayat Alkitab, terdiri dari teks ayat dan nomor ayat.
- **VerseReference**: String referensi ayat dalam format `{Nama Kitab} {Pasal}:{Nomor Ayat}`, contoh: `Yohanes 3:16`.
- **Sidebar**: Komponen navigasi di `components/Sidebar.js` yang menampilkan link ke halaman-halaman utama aplikasi.
- **TB**: Singkatan dari Terjemahan Baru, versi Alkitab yang digunakan dalam aplikasi ini.

---

## Requirements

### Requirement 1: Navigasi ke Halaman Verse

**User Story:** Sebagai pengguna, saya ingin dapat mengakses halaman Verse of The Day dari sidebar, sehingga saya dapat membaca ayat harian dengan mudah.

#### Acceptance Criteria

1. THE Sidebar SHALL menampilkan link navigasi ke `/verse` dengan label "Verse" menggantikan link `/summary` yang sebelumnya ada.
2. THE Sidebar SHALL menggunakan ikon `✝` untuk link navigasi Verse.
3. WHEN pengguna berada di halaman `/verse`, THE Sidebar SHALL menampilkan link Verse dalam kondisi aktif (highlighted).

---

### Requirement 2: Pengambilan Data Ayat Harian

**User Story:** Sebagai pengguna, saya ingin melihat ayat Alkitab yang berbeda setiap hari, sehingga saya mendapat bacaan rohani yang segar setiap harinya.

#### Acceptance Criteria

1. WHEN VersePage dimuat, THE VersePage SHALL mengambil daftar kitab dari BeebleAPI endpoint `GET https://beeble.vercel.app/api/v1/passage/list`.
2. WHEN daftar kitab berhasil diterima, THE VersePage SHALL memilih satu kitab secara acak menggunakan SeededRandom berbasis DateSeed dari tanggal hari ini.
3. WHEN kitab telah dipilih, THE VersePage SHALL memilih satu nomor pasal secara acak dari rentang pasal yang tersedia pada kitab tersebut menggunakan SeededRandom.
4. WHEN pasal telah dipilih, THE VersePage SHALL mengambil isi pasal dari BeebleAPI endpoint `GET https://beeble.vercel.app/api/v1/passage/{abbr}/{chapter}?ver=tb`.
5. WHEN isi pasal berhasil diterima, THE VersePage SHALL memilih satu ayat secara acak dari daftar ayat menggunakan SeededRandom.
6. THE SeededRandom SHALL menghasilkan nilai yang identik untuk DateSeed yang sama, sehingga ayat yang dipilih tidak berubah selama satu hari penuh meskipun halaman di-refresh.
7. THE DateSeed SHALL diturunkan hanya dari nilai tahun, bulan, dan hari kalender lokal pengguna, tanpa menyertakan jam, menit, atau detik.

---

### Requirement 3: Tampilan Ayat (Scripture Card)

**User Story:** Sebagai pengguna, saya ingin melihat ayat ditampilkan dalam format yang indah dan mudah dibaca, sehingga pengalaman membaca terasa seperti membuka Alkitab.

#### Acceptance Criteria

1. THE VersePage SHALL menampilkan teks ayat yang dipilih di dalam sebuah bordered container dengan gaya scripture / mini Bible card.
2. THE VersePage SHALL menampilkan VerseReference dalam format `{Nama Kitab} {Pasal}:{Nomor Ayat}` di bawah teks ayat.
3. THE VersePage SHALL menampilkan label versi Alkitab "TB" (Terjemahan Baru) pada card.
4. THE VersePage SHALL menggunakan font serif untuk teks ayat agar memberikan kesan scripture.
5. THE VersePage SHALL menampilkan label halaman "VERSE OF THE DAY" sebagai judul seksi di atas card.
6. THE VersePage SHALL menggunakan CSS variable yang sudah ada (`--bg-card`, `--border`, `--accent`, `--text-main`, `--text-muted`) agar tampilan konsisten dengan tema aplikasi.

---

### Requirement 4: State Loading dan Error

**User Story:** Sebagai pengguna, saya ingin mendapat umpan balik yang jelas saat data sedang dimuat atau terjadi kesalahan, sehingga saya tidak bingung dengan tampilan kosong.

#### Acceptance Criteria

1. WHILE data ayat sedang diambil dari BeebleAPI, THE VersePage SHALL menampilkan indikator loading dengan teks "LOADING...".
2. IF BeebleAPI mengembalikan respons error (status HTTP non-2xx), THEN THE VersePage SHALL menampilkan pesan error yang deskriptif kepada pengguna.
3. IF fetch ke BeebleAPI gagal karena masalah jaringan, THEN THE VersePage SHALL menampilkan pesan error yang deskriptif kepada pengguna.
4. IF daftar ayat dari pasal yang diambil kosong, THEN THE VersePage SHALL menampilkan pesan error yang deskriptif kepada pengguna.

---

### Requirement 5: Autentikasi dan Akses Halaman

**User Story:** Sebagai pengguna yang sudah login, saya ingin halaman Verse hanya dapat diakses setelah autentikasi, sehingga konten tetap terlindungi.

#### Acceptance Criteria

1. WHEN VersePage dimuat dan sesi pengguna tidak ditemukan, THE VersePage SHALL mengarahkan pengguna ke halaman `/login`.
2. WHEN VersePage dimuat dan sesi pengguna valid, THE VersePage SHALL menampilkan Sidebar dengan data profil pengguna yang sedang login.

---

### Requirement 6: Implementasi Teknis

**User Story:** Sebagai developer, saya ingin implementasi yang bersih dan tidak bergantung pada library eksternal, sehingga kode mudah dipelihara dan di-deploy.

#### Acceptance Criteria

1. THE VersePage SHALL menggunakan native `fetch` API bawaan JavaScript untuk semua pemanggilan ke BeebleAPI, tanpa library HTTP eksternal.
2. THE VersePage SHALL diimplementasikan sebagai React Client Component (`"use client"`) menggunakan Next.js App Router.
3. THE VersePage SHALL tidak memerlukan environment variable atau API key untuk mengakses BeebleAPI.
4. THE SeededRandom SHALL diimplementasikan sebagai fungsi JavaScript murni (pure function) tanpa dependensi eksternal.
5. THE VersePage SHALL menggunakan `export const dynamic = "force-dynamic"` untuk memastikan halaman tidak di-cache secara statis oleh Next.js.
