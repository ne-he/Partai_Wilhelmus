# Design Document: Family App v6

## Overview

Family App v6 adalah update additive yang meningkatkan pengalaman pengguna melalui tiga pilar:

1. **Micro-interactions & Animasi** — drag-and-drop feedback, transisi halaman, hover states, skeleton loading, toast notifikasi, dan aksesibilitas animasi
2. **Responsivitas Mobile-First** — layout adaptif untuk semua halaman, bottom navigation bar, dan dukungan touch drag-and-drop
3. **Sistem Tema Lanjutan** — Light Mode, kustomisasi warna aksen, efek Stellar, dan modul tema modular

Update ini tidak mengubah database, RLS, autentikasi, atau cron job. File `.js` yang sudah ada dipertahankan; komponen baru dibuat dalam `.tsx`.

---

## Architecture

### Prinsip Desain

- **Additive only**: Tidak ada breaking changes pada komponen atau halaman yang sudah ada
- **CSS Variables first**: Semua theming melalui CSS custom properties di `app/globals.css`
- **Inline styles dominant**: Styling utama via inline styles; Tailwind hanya untuk komponen kecil baru
- **Hook-based state**: `useState`/`useEffect` lokal, tanpa library state management baru
- **Progressive enhancement**: Fitur mobile tidak merusak tampilan desktop

### Dependency yang Digunakan

| Library | Versi | Penggunaan |
|---|---|---|
| `framer-motion` | ^12.38.0 | Animasi semua komponen baru |
| `@dnd-kit/core` | ^6.3.1 | TouchSensor, DragOverlay |
| `@dnd-kit/sortable` | ^10.0.0 | Sortable kanban |
| `fast-check` | ^4.6.0 | Property-based testing |

### Struktur File Baru

```
components/
  ConfirmModal.tsx       # Modal konfirmasi hapus tugas
  Tooltip.tsx            # Tooltip dengan animasi fade
  Skeleton.tsx           # Loading placeholder
  Toast.tsx              # Notifikasi sementara
  Navigation.tsx         # Bottom navigation bar mobile
  AccentPicker.tsx       # Color picker untuk aksen

Lib/
  theme.ts               # Theme_System: types, configs, applyTheme()
  hooks/
    useToast.ts          # Hook manajemen antrian toast
    useBreakpoint.ts     # Hook deteksi breakpoint layar
    useReducedMotion.ts  # Hook deteksi prefers-reduced-motion
    useTheme.ts          # Hook manajemen tema dan persistensi
```

### Alur Data Tema

```
localStorage (theme_prefs)
       ↓
  useTheme hook
       ↓
  applyTheme() [Lib/theme.ts]
       ↓
  document.documentElement CSS variables
       ↓
  Semua komponen via var(--accent), var(--bg-main), dll.
```

### Alur Toast

```
Aksi pengguna (add/delete/assign)
       ↓
  showToast(message, type) [useToast]
       ↓
  Toast queue state
       ↓
  Toast.tsx (AnimatePresence + motion.div)
       ↓
  Auto-dismiss setelah 3 detik
```

---

## Components and Interfaces

### Komponen Baru

#### `ConfirmModal.tsx`

```tsx
interface ConfirmModalProps {
  isOpen: boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}
```

Menggunakan `AnimatePresence` + `motion.div` dengan `scale` dari `0.9` ke `1.0` dan `opacity` dari `0` ke `1`. Overlay menggunakan `backdrop-filter: blur(8px)`.

#### `Tooltip.tsx`

```tsx
interface TooltipProps {
  text: string;
  children: ReactNode;
}
```

Menggunakan `motion.div` dengan `initial={{ opacity: 0 }}` dan `animate={{ opacity: 1 }}`. Memiliki `role="tooltip"` dan dihubungkan via `aria-describedby`.

#### `Skeleton.tsx`

```tsx
interface SkeletonProps {
  variant: 'task-card' | 'task-list' | 'verse-card';
  count?: number;
}
```

Menggunakan `@keyframes pulse` dengan `opacity` dari `0.4` ke `1.0`. Background menggunakan `linear-gradient` dengan `var(--bg-card)` dan `var(--bg-card2)`.

#### `Toast.tsx`

```tsx
interface ToastItem {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface ToastProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}
```

Container memiliki `role="status"` dan `aria-live="polite"`. Setiap toast menggunakan `motion.div` dengan `initial={{ y: 100, opacity: 0 }}` dan `animate={{ y: 0, opacity: 1 }}`.

#### `Navigation.tsx`

```tsx
interface NavigationProps {
  currentPath: string;
}
```

