# Requirements Document

## Introduction

Fitur ini menambahkan halaman Home (`/home`) ke aplikasi to-do list keluarga "Partai Wilhelmus" yang sudah berjalan di Next.js 15 App Router dengan Supabase. Setelah login berhasil, pengguna diarahkan ke `/home` sebagai landing page utama — bukan langsung ke `/personal`. Halaman ini berfungsi sebagai dashboard pribadi yang menampilkan jam analog photorealistic, greeting personal berdasarkan akun dan waktu, background interaktif berbasis Canvas, theme picker, dan ringkasan tugas. Sidebar yang sudah ada juga diperbarui dengan menambahkan item navigasi "Home" sebagai entri pertama.

---

## Glossary

- **Home_Page**: Halaman Next.js di route `/home` (`app/home/page.js`) yang menjadi landing page setelah login.
- **Analog_Clock**: Komponen jam analog berbasis SVG atau Canvas yang menampilkan waktu secara real-time dengan animasi halus.
- **Digital_Clock**: Komponen fallback teks yang menampilkan waktu dalam format HH:MM:SS.
- **Particle_Canvas**: Komponen Canvas yang merender sistem partikel interaktif sebagai background halaman.
- **Theme_Picker**: Komponen UI untuk memilih tema tampilan; pilihan disimpan di `localStorage`.
- **Task_Summary**: Komponen yang menampilkan ringkasan jumlah tugas dari tabel `personal_tasks` di Supabase.
- **Greeting**: Teks sapaan personal yang ditampilkan berdasarkan akun pengguna dan rentang waktu hari.
- **Sidebar**: Komponen navigasi samping yang sudah ada di `components/Sidebar.js`.
- **EMAIL_ROLE_MAP**: Peta email-ke-nama-panggilan yang sudah didefinisikan di `app/login/page.js`.
- **Reduced_Motion**: Preferensi aksesibilitas pengguna yang menonaktifkan animasi bergerak.
- **Theme_Vintage**: Tema default dengan palet earth-tone sesuai CSS variables yang sudah ada.
- **Theme_Minimal**: Tema flat dark dengan kontras tinggi dan tanpa ornamen.
- **Theme_Stellar**: Tema space/bintang dengan palet gelap dan aksen biru-ungu.
- **ARIA_Live_Region**: Elemen HTML dengan atribut `aria-live` untuk mengumumkan perubahan konten ke screen reader.
- **requestAnimationFrame**: Web API untuk animasi yang sinkron dengan refresh rate layar.

---

## Requirements

### Requirement 1: Redirect Pasca-Login ke /home

**User Story:** Sebagai anggota keluarga Wilhelmus, saya ingin diarahkan ke halaman Home setelah login, sehingga saya langsung melihat dashboard pribadi saya.

#### Acceptance Criteria

1. WHEN pengguna berhasil melakukan autentikasi via `supabase.auth.signInWithPassword`, THE Login_Page SHALL mengarahkan pengguna ke route `/home` menggunakan `router.push("/home")`.
2. WHEN pengguna mengakses route `/home` tanpa sesi autentikasi aktif, THE Home_Page SHALL mengarahkan pengguna ke `/login`.
3. THE Home_Page SHALL memverifikasi sesi autentikasi via `supabase.auth.getUser()` pada saat mount komponen.

---

### Requirement 2: Jam Analog Photorealistic

**User Story:** Sebagai pengguna, saya ingin melihat jam analog bergaya jam dinding nyata, sehingga saya dapat mengetahui waktu dengan cara yang estetis dan imersif.

#### Acceptance Criteria

1. THE Analog_Clock SHALL merender wajah jam menggunakan SVG atau Canvas HTML5 dengan tekstur visual earth-tone yang selaras dengan Theme_Vintage.
2. WHEN halaman Home_Page dimuat, THE Analog_Clock SHALL memulai animasi jarum jam menggunakan `requestAnimationFrame` untuk pergerakan yang halus (smooth sweep).
3. THE Analog_Clock SHALL menampilkan tiga jarum: jarum jam (hour hand), jarum menit (minute hand), dan jarum detik (second hand) dengan proporsi dan bobot visual yang berbeda.
4. THE Analog_Clock SHALL menampilkan 12 tanda angka (1–12) dan 60 tanda tick pada lingkaran wajah jam.
5. THE Analog_Clock SHALL menerapkan efek visual kedalaman (depth) berupa drop shadow pada jarum dan wajah jam untuk kesan tiga dimensi.
6. WHEN pengguna mengaktifkan Reduced_Motion, THE Analog_Clock SHALL menghentikan animasi `requestAnimationFrame` dan memperbarui posisi jarum setiap 1000ms menggunakan `setInterval`.
7. WHEN tema aktif adalah Theme_Minimal, THE Analog_Clock SHALL menyesuaikan palet warna wajah jam ke skema flat dark.
8. WHEN tema aktif adalah Theme_Stellar, THE Analog_Clock SHALL menyesuaikan palet warna wajah jam ke skema space/bintang.

