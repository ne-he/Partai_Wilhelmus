# Tasks — verse-of-the-day-v3

## Task List

- [x] 1. Update Sidebar navigation
  - [x] 1.1 Ganti entry `{ href: "/summary", label: "Summary", icon: "◈" }` dengan `{ href: "/verse", label: "Verse", icon: "✝" }` di array `navItems` pada `components/Sidebar.js`

- [x] 2. Buat utility functions di `lib/verse-utils.js`
  - [x] 2.1 Implementasi `computeDateSeed(date)` — mengembalikan integer unik per hari dari year, month, day
  - [x] 2.2 Implementasi `seededRandom(seed)` — Mulberry32 PRNG, mengembalikan fungsi `() => float [0,1)`
  - [x] 2.3 Implementasi `pickWithSeed(arr, seed)` — memilih satu elemen dari array menggunakan seed
  - [x] 2.4 Implementasi `formatReference(bookName, chapter, verseNumber)` — mengembalikan string `"Nama Kitab Pasal:Ayat"`

- [x] 3. Buat halaman `app/verse/page.js`
  - [x] 3.1 Setup boilerplate: `"use client"`, imports, `export const dynamic = "force-dynamic"`
  - [x] 3.2 Implementasi auth guard: `supabase.auth.getUser()` → redirect ke `/login` jika tidak ada sesi
  - [x] 3.3 Implementasi fetch daftar kitab dari `GET https://beeble.vercel.app/api/v1/passage/list`
  - [x] 3.4 Implementasi pemilihan kitab, pasal, dan ayat menggunakan `pickWithSeed` dengan seed berbeda (`dateSeed * 1`, `dateSeed * 2`, `dateSeed * 3`)
  - [x] 3.5 Implementasi fetch isi pasal dari `GET https://beeble.vercel.app/api/v1/passage/{abbr}/{chapter}?ver=tb`
  - [x] 3.6 Implementasi error handling untuk semua kasus: HTTP error, network error, empty verses, empty book list
  - [x] 3.7 Implementasi loading state dengan teks "LOADING..."
  - [x] 3.8 Implementasi `ScriptureCard` inline: teks ayat italic serif, VerseReference dengan accent color, label "TB"
  - [x] 3.9 Implementasi layout halaman: Sidebar + main content dengan label "VERSE OF THE DAY"

- [x] 4. Tulis property-based tests di `lib/__tests__/verse-utils.test.js`
  - [x] 4.1 Property 1: `seededRandom` determinism — seed yang sama menghasilkan nilai yang sama
  - [x] 4.2 Property 2: `computeDateSeed` ignores time components — dua Date pada hari yang sama menghasilkan seed yang sama
  - [x] 4.3 Property 3: `formatReference` format — output selalu `"{bookName} {chapter}:{verseNumber}"`
  - [x] 4.4 Property 4: `pickWithSeed` bounds — selalu mengembalikan elemen yang ada di array

- [x] 5. Tulis unit tests di `app/verse/__tests__/page.test.js`
  - [x] 5.1 Auth guard: tanpa sesi → redirect ke `/login`
  - [x] 5.2 Loading state: saat fetch berjalan → "LOADING..." tampil
  - [x] 5.3 Error state HTTP: fetch mengembalikan status 500 → pesan error tampil
  - [x] 5.4 Error state network: fetch throw Error → pesan error tampil
  - [x] 5.5 Error state empty verses: `{ verses: [] }` → pesan error tampil
  - [x] 5.6 Success state: fetch sukses → teks ayat, referensi, dan "TB" tampil
  - [x] 5.7 Label "VERSE OF THE DAY" ada di halaman
  - [x] 5.8 Sidebar: link `/verse` dengan ikon `✝` ada, link `/summary` tidak ada
