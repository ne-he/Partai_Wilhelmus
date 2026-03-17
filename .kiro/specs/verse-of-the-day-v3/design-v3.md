# Design Document — verse-of-the-day-v3

## Overview

Fitur ini menambahkan halaman `/verse` ke aplikasi "Partai Wilhelmus" yang menampilkan satu ayat Alkitab harian dari Beeble Indonesia API (versi Terjemahan Baru / TB). Ayat dipilih secara deterministik menggunakan date-seeded PRNG sehingga stabil sepanjang hari meskipun halaman di-refresh berkali-kali.

Halaman dibangun sebagai Next.js App Router Client Component di `app/verse/page.js`. Sidebar diperbarui untuk mengganti link `/summary` dengan link `/verse`. Tidak ada library eksternal yang dibutuhkan — semua menggunakan native `fetch`, React hooks, dan pure JavaScript.

---

## Architecture

```
app/
  verse/
    page.js              <- halaman utama, orchestrator state + fetch logic
components/
  Sidebar.js             <- diperbarui: ganti /summary → /verse dengan ikon ✝
```

### Data Flow

```
mount → supabase.auth.getUser()
  no session → router.push("/login")
  session OK → setUser(user) → fetch profile → setProfile(profile)
    → computeDateSeed(today)
    → fetch GET /passage/list → bookList
    → pickWithSeed(bookList, seed * 1)     → selectedBook
    → pickWithSeed(chapters, seed * 2)     → selectedChapter
    → fetch GET /passage/{abbr}/{chapter}?ver=tb → verseList
    → pickWithSeed(verseList, seed * 3)    → selectedVerse
    → render ScriptureCard
```

### Seeded Selection Strategy

Tiga pemilihan (kitab, pasal, ayat) menggunakan seed yang berbeda agar tidak saling berkorelasi:

```
bookSeed    = dateSeed * 1
chapterSeed = dateSeed * 2
verseSeed   = dateSeed * 3
```

Ini memastikan variasi yang lebih baik antar hari dibanding menggunakan seed yang sama untuk ketiga pemilihan.

---

## Components and Interfaces

### `app/verse/page.js`

Client Component utama. Mengelola seluruh state dan fetch logic secara inline (tidak ada komponen terpisah untuk card).

```js
// State:
//   user: object | null        - Supabase auth user
//   profile: object | null     - row dari tabel users
//   verse: { text, number } | null
//   reference: string | null   - "Nama Kitab Pasal:Ayat"
//   loading: boolean
//   error: string | null
```

Layout structure:

```
<div style="display:flex; min-height:100vh">
  <Sidebar user={profile} />
  <main style="margin-left:220px; flex:1; ...">
    <div style="...label...">VERSE OF THE DAY</div>
    {loading && <LoadingScreen />}
    {error && <ErrorMessage message={error} />}
    {verse && <ScriptureCard verse={verse} reference={reference} />}
  </main>
</div>
```

### `ScriptureCard` (inline di page.js)

Komponen inline yang merender bordered container dengan gaya scripture.

```js
// Props:
//   verse: { text: string, number: number }
//   reference: string   - "Yohanes 3:16"
```

### `components/Sidebar.js`

Diperbarui: ganti entry `{ href: "/summary", label: "Summary", icon: "◈" }` dengan `{ href: "/verse", label: "Verse", icon: "✝" }`.

---

## Data Models

### BeebleAPI Response Shapes

```js
// GET /passage/list
// Response: array of book objects
[
  {
    name: "Kejadian",
    abbr: "kej",
    chapters: 50,   // jumlah pasal
    // ... field lain mungkin ada
  },
  // ...
]

// GET /passage/{abbr}/{chapter}?ver=tb
// Response: object dengan array verses
{
  verses: [
    { verse: 1, text: "Pada mulanya Allah menciptakan langit dan bumi." },
    { verse: 2, text: "..." },
    // ...
  ]
}
```

### DateSeed

```js
// Input: Date object (tanggal hari ini)
// Output: integer positif unik per hari
function computeDateSeed(date) {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;  // 1-12
  const d = date.getDate();       // 1-31
  return y * 10000 + m * 100 + d;
  // Contoh: 2025-07-15 → 20250715
}
```

