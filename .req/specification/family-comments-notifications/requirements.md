# Requirements Document

## Introduction

Fitur v8 "Komentar pada Family Tasks & Notifikasi Real-time" menambahkan kemampuan diskusi kolaboratif pada setiap tugas keluarga di aplikasi "Partai Wilhelmus", serta sistem notifikasi instan (in-app toast dan push notification browser) agar seluruh anggota keluarga selalu terinformasi tentang aktivitas terbaru. Fitur ini dibangun di atas infrastruktur Supabase yang sudah ada (PostgreSQL + RLS + Realtime) dan terintegrasi dengan komponen UI yang telah tersedia (Toast, Skeleton, ConfirmModal, Framer Motion).

Empat anggota keluarga dengan hierarki mafia vintage:
- **Papa** (username: Papa, role: papa, alias: Abi) — BOSS, hak penuh
- **Mama** (username: Mama, role: mama, alias: Umi) — CONSIGLIERE, hak penuh
- **Nemi** (username: Nemi, role: nemi, alias: Baginda) — SOLDATO, hak terbatas
- **Venly** (username: Venly, role: venly, alias: Mbah) — SOLDATO, hak terbatas

---

## Glossary

- **System**: Aplikasi web "Partai Wilhelmus" berbasis Next.js App Router
- **TaskDetailModal**: Komponen modal yang menampilkan detail task beserta thread komentar
- **CommentSection**: Sub-komponen dalam TaskDetailModal yang mengelola daftar dan form komentar
- **CommentList**: Sub-komponen yang merender daftar komentar dengan pagination
- **CommentForm**: Sub-komponen textarea + emoji picker untuk menambah komentar baru
- **CommentItem**: Sub-komponen yang merender satu komentar beserta aksi edit/hapus
- **useRealtimeComments**: Custom hook yang mengelola subscription Supabase Realtime untuk tabel task_comments
- **useNotifications**: Custom hook yang mengelola subscription in-app notification dan push notification
- **NotificationService**: Supabase Edge Function `send-push-notification` yang mengirim push ke browser
- **DeadlineReminderJob**: Supabase Edge Function terjadwal yang memeriksa deadline H-1 setiap pagi
- **ServiceWorker**: File `public/sw.js` yang menangani push event di background browser
- **BOSS**: Role papa — dapat membuat, mengedit, menghapus semua task dan komentar
- **CONSIGLIERE**: Role mama — dapat membuat, mengedit, menghapus semua task dan komentar
- **SOLDATO**: Role nemi/venly — dapat membuat komentar, hanya dapat mengedit/menghapus komentar milik sendiri
- **family_tasks**: Tabel Supabase yang sudah ada berisi tugas keluarga
- **task_comments**: Tabel baru berisi komentar pada family tasks
- **push_subscriptions**: Tabel baru berisi endpoint push subscription browser per user
- **VAPID**: Voluntary Application Server Identification — pasangan kunci untuk autentikasi push notification
- **Timestamp relatif**: Format waktu seperti "2 menit lalu", "1 jam lalu", "kemarin"
- **Alias**: Nama tampilan mafia (Abi/Umi/Baginda/Mbah) yang digunakan di UI

---

## Requirements

### Requirement 1: Struktur Database — Tabel task_comments

**User Story:** Sebagai developer, saya ingin tabel `task_comments` dengan RLS yang tepat, agar komentar tersimpan aman dan hanya dapat diakses sesuai hak role.

#### Acceptance Criteria