---

### Requirement 3: Digital Clock Fallback

**User Story:** Sebagai pengguna dengan kebutuhan aksesibilitas atau preferensi tampilan sederhana, saya ingin ada tampilan jam digital sebagai alternatif, sehingga saya tetap dapat membaca waktu dengan jelas.

#### Acceptance Criteria

1. THE Digital_Clock SHALL menampilkan waktu saat ini dalam format `HH:MM:SS` menggunakan 24-jam atau 12-jam sesuai locale browser.
2. WHEN pengguna mengaktifkan Reduced_Motion, THE Home_Page SHALL menampilkan Digital_Clock secara default sebagai pengganti Analog_Clock.
3. THE Digital_Clock SHALL dapat diaktifkan secara manual oleh pengguna melalui tombol toggle yang terlihat di halaman.
4. THE Digital_Clock SHALL memperbarui tampilan setiap 1000ms menggunakan `setInterval`.

---

### Requirement 4: Greeting Personal Berdasarkan Akun dan Waktu

**User Story:** Sebagai anggota keluarga, saya ingin disapa dengan nama panggilan saya yang sesuai waktu hari ini, sehingga halaman terasa personal dan hangat.

#### Acceptance Criteria

1. THE Home_Page SHALL menentukan periode waktu berdasarkan jam lokal: Pagi (05:00–11:59), Siang (12:00–17:59), Malam (18:00–20:59), dan Tengah Malam (21:00–04:59).
2. WHEN pengguna yang login adalah `papa@example.com`, THE Greeting SHALL menampilkan "Good Morning Abah" / "Good Afternoon Abah" / "Good Evening Abah" / "Good Night Abah" sesuai periode waktu.
3. WHEN pengguna yang login adalah `mama@example.com`, THE Greeting SHALL menampilkan "Good Morning Emak" / "Good Afternoon Emak" / "Good Evening Emak" / "Good Night Emak" sesuai periode waktu.
4. WHEN pengguna yang login adalah `nemi@example.com`, THE Greeting SHALL menampilkan "Good Morning Tuan Muda" / "Good Afternoon Tuan Muda" / "Good Evening Tuan Muda" / "Good Night Tuan Muda" sesuai periode waktu.
5. WHEN pengguna yang login adalah `venly@example.com`, THE Greeting SHALL menampilkan "Good Morning Penly" / "Good Afternoon Penly" / "Good Evening Penly" / "Good Night Penly" sesuai periode waktu.
6. THE Greeting SHALL diperbarui secara otomatis apabila periode waktu berubah selama sesi aktif, tanpa memerlukan reload halaman.
7. IF email pengguna tidak terdapat dalam peta nama panggilan yang dikenal, THE Greeting SHALL menampilkan sapaan generik menggunakan bagian lokal dari alamat email pengguna.

---

### Requirement 5: Background Interaktif — Particle Canvas

**User Story:** Sebagai pengguna, saya ingin background halaman yang hidup dan merespons gerakan kursor saya, sehingga pengalaman menggunakan aplikasi terasa lebih menarik.

#### Acceptance Criteria

1. THE Particle_Canvas SHALL merender sistem partikel di layer background halaman menggunakan Canvas HTML5 yang menutupi seluruh viewport.
2. WHEN halaman Home_Page dimuat, THE Particle_Canvas SHALL menginisialisasi partikel dengan posisi acak di seluruh area canvas.
3. WHEN kursor pengguna bergerak di atas halaman, THE Particle_Canvas SHALL menggerakkan partikel yang berada dalam radius 120px dari posisi kursor menjauh dari kursor (efek repulsi).
4. THE Particle_Canvas SHALL menganimasikan pergerakan partikel menggunakan `requestAnimationFrame` dengan kecepatan dan arah yang bervariasi per partikel.
5. WHEN tema aktif adalah Theme_Vintage, THE Particle_Canvas SHALL merender partikel dengan warna earth-tone (variasi `--accent` dan `--text-muted`).
6. WHEN tema aktif adalah Theme_Stellar, THE Particle_Canvas SHALL merender partikel menyerupai bintang dengan warna putih dan biru muda.
7. WHEN tema aktif adalah Theme_Minimal, THE Particle_Canvas SHALL merender partikel dengan warna abu-abu gelap beropa rendah.
8. WHEN pengguna mengaktifkan Reduced_Motion, THE Particle_Canvas SHALL menghentikan animasi `requestAnimationFrame` dan menampilkan partikel sebagai titik statis.
9. WHEN ukuran jendela browser berubah, THE Particle_Canvas SHALL menyesuaikan dimensi canvas ke ukuran viewport yang baru.

---

### Requirement 6: Theme Picker

**User Story:** Sebagai pengguna, saya ingin memilih tema tampilan halaman Home, sehingga saya dapat menyesuaikan pengalaman visual sesuai suasana hati saya.

#### Acceptance Criteria