### SeededRandom (Mulberry32 PRNG)

```js
// Pure function PRNG berbasis Mulberry32 algorithm
// Input: seed integer
// Output: fungsi () => float [0, 1)
function seededRandom(seed) {
  let s = seed >>> 0;
  return function () {
    s += 0x6d2b79f5;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) >>> 0;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Helper: pilih satu item dari array menggunakan seed
function pickWithSeed(arr, seed) {
  const rand = seededRandom(seed);
  const index = Math.floor(rand() * arr.length);
  return arr[index];
}
```

### VerseReference Format

```js
// Input: bookName string, chapter number, verseNumber number
// Output: string "Nama Kitab Pasal:Ayat"
function formatReference(bookName, chapter, verseNumber) {
  return `${bookName} ${chapter}:${verseNumber}`;
}
// Contoh: formatReference("Yohanes", 3, 16) → "Yohanes 3:16"
```

---

## Visual Layout

```
+----------------------------------------------------------+
| Sidebar (220px fixed)  |  Main Content                   |
|                        |  margin-left: 220px             |
|  PARTAI WILHELMUS      |  padding: 2.5rem 3rem           |
|  [user info]           |                                 |
|                        |  VERSE OF THE DAY               |
|  * Home                |  (label kecil, letter-spacing)  |
|  * Personal            |                                 |
|  * Family              |  +------------------------+     |
|  * ✝ Verse  <- active  |  |  ✦  (ornament)         |     |
|  SPECTATE              |  |                        |     |
|  o papa                |  |  "Teks ayat di sini    |     |
|  o mama                |  |   dalam font serif     |     |
|  o nemi                |  |   italic..."           |     |
|  o venly               |  |                        |     |
|                        |  |  — Yohanes 3:16        |     |
|  Logout                |  |  TB                    |     |
|                        |  +------------------------+     |
+----------------------------------------------------------+
```

### Scripture Card Style

```
border: 1px solid var(--border)
background: var(--bg-card)
border-radius: 16px
padding: 2.5rem
max-width: 600px
position: relative

Teks ayat:
  font-family: Georgia, serif
  font-style: italic
  font-size: 1.3rem
  color: var(--text-main)
  line-height: 1.8

VerseReference:
  color: var(--accent)
  font-size: 0.9rem
  margin-top: 1.5rem

Label TB:
  font-size: 0.65rem
  color: var(--text-muted)
  letter-spacing: 2px
  margin-top: 0.5rem
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: SeededRandom determinism

*For any* integer seed, calling `seededRandom(seed)` and invoking the returned function should always produce the same sequence of values when called with the same seed again.

**Validates: Requirements 2.6, 6.4**

### Property 2: DateSeed ignores time components

*For any* two `Date` objects that share the same year, month, and day but differ in hour, minute, or second, `computeDateSeed(date1)` should equal `computeDateSeed(date2)`.

**Validates: Requirements 2.7**

### Property 3: VerseReference format is always "Name Chapter:Verse"

*For any* book name string, chapter number, and verse number, `formatReference(bookName, chapter, verseNumber)` should return a string matching the pattern `{bookName} {chapter}:{verseNumber}`.

**Validates: Requirements 3.2**

### Property 4: pickWithSeed always returns a valid array element

*For any* non-empty array and any integer seed, `pickWithSeed(arr, seed)` should return an element that exists in the array (i.e., the selected index is always within bounds).

**Validates: Requirements 2.2, 2.3, 2.5**

---

## Error Handling

### Auth Errors
- `supabase.auth.getUser()` gagal atau session null → `router.push("/login")` segera.

### API Errors
- Fetch ke `/passage/list` gagal (network error) → `setError("Gagal memuat daftar kitab. Periksa koneksi internet.")`.
- Fetch ke `/passage/list` mengembalikan HTTP non-2xx → `setError("API error: ${response.status}")`.
- Fetch ke `/passage/{abbr}/{chapter}` gagal → `setError("Gagal memuat isi pasal.")`.
- Fetch ke `/passage/{abbr}/{chapter}` mengembalikan HTTP non-2xx → `setError("API error: ${response.status}")`.

### Data Errors
- `verses` array kosong atau undefined → `setError("Tidak ada ayat ditemukan untuk pasal ini.")`.
- `bookList` array kosong → `setError("Daftar kitab kosong.")`.

### Error Display
Semua error ditampilkan sebagai teks deskriptif di dalam area konten utama, menggantikan ScriptureCard. Tidak ada retry otomatis.

---

## Testing Strategy

### Dual Testing Approach

Unit tests dan property-based tests bersifat komplementer dan keduanya diperlukan.

- **Unit tests**: verifikasi contoh spesifik, auth guard, error states, dan rendering.
- **Property tests**: verifikasi properti universal yang berlaku untuk semua input valid.

### Property-Based Testing Library

Gunakan **fast-check** (JavaScript/Node.js):

```
npm install --save-dev fast-check
```

Setiap property test dikonfigurasi dengan minimum **100 iterasi** (`numRuns: 100`).
Tag format: `// Feature: verse-of-the-day-v3, Property N: <property_text>`