Menampilkan 5 item navigasi (Home, Personal, Family, Summary, Profile). Hanya ditampilkan ketika `isMobile=true`. Container memiliki `role="navigation"` dan setiap tombol memiliki `aria-label`.

#### `AccentPicker.tsx`

```tsx
interface AccentPickerProps {
  currentAccent: string;
  onAccentChange: (hex: string) => void;
}
```

Merender `<input type="color">`. Saat nilai berubah, memanggil `document.documentElement.style.setProperty('--accent', hex)` dan menyimpan ke localStorage.

### Hooks Baru

#### `Lib/hooks/useBreakpoint.ts`

```ts
function useBreakpoint(): { isMobile: boolean }
```

Menggunakan `window.matchMedia('(max-width: 767px)')` dengan event listener untuk reaktivitas.

#### `Lib/hooks/useReducedMotion.ts`

```ts
function useReducedMotion(): { shouldReduceMotion: boolean }
```

Menggunakan `window.matchMedia('(prefers-reduced-motion: reduce)')` dengan event listener.

#### `Lib/hooks/useToast.ts`

```ts
interface ToastItem {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

function useToast(): {
  toasts: ToastItem[];
  showToast: (message: string, type?: ToastItem['type']) => void;
  dismissToast: (id: string) => void;
}
```

Mengelola array toast. `showToast` menambahkan item baru dan menjadwalkan auto-dismiss setelah 3000ms.

#### `Lib/hooks/useTheme.ts`

```ts
function useTheme(): {
  theme: Theme;
  accent: string;
  setTheme: (theme: Theme) => void;
  setAccent: (hex: string) => void;
}
```

Membaca dari `localStorage` key `theme_prefs` (format: `{ theme, accent }`). Memanggil `applyTheme()` saat nilai berubah.

### Modul Tema

#### `Lib/theme.ts`

```ts
type Theme = 'vintage' | 'minimal' | 'stellar' | 'light';

interface ThemeConfig {
  '--bg-main': string;
  '--bg-card': string;
  '--bg-card2': string;
  '--accent': string;
  '--text-main': string;
  '--text-muted': string;
  '--border': string;
}

const THEME_CONFIGS: Record<Theme, ThemeConfig> = { ... };

function applyTheme(theme: Theme, accent?: string): void;
```

### Modifikasi Komponen yang Sudah Ada

#### `DraggableTask.tsx`
- Tambah `React.memo` wrapper
- Tambah `aria-label` pada tombol delete
- Tambah `role="button"` dan `aria-grabbed` pada drag handle
- Saat `isDragging`: `transform: scale(1.02)`, `box-shadow` diperbesar
- Saat hover: `borderColor: var(--accent)`, `backgroundColor` lebih terang
- Saat `isOverlay`: efek scale dan shadow yang sama

#### `DroppableColumn.tsx`
- Tambah drop indicator: `<div>` dengan garis horizontal `var(--accent)` saat `isOver=true`
- Animasi spring dari framer-motion pada drop indicator

#### `ThemePicker.js`
- Tambah opsi "Light" ke array `THEMES`
- Integrasikan dengan `useTheme` hook untuk persistensi

#### `app/personal/page.tsx`
- Tambah `TouchSensor` ke sensors
- Tambah `ConfirmModal` untuk konfirmasi hapus
- Tambah `useToast` untuk notifikasi
- Tambah `useBreakpoint` untuk layout mobile
- Tambah `useReducedMotion` untuk aksesibilitas
- Bungkus konten dengan `PageTransition`
- Tampilkan `Skeleton` saat loading

#### `app/family/page.tsx`
- Tambah `TouchSensor` ke sensors
- Tambah `useToast` untuk notifikasi assign
- Tambah `useBreakpoint` untuk layout mobile (card stack)
- Tambah `Tooltip` pada ikon assignment
- Bungkus konten dengan `PageTransition`
- Tampilkan `Skeleton` saat loading

#### `app/home/page.js`
- Bungkus konten dengan `PageTransition`
- Tambah `useBreakpoint` untuk layout vertikal mobile
- Integrasikan `useTheme` untuk persistensi tema

#### `app/summary/page.js`
- Bungkus konten dengan `PageTransition`
- Tambah `clamp()` untuk font size dan padding
- Tampilkan `Skeleton` saat loading

#### `app/spectate/[user]/page.js`
- Bungkus konten dengan `PageTransition`

---

## Data Models

### localStorage Schema

```ts
// Key: 'theme_prefs'
interface ThemePrefs {
  theme: Theme;   // 'vintage' | 'minimal' | 'stellar' | 'light'
  accent: string; // hex color, e.g. '#c8a96e'
}
```