1. THE System SHALL membuat tabel `task_comments` dengan kolom: `id` (UUID PRIMARY KEY DEFAULT gen_random_uuid()), `task_id` (UUID NOT NULL), `user_id` (UUID NOT NULL), `content` (TEXT NOT NULL), `created_at` (TIMESTAMPTZ DEFAULT now()), `updated_at` (TIMESTAMPTZ DEFAULT now()).
2. THE System SHALL mendefinisikan foreign key `task_id` mereferensikan `family_tasks(id)` dengan ON DELETE CASCADE.
3. THE System SHALL mendefinisikan foreign key `user_id` mereferensikan `users(id)`.
4. THE System SHALL mengaktifkan Row Level Security pada tabel `task_comments`.
5. WHEN seorang user yang terautentikasi melakukan SELECT pada `task_comments`, THE System SHALL mengizinkan akses hanya pada komentar yang `task_id`-nya merujuk ke task yang visible bagi role user tersebut.
6. WHEN seorang user yang terautentikasi melakukan INSERT pada `task_comments`, THE System SHALL mengizinkan insert hanya jika `user_id` pada row baru sama dengan `auth.uid()`.
7. WHEN seorang user dengan role SOLDATO melakukan UPDATE pada `task_comments`, THE System SHALL mengizinkan update hanya pada komentar yang `user_id`-nya sama dengan `auth.uid()`.
8. WHEN seorang user dengan role BOSS atau CONSIGLIERE melakukan UPDATE pada `task_comments`, THE System SHALL mengizinkan update pada semua komentar.
9. WHEN seorang user dengan role SOLDATO melakukan DELETE pada `task_comments`, THE System SHALL mengizinkan delete hanya pada komentar yang `user_id`-nya sama dengan `auth.uid()`.
10. WHEN seorang user dengan role BOSS atau CONSIGLIERE melakukan DELETE pada `task_comments`, THE System SHALL mengizinkan delete pada semua komentar.

---

### Requirement 2: Struktur Database — Tabel push_subscriptions

**User Story:** Sebagai developer, saya ingin tabel `push_subscriptions` untuk menyimpan endpoint push notification per user, agar NotificationService dapat mengirim push ke browser yang tepat.

#### Acceptance Criteria

1. THE System SHALL membuat tabel `push_subscriptions` dengan kolom: `id` (UUID PRIMARY KEY DEFAULT gen_random_uuid()), `user_id` (UUID NOT NULL), `endpoint` (TEXT NOT NULL), `keys` (JSONB NOT NULL), `created_at` (TIMESTAMPTZ DEFAULT now()).
2. THE System SHALL mendefinisikan foreign key `user_id` mereferensikan `users(id)` dengan ON DELETE CASCADE.
3. THE System SHALL mendefinisikan UNIQUE constraint pada kolom `endpoint`.
4. THE System SHALL mengaktifkan Row Level Security pada tabel `push_subscriptions`.
5. WHEN seorang user yang terautentikasi melakukan SELECT pada `push_subscriptions`, THE System SHALL mengizinkan akses hanya pada baris yang `user_id`-nya sama dengan `auth.uid()`.
6. WHEN seorang user yang terautentikasi melakukan INSERT pada `push_subscriptions`, THE System SHALL mengizinkan insert hanya jika `user_id` sama dengan `auth.uid()`.
7. WHEN seorang user yang terautentikasi melakukan DELETE pada `push_subscriptions`, THE System SHALL mengizinkan delete hanya pada baris yang `user_id`-nya sama dengan `auth.uid()`.

---

### Requirement 3: Struktur Database — Trigger Notifikasi

**User Story:** Sebagai developer, saya ingin trigger database yang memanggil Edge Function saat ada insert pada tabel relevan, agar notifikasi push terkirim secara otomatis dari sisi database.

#### Acceptance Criteria

1. THE System SHALL membuat fungsi SQL trigger `notify_on_family_task_insert` yang memanggil Edge Function `send-push-notification` saat terjadi INSERT pada tabel `family_tasks`.
2. THE System SHALL membuat fungsi SQL trigger `notify_on_comment_insert` yang memanggil Edge Function `send-push-notification` saat terjadi INSERT pada tabel `task_comments`.
3. THE System SHALL membuat fungsi SQL trigger `notify_on_assignment_insert` yang memanggil Edge Function `send-push-notification` saat terjadi INSERT atau UPDATE kolom `assigned_to` pada tabel `family_tasks`.
4. WHEN trigger dipanggil, THE System SHALL menyertakan payload berisi `user_id` penerima, `title`, `body`, dan `data` konteks event.
5. WHEN trigger dipanggil, THE System SHALL tidak mengirim notifikasi kepada user yang melakukan aksi (pembuat event).
6. IF Edge Function tidak tersedia saat trigger dipanggil, THEN THE System SHALL mencatat error ke log tanpa menggagalkan transaksi database utama.