### Property Test Implementations

```js
import fc from 'fast-check';
import { seededRandom, computeDateSeed, formatReference, pickWithSeed } from '../lib/verse-utils';

// Feature: verse-of-the-day-v3, Property 1: SeededRandom determinism
test('Property 1: seededRandom is deterministic', () => {
  fc.assert(fc.property(
    fc.integer({ min: 1, max: 2 ** 31 - 1 }),
    (seed) => {
      const r1 = seededRandom(seed)();
      const r2 = seededRandom(seed)();
      return r1 === r2;
    }
  ), { numRuns: 100 });
});

// Feature: verse-of-the-day-v3, Property 2: DateSeed ignores time components
test('Property 2: DateSeed ignores time components', () => {
  fc.assert(fc.property(
    fc.integer({ min: 2000, max: 2100 }),
    fc.integer({ min: 0, max: 11 }),
    fc.integer({ min: 1, max: 28 }),
    fc.integer({ min: 0, max: 23 }),
    fc.integer({ min: 0, max: 23 }),
    (year, month, day, hour1, hour2) => {
      const d1 = new Date(year, month, day, hour1, 30, 0);
      const d2 = new Date(year, month, day, hour2, 45, 59);
      return computeDateSeed(d1) === computeDateSeed(d2);
    }
  ), { numRuns: 100 });
});

// Feature: verse-of-the-day-v3, Property 3: VerseReference format
test('Property 3: formatReference produces correct format', () => {
  fc.assert(fc.property(
    fc.string({ minLength: 1 }),
    fc.integer({ min: 1, max: 150 }),
    fc.integer({ min: 1, max: 176 }),
    (bookName, chapter, verseNumber) => {
      const ref = formatReference(bookName, chapter, verseNumber);
      return ref === `${bookName} ${chapter}:${verseNumber}`;
    }
  ), { numRuns: 100 });
});

// Feature: verse-of-the-day-v3, Property 4: pickWithSeed returns valid element
test('Property 4: pickWithSeed always returns a valid array element', () => {
  fc.assert(fc.property(
    fc.array(fc.anything(), { minLength: 1, maxLength: 200 }),
    fc.integer({ min: 1, max: 2 ** 31 - 1 }),
    (arr, seed) => {
      const result = pickWithSeed(arr, seed);
      return arr.includes(result);
    }
  ), { numRuns: 100 });
});
```

### Unit Test Coverage

Unit tests (Jest + React Testing Library) fokus pada:

- Auth guard: render `VersePage` tanpa session → `router.push("/login")` dipanggil
- Loading state: saat fetch berjalan → teks "LOADING..." tampil
- Error state (HTTP error): mock fetch mengembalikan status 500 → pesan error tampil
- Error state (network error): mock fetch throw Error → pesan error tampil
- Error state (empty verses): mock fetch mengembalikan `{ verses: [] }` → pesan error tampil
- Success state: mock fetch sukses → teks ayat, referensi, dan label "TB" tampil
- Label "VERSE OF THE DAY": teks label ada di halaman
- Sidebar update: link `/verse` dengan ikon `✝` ada, link `/summary` tidak ada
- Sidebar active state: pathname `/verse` → item Verse dalam kondisi aktif
