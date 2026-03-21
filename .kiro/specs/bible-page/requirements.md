# Requirements Document

## Introduction

Fitur Bible Page menggantikan halaman `/summary` yang sebelumnya menampilkan activity log. Halaman baru ini menampilkan satu ayat Alkitab per hari kepada user, diambil dari API bible-api.com dan di-cache di localStorage berdasarkan tanggal. Desain mengikuti estetika mafia-themed yang sudah ada di aplikasi: glassmorphism, dark mode, font serif elegan (Playfair Display), dan ornamen dekoratif. Halaman mendukung dark/light mode, animasi fade-in, loading state, dan error state.

## Glossary

- **Bible_Page**: Halaman `/summary` yang telah diganti kontennya menjadi tampilan ayat Alkitab harian.
- **Bible_API**: Layanan eksternal `https://bible-api.com/` yang menyediakan data ayat Alkitab dalam format JSON.
- **Daily_Verse**: Satu ayat Alkitab yang ditampilkan kepada user selama satu hari penuh (00:00–23:59 waktu lokal).
- **Verse_Cache**: Data ayat yang disimpan di localStorage dengan key berbasis tanggal lokal user, agar ayat tidak berubah sepanjang hari.
- **Verse_Fetcher**: Modul `Lib/utils/bibleApi.ts` yang berisi fungsi `getDailyVerse()` dan `fetchRandomVerse()`.
- **Verse_Card**: Komponen visual utama yang menampilkan teks ayat, referensi kitab, dan ornamen dekoratif.
- **Loading_State**: Tampilan sementara yang ditampilkan saat ayat sedang diambil dari API atau cache.
- **Error_State**: Tampilan yang ditampilkan ketika pengambilan ayat gagal, beserta tombol retry.
- **Sidebar**: Komponen navigasi global yang sudah ada dan tidak boleh diubah.

---

## Requirements

### Requirement 1: Penggantian Konten Halaman Summary

**User Story:** Sebagai user, saya ingin membuka halaman `/summary` dan melihat ayat Alkitab harian, bukan activity log, sehingga saya mendapat inspirasi spiritual setiap hari.

#### Acceptance Criteria

1. THE Bible_Page SHALL menggantikan seluruh konten halaman `/summary` dengan tampilan ayat Alkitab harian.
2. THE Bible_Page SHALL mempertahankan komponen Sidebar yang sudah ada tanpa modifikasi apapun.
3. THE Bible_Page SHALL mempertahankan layout global (app/layout.tsx) tanpa modifikasi apapun.
4. THE Bible_Page SHALL menggunakan CSS variable yang sudah ada (`--bg-main`, `--bg-card`, `--accent`, `--text-main`, `--text-muted`, `--border`) untuk konsistensi visual.

---

### Requirement 2: Pengambilan Ayat dari Bible API

**User Story:** Sebagai user, saya ingin ayat yang ditampilkan diambil dari sumber yang valid, sehingga konten yang saya baca adalah ayat Alkitab yang benar.

#### Acceptance Criteria

1. THE Verse_Fetcher SHALL mengekspos fungsi `fetchRandomVerse()` yang melakukan HTTP GET ke `https://bible-api.com/{reference}` untuk mengambil satu ayat.
2. WHEN `fetchRandomVerse()` dipanggil, THE Verse_Fetcher SHALL memilih referensi ayat secara acak dari daftar referensi yang telah ditentukan.
3. WHEN respons API berhasil diterima, THE Verse_Fetcher SHALL mengembalikan objek yang berisi `text` (teks ayat), `reference` (referensi kitab, pasal, ayat), dan `translation` (nama terjemahan).
4. IF respons API mengembalikan status HTTP selain 200, THEN THE Verse_Fetcher SHALL melempar error dengan pesan deskriptif.
5. IF jaringan tidak tersedia atau request timeout, THEN THE Verse_Fetcher SHALL melempar error dengan pesan deskriptif.

---

### Requirement 3: Cache Ayat Harian di localStorage

**User Story:** Sebagai user, saya ingin ayat yang sama ditampilkan sepanjang hari, sehingga pengalaman membaca saya konsisten dan tidak berubah-ubah saat refresh.

#### Acceptance Criteria

1. THE Verse_Fetcher SHALL mengekspos fungsi `getDailyVerse()` yang mengelola logika cache harian.
2. WHEN `getDailyVerse()` dipanggil, THE Verse_Fetcher SHALL memeriksa localStorage dengan key `daily_verse_{YYYY-MM-DD}` menggunakan tanggal lokal user.
3. IF cache untuk tanggal hari ini ditemukan di localStorage, THEN THE Verse_Fetcher SHALL mengembalikan data dari cache tanpa melakukan request ke API.
4. IF cache untuk tanggal hari ini tidak ditemukan, THEN THE Verse_Fetcher SHALL memanggil `fetchRandomVerse()`, menyimpan hasilnya ke localStorage, lalu mengembalikan data tersebut.
5. WHEN data ayat berhasil disimpan ke localStorage, THE Verse_Fetcher SHALL menyertakan field `cachedAt` berisi tanggal dalam format `YYYY-MM-DD`.
6. THE Verse_Fetcher SHALL menggunakan format key localStorage `daily_verse_{YYYY-MM-DD}` di mana `YYYY-MM-DD` adalah tanggal lokal user saat `getDailyVerse()` dipanggil.

---

### Requirement 4: Tampilan Loading State

