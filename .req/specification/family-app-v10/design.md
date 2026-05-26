# Design Document

## Overview

Family App v10 mengimplementasikan lima fitur update untuk aplikasi "Partai Wilhelmus". Desain mengikuti pola yang sudah ada: inline styles dengan CSS variables, komponen `.tsx` baru, file `.js` yang sudah ada tidak diubah ekstensinya, dan tidak ada perubahan database atau RLS.

---

## Architecture

### Komponen dan File yang Terlibat

```
app/
  summary/page.js              ← tambah TranslateButton, hapus elemen "WEB"
  family/page.tsx              ← ganti label display anggota keluarga
  api/translate/route.js       ← NEW: proxy ke MyMemory API
components/
  TranslateButton.tsx          ← NEW: tombol terjemahan dengan toggle & cache
  TaskQueue.tsx                ← perbaiki warna ke CSS variables
vercel.json                    ← ubah jadwal cron ke 0 17 * * *
app/api/cron/daily-reset/route.ts  ← tambah dedup check, logging
```

---

## Feature 1: Translate Daily Verse

### Komponen: `components/TranslateButton.tsx`

Komponen menerima props `verseText` (string) dan `verseId` (string, digunakan sebagai cache key). Komponen mengelola state internal: `translated` (string | null), `isVisible` (boolean), `isLoading` (boolean).

**State machine:**
- `isVisible = false` → tombol label "Terjemahkan"
- `isVisible = true` → tombol label "Sembunyikan"
- `isLoading = true` → tombol disabled, tampilkan spinner

**Cache key:** `translated_<verseId>` di localStorage, di mana `verseId` adalah `verse.reference` yang di-encode (spasi diganti `_`).

**Toggle logic:**
```
onClick:
  if (isVisible) → setIsVisible(false)
  else if (translated) → setIsVisible(true)  // sudah ada cache
  else → fetchTranslation()
```

**Animasi terjemahan:** `motion.div` dengan `initial={{ opacity: 0, y: -8 }}`, `animate={{ opacity: 1, y: 0 }}`, `transition={{ duration: 0.4 }}`.

### API Route: `app/api/translate/route.js`

Route GET menerima query param `text`. Memanggil MyMemory API dengan `AbortController` timeout 10 detik. Mengembalikan `{ translatedText: string }` atau `{ error: string }` dengan status 500.

```
GET /api/translate?text=<encoded_verse_text>
→ fetch https://api.mymemory.translated.net/get?q=<text>&langpair=en|id
→ return { translatedText: data.responseData.translatedText }
```

**Error handling:**
- Timeout 10 detik → return 500 `{ error: 'Request timeout' }`
- HTTP error dari MyMemory → return 500 `{ error: 'Translation failed' }`
- Network error → return 500 `{ error: 'Network error' }`

### Integrasi di `app/summary/page.js`

Import `TranslateButton` dan `useToast` (atau gunakan state `toast` yang sudah ada). Tambahkan `TranslateButton` di dalam array action buttons di komponen `VerseCard`, di antara "Bagikan" dan "Ayat Baru". Pass `verse.text` dan `verse.reference` sebagai props. Pass `onTranslateError` callback untuk menampilkan toast error.

**Urutan tombol final:** Salin → Bagikan → Terjemahkan → Ayat Baru

---

## Feature 2: Hapus Teks "WEB"

Cari dan hapus elemen JSX di `app/summary/page.js` yang merender teks "WEB". Berdasarkan analisis kode, elemen ini kemungkinan ada sebagai label atau badge. Hapus hanya elemen tersebut tanpa mengubah struktur sekitarnya.

---

## Feature 3: Ganti Label Anggota Keluarga

### Mapping Label

```typescript
const DISPLAY_NAME_MAP: Record<string, string> = {
  papa: 'Abi',
  mama: 'Umi',
  nemi: 'Baginda',
  venly: 'Mbah',
};
```

Fungsi helper:
```typescript
function getDisplayName(username: string): string {
  return DISPLAY_NAME_MAP[username.toLowerCase()] ?? username;
}
```

Mapping ini diterapkan hanya pada layer display (label yang dirender ke UI). Nilai `user.username` yang asli tetap digunakan untuk semua logika bisnis (permission check, assignment, database query).

### Lokasi Perubahan di `app/family/page.tsx`

1. Komponen `DraggableMember` menerima `user` object — tambahkan `getDisplayName` saat merender nama di UI.
2. Toast message saat assignment: gunakan `getDisplayName(draggedUser.username)` untuk nama yang ditampilkan.
3. Pesan "Hanya Papa dan Mama yang bisa mengelola" — ubah teks menjadi "Hanya Abi dan Umi yang bisa mengelola tugas keluarga."