---

### Requirement 4: TaskDetailModal — Tampilan Detail Task

**User Story:** Sebagai anggota keluarga, saya ingin membuka modal detail task saat mengklik task card, agar saya dapat melihat informasi lengkap task dan thread komentar.

#### Acceptance Criteria

1. WHEN seorang user mengklik task card di halaman Family, THE System SHALL menampilkan TaskDetailModal dengan animasi Framer Motion (scale + opacity dari 0.9 ke 1.0).
2. THE TaskDetailModal SHALL menampilkan informasi task: judul, status (dengan warna sesuai statusConfig), nama assignee menggunakan alias (Abi/Umi/Baginda/Mbah), dan tanggal dibuat.
3. THE TaskDetailModal SHALL menampilkan CommentSection di bawah informasi task.
4. WHEN seorang user mengklik area backdrop di luar modal, THE System SHALL menutup TaskDetailModal dengan animasi exit.
5. WHEN seorang user menekan tombol tutup (✕) pada modal, THE System SHALL menutup TaskDetailModal.
6. THE TaskDetailModal SHALL dapat diakses oleh semua role (BOSS, CONSIGLIERE, SOLDATO).
7. WHERE aplikasi diakses di perangkat mobile (lebar < 768px), THE TaskDetailModal SHALL menggunakan layout full-screen bottom sheet.

---

### Requirement 5: CommentList — Daftar Komentar dengan Pagination

**User Story:** Sebagai anggota keluarga, saya ingin melihat daftar komentar pada suatu task dengan pagination, agar halaman tidak lambat meski komentar banyak.

#### Acceptance Criteria

