# Implementation Plan: Family App v6

## Overview

Implementasi additive yang meningkatkan UX melalui tiga pilar: micro-interactions & animasi, responsivitas mobile-first, dan sistem tema lanjutan. Urutan implementasi mengikuti dependency graph: infrastruktur tema → hooks utilitas → komponen baru → modifikasi halaman → modifikasi komponen yang ada → tests.

## Tasks

- [x] 1. Infrastruktur Tema (`Lib/theme.ts` + `globals.css`)
  - [x] 1.1 Buat `Lib/theme.ts` dengan type `Theme`, `ThemeConfig`, objek `THEME_CONFIGS`, dan fungsi `applyTheme(theme, accent?)`
    - Definisikan `type Theme = 'vintage' | 'minimal' | 'stellar' | 'light'`
    - Definisikan `interface ThemeConfig` dengan semua CSS variables
    - Isi `THEME_CONFIGS` untuk keempat tema termasuk Light Mode (`--bg-main: #f9f7f5`, `--bg-card: #ffffff`, `--text-main: #1e1a15`)
    - Implementasikan `applyTheme` yang mengubah `document.documentElement` CSS variables; jika `accent` diberikan, override `--accent`
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 12.2_

  - [ ]* 1.2 Tulis property test untuk `applyTheme` (Property 18)
    - **Property 18: applyTheme menerapkan semua CSS variables**
    - **Validates: Requirements 15.3, 15.4**
    - Gunakan `fast-check` dengan `fc.constantFrom('vintage','minimal','stellar','light')` dan verifikasi semua CSS variables berubah di `document.documentElement`

  - [ ]* 1.3 Tulis property test untuk type safety Theme (Property 20)
    - **Property 20: Theme type safety**
    - **Validates: Requirements 15.1**
    - Verifikasi TypeScript menolak string di luar union type (compile-time check via `@ts-expect-error`)

  - [x] 1.4 Tambah CSS variables Light Mode dan Stellar twinkle ke `app/globals.css`
    - Tambah class `.theme-light` dengan CSS variables Light Mode
    - Tambah `@keyframes twinkle` untuk efek bintang Stellar (opacity periodik)
    - Tambah `body.theme-stellar::before` dengan `background: radial-gradient` untuk efek bintang
    - _Requirements: 12.2, 14.1, 14.2, 14.3_

- [x] 2. Hooks Utilitas
  - [x] 2.1 Buat `Lib/hooks/useReducedMotion.ts`
    - Gunakan `window.matchMedia('(prefers-reduced-motion: reduce)')` dengan event listener `change`
    - Kembalikan `{ shouldReduceMotion: boolean }`
    - _Requirements: 6.1, 6.4, 6.5_

  - [ ]* 2.2 Tulis property test untuk `useReducedMotion` (Property 10)
    - **Property 10: useReducedMotion reaktif terhadap media query**
    - **Validates: Requirements 6.1, 6.4, 6.5**
    - Mock `window.matchMedia`, ubah nilai, verifikasi hook memperbarui `shouldReduceMotion`

  - [x] 2.3 Buat `Lib/hooks/useBreakpoint.ts`
    - Gunakan `window.matchMedia('(max-width: 767px)')` dengan event listener `change`
    - Kembalikan `{ isMobile: boolean }`
    - _Requirements: 7.1, 11.4_

  - [ ]* 2.4 Tulis property test untuk `useBreakpoint` (Property 12)
    - **Property 12: useBreakpoint mengembalikan isMobile yang benar**
    - **Validates: Requirements 7.1**
    - Gunakan `fc.integer({ min: 0, max: 2000 })`, mock `window.innerWidth`, verifikasi `isMobile = width < 768`

  - [x] 2.5 Buat `Lib/hooks/useToast.ts`
    - State: `toasts: ToastItem[]` dengan interface `{ id, message, type }`
    - `showToast(message, type?)` menambah item baru dan jadwalkan `dismissToast` setelah 3000ms via `setTimeout`
    - `dismissToast(id)` menghapus item dari array
    - _Requirements: 5.2, 5.3, 5.7_

  - [ ]* 2.6 Tulis property test untuk `useToast` auto-dismiss (Property 7)
    - **Property 7: Toast auto-dismiss setelah 3 detik**
    - **Validates: Requirements 5.2**
    - Gunakan fake timers, verifikasi toast tidak ada dalam antrian setelah 3000ms

  - [x] 2.7 Buat `Lib/hooks/useTheme.ts`
    - Baca dari `localStorage` key `theme_prefs` (format JSON `{ theme, accent }`)
    - Panggil `applyTheme()` saat nilai berubah
    - Kembalikan `{ theme, accent, setTheme, setAccent }`
    - Gunakan `safeGetItem` untuk handle localStorage error (private browsing)
    - _Requirements: 12.3, 12.4, 12.5, 13.3, 13.4_

  - [ ]* 2.8 Tulis property test untuk `useTheme` persistence round-trip (Property 19)
    - **Property 19: useTheme persistence round-trip**
    - **Validates: Requirements 12.3, 12.4, 12.5, 13.2, 13.3, 13.4**
    - Gunakan `fc.constantFrom('vintage','minimal','stellar','light')` dan `fc.hexaString`, verifikasi nilai tersimpan dan terbaca kembali identik

