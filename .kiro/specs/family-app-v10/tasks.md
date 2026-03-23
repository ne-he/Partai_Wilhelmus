# Tasks

## Task List

- [x] 1. Buat API Route Translate
  - [x] 1.1 Buat file `app/api/translate/route.js` dengan handler GET yang menerima query param `text`
  - [x] 1.2 Implementasi pemanggilan MyMemory API (`https://api.mymemory.translated.net/get?q=...&langpair=en|id`) dengan `AbortController` timeout 10 detik
  - [x] 1.3 Tambahkan error handling: timeout → 500, HTTP error → 500, network error → 500, semua dengan pesan error yang deskriptif
  - [x] 1.4 Return `{ translatedText: string }` saat sukses

- [x] 2. Buat Komponen TranslateButton
  - [x] 2.1 Buat file `components/TranslateButton.tsx` dengan props `verseText: string`, `verseId: string`, `onError: (msg: string) => void`
  - [x] 2.2 Implementasi state: `translated` (string | null), `isVisible` (boolean), `isLoading` (boolean)
  - [x] 2.3 Implementasi cache localStorage dengan key `translated_<verseId>` — baca saat mount, tulis setelah fetch berhasil
  - [x] 2.4 Implementasi toggle logic: klik pertama fetch/tampilkan, klik kedua sembunyikan, klik ketiga tampilkan dari cache
  - [x] 2.5 Implementasi animasi fade-in teks terjemahan menggunakan `motion.div` dari Framer Motion (`opacity: 0→1`, `y: -8→0`, durasi 0.4s)
  - [x] 2.6 Tampilkan loading spinner (elemen `<span>` dengan animasi spin) saat `isLoading = true` dan disable tombol
  - [x] 2.7 Render teks terjemahan di bawah garis pemisah menggunakan `var(--text-muted)` dan `var(--border)`

- [x] 3. Integrasi TranslateButton ke Summary Page
  - [x] 3.1 Di `app/summary/page.js`, import `TranslateButton` dan tambahkan ke array action buttons di komponen `VerseCard` di antara "Bagikan" dan "Ayat Baru"
  - [x] 3.2 Pass `verse.text` sebagai `verseText` dan `verse.reference` sebagai `verseId` ke `TranslateButton`
  - [x] 3.3 Pass callback `onError` yang memanggil `showToast("Gagal menerjemahkan, coba lagi nanti")` ke `TranslateButton`
  - [x] 3.4 Hapus elemen JSX yang merender teks "WEB" dari `app/summary/page.js`

- [x] 4. Ganti Label Anggota Keluarga di Family Page
  - [x] 4.1 Tambahkan konstanta `DISPLAY_NAME_MAP` di `app/family/page.tsx` dengan mapping: `papa→Abi`, `mama→Umi`, `nemi→Baginda`, `venly→Mbah`
  - [x] 4.2 Tambahkan fungsi helper `getDisplayName(username: string): string` yang mengembalikan display name dari map, atau username asli jika tidak ada di map
  - [x] 4.3 Terapkan `getDisplayName` pada komponen `DraggableMember` — tambahkan mapping yang sama di `components/DraggableMember.tsx` untuk render nama
  - [x] 4.4 Update pesan toast assignment di `handleDragEnd` untuk menggunakan `getDisplayName(draggedUser.username)`
  - [x] 4.5 Update teks info permission dari "Hanya Papa dan Mama" menjadi "Hanya Abi dan Umi yang bisa mengelola tugas keluarga."

- [x] 5. Perbaiki Tampilan TaskQueue dengan CSS Variables
  - [x] 5.1 Di `components/TaskQueue.tsx`, ganti `background: 'rgba(15,14,11,0.6)'` pada container utama dengan `background: 'var(--bg-card)'`
  - [x] 5.2 Ganti `border: '1px solid rgba(201,165,59,0.12)'` pada container utama dengan `border: '1px solid var(--border)'`
  - [x] 5.3 Ganti `background: 'rgba(22,20,16,0.7)'` pada kartu tugas individual dengan `background: 'var(--bg-card2)'`
  - [x] 5.4 Ganti `border: '1px dashed rgba(201,165,59,0.2)'` pada kartu tugas individual dengan `border: '1px dashed var(--border)'`
  - [x] 5.5 Hapus atau kondisikan `backdropFilter: 'blur(16px)'` agar tidak diterapkan pada tema light/minimal (cukup hapus property ini karena `var(--bg-card)` sudah opaque di tema terang)

- [x] 6. Perbaiki Logika Daily Reset
  - [x] 6.1 Di `app/api/cron/daily-reset/route.ts`, tambahkan logging `console.log` di awal fungsi GET dengan timestamp
  - [x] 6.2 Tambahkan logging per user setelah setiap `performUserReset` selesai (sukses maupun gagal)
  - [x] 6.3 Tambahkan logging ringkasan di akhir sebelum return response
  - [x] 6.4 Di fungsi `performUserReset`, tambahkan deduplication check: sebelum insert ke `task_queue`, query entri yang sudah ada dengan `user_id` yang sama dan `queued_at` pada hari yang sama
  - [x] 6.5 Filter `tasksToQueue` untuk menghilangkan tugas yang judulnya sudah ada di `task_queue` hari ini sebelum insert
  - [x] 6.6 Di `vercel.json`, ubah jadwal cron dari `"0 0 * * *"` menjadi `"0 17 * * *"` untuk eksekusi pukul 00:00 WIB (UTC+7)