1. THE Theme_Picker SHALL menyediakan tiga pilihan tema: Vintage (default), Minimal, dan Stellar.
2. WHEN pengguna memilih sebuah tema, THE Theme_Picker SHALL menyimpan pilihan tersebut ke `localStorage` dengan key `home_theme_{userId}` agar persisten per akun.
3. WHEN Home_Page dimuat, THE Theme_Picker SHALL membaca nilai dari `localStorage` dan menerapkan tema yang tersimpan; apabila tidak ada nilai tersimpan, THE Theme_Picker SHALL menerapkan tema Vintage.
4. WHEN pengguna memilih tema, THE Home_Page SHALL menerapkan perubahan visual secara instan tanpa reload halaman.
5. THE Theme_Picker SHALL menampilkan indikator visual (misalnya border atau highlight) pada tema yang sedang aktif.
6. THE Theme_Vintage SHALL menggunakan palet CSS variables yang sudah ada: `--bg-main: #1a1612`, `--accent: #c8a96e`, `--text-main: #f0e6d3`.
7. THE Theme_Minimal SHALL menggunakan palet flat dark dengan background `#0d0d0d`, teks `#e0e0e0`, dan aksen `#ffffff`.
8. THE Theme_Stellar SHALL menggunakan palet space dengan background `#050510`, teks `#c8d8f0`, dan aksen `#7090e0`.

---

### Requirement 7: Task Summary

**User Story:** Sebagai pengguna, saya ingin melihat ringkasan tugas saya di halaman Home, sehingga saya dapat langsung mengetahui progres tanpa harus berpindah halaman terlebih dahulu.

#### Acceptance Criteria

1. WHEN Home_Page dimuat dan pengguna terautentikasi, THE Task_Summary SHALL mengambil data dari tabel `personal_tasks` di Supabase dengan filter `user_id` milik pengguna yang sedang login.
2. THE Task_Summary SHALL menampilkan tiga angka: jumlah tugas total, jumlah tugas dengan status `done`, dan jumlah tugas dengan status selain `done` (pending/in_progress).
3. WHEN pengguna mengklik area Task_Summary, THE Home_Page SHALL mengarahkan pengguna ke route `/personal` menggunakan `router.push("/personal")`.
4. IF query Supabase mengembalikan error, THE Task_Summary SHALL menampilkan pesan "Gagal memuat tugas" dan tidak menampilkan angka yang tidak valid.
5. THE Task_Summary SHALL menampilkan state loading selama data sedang diambil dari Supabase.

---

### Requirement 8: Aksesibilitas

**User Story:** Sebagai pengguna dengan kebutuhan aksesibilitas, saya ingin halaman Home dapat digunakan dengan screen reader dan tanpa animasi berlebihan, sehingga pengalaman saya tetap nyaman dan informatif.

#### Acceptance Criteria

1. THE Home_Page SHALL menyertakan elemen dengan atribut `aria-live="polite"` yang memuat teks waktu digital saat ini, diperbarui setiap menit, agar screen reader dapat mengumumkan perubahan waktu.
2. THE Home_Page SHALL menyertakan elemen dengan atribut `aria-live="polite"` yang memuat teks Greeting saat ini, diperbarui ketika periode waktu berubah.
3. THE Home_Page SHALL menyertakan tombol toggle Reduced_Motion yang dapat diakses via keyboard (focusable, operable dengan Enter/Space).
4. WHEN pengguna mengaktifkan Reduced_Motion melalui tombol toggle, THE Home_Page SHALL menyimpan preferensi tersebut ke `localStorage` dengan key `reduced_motion_{userId}`.
5. WHEN `window.matchMedia("(prefers-reduced-motion: reduce)").matches` bernilai `true` pada saat mount, THE Home_Page SHALL mengaktifkan Reduced_Motion secara otomatis.
6. THE Analog_Clock SHALL menyertakan atribut `aria-label` yang mendeskripsikan waktu saat ini dalam format teks yang dapat dibaca (contoh: "Jam 14 lewat 30 menit 5 detik").
7. THE Theme_Picker SHALL menyertakan atribut `aria-pressed` pada setiap tombol tema untuk mengindikasikan tema yang sedang aktif kepada screen reader.

---

### Requirement 9: Pembaruan Sidebar

**User Story:** Sebagai pengguna, saya ingin ada tautan "Home" di sidebar navigasi, sehingga saya dapat kembali ke halaman Home kapan saja dari halaman mana pun.

#### Acceptance Criteria

1. THE Sidebar SHALL menambahkan item navigasi dengan label "Home", href `/home`, dan ikon `✦` atau `⌂` sebagai entri pertama dalam array `navItems`, sebelum item "Personal".
2. WHEN route aktif adalah `/home`, THE Sidebar SHALL menampilkan item "Home" dalam state aktif (warna `--accent`, border kiri, background highlight) sesuai dengan gaya item aktif yang sudah ada.
3. THE Sidebar SHALL mempertahankan semua item navigasi yang sudah ada (Personal, Family, Summary, Spectate) tanpa perubahan urutan relatif di antara mereka.
