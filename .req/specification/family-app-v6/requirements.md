# Requirements Document

## Introduction

Family App v6 adalah update besar yang meningkatkan kenyamanan dan kepuasan pengguna melalui tiga pilar utama: micro-interactions & animasi, responsivitas mobile-first, dan sistem tema lanjutan. Update ini bersifat additive — tidak mengubah struktur database, logika autentikasi, cron job, atau RLS yang sudah ada. File `.js` yang sudah ada dipertahankan ekstensinya; komponen baru dibuat dalam `.tsx`. Semua styling dominan menggunakan inline styles dengan CSS variables; Tailwind hanya untuk komponen kecil baru.

---

## Glossary

- **System**: Aplikasi Family App v6 secara keseluruhan
- **Personal_Page**: Halaman `app/personal/page.tsx` yang menampilkan kanban tugas pribadi
- **Family_Page**: Halaman `app/family/page.tsx` yang menampilkan tugas keluarga
- **Home_Page**: Halaman `app/home/page.js` yang menampilkan jam dan greeting
- **Summary_Page**: Halaman `app/summary/page.js` yang menampilkan ayat harian
- **Spectate_Page**: Halaman `app/spectate/[user]/page.js` untuk melihat tugas anggota lain
- **DraggableTask**: Komponen `components/DraggableTask.tsx` untuk kartu tugas yang bisa di-drag
- **DroppableColumn**: Komponen `components/DroppableColumn.tsx` untuk kolom kanban
- **DragOverlay**: Komponen overlay dari `@dnd-kit/core` yang menampilkan kartu saat di-drag
- **PageTransition**: Komponen `components/PageTransition.tsx` untuk transisi antar halaman
- **ConfirmModal**: Komponen `components/ConfirmModal.tsx` untuk konfirmasi hapus tugas
- **Tooltip**: Komponen `components/Tooltip.tsx` untuk tooltip dengan animasi fade
- **Skeleton**: Komponen `components/Skeleton.tsx` untuk loading placeholder
- **Toast**: Komponen `components/Toast.tsx` untuk notifikasi sementara
- **Navigation**: Komponen `components/Navigation.tsx` untuk bottom navigation bar mobile
- **AccentPicker**: Komponen `components/AccentPicker.tsx` untuk memilih warna aksen
- **ThemePicker**: Komponen `components/ThemePicker.js` yang sudah ada, akan diperluas
- **Theme_System**: Modul `Lib/theme.ts` untuk manajemen konfigurasi tema
- **useToast**: Hook `hooks/useToast.ts` untuk manajemen antrian toast
- **useBreakpoint**: Hook `Lib/hooks/useBreakpoint.ts` untuk deteksi breakpoint layar
- **useReducedMotion**: Hook `Lib/hooks/useReducedMotion.ts` untuk deteksi preferensi gerak
- **useTheme**: Hook `Lib/hooks/useTheme.ts` untuk manajemen tema dan persistensi
- **CSS_Variables**: Variabel CSS global yang didefinisikan di `app/globals.css`
- **localStorage**: Web Storage API untuk menyimpan preferensi pengguna di browser
- **framer-motion**: Library animasi yang sudah terpasang di project
- **dnd-kit**: Library drag-and-drop yang sudah terpasang (`@dnd-kit/core`, `@dnd-kit/sortable`)
- **TouchSensor**: Sensor dari `@dnd-kit/core` untuk mendukung drag di perangkat sentuh
- **PointerSensor**: Sensor dari `@dnd-kit/core` untuk mendukung drag dengan pointer/mouse
- **AnimatePresence**: Komponen dari `framer-motion` untuk animasi mount/unmount
- **spring**: Tipe transisi framer-motion dengan efek pegas fisik
- **prefers-reduced-motion**: Media query CSS untuk mendeteksi preferensi gerak pengguna
- **theme_prefs**: Key localStorage untuk menyimpan preferensi tema (struktur: `{ theme, accent }`)
- **Light_Mode**: Tema terang dengan background `#f9f7f5`, card `#ffffff`, text `#1e1a15`
- **Stellar_Theme**: Tema bintang dengan efek partikel dan animasi kedip
- **Accent_Color**: Warna aksen yang dapat dikustomisasi, disimpan sebagai CSS variable `--accent`

---

## Requirements

### Requirement 1: Drag-and-Drop Feedback Visual