### Toast Queue

```ts
interface ToastItem {
  id: string;       // crypto.randomUUID() atau Date.now().toString()
  message: string;
  type: 'success' | 'error' | 'info';
  createdAt: number; // timestamp untuk auto-dismiss
}
```

### Breakpoint

```ts
// Threshold: 768px
// isMobile = window.innerWidth < 768
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: DraggableTask drag state styling

*For any* DraggableTask yang dirender dengan `isDragging=true`, komponen harus menerapkan `transform` yang mengandung `scale` lebih dari 1.0 dan `box-shadow` yang lebih besar dibanding state normal.

**Validates: Requirements 1.1, 1.2**

### Property 2: DroppableColumn drop indicator visibility

*For any* DroppableColumn yang dirender dengan `isOver=true`, komponen harus menampilkan elemen drop indicator yang tidak ditampilkan saat `isOver=false`.

**Validates: Requirements 1.3**

### Property 3: ConfirmModal open/close round-trip

*For any* state awal dimana ConfirmModal tertutup, membuka modal lalu menutupnya (via confirm atau cancel) harus mengembalikan state ke kondisi tertutup.

**Validates: Requirements 2.8, 2.9**

### Property 4: DraggableTask hover border color

*For any* DraggableTask, CSS hover rules harus mendefinisikan `border-color` yang berbeda dari state normal (menggunakan `var(--accent)`).

**Validates: Requirements 3.2**

### Property 5: Tooltip accessibility attributes

*For any* Tooltip yang dirender dalam kondisi visible, elemen tooltip harus memiliki `role="tooltip"` dan elemen pemicunya harus memiliki `aria-describedby` yang merujuk ke id tooltip.

**Validates: Requirements 3.5**

### Property 6: Skeleton ditampilkan saat loading

*For any* halaman (Personal, Family, Summary) yang berada dalam state `loading=true`, komponen Skeleton harus ditampilkan dan konten utama tidak ditampilkan.

**Validates: Requirements 4.2, 4.3, 4.4**

### Property 7: Toast auto-dismiss setelah 3 detik

*For any* toast yang ditambahkan ke antrian, toast tersebut harus tidak lagi ada dalam antrian setelah 3000ms berlalu.

**Validates: Requirements 5.2**

### Property 8: Toast muncul setelah aksi task

*For any* aksi task (tambah, hapus, assign), antrian toast harus bertambah satu item dengan pesan yang relevan setelah aksi selesai.

**Validates: Requirements 5.4, 5.5, 5.6**

### Property 9: Toast accessibility attributes

*For any* Toast container yang dirender, elemen container harus memiliki `role="status"` dan `aria-live="polite"`.

**Validates: Requirements 5.8**

### Property 10: useReducedMotion reaktif terhadap media query

*For any* perubahan nilai `prefers-reduced-motion` media query, hook `useReducedMotion` harus memperbarui nilai `shouldReduceMotion` secara sinkron.

**Validates: Requirements 6.1, 6.4, 6.5**

### Property 11: Animasi dinonaktifkan saat reduced motion

*For any* komponen yang menggunakan animasi framer-motion, ketika `shouldReduceMotion=true`, nilai `duration` animasi harus 0 atau animasi harus di-skip.

**Validates: Requirements 6.2, 6.3**

### Property 12: useBreakpoint mengembalikan isMobile yang benar

*For any* lebar layar, `useBreakpoint` harus mengembalikan `isMobile=true` jika dan hanya jika lebar layar kurang dari 768px.

**Validates: Requirements 7.1**

### Property 13: Personal_Page layout berdasarkan isMobile

*For any* nilai `isMobile`, Personal_Page harus menampilkan layout tiga kolom ketika `isMobile=false` dan layout tab/vertikal ketika `isMobile=true`.

**Validates: Requirements 7.2, 7.5**

### Property 14: Family_Page layout berdasarkan isMobile

*For any* nilai `isMobile`, Family_Page harus menampilkan card stack ketika `isMobile=true` dan daftar normal ketika `isMobile=false`. Setiap card harus mengandung judul, status, assignee, dan tombol aksi.

**Validates: Requirements 8.1, 8.2, 8.3**

### Property 15: Navigation visibility berdasarkan isMobile

*For any* nilai `isMobile`, Navigation harus ditampilkan ketika `isMobile=true` dan tidak ditampilkan ketika `isMobile=false`.

**Validates: Requirements 11.2, 11.3**

### Property 16: Navigation active item styling

*For any* halaman aktif, item navigasi yang sesuai harus memiliki style dengan warna `var(--accent)`.

**Validates: Requirements 11.5**

### Property 17: Navigation accessibility attributes

*For any* Navigation yang dirender, container harus memiliki `role="navigation"` dan setiap tombol harus memiliki `aria-label` yang tidak kosong.

**Validates: Requirements 11.6**

### Property 18: applyTheme menerapkan semua CSS variables

*For any* tema yang valid, memanggil `applyTheme(theme)` harus mengubah semua CSS variables yang didefinisikan dalam `THEME_CONFIGS[theme]` pada `document.documentElement`. Jika parameter `accent` diberikan, `--accent` harus menggunakan nilai tersebut.

**Validates: Requirements 12.2, 15.3, 15.4**

### Property 19: useTheme persistence round-trip

*For any* tema dan warna aksen yang dipilih, nilai tersebut harus tersimpan di localStorage dan dapat dibaca kembali saat aplikasi dimuat ulang, menghasilkan state tema yang identik.

**Validates: Requirements 12.3, 12.4, 12.5, 13.2, 13.3, 13.4**

### Property 20: Theme type safety

*For any* string yang bukan salah satu dari `'vintage' | 'minimal' | 'stellar' | 'light'`, TypeScript harus menolak nilai tersebut sebagai argumen `Theme`.

**Validates: Requirements 15.1**

---

## Error Handling

### Fetch Errors

Semua halaman yang melakukan fetch data harus menangani error dengan menampilkan fallback UI yang informatif:

```tsx
// Pattern yang digunakan di semua halaman
const [error, setError] = useState<string | null>(null);

