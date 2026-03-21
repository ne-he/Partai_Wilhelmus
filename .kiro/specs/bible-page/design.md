# Design Document

## Overview

Halaman `/summary` diganti kontennya menjadi halaman Bible yang menampilkan satu ayat Alkitab per hari. Implementasi menggunakan pola yang sama dengan halaman lain di proyek ini: auth check via Supabase, Sidebar yang tidak dimodifikasi, CSS variables yang sudah ada, dan inline styles konsisten dengan `app/home/page.js` dan `app/summary/page.js`.

Dua file baru dibuat:
1. `Lib/utils/bibleApi.ts` — utility untuk fetch dan cache ayat
2. `app/summary/page.js` — diganti seluruh kontennya (file tetap `.js` agar konsisten)

Tidak ada perubahan pada `app/layout.tsx`, `components/Sidebar.js`, atau `app/globals.css`.

---

## Architecture

```
app/summary/page.js          ← diganti kontennya
Lib/utils/bibleApi.ts        ← utility baru (fetch + cache)
```

### Data Flow

```
BiblePage (mount)
  → supabase.auth.getUser()
    → redirect /login jika tidak ada sesi
    → getDailyVerse()
        → cek localStorage key: daily_verse_{YYYY-MM-DD}
            → HIT: return cached verse
            → MISS: fetchRandomVerse() → simpan ke localStorage → return
  → render VerseCard dengan fade-in
```

---

## Components

### `Lib/utils/bibleApi.ts`

```typescript
export interface Verse {
  reference: string;
  text: string;
  translation: string;
  cachedAt: string; // YYYY-MM-DD
}

// Daftar referensi ayat populer untuk dipilih secara acak
const VERSE_REFS = [
  "john 3:16", "psalm 23:1", "romans 8:28", "philippians 4:13",
  "jeremiah 29:11", "proverbs 3:5", "isaiah 40:31", "matthew 6:33",
  "psalm 46:1", "romans 8:38-39", "john 14:6", "psalm 119:105",
  "2 timothy 1:7", "matthew 11:28", "john 16:33", "romans 5:8",
  "ephesians 2:8", "psalm 27:1", "isaiah 41:10", "hebrews 11:1",
];

export async function getDailyVerse(): Promise<Verse>
export async function fetchRandomVerse(): Promise<Verse>
```

**`getDailyVerse()` logic:**
1. Hitung `today = new Date().toLocaleDateString('en-CA')` → format `YYYY-MM-DD`
2. Baca `localStorage.getItem('daily_verse_' + today)`
3. Jika ada dan valid (punya field `text`, `reference`, `cachedAt`) → parse dan return
4. Jika tidak → panggil `fetchRandomVerse()`, simpan ke localStorage, return

**`fetchRandomVerse()` logic:**
1. Pilih referensi acak dari `VERSE_REFS` menggunakan `Math.random()`
2. `fetch('https://bible-api.com/' + encodeURIComponent(ref))`
3. Jika `!res.ok` → throw Error
4. Map response ke `Verse` interface, tambahkan `cachedAt`

**Cache integrity:** Sebelum menggunakan data dari localStorage, validasi keberadaan field `text`, `reference`, dan `cachedAt`. Jika tidak valid, fetch ulang.

---

### `app/summary/page.js` (BiblePage)

Struktur komponen mengikuti pola `app/summary/page.js` yang lama:

```
BiblePage
  ├── LoadingScreen (saat loading)
  ├── ErrorState (saat error)
  └── Layout (div flex)
       ├── Sidebar (tidak dimodifikasi)
       └── main (marginLeft: 220px)
            ├── Header section (label + judul)
            └── VerseCard (glassmorphism)
                 ├── Ornamen atas (✦ ─── ✦)
                 ├── Label tanggal
                 ├── Teks ayat (font Playfair Display, italic)
                 ├── Ornamen tengah (◆)
                 ├── Referensi ayat
                 └── Badge terjemahan
```

**State:**
```javascript
const [verse, setVerse] = useState(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState('');
const [visible, setVisible] = useState(false); // untuk fade-in
const [profile, setProfile] = useState(null);
```

**Auth pattern** (sama persis dengan halaman lain):
```javascript
useEffect(() => { init(); }, []);

async function init() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) { router.push('/login'); return; }
  const { data: prof } = await supabase.from('users').select('*').eq('id', user.id).single();
  setProfile(prof);
  // ... load verse
}
```

---

## Visual Design