**User Story:** Sebagai user, saya ingin melihat indikator loading yang sesuai dengan desain aplikasi saat ayat sedang dimuat, sehingga saya tahu sistem sedang bekerja.

#### Acceptance Criteria

1. WHILE ayat sedang diambil dari API atau cache, THE Bible_Page SHALL menampilkan Loading_State.
2. THE Loading_State SHALL menampilkan teks animasi atau indikator visual yang konsisten dengan desain mafia-themed yang sudah ada.
3. THE Loading_State SHALL menggunakan warna `var(--accent)` dan font yang konsisten dengan halaman lain.

---

### Requirement 5: Tampilan Error State

**User Story:** Sebagai user, saya ingin melihat pesan error yang jelas beserta opsi untuk mencoba lagi ketika ayat gagal dimuat, sehingga saya tidak terjebak di halaman kosong.

#### Acceptance Criteria

1. IF `getDailyVerse()` melempar error, THEN THE Bible_Page SHALL menampilkan Error_State.
2. THE Error_State SHALL menampilkan pesan error yang informatif dalam bahasa Indonesia.
3. THE Error_State SHALL menampilkan tombol "Coba Lagi" yang ketika diklik akan memanggil ulang `getDailyVerse()`.
4. WHEN tombol "Coba Lagi" diklik, THE Bible_Page SHALL kembali menampilkan Loading_State selama proses pengambilan ulang berlangsung.

---

### Requirement 6: Tampilan Verse Card

**User Story:** Sebagai user, saya ingin ayat ditampilkan dengan desain yang indah dan elegan, sehingga pengalaman membaca terasa bermakna dan sesuai dengan estetika aplikasi.

#### Acceptance Criteria

1. THE Verse_Card SHALL menampilkan teks ayat menggunakan font Playfair Display (serif) dengan ukuran yang mudah dibaca.
2. THE Verse_Card SHALL menampilkan referensi ayat (kitab, pasal, ayat) di bawah teks ayat.
3. THE Verse_Card SHALL menampilkan nama terjemahan Alkitab yang digunakan.
4. THE Verse_Card SHALL menggunakan efek glassmorphism: `background: rgba(...)`, `backdrop-filter: blur(...)`, dan `border: 1px solid rgba(255,255,255,0.1)`.
5. THE Verse_Card SHALL menampilkan ornamen dekoratif (misalnya simbol `✦` atau `◆`) sebagai elemen visual pembatas.
6. THE Verse_Card SHALL menampilkan label tanggal hari ini di atas kartu dalam format yang konsisten dengan halaman lain (huruf kapital, letter-spacing lebar).

---

### Requirement 7: Animasi Fade-In

**User Story:** Sebagai user, saya ingin ayat muncul dengan animasi yang halus saat pertama kali dimuat, sehingga transisi terasa elegan dan tidak tiba-tiba.

#### Acceptance Criteria

1. WHEN ayat berhasil dimuat dan siap ditampilkan, THE Verse_Card SHALL muncul dengan animasi fade-in dari opacity 0 ke opacity 1.
2. THE Verse_Card SHALL menyelesaikan animasi fade-in dalam durasi antara 400ms hingga 800ms.
3. WHERE user mengaktifkan `prefers-reduced-motion` di sistem operasi, THE Bible_Page SHALL menampilkan Verse_Card tanpa animasi.

---

### Requirement 8: Autentikasi dan Proteksi Halaman

**User Story:** Sebagai user yang belum login, saya ingin diarahkan ke halaman login ketika mencoba mengakses halaman Bible, sehingga konten hanya dapat diakses oleh user yang terautentikasi.

#### Acceptance Criteria

1. WHEN Bible_Page dimuat, THE Bible_Page SHALL memeriksa sesi autentikasi menggunakan Supabase.
2. IF sesi autentikasi tidak ditemukan, THEN THE Bible_Page SHALL mengarahkan user ke halaman `/login`.
3. WHEN sesi autentikasi valid ditemukan, THE Bible_Page SHALL memuat data profil user dan menampilkan Sidebar dengan data tersebut.

---

### Requirement 9: Responsivitas

**User Story:** Sebagai user yang mengakses dari berbagai perangkat, saya ingin halaman Bible tampil dengan baik di semua ukuran layar, sehingga pengalaman membaca tetap nyaman.

#### Acceptance Criteria

1. THE Bible_Page SHALL menampilkan layout yang dapat digunakan pada lebar layar minimal 320px.
2. WHEN lebar layar kurang dari 768px, THE Bible_Page SHALL menyesuaikan margin dan padding agar konten tidak terpotong oleh Sidebar.
3. THE Verse_Card SHALL memiliki lebar maksimum yang membatasi panjang baris teks agar mudah dibaca pada layar lebar.

---

### Requirement 10: Round-Trip Cache Integrity

**User Story:** Sebagai developer, saya ingin memastikan data yang disimpan ke localStorage dapat dibaca kembali dengan benar, sehingga tidak ada data korup yang menyebabkan error.

#### Acceptance Criteria

1. FOR ALL objek ayat yang valid, THE Verse_Fetcher SHALL menghasilkan data yang ketika di-serialize ke JSON lalu di-parse kembali menghasilkan objek yang ekuivalen (round-trip property).
2. IF data yang dibaca dari localStorage tidak memiliki field `text`, `reference`, atau `cachedAt`, THEN THE Verse_Fetcher SHALL mengabaikan cache tersebut dan melakukan fetch ulang dari API.