- [x] 3. Checkpoint — Pastikan semua tests hooks dan theme lulus
  - Pastikan semua tests lulus, tanya user jika ada pertanyaan.

- [x] 4. Komponen Baru
  - [x] 4.1 Buat `components/Skeleton.tsx`
    - Props: `variant: 'task-card' | 'task-list' | 'verse-card'`, `count?: number`
    - Animasi `@keyframes pulse` dengan opacity `0.4` → `1.0`
    - Background `linear-gradient` menggunakan `var(--bg-card)` dan `var(--bg-card2)`
    - _Requirements: 4.1, 4.5_

  - [ ]* 4.2 Tulis property test untuk Skeleton loading state (Property 6)
    - **Property 6: Skeleton ditampilkan saat loading**
    - **Validates: Requirements 4.2, 4.3, 4.4**
    - Verifikasi untuk setiap variant, Skeleton dirender dan konten utama tidak dirender saat `loading=true`

  - [x] 4.3 Buat `components/Toast.tsx`
    - Props: `toasts: ToastItem[]`, `onDismiss: (id: string) => void`
    - Container: `role="status"`, `aria-live="polite"`
    - Setiap toast: `motion.div` dengan `initial={{ y: 100, opacity: 0 }}`, `animate={{ y: 0, opacity: 1 }}`, `exit={{ y: 100, opacity: 0 }}`
    - Gunakan `AnimatePresence` untuk antrian beberapa toast
    - _Requirements: 5.1, 5.2, 5.7, 5.8_

  - [ ]* 4.4 Tulis property test untuk Toast accessibility (Property 9)
    - **Property 9: Toast accessibility attributes**
    - **Validates: Requirements 5.8**
    - Verifikasi container memiliki `role="status"` dan `aria-live="polite"` untuk setiap kombinasi toast

  - [x] 4.5 Buat `components/Tooltip.tsx`
    - Props: `text: string`, `children: ReactNode`
    - Tooltip element: `role="tooltip"`, id unik
    - Trigger element: `aria-describedby` merujuk ke id tooltip
    - Animasi: `motion.div` dengan `initial={{ opacity: 0 }}`, `animate={{ opacity: 1 }}`
    - _Requirements: 3.3, 3.5_

  - [ ]* 4.6 Tulis property test untuk Tooltip accessibility (Property 5)
    - **Property 5: Tooltip accessibility attributes**
    - **Validates: Requirements 3.5**
    - Verifikasi `role="tooltip"` ada dan `aria-describedby` pada trigger merujuk ke id yang sama

  - [x] 4.7 Buat `components/ConfirmModal.tsx`
    - Props: `isOpen`, `message`, `onConfirm`, `onCancel`
    - Overlay: `backdrop-filter: blur(8px)`
    - Animasi: `AnimatePresence` + `motion.div` dengan `scale` dari `0.9` ke `1.0`, `opacity` dari `0` ke `1`
    - _Requirements: 2.7, 2.8, 2.9_

  - [ ]* 4.8 Tulis property test untuk ConfirmModal open/close round-trip (Property 3)
    - **Property 3: ConfirmModal open/close round-trip**
    - **Validates: Requirements 2.8, 2.9**
    - Verifikasi membuka lalu menutup modal (via confirm atau cancel) mengembalikan state ke kondisi tertutup

  - [x] 4.9 Buat `components/Navigation.tsx`
    - Props: `currentPath: string`
    - 5 item: Home, Personal, Family, Summary, Profile dengan ikon dan label
    - Container: `role="navigation"`, setiap tombol: `aria-label` tidak kosong
    - Hanya tampil saat `isMobile=true` via `useBreakpoint`
    - Item aktif: warna `var(--accent)`
    - Fixed bottom bar
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6_

  - [ ]* 4.10 Tulis property test untuk Navigation visibility (Property 15)
    - **Property 15: Navigation visibility berdasarkan isMobile**
    - **Validates: Requirements 11.2, 11.3**
    - Verifikasi Navigation tampil saat `isMobile=true` dan tidak tampil saat `isMobile=false`

  - [ ]* 4.11 Tulis property test untuk Navigation active item (Property 16)
    - **Property 16: Navigation active item styling**
    - **Validates: Requirements 11.5**
    - Verifikasi item yang sesuai `currentPath` memiliki style warna `var(--accent)`

  - [ ]* 4.12 Tulis property test untuk Navigation accessibility (Property 17)
    - **Property 17: Navigation accessibility attributes**
    - **Validates: Requirements 11.6**
    - Verifikasi `role="navigation"` pada container dan `aria-label` tidak kosong pada setiap tombol

  - [x] 4.13 Buat `components/AccentPicker.tsx`
    - Props: `currentAccent: string`, `onAccentChange: (hex: string) => void`
    - Render `<input type="color">` dengan nilai `currentAccent`
    - Saat berubah: panggil `document.documentElement.style.setProperty('--accent', hex)` dan simpan ke localStorage
    - _Requirements: 13.1, 13.2, 13.3_