### VerseCard

```
┌─────────────────────────────────────────────────────┐
│  ✦ ─────────────────────────────────────────── ✦   │
│                                                     │
│  SABTU, 21 MARET 2026                               │  ← text-muted, letter-spacing: 3px
│                                                     │
│  📖  AYAT RENUNGAN HARIAN                           │  ← accent, letter-spacing: 2px
│                                                     │
│  "For God so loved the world, that he gave          │  ← Playfair Display, italic
│   his only begotten Son, that whosoever             │    font-size: 1.4rem–1.8rem
│   believeth in him should not perish..."            │    color: text-main
│                                                     │
│                    ◆                                │  ← ornamen pemisah
│                                                     │
│                          — John 3:16                │  ← accent, font-size: 1rem
│                                                     │
│  KJV                                                │  ← badge: bg-card2, border
│                                                     │
│  ✦ ─────────────────────────────────────────── ✦   │
└─────────────────────────────────────────────────────┘
```

**Glassmorphism styles:**
```javascript
{
  background: 'rgba(36, 32, 24, 0.7)',      // --bg-card dengan opacity
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(200, 169, 110, 0.2)',  // --accent dengan opacity
  borderRadius: '16px',
  padding: '3rem',
  maxWidth: '680px',
  width: '100%',
}
```

### Animasi Fade-In

```javascript
// Setelah verse di-set, trigger visible = true dengan delay kecil
useEffect(() => {
  if (verse) {
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }
}, [verse]);

// Style pada VerseCard:
{
  opacity: visible ? 1 : 0,
  transform: visible ? 'translateY(0)' : 'translateY(12px)',
  transition: 'opacity 0.6s ease, transform 0.6s ease',
}
```

**Reduced motion:** Gunakan CSS media query via inline check:
```javascript
const prefersReduced = typeof window !== 'undefined' 
  && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
// Jika true, skip animasi (langsung visible = true)
```

### Loading State

Sama dengan pola di halaman lain:
```javascript
function LoadingScreen() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', 
                  justifyContent: 'center', background: 'var(--bg-main)' }}>
      <div style={{ color: 'var(--accent)', letterSpacing: '4px', fontSize: '0.8rem' }}>
        MEMUAT AYAT...
      </div>
    </div>
  );
}
```

### Error State

```javascript
// Ditampilkan di dalam main content area (bukan full screen)
// Berisi pesan error + tombol "Coba Lagi"
```

---

## Correctness Properties

### Property 1: Cache Round-Trip Integrity
Untuk semua objek `Verse` yang valid, serialisasi ke JSON dan parse kembali menghasilkan objek yang ekuivalen.

```typescript
// PBT: generate arbitrary Verse objects, verify round-trip
property("verse round-trip", () => {
  fc.assert(fc.property(
    fc.record({ reference: fc.string(), text: fc.string(), 
                translation: fc.string(), cachedAt: fc.string() }),
    (verse) => {
      const parsed = JSON.parse(JSON.stringify(verse));
      return parsed.reference === verse.reference &&
             parsed.text === verse.text &&
             parsed.translation === verse.translation &&
             parsed.cachedAt === verse.cachedAt;
    }
  ));
});
```

### Property 2: Cache Key Isolation
Untuk dua tanggal yang berbeda, key localStorage yang dihasilkan selalu berbeda.

```typescript
property("different dates produce different cache keys", () => {
  fc.assert(fc.property(
    fc.date(), fc.date(),
    (d1, d2) => {
      const k1 = 'daily_verse_' + d1.toLocaleDateString('en-CA');
      const k2 = 'daily_verse_' + d2.toLocaleDateString('en-CA');
      return d1.toLocaleDateString('en-CA') === d2.toLocaleDateString('en-CA') 
        ? k1 === k2 
        : k1 !== k2;
    }
  ));
});
```

### Property 3: Invalid Cache Rejection
Jika data di localStorage tidak memiliki field `text`, `reference`, atau `cachedAt`, maka `getDailyVerse()` tidak menggunakan data tersebut.

```typescript
property("invalid cache is rejected", () => {
  // Test dengan objek yang missing salah satu field wajib
  // Verifikasi bahwa fetchRandomVerse() dipanggil ulang
});
```

---

## File Changes Summary

| File | Action |
|------|--------|
| `app/summary/page.js` | Ganti seluruh konten |
| `Lib/utils/bibleApi.ts` | Buat baru |

Tidak ada file lain yang dimodifikasi.