try {
  const data = await fetchData();
  setData(data);
} catch (err) {
  setError('Gagal memuat data. Silakan coba lagi.');
}

// Render
if (error) return <ErrorFallback message={error} onRetry={refetch} />;
```

### localStorage Errors

`useTheme` harus menangani kasus dimana localStorage tidak tersedia (private browsing, storage quota exceeded):

```ts
function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
```

### DnD Errors

`handleDragEnd` di Personal_Page dan Family_Page sudah menggunakan try/catch dengan rollback ke state sebelumnya. Pattern ini dipertahankan.

### Toast Error Type

Toast dengan `type: 'error'` menggunakan warna merah untuk membedakan dari notifikasi sukses.

---

## Testing Strategy

### Dual Testing Approach

Testing menggunakan dua pendekatan komplementer:

1. **Unit tests**: Contoh spesifik, edge cases, error conditions
2. **Property-based tests**: Properti universal menggunakan `fast-check` (sudah terpasang di devDependencies)

### Property-Based Testing

Library: `fast-check` (^4.6.0, sudah ada di package.json)

Setiap property test harus:
- Menjalankan minimum **100 iterasi**
- Diberi tag komentar: `// Feature: family-app-v6, Property N: <property_text>`
- Satu property test per correctness property

Contoh implementasi:

```ts
import fc from 'fast-check';

// Feature: family-app-v6, Property 12: useBreakpoint mengembalikan isMobile yang benar
test('useBreakpoint: isMobile true iff width < 768', () => {
  fc.assert(
    fc.property(fc.integer({ min: 0, max: 2000 }), (width) => {
      const isMobile = width < 768;
      // mock window.innerWidth = width, render hook, check result
      expect(renderBreakpointHook(width).isMobile).toBe(isMobile);
    }),
    { numRuns: 100 }
  );
});
```

### Unit Testing

Unit tests fokus pada:
- Contoh spesifik yang mendemonstrasikan perilaku benar
- Integration points antar komponen
- Edge cases dan error conditions

Contoh:

```ts
// Contoh spesifik: ThemePicker menampilkan opsi Light
test('ThemePicker renders Light option', () => {
  render(<ThemePicker theme="vintage" onThemeChange={() => {}} />);
  expect(screen.getByText('Light')).toBeInTheDocument();
});

// Edge case: Toast dengan pesan kosong tidak crash
test('showToast handles empty message', () => {
  const { showToast } = renderHook(() => useToast()).result.current;
  expect(() => showToast('')).not.toThrow();
});
```

### Test File Structure

```
__tests__/
  components/
    ConfirmModal.test.tsx
    Tooltip.test.tsx
    Skeleton.test.tsx
    Toast.test.tsx
    Navigation.test.tsx
    AccentPicker.test.tsx
  hooks/
    useBreakpoint.test.ts
    useReducedMotion.test.ts
    useToast.test.ts
    useTheme.test.ts
  lib/
    theme.test.ts
```

### Coverage Target

- Semua hooks baru: 100% line coverage
- `Lib/theme.ts`: 100% line coverage
- Komponen baru: minimal 80% line coverage
- Property tests: minimal 100 iterasi per property