**User Story:** Sebagai pengguna, saya ingin mendapat umpan balik visual yang jelas saat melakukan drag-and-drop tugas, sehingga saya tahu kartu mana yang sedang saya pindahkan dan ke mana kartu tersebut akan mendarat.

#### Acceptance Criteria

1. WHEN pengguna memulai drag pada kartu tugas di Personal_Page, THE DraggableTask SHALL menerapkan `transform: scale(1.02)` dan `box-shadow` yang lebih besar pada kartu yang sedang di-drag.
2. WHEN kartu tugas sedang di-drag, THE DragOverlay SHALL menampilkan salinan kartu dengan efek `scale(1.02)` dan `box-shadow` yang diperbesar menggunakan `framer-motion`.
3. WHEN pengguna melakukan drag over kolom atau area antar kartu, THE DroppableColumn SHALL menampilkan drop indicator berupa garis horizontal berwarna `var(--accent)` menggunakan elemen `<div>` dengan animasi spring dari `framer-motion`.
4. WHEN kartu tugas mendarat setelah drag (onDragEnd), THE DraggableTask SHALL menjalankan animasi spring dengan `duration: 0.2` dan `type: "spring"` menggunakan `motion` dari `framer-motion`.
5. THE Personal_Page SHALL mengaktifkan `PointerSensor` dan `TouchSensor` dari `@dnd-kit/core` agar drag-and-drop berfungsi di perangkat sentuh.
6. WHEN pengguna menggunakan perangkat sentuh, THE Personal_Page SHALL mendukung drag-and-drop melalui `TouchSensor` dengan `activationConstraint` yang sesuai.

---

### Requirement 2: Transisi Halaman dan Modal

**User Story:** Sebagai pengguna, saya ingin melihat transisi halus saat berpindah halaman dan membuka/menutup modal, sehingga pengalaman navigasi terasa lebih mulus dan profesional.

#### Acceptance Criteria

1. THE PageTransition SHALL menggunakan `motion.div` dari `framer-motion` dengan `initial={{ opacity: 0, y: 20 }}`, `animate={{ opacity: 1, y: 0 }}`, `exit={{ opacity: 0, y: -20 }}`, dan `transition={{ duration: 0.3 }}`.
2. THE Home_Page SHALL membungkus konten utamanya dengan komponen PageTransition.
3. THE Personal_Page SHALL membungkus konten utamanya dengan komponen PageTransition.
4. THE Family_Page SHALL membungkus konten utamanya dengan komponen PageTransition.
5. THE Summary_Page SHALL membungkus konten utamanya dengan komponen PageTransition.
6. THE Spectate_Page SHALL membungkus konten utamanya dengan komponen PageTransition.
7. THE ConfirmModal SHALL menggunakan `AnimatePresence` dari `framer-motion` dengan animasi `scale` dan efek `backdrop-filter: blur()` pada overlay.
8. WHEN pengguna mengklik tombol hapus tugas di Personal_Page, THE ConfirmModal SHALL muncul dengan animasi scale dari `0.9` ke `1.0` dan `opacity` dari `0` ke `1`.
9. WHEN pengguna mengkonfirmasi atau membatalkan di ConfirmModal, THE ConfirmModal SHALL menutup dengan animasi exit yang merupakan kebalikan dari animasi masuk.

---

### Requirement 3: Hover States dan Tooltip

**User Story:** Sebagai pengguna, saya ingin mendapat umpan balik visual saat mengarahkan kursor ke elemen interaktif, sehingga saya tahu elemen mana yang bisa diklik atau diinteraksikan.

#### Acceptance Criteria

1. THE System SHALL menerapkan `transition: 'all 0.15s ease'` pada semua elemen interaktif yang menggunakan inline styles.
2. WHEN pengguna mengarahkan kursor ke kartu tugas, THE DraggableTask SHALL mengubah `borderColor` menjadi `var(--accent)` dan `backgroundColor` menjadi sedikit lebih terang.
3. THE Tooltip SHALL menampilkan teks tooltip dengan animasi fade menggunakan `motion.div` dari `framer-motion` dengan `initial={{ opacity: 0 }}` dan `animate={{ opacity: 1 }}`.
4. WHEN pengguna mengarahkan kursor ke ikon assignment di Family_Page, THE Tooltip SHALL menampilkan teks "Drag to assign" dengan animasi fade.
5. THE Tooltip SHALL memiliki atribut `role="tooltip"` dan dihubungkan ke elemen pemicunya melalui `aria-describedby`.

---

### Requirement 4: Loading Skeleton