### Komponen `components/DraggableMember.tsx`

Tambahkan mapping yang sama atau terima prop `displayName` dari parent. Karena komponen ini digunakan di `family/page.tsx`, pendekatan paling sederhana adalah menambahkan `DISPLAY_NAME_MAP` di `DraggableMember.tsx` dan menggunakannya saat render nama.

---

## Feature 4: Perbaikan TaskQueue CSS Variables

### Perubahan di `components/TaskQueue.tsx`

Ganti semua nilai warna hardcoded dengan CSS variables:

| Sebelum | Sesudah |
|---------|---------|
| `rgba(15,14,11,0.6)` (bg container) | `var(--bg-card)` |
| `rgba(201,165,59,0.12)` (border container) | `var(--border)` |
| `rgba(22,20,16,0.7)` (bg kartu) | `var(--bg-card2)` |
| `rgba(201,165,59,0.2)` (border kartu dashed) | `var(--border)` |
| `backdropFilter: 'blur(16px)'` | hapus atau kondisional |

Warna teks yang sudah menggunakan `var(--text-main)` dan `var(--text-muted)` tidak perlu diubah.

Tombol "→ Hari Ini" tetap menggunakan `var(--accent)` untuk warna teks dan border, karena ini adalah elemen interaktif yang memang menggunakan accent color.

---

## Feature 5: Perbaikan Daily Reset

### Perubahan di `app/api/cron/daily-reset/route.ts`

#### Deduplication Check

Sebelum insert ke `task_queue`, cek apakah sudah ada entri dengan `user_id` dan `title` yang sama yang di-queue pada hari yang sama:

```typescript
const today = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"

const { data: existing } = await supabase
  .from('task_queue')
  .select('id, title')
  .eq('user_id', userId)
  .gte('queued_at', today + 'T00:00:00.000Z')
  .lt('queued_at', today + 'T23:59:59.999Z');

const existingTitles = new Set(existing?.map(t => t.title) ?? []);
const tasksToInsert = tasksToQueue.filter(t => !existingTitles.has(t.title));
```

Jika `tasksToInsert.length === 0`, skip insert dan lanjut ke step delete.

#### Logging

```typescript
console.log(`[DailyReset] Starting at ${new Date().toISOString()}`);
console.log(`[DailyReset] Processing ${users.length} users`);
// per user:
console.log(`[DailyReset] User ${user.username} (${user.id}): queued ${result.queued}, deleted done tasks`);
// on error:
console.error(`[DailyReset] Error for user ${user.id}:`, error);
// summary:
console.log(`[DailyReset] Done. Success: ${successCount}, Error: ${errorCount}, Duration: ${duration}ms`);
```

#### Jadwal Vercel

Ubah `vercel.json` dari `"0 0 * * *"` ke `"0 17 * * *"` agar berjalan pukul 17:00 UTC = 00:00 WIB.

---

## Correctness Properties

### Property 1: Translate Cache Round-Trip
Setelah terjemahan berhasil disimpan ke localStorage dengan key `translated_<verseId>`, membaca kembali key yang sama harus mengembalikan string terjemahan yang identik.
- Testable: yes — round-trip property

### Property 2: Toggle Idempotence
Mengklik tombol "Terjemahkan" dua kali berturut-turut (show → hide) harus mengembalikan UI ke state awal (terjemahan tidak terlihat), tanpa memanggil API tambahan jika cache sudah ada.
- Testable: yes — idempotence property

### Property 3: Label Mapping Completeness
Untuk setiap username yang ada di `DISPLAY_NAME_MAP`, `getDisplayName(username)` harus mengembalikan nilai yang berbeda dari username aslinya. Untuk username yang tidak ada di map, fungsi harus mengembalikan username asli (identity).
- Testable: yes — example-based

### Property 4: Daily Reset No Duplication
Menjalankan cron job dua kali pada hari yang sama tidak boleh menghasilkan duplikasi entri di `task_queue` untuk user dan judul tugas yang sama.
- Testable: yes — idempotence property

### Property 5: Daily Reset Per-User Error Isolation
Jika proses reset untuk satu user gagal (simulasi error database), proses untuk user lain harus tetap berjalan dan `errorCount` harus tepat 1 sementara `successCount` mencerminkan user yang berhasil.
- Testable: yes — error condition property

### Property 6: CSS Variable Contrast
Pada tema light (`--bg-card: #ffffff`, `--text-main: #1e1a15`), rasio kontras antara warna teks dan background TaskQueue harus memenuhi minimum 4.5:1 (WCAG AA).
- Testable: yes — example-based (dapat diverifikasi dengan kalkulasi rasio kontras)