1. WHEN TaskDetailModal dibuka, THE CommentList SHALL memuat 10 komentar pertama (terbaru di bawah) dari Supabase secara otomatis.
2. THE CommentList SHALL menampilkan setiap komentar dengan: avatar inisial (2 huruf kapital dari username), nama alias (Abi/Umi/Baginda/Mbah), timestamp relatif, dan teks komentar.
3. WHEN jumlah komentar pada task melebihi 10, THE CommentList SHALL menampilkan tombol "Muat lebih banyak" yang memuat 10 komentar berikutnya.
4. WHILE komentar sedang dimuat dari Supabase, THE CommentList SHALL menampilkan skeleton loading (menggunakan komponen Skeleton yang sudah ada).
5. IF terjadi error saat memuat komentar, THEN THE CommentList SHALL menampilkan pesan error "Gagal memuat komentar. Coba lagi." dengan tombol retry.
6. WHEN tidak ada komentar pada task, THE CommentList SHALL menampilkan pesan "Belum ada komentar. Jadilah yang pertama!" dengan gaya italic.
7. THE CommentList SHALL menampilkan warna avatar sesuai role: BOSS (#c8a96e), CONSIGLIERE (#b8956a), SOLDATO (#9c8a72).

---

### Requirement 6: CommentForm — Tambah Komentar dengan Emoji Picker

**User Story:** Sebagai anggota keluarga, saya ingin menambahkan komentar dengan dukungan emoji, agar diskusi lebih ekspresif dan menyenangkan.

#### Acceptance Criteria

1. THE CommentForm SHALL menampilkan textarea untuk input teks komentar dan tombol "Kirim".
2. THE CommentForm SHALL menampilkan tombol emoji (🙂) yang membuka emoji picker sebagai popup saat diklik.
3. WHEN seorang user memilih emoji dari picker, THE CommentForm SHALL menyisipkan emoji ke posisi kursor pada textarea.
4. WHEN seorang user mengklik tombol "Kirim" dengan textarea tidak kosong, THE System SHALL melakukan INSERT ke tabel `task_comments` dengan `task_id`, `user_id` (auth.uid()), dan `content`.
5. WHEN insert komentar berhasil, THE CommentForm SHALL mengosongkan textarea dan menutup emoji picker.
6. IF insert komentar gagal, THEN THE System SHALL menampilkan toast error "Gagal mengirim komentar. Coba lagi." menggunakan komponen Toast yang sudah ada.
7. WHILE proses insert sedang berlangsung, THE CommentForm SHALL menonaktifkan tombol "Kirim" dan menampilkan indikator loading.
8. WHEN textarea kosong, THE CommentForm SHALL menonaktifkan tombol "Kirim".
9. WHEN seorang user menekan Ctrl+Enter atau Cmd+Enter pada textarea, THE System SHALL mengirim komentar (sama seperti klik tombol "Kirim").

---

### Requirement 7: Edit & Hapus Komentar dengan Role-Based Access

**User Story:** Sebagai anggota keluarga, saya ingin dapat mengedit atau menghapus komentar sesuai hak akses role saya, agar konten diskusi dapat dikelola dengan tepat.

#### Acceptance Criteria

1. THE CommentItem SHALL menampilkan ikon three-dots (⋯) pada setiap komentar yang dapat diedit/dihapus oleh user yang sedang login.
2. WHEN seorang user dengan role SOLDATO melihat komentar milik user lain, THE CommentItem SHALL menyembunyikan ikon three-dots.
3. WHEN seorang user mengklik ikon three-dots, THE System SHALL menampilkan dropdown menu dengan opsi "Edit" dan "Hapus".
4. WHEN seorang user memilih "Edit", THE CommentItem SHALL mengganti tampilan teks komentar dengan textarea pre-filled teks lama dan tombol "Simpan" dan "Batal".
5. WHEN seorang user mengklik "Simpan" setelah mengedit, THE System SHALL melakukan UPDATE pada `task_comments` dengan `content` baru dan `updated_at` = now().
6. WHEN edit berhasil, THE CommentItem SHALL kembali ke tampilan normal dan menampilkan tanda "(diedit)" di samping timestamp.
7. WHEN seorang user memilih "Hapus", THE System SHALL menampilkan ConfirmModal (komponen yang sudah ada) dengan pesan "Hapus komentar ini?".
8. WHEN seorang user mengkonfirmasi hapus, THE System SHALL melakukan DELETE pada `task_comments` untuk komentar tersebut.
9. IF operasi edit atau hapus gagal, THEN THE System SHALL menampilkan toast error menggunakan komponen Toast yang sudah ada.

---

### Requirement 8: Real-time Komentar via Supabase Realtime

**User Story:** Sebagai anggota keluarga, saya ingin komentar baru muncul secara otomatis tanpa refresh halaman, agar diskusi terasa langsung dan responsif.

#### Acceptance Criteria

1. THE useRealtimeComments hook SHALL subscribe ke channel Supabase Realtime dengan filter `task_id=eq.{taskId}` pada tabel `task_comments`.
2. WHEN komentar baru di-INSERT oleh user lain, THE CommentList SHALL menambahkan komentar tersebut ke bagian bawah daftar tanpa reload halaman.
3. WHEN komentar di-UPDATE oleh user lain, THE CommentList SHALL memperbarui teks komentar yang bersangkutan secara in-place.
4. WHEN komentar di-DELETE oleh user lain, THE CommentList SHALL menghapus komentar tersebut dari daftar dengan animasi exit.
5. WHEN komentar baru masuk dari user lain, THE System SHALL menampilkan toast info "Komentar baru dari [alias]" menggunakan komponen Toast yang sudah ada.
6. WHEN TaskDetailModal ditutup, THE useRealtimeComments hook SHALL melakukan unsubscribe dari channel Realtime untuk mencegah memory leak.
7. IF koneksi Realtime terputus, THEN THE System SHALL mencoba reconnect secara otomatis menggunakan mekanisme bawaan Supabase Realtime client.

---

### Requirement 9: In-App Toast Notification via Supabase Realtime

**User Story:** Sebagai anggota keluarga, saya ingin menerima notifikasi toast dalam aplikasi saat ada aktivitas keluarga baru, agar saya tidak melewatkan update penting.

#### Acceptance Criteria

1. THE useNotifications hook SHALL subscribe ke channel Supabase Realtime `family:{familyId}` untuk event level keluarga.
2. THE useNotifications hook SHALL subscribe ke channel Supabase Realtime `user:{userId}` untuk event yang ditujukan ke user tertentu.
3. WHEN terjadi INSERT pada `family_tasks`, THE System SHALL menampilkan toast info "Tugas baru: [judul task]" kepada semua anggota keluarga kecuali pembuat.
4. WHEN terjadi INSERT pada `task_comments` pada task yang diikuti user, THE System SHALL menampilkan toast info "Komentar baru dari [alias] pada [judul task]".
5. WHEN terjadi assignment (UPDATE `assigned_to`) pada `family_tasks`, THE System SHALL menampilkan toast info "Kamu ditugaskan ke: [judul task]" kepada user yang di-assign.
6. WHEN deadline task kurang dari 24 jam, THE System SHALL menampilkan toast warning "Deadline besok: [judul task]" kepada user yang di-assign dan BOSS/CONSIGLIERE.
7. WHEN useNotifications hook di-unmount, THE System SHALL melakukan unsubscribe dari semua channel Realtime.

---

### Requirement 10: Pengaturan Notifikasi Browser

**User Story:** Sebagai anggota keluarga, saya ingin dapat mengaktifkan atau menonaktifkan notifikasi push browser dari halaman Settings, agar saya dapat mengontrol preferensi notifikasi saya.

#### Acceptance Criteria

1. THE System SHALL menampilkan toggle "Aktifkan Notifikasi Browser" di halaman Settings.
2. WHEN seorang user mengaktifkan toggle, THE System SHALL memanggil `Notification.requestPermission()` untuk meminta izin notifikasi browser.
3. WHEN izin notifikasi diberikan oleh user, THE System SHALL mendaftarkan ServiceWorker dari `public/sw.js` dan membuat push subscription menggunakan VAPID public key.
4. WHEN push subscription berhasil dibuat, THE System SHALL menyimpan `endpoint` dan `keys` ke tabel `push_subscriptions` via Supabase.
5. WHEN seorang user menonaktifkan toggle, THE System SHALL menghapus subscription dari tabel `push_subscriptions` dan melakukan unsubscribe dari push manager browser.
6. IF browser tidak mendukung Push API atau Service Worker, THEN THE System SHALL menonaktifkan toggle dan menampilkan pesan "Browser Anda tidak mendukung notifikasi push."
7. IF izin notifikasi ditolak oleh user, THEN THE System SHALL menampilkan pesan "Izin notifikasi ditolak. Aktifkan melalui pengaturan browser." dan tidak menyimpan subscription.
8. WHEN halaman Settings dimuat, THE System SHALL menampilkan status izin notifikasi saat ini (Aktif / Nonaktif / Ditolak).

---

### Requirement 11: Service Worker & VAPID

**User Story:** Sebagai developer, saya ingin service worker yang menangani push event dan konfigurasi VAPID yang aman, agar push notification dapat diterima browser meski aplikasi tidak terbuka.

#### Acceptance Criteria

1. THE System SHALL menyediakan file `public/sw.js` yang mendaftarkan event listener untuk event `push`.
2. WHEN ServiceWorker menerima push event, THE System SHALL menampilkan notifikasi browser dengan `title`, `body`, `icon`, dan `data` dari payload push.
3. WHEN seorang user mengklik notifikasi browser, THE ServiceWorker SHALL membuka atau memfokuskan tab aplikasi dan menavigasi ke URL yang relevan dari `data`.
4. THE System SHALL menyimpan VAPID public key di environment variable `NEXT_PUBLIC_VAPID_PUBLIC_KEY` dan VAPID private key di `VAPID_PRIVATE_KEY`.
5. THE System SHALL tidak mengekspos VAPID private key ke sisi client (hanya digunakan di Edge Function).
6. THE ServiceWorker SHALL menangani event `notificationclick` untuk menutup notifikasi dan membuka aplikasi.

---

### Requirement 12: Edge Function Push Notification

**User Story:** Sebagai developer, saya ingin Supabase Edge Function yang mengirim push notification ke browser user, agar notifikasi terkirim dari sisi server secara aman.

#### Acceptance Criteria

1. THE NotificationService SHALL menerima payload berisi `user_id`, `title`, `body`, dan `data` opsional.
2. WHEN NotificationService dipanggil, THE System SHALL melakukan query ke `push_subscriptions` untuk mendapatkan semua endpoint milik `user_id` yang diberikan.
3. WHEN endpoint ditemukan, THE NotificationService SHALL mengirim push notification menggunakan library `web-push` dengan VAPID credentials dari environment variable.
4. WHEN push berhasil terkirim ke semua endpoint, THE NotificationService SHALL mengembalikan response HTTP 200 dengan jumlah endpoint yang berhasil.
5. IF endpoint push subscription tidak valid (HTTP 410 Gone dari push service), THEN THE NotificationService SHALL menghapus endpoint tersebut dari tabel `push_subscriptions`.
6. IF semua endpoint gagal, THEN THE NotificationService SHALL mengembalikan response HTTP 500 dengan pesan error.
7. THE NotificationService SHALL memvalidasi bahwa request berasal dari Supabase internal (service role key) sebelum memproses payload.

---

### Requirement 13: Trigger Database ke Edge Function

**User Story:** Sebagai developer, saya ingin trigger database yang memanggil NotificationService dengan payload yang tepat, agar push notification terkirim otomatis saat ada aktivitas relevan.

#### Acceptance Criteria

1. WHEN terjadi INSERT pada `family_tasks`, THE System SHALL memanggil NotificationService untuk setiap anggota keluarga kecuali pembuat task, dengan title "Tugas Baru" dan body berisi judul task.
2. WHEN terjadi INSERT pada `task_comments`, THE System SHALL memanggil NotificationService untuk user yang di-assign pada task tersebut dan BOSS/CONSIGLIERE, kecuali pembuat komentar, dengan title "Komentar Baru" dan body berisi preview 50 karakter pertama komentar.
3. WHEN terjadi UPDATE `assigned_to` pada `family_tasks`, THE System SHALL memanggil NotificationService untuk user yang baru di-assign, dengan title "Kamu Ditugaskan" dan body berisi judul task.
4. THE System SHALL tidak mengirim push notification kepada user yang melakukan aksi (pembuat event) pada semua trigger.
5. IF `assigned_to` pada task adalah NULL saat komentar di-INSERT, THEN THE System SHALL mengirim notifikasi hanya kepada BOSS dan CONSIGLIERE.

---

### Requirement 14: Deadline Reminder Harian

**User Story:** Sebagai anggota keluarga, saya ingin menerima pengingat push notification H-1 sebelum deadline task, agar saya tidak lupa menyelesaikan tugas tepat waktu.

#### Acceptance Criteria

1. THE DeadlineReminderJob SHALL berjalan terjadwal setiap hari pukul 07:00 WIB (00:00 UTC).
2. WHEN DeadlineReminderJob berjalan, THE System SHALL melakukan query ke `family_tasks` untuk task dengan status bukan 'done' dan deadline antara 20 jam hingga 28 jam dari waktu eksekusi.
3. WHEN task dengan deadline H-1 ditemukan, THE DeadlineReminderJob SHALL memanggil NotificationService untuk user yang di-assign pada task tersebut dengan title "Deadline Besok" dan body berisi judul task.
4. WHEN task dengan deadline H-1 ditemukan, THE DeadlineReminderJob SHALL memanggil NotificationService untuk semua user dengan role BOSS dan CONSIGLIERE dengan title "Deadline Besok" dan body berisi judul task dan nama assignee.
5. IF kolom `deadline` tidak ada pada tabel `family_tasks`, THEN THE System SHALL menambahkan kolom `deadline` (TIMESTAMPTZ, nullable) via migration sebelum mengimplementasikan DeadlineReminderJob.
6. THE DeadlineReminderJob SHALL mengembalikan log berisi jumlah task yang diproses dan jumlah notifikasi yang terkirim.

---

### Requirement 15: Integrasi Modal ke Family Page

**User Story:** Sebagai anggota keluarga, saya ingin mengklik task card di halaman Family untuk membuka TaskDetailModal, agar saya dapat mengakses komentar langsung dari halaman utama.

#### Acceptance Criteria

1. WHEN seorang user mengklik task card (DroppableFamilyTask atau mobile card) di halaman Family, THE System SHALL membuka TaskDetailModal dengan data task yang diklik.
2. THE System SHALL meneruskan `task.id` dan data task awal sebagai props ke TaskDetailModal untuk menghindari fetch ulang yang tidak perlu.
3. WHEN TaskDetailModal terbuka, THE System SHALL mencegah scroll pada halaman di belakang modal (overflow: hidden pada body).
4. WHEN TaskDetailModal ditutup, THE System SHALL mengembalikan scroll halaman ke kondisi normal.
5. THE System SHALL memastikan aksi drag-and-drop (assign member) tidak terpicu saat user mengklik task card untuk membuka modal (gunakan threshold distance minimal 5px sesuai konfigurasi PointerSensor yang sudah ada).

---

### Requirement 16: Loading & Error Handling

**User Story:** Sebagai anggota keluarga, saya ingin melihat indikator loading yang jelas dan pesan error yang informatif, agar pengalaman menggunakan fitur komentar tetap nyaman meski koneksi lambat.

#### Acceptance Criteria

1. WHILE komentar sedang dimuat pertama kali, THE CommentList SHALL menampilkan 3 skeleton item menggunakan komponen Skeleton yang sudah ada dengan variant 'task-list'.
2. WHILE komentar tambahan (pagination) sedang dimuat, THE CommentList SHALL menampilkan spinner atau skeleton di bawah daftar komentar yang sudah ada.
3. IF gagal memuat komentar, THEN THE System SHALL menampilkan pesan error dengan tombol "Coba Lagi" yang melakukan retry fetch.
4. IF gagal mengirim komentar, THEN THE System SHALL menampilkan toast error dan mempertahankan teks di textarea agar user tidak kehilangan input.
5. IF gagal mengedit komentar, THEN THE System SHALL menampilkan toast error dan mempertahankan textarea edit dalam kondisi terbuka.
6. IF gagal menghapus komentar, THEN THE System SHALL menampilkan toast error dan membatalkan penghapusan (komentar tetap tampil).
7. WHEN TaskDetailModal ditutup saat ada operasi async yang sedang berjalan, THE System SHALL membatalkan operasi tersebut dan membersihkan state.

---

### Requirement 17: Round-Trip & Konsistensi Data Komentar

**User Story:** Sebagai developer, saya ingin memastikan data komentar konsisten antara operasi tulis dan baca, agar tidak ada data yang hilang atau korup.

#### Acceptance Criteria

1. FOR ALL komentar yang berhasil di-INSERT ke `task_comments`, THE System SHALL dapat membaca kembali komentar tersebut dengan `content`, `user_id`, dan `task_id` yang identik (round-trip property).
2. WHEN komentar di-UPDATE, THE System SHALL memastikan `updated_at` selalu lebih besar atau sama dengan `created_at` (invariant).
3. WHEN komentar di-DELETE dengan ON DELETE CASCADE dari `family_tasks`, THE System SHALL memastikan tidak ada komentar yatim (orphan) yang tersisa dengan `task_id` yang tidak valid.
4. FOR ALL operasi INSERT komentar yang berhasil, THE System SHALL memastikan komentar tersebut muncul di CommentList dalam waktu maksimal 3 detik via Realtime subscription (pada koneksi normal).
5. WHEN dua user mengirim komentar secara bersamaan pada task yang sama, THE System SHALL menyimpan kedua komentar tanpa konflik dan menampilkan keduanya di CommentList semua user yang subscribe.