- [x] 5. Checkpoint — Pastikan semua komponen baru bisa dirender tanpa error
  - Pastikan semua tests lulus, tanya user jika ada pertanyaan.

- [x] 6. Modifikasi Halaman
  - [x] 6.1 Modifikasi `app/personal/page.tsx`
    - Tambah `TouchSensor` ke sensors dengan `activationConstraint` yang sesuai
    - Integrasikan `useToast` dan render `<Toast>` — tampilkan toast saat tambah tugas (Req 5.4) dan hapus tugas (Req 5.5)
    - Integrasikan `useBreakpoint` — saat `isMobile=true`, tampilkan layout tab/vertikal dengan badge status dan tombol pindah status (Req 7.2, 7.3)
    - Integrasikan `useReducedMotion` — saat `shouldReduceMotion=true`, set `duration: 0` pada animasi framer-motion
    - Ganti loading screen dengan `<Skeleton variant="task-card" count={3} />`
    - Ganti `window.confirm` hapus tugas dengan `<ConfirmModal>`
    - Bungkus konten dengan `<PageTransition>`
    - _Requirements: 1.5, 1.6, 2.3, 4.2, 5.4, 5.5, 6.2, 6.3, 7.2, 7.3, 7.4, 7.5_

  - [ ]* 6.2 Tulis property test untuk Personal_Page layout (Property 13)
    - **Property 13: Personal_Page layout berdasarkan isMobile**
    - **Validates: Requirements 7.2, 7.5**
    - Verifikasi tiga kolom tampil saat `isMobile=false` dan layout vertikal/tab tampil saat `isMobile=true`

  - [x] 6.3 Modifikasi `app/family/page.tsx`
    - Tambah `TouchSensor` ke sensors
    - Integrasikan `useToast` dan render `<Toast>` — tampilkan toast saat assign tugas (Req 5.6)
    - Integrasikan `useBreakpoint` — saat `isMobile=true`, tampilkan card stack vertikal dengan judul, status, assignee, dan tombol aksi (Req 8.1, 8.2)
    - Tambah `<Tooltip text="Drag to assign">` pada ikon assignment (Req 3.4)
    - Ganti loading screen dengan `<Skeleton variant="task-list" count={4} />`
    - Bungkus konten dengan `<PageTransition>`
    - _Requirements: 2.4, 3.4, 4.3, 5.6, 8.1, 8.2, 8.3_

  - [ ]* 6.4 Tulis property test untuk Family_Page layout (Property 14)
    - **Property 14: Family_Page layout berdasarkan isMobile**
    - **Validates: Requirements 8.1, 8.2, 8.3**
    - Verifikasi card stack tampil saat `isMobile=true` dan daftar normal tampil saat `isMobile=false`; setiap card mengandung judul, status, assignee, tombol aksi

  - [x] 6.5 Modifikasi `app/home/page.js`
    - Bungkus konten dengan `<PageTransition>`
    - Integrasikan `useBreakpoint` — saat `isMobile=true`, tata letak jam menjadi vertikal dengan `grid-template-columns: 1fr` (Req 9.1)
    - Integrasikan `useTheme` untuk persistensi tema (gantikan logika localStorage manual yang ada)
    - _Requirements: 2.2, 9.1, 9.2, 12.3, 12.4, 12.5_

  - [x] 6.6 Modifikasi `app/summary/page.js`
    - Bungkus konten dengan `<PageTransition>`
    - Terapkan `clamp()` pada font size teks ayat: `fontSize: 'clamp(1rem, 4vw, 1.5rem)'`
    - Terapkan `clamp()` pada padding card: `padding: 'clamp(1rem, 5vw, 2rem)'`
    - Ganti loading screen dengan `<Skeleton variant="verse-card" />`
    - _Requirements: 2.5, 4.4, 10.1, 10.2_

  - [x] 6.7 Modifikasi `app/spectate/[user]/page.js`
    - Bungkus konten dengan `<PageTransition>`
    - _Requirements: 2.6_