**User Story:** Sebagai pengguna, saya ingin melihat placeholder yang menyerupai konten saat data sedang dimuat, sehingga halaman tidak terasa kosong dan saya tahu bahwa konten sedang diproses.

#### Acceptance Criteria

1. THE Skeleton SHALL menggunakan animasi `@keyframes pulse` dengan perubahan `opacity` dari `0.4` ke `1.0` untuk efek berkedip.
2. WHEN Personal_Page sedang melakukan fetch tugas, THE Personal_Page SHALL menampilkan Skeleton yang menyerupai layout kartu tugas dengan bar-bar dengan lebar bervariasi.
3. WHEN Family_Page sedang melakukan fetch tugas keluarga, THE Family_Page SHALL menampilkan Skeleton yang menyerupai layout daftar tugas.
4. WHEN Summary_Page sedang melakukan fetch ayat harian, THE Summary_Page SHALL menampilkan Skeleton yang menyerupai layout card dengan garis-garis teks.
5. THE Skeleton SHALL menggunakan `background: linear-gradient` dengan warna `var(--bg-card)` dan `var(--bg-card2)` agar sesuai dengan tema aktif.

---

### Requirement 5: Toast Notifikasi

**User Story:** Sebagai pengguna, saya ingin mendapat notifikasi singkat saat melakukan aksi penting seperti menambah, menghapus, atau mengassign tugas, sehingga saya mendapat konfirmasi bahwa aksi berhasil dilakukan.

#### Acceptance Criteria

1. THE Toast SHALL muncul dari bawah layar dengan animasi slide-in menggunakan `motion.div` dari `framer-motion` dengan `initial={{ y: 100, opacity: 0 }}` dan `animate={{ y: 0, opacity: 1 }}`.
2. THE Toast SHALL otomatis menghilang setelah 3 detik dengan animasi exit `{ y: 100, opacity: 0 }`.
3. THE useToast SHALL menyediakan fungsi `showToast(message, type)` yang dapat dipanggil dari komponen manapun.
4. WHEN pengguna menambahkan tugas baru di Personal_Page, THE Toast SHALL menampilkan pesan konfirmasi penambahan tugas.
5. WHEN pengguna menghapus tugas di Personal_Page, THE Toast SHALL menampilkan pesan konfirmasi penghapusan tugas.
6. WHEN pengguna mengassign tugas di Family_Page, THE Toast SHALL menampilkan pesan konfirmasi assignment.
7. THE Toast SHALL menggunakan `AnimatePresence` dari `framer-motion` untuk mengelola antrian beberapa toast secara bersamaan.
8. THE Toast SHALL memiliki atribut `role="status"` dan `aria-live="polite"` untuk aksesibilitas screen reader.

---

### Requirement 6: Aksesibilitas Animasi

**User Story:** Sebagai pengguna yang sensitif terhadap gerakan, saya ingin animasi kompleks dinonaktifkan secara otomatis berdasarkan preferensi sistem saya, sehingga saya dapat menggunakan aplikasi dengan nyaman.

#### Acceptance Criteria

1. THE useReducedMotion SHALL mendeteksi media query `(prefers-reduced-motion: reduce)` menggunakan `window.matchMedia`.
2. WHEN `prefers-reduced-motion: reduce` aktif di sistem pengguna, THE System SHALL menonaktifkan animasi transisi halaman, animasi spring drag-and-drop, dan animasi toast.
3. WHEN `prefers-reduced-motion: reduce` aktif, THE System SHALL tetap menampilkan perubahan state (seperti perpindahan kartu) tanpa animasi transisi.
4. THE useReducedMotion SHALL mengembalikan nilai boolean `shouldReduceMotion` yang dapat digunakan oleh komponen lain.
5. WHEN nilai `prefers-reduced-motion` berubah saat aplikasi berjalan, THE useReducedMotion SHALL memperbarui nilai `shouldReduceMotion` secara reaktif.

---

### Requirement 7: Kanban Mobile-Responsive di Personal Page

**User Story:** Sebagai pengguna mobile, saya ingin tampilan kanban yang optimal di layar kecil, sehingga saya dapat mengelola tugas dengan mudah tanpa harus scroll horizontal.

#### Acceptance Criteria