- [x] 7. Modifikasi Komponen yang Sudah Ada
  - [x] 7.1 Modifikasi `components/DraggableTask.tsx`
    - Bungkus komponen dengan `React.memo`
    - Tambah `aria-label` pada tombol delete (Req 16.4)
    - Tambah `role="button"` dan `aria-grabbed={isDragging}` pada drag handle
    - Saat `isDragging`: `transform: scale(1.02)`, `box-shadow` diperbesar (Req 1.1)
    - Saat hover: `borderColor: var(--accent)`, `backgroundColor` lebih terang (Req 3.2)
    - Saat `isOverlay`: efek scale dan shadow yang sama (Req 1.2)
    - Tambah animasi spring `{ duration: 0.2, type: "spring" }` saat drop (Req 1.4)
    - _Requirements: 1.1, 1.2, 1.4, 3.1, 3.2, 16.3, 16.4_

  - [ ]* 7.2 Tulis property test untuk DraggableTask drag state styling (Property 1)
    - **Property 1: DraggableTask drag state styling**
    - **Validates: Requirements 1.1, 1.2**
    - Verifikasi saat `isDragging=true`, `transform` mengandung `scale` > 1.0 dan `box-shadow` lebih besar dari state normal

  - [ ]* 7.3 Tulis property test untuk DraggableTask hover border color (Property 4)
    - **Property 4: DraggableTask hover border color**
    - **Validates: Requirements 3.2**
    - Verifikasi CSS hover rules mendefinisikan `border-color: var(--accent)` yang berbeda dari state normal

  - [x] 7.4 Modifikasi `components/DroppableColumn.tsx`
    - Tambah drop indicator: `<motion.div>` dengan garis horizontal `var(--accent)` yang muncul saat `isOver=true`
    - Animasi spring dari framer-motion pada drop indicator
    - _Requirements: 1.3_

  - [ ]* 7.5 Tulis property test untuk DroppableColumn drop indicator (Property 2)
    - **Property 2: DroppableColumn drop indicator visibility**
    - **Validates: Requirements 1.3**
    - Verifikasi drop indicator ada saat `isOver=true` dan tidak ada saat `isOver=false`

  - [x] 7.6 Modifikasi `components/ThemePicker.js`
    - Tambah opsi "Light" ke array `THEMES` dengan swatch `#f9f7f5`
    - Integrasikan dengan `useTheme` hook untuk persistensi (gantikan logika localStorage manual)
    - _Requirements: 12.1_

- [ ] 8. Checkpoint — Pastikan semua tests lulus dan tidak ada regresi
  - Pastikan semua tests lulus, tanya user jika ada pertanyaan.

- [x] 9. Integrasi Navigation ke Layout
  - [x] 9.1 Tambahkan `<Navigation>` ke `app/layout.tsx`
    - Import dan render `<Navigation currentPath={pathname} />` di dalam layout
    - Gunakan `usePathname()` dari `next/navigation` untuk mendapatkan path aktif
    - Navigation hanya tampil saat `isMobile=true` (sudah dihandle di dalam komponen)
    - _Requirements: 11.1, 11.2, 11.3_

  - [x] 9.2 Tambah padding bottom pada halaman saat mobile agar konten tidak tertutup Navigation
    - Saat `isMobile=true`, tambah `paddingBottom: '5rem'` pada `<main>` di setiap halaman
    - _Requirements: 11.2_

- [x] 10. Final Checkpoint — Pastikan semua tests lulus
  - Pastikan semua tests lulus, tidak ada regresi pada fitur yang sudah ada, tanya user jika ada pertanyaan.

## Notes

- Tasks bertanda `*` bersifat opsional dan dapat dilewati untuk MVP yang lebih cepat
- Setiap task mereferensikan requirements spesifik untuk traceability
- Urutan implementasi mengikuti dependency: infrastruktur → hooks → komponen → halaman → komponen existing
- Property tests menggunakan `fast-check` yang sudah ada di devDependencies
- File `.js` yang sudah ada (home, summary, spectate, login) tidak dikonversi ke TypeScript (Req 16.1)
- Semua komponen baru dibuat dalam format `.tsx` (Req 16.2)
- Tidak ada perubahan pada database, RLS, autentikasi, atau cron job (Req 16.5)