1. THE useBreakpoint SHALL mendeteksi lebar layar dan mengembalikan nilai boolean `isMobile` yang bernilai `true` ketika lebar layar kurang dari 768px.
2. WHEN `isMobile` bernilai `true`, THE Personal_Page SHALL mengubah tampilan tiga kolom kanban menjadi tampilan tab horizontal atau daftar vertikal dengan badge status.
3. WHEN tampilan mobile aktif, THE Personal_Page SHALL menampilkan tombol pindah status pada setiap kartu tugas sebagai pengganti drag-and-drop kolom.
4. WHILE tampilan mobile aktif, THE Personal_Page SHALL tetap mendukung drag-and-drop menggunakan `TouchSensor`.
5. WHEN `isMobile` bernilai `false`, THE Personal_Page SHALL menampilkan layout tiga kolom kanban seperti semula.

---

### Requirement 8: Family Page Mobile-Responsive

**User Story:** Sebagai pengguna mobile, saya ingin melihat tugas keluarga dalam format yang mudah dibaca di layar kecil, sehingga saya tidak perlu scroll horizontal pada tabel.

#### Acceptance Criteria

1. WHEN lebar layar kurang dari 768px, THE Family_Page SHALL mengubah tampilan daftar tugas dari format tabel menjadi format card stack vertikal.
2. WHEN tampilan card stack aktif, THE Family_Page SHALL menampilkan judul tugas, status, assignee, dan tombol aksi pada setiap card.
3. WHEN lebar layar 768px atau lebih, THE Family_Page SHALL menampilkan tampilan daftar tugas seperti semula.

---

### Requirement 9: Home Page Mobile-Responsive

**User Story:** Sebagai pengguna mobile, saya ingin tampilan jam dan greeting yang optimal di layar kecil, sehingga semua elemen terlihat dengan baik tanpa terpotong.

#### Acceptance Criteria

1. WHEN lebar layar kurang dari 768px, THE Home_Page SHALL mengubah tata letak jam menjadi vertikal dengan jam analog di atas dan jam digital di bawah menggunakan CSS Grid dengan `grid-template-columns: 1fr`.
2. WHEN lebar layar 768px atau lebih, THE Home_Page SHALL mempertahankan tata letak horizontal yang sudah ada.

---

### Requirement 10: Summary Page Mobile-Responsive

**User Story:** Sebagai pengguna mobile, saya ingin teks ayat harian yang mudah dibaca di layar kecil, sehingga saya dapat menikmati konten tanpa teks yang terlalu kecil atau terlalu besar.

#### Acceptance Criteria

1. THE Summary_Page SHALL menggunakan `clamp()` untuk ukuran font teks ayat: `fontSize: 'clamp(1rem, 4vw, 1.5rem)'`.
2. THE Summary_Page SHALL menggunakan `clamp()` untuk padding card ayat: `padding: 'clamp(1rem, 5vw, 2rem)'`.

---

### Requirement 11: Bottom Navigation Bar Mobile

**User Story:** Sebagai pengguna mobile, saya ingin navigasi yang mudah dijangkau di bagian bawah layar, sehingga saya dapat berpindah halaman dengan ibu jari tanpa harus menjangkau sidebar.

#### Acceptance Criteria

1. THE Navigation SHALL menampilkan bottom navigation bar dengan ikon untuk Home, Personal, Family, Summary, dan Profile.
2. WHEN lebar layar kurang dari 768px, THE Navigation SHALL ditampilkan sebagai bottom bar yang fixed di bagian bawah layar.
3. WHEN lebar layar 768px atau lebih, THE Navigation SHALL tidak ditampilkan (sidebar yang sudah ada tetap digunakan).
4. THE Navigation SHALL menggunakan `useMediaQuery` atau `useBreakpoint` untuk menentukan kapan ditampilkan.
5. THE Navigation SHALL menandai halaman aktif dengan warna `var(--accent)` pada ikon dan label yang sesuai.
6. THE Navigation SHALL memiliki `aria-label` pada setiap tombol navigasi dan `role="navigation"` pada elemen container.

---

### Requirement 12: Tema Terang (Light Mode)

**User Story:** Sebagai pengguna, saya ingin pilihan tema terang yang nyaman di siang hari, sehingga saya dapat menggunakan aplikasi di berbagai kondisi pencahayaan.

#### Acceptance Criteria

1. THE ThemePicker SHALL menampilkan opsi tema "Light" sebagai tambahan dari tema yang sudah ada (Vintage, Minimal, Stellar).
2. WHEN tema Light dipilih, THE System SHALL menerapkan CSS variables: `--bg-main: #f9f7f5`, `--bg-card: #ffffff`, `--text-main: #1e1a15`, `--accent: #c8a96e`.
3. THE useTheme SHALL membaca preferensi tema dari localStorage dengan key `theme_prefs` dalam format JSON `{ theme: string, accent: string }`.
4. WHEN preferensi tema tersimpan di localStorage, THE useTheme SHALL menerapkan class `theme-light` atau `theme-vintage` ke elemen `<html>` saat aplikasi dimuat.
5. WHEN tema berubah, THE useTheme SHALL menyimpan preferensi baru ke localStorage dengan key `theme_prefs`.

---

### Requirement 13: Kustomisasi Warna Aksen

**User Story:** Sebagai pengguna, saya ingin memilih warna aksen favorit saya, sehingga tampilan aplikasi terasa lebih personal dan sesuai selera.

#### Acceptance Criteria

1. THE AccentPicker SHALL menampilkan elemen `<input type="color">` untuk memilih warna aksen secara bebas.
2. WHEN pengguna memilih warna baru di AccentPicker, THE System SHALL memperbarui CSS variable `--accent` secara dinamis menggunakan `document.documentElement.style.setProperty`.
3. WHEN pengguna memilih warna baru di AccentPicker, THE System SHALL menyimpan nilai hex ke localStorage dalam key `theme_prefs` dengan field `accent`.
4. WHEN aplikasi dimuat, THE useTheme SHALL membaca nilai `accent` dari localStorage dan menerapkannya ke CSS variable `--accent`.

---

### Requirement 14: Tema Stellar dengan Efek Bintang

**User Story:** Sebagai pengguna, saya ingin efek visual bintang yang menarik saat menggunakan tema Stellar, sehingga pengalaman menggunakan aplikasi terasa lebih imersif.

#### Acceptance Criteria

1. WHEN tema Stellar aktif, THE System SHALL menambahkan lapisan `::before` pada `body` dengan `background: radial-gradient` untuk efek bintang.
2. WHEN tema Stellar aktif, THE System SHALL menjalankan animasi `twinkle` menggunakan `@keyframes` yang mengubah `opacity` bintang secara periodik.
3. WHEN tema Stellar tidak aktif, THE System SHALL menghapus efek bintang dari `body`.

---

### Requirement 15: Sistem Tema Modular

**User Story:** Sebagai developer, saya ingin sistem tema yang terstruktur dan mudah diperluas, sehingga penambahan tema baru di masa depan dapat dilakukan dengan mudah.

#### Acceptance Criteria

1. THE Theme_System SHALL mendefinisikan type `Theme` yang mencakup semua nama tema yang valid: `'vintage' | 'minimal' | 'stellar' | 'light'`.
2. THE Theme_System SHALL mendefinisikan type `ThemeConfig` yang berisi semua CSS variable yang dapat dikustomisasi per tema.
3. THE Theme_System SHALL menyediakan fungsi `applyTheme(theme: Theme, accent?: string)` yang mengubah CSS variables pada `document.documentElement`.
4. WHEN `applyTheme` dipanggil dengan parameter `accent`, THE Theme_System SHALL menerapkan nilai `accent` ke CSS variable `--accent`.
5. THE Theme_System SHALL mengekspor objek `THEME_CONFIGS` yang berisi konfigurasi CSS variables untuk setiap tema.

---

### Requirement 16: Pedoman Teknis dan Batasan

**User Story:** Sebagai developer, saya ingin memastikan update v6 tidak merusak fungsionalitas yang sudah ada, sehingga pengguna tidak mengalami regresi.

#### Acceptance Criteria

1. THE System SHALL mempertahankan ekstensi file `.js` untuk semua file halaman yang sudah ada (`home/page.js`, `login/page.js`, `summary/page.js`, `spectate/[user]/page.js`) dan tidak mengkonversinya ke TypeScript.
2. THE System SHALL membuat semua komponen baru dalam format `.tsx`.
3. THE System SHALL menggunakan `React.memo` untuk komponen DraggableTask guna menghindari re-render yang tidak perlu.
4. THE System SHALL menambahkan atribut `aria-label` pada semua tombol baru dan atribut `role` pada elemen drag-and-drop.
5. THE System SHALL tidak mengubah struktur tabel database, kebijakan RLS, logika autentikasi, atau konfigurasi cron job daily reset.
6. WHEN terjadi error pada operasi fetch data, THE System SHALL menampilkan fallback UI yang informatif dan tidak menampilkan halaman kosong.
7. THE System SHALL menggunakan `useState` dan `useEffect` lokal untuk state management, tanpa menambahkan library state management baru.
