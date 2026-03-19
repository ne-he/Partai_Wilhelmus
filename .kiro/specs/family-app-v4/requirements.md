# Requirements Document

## Introduction

Dokumen ini menjelaskan requirements untuk pengembangan fitur-fitur baru pada family web app yang dibangun dengan Next.js 14 (App Router), TypeScript, Tailwind CSS, dan Supabase. Fitur-fitur yang akan dikembangkan meliputi: transisi halaman dengan animasi, drag-and-drop task management, Pomodoro timer, dan sistem manajemen tugas harian dengan queue.

## Glossary

- **App**: Family web application yang dibangun dengan Next.js 14
- **User**: Pengguna aplikasi yang sudah terautentikasi
- **Personal_Task**: Tugas pribadi milik seorang User
- **Family_Task**: Tugas keluarga yang dapat di-assign ke anggota keluarga
- **Task_Status**: Status tugas yang dapat berupa pending, in_progress, atau done
- **Queue**: Daftar tugas yang belum selesai dari hari sebelumnya
- **Pomodoro_Session**: Sesi fokus 25 menit yang dikaitkan dengan task tertentu
- **Focus_Session**: Record di database yang menyimpan data sesi Pomodoro
- **Parent_User**: User dengan role "papa" atau "mama" yang memiliki hak akses penuh
- **Child_User**: User dengan role selain "papa" atau "mama"
- **Page_Transition**: Animasi perpindahan antar halaman
- **Drag_Source**: Elemen UI yang dapat di-drag oleh User
- **Drop_Target**: Area UI tempat Drag_Source dapat di-drop
- **Daily_Reset**: Proses otomatis yang berjalan setiap hari pada pukul 00:00
- **Cron_Job**: Scheduled task yang berjalan pada waktu tertentu
- **Timer_State**: Status timer Pomodoro (idle, running, paused, break)

## Requirements

### Requirement 1: Page Transitions dengan Framer Motion

**User Story:** Sebagai User, saya ingin melihat animasi transisi yang mulus saat berpindah halaman, sehingga pengalaman navigasi terasa lebih natural dan menyenangkan.

#### Acceptance Criteria

1. WHEN User mengklik link navigasi di sidebar, THE App SHALL menampilkan animasi fade-out pada halaman saat ini
2. WHEN halaman baru dimuat, THE App SHALL menampilkan animasi fade-in atau slide-in pada konten halaman baru
3. THE Page_Transition SHALL memiliki durasi 0.3 detik dengan easing cubic-bezier yang lembut
4. THE App SHALL menggunakan Framer Motion untuk implementasi animasi
5. THE Page_Transition SHALL berfungsi untuk semua rute yang dapat diakses melalui sidebar
6. WHILE Page_Transition sedang berjalan, THE App SHALL mencegah User melakukan navigasi ganda

### Requirement 2: Drag-and-Drop untuk Personal Tasks

**User Story:** Sebagai User, saya ingin dapat mengubah status dan urutan personal tasks dengan drag-and-drop, sehingga saya dapat mengelola tugas dengan lebih intuitif dan cepat.

#### Acceptance Criteria

1. THE App SHALL menggunakan @dnd-kit/sortable untuk implementasi drag-and-drop
2. WHEN User men-drag Personal_Task ke kolom status berbeda, THE App SHALL mengupdate Task_Status di database
3. THE App SHALL menampilkan tiga kolom status: "Pending", "In Progress", dan "Done"
4. WHEN User men-drag Personal_Task dalam satu kolom, THE App SHALL mengubah urutan task tersebut
5. WHILE User sedang men-drag task, THE App SHALL menampilkan visual feedback (opacity, shadow, atau highlight)
6. WHEN drag operation selesai, THE App SHALL menyimpan perubahan status dan urutan ke database
7. THE App SHALL menyimpan field "order" atau "position" untuk setiap Personal_Task dalam kolom yang sama
8. IF drag operation gagal atau dibatalkan, THEN THE App SHALL mengembalikan task ke posisi semula

### Requirement 3: Drag-and-Drop Assignment untuk Family Tasks

**User Story:** Sebagai Parent_User, saya ingin dapat meng-assign family tasks dengan men-drag nama anggota keluarga ke task, sehingga proses assignment lebih visual dan mudah.

#### Acceptance Criteria

1. THE App SHALL menampilkan daftar nama anggota keluarga sebagai Drag_Source
2. WHEN Parent_User men-drag nama anggota ke Family_Task, THE App SHALL mengupdate field assigned_to di database
3. WHEN assignment berhasil, THE App SHALL mengubah Task_Status menjadi "in_progress" secara otomatis
4. WHERE User adalah Child_User, THE App SHALL menonaktifkan kemampuan drag assignment
5. THE App SHALL menampilkan visual feedback saat nama anggota di-hover di atas task
6. WHEN Parent_User men-drag nama anggota yang sudah ter-assign ke task lain, THE App SHALL memindahkan assignment ke task baru
7. THE App SHALL menghapus dropdown assignment yang lama dari UI
8. WHERE User adalah Child_User atau Parent_User, THE App SHALL mengizinkan perubahan Task_Status melalui dropdown atau drag

### Requirement 4: Pomodoro Timer

**User Story:** Sebagai User, saya ingin menggunakan Pomodoro timer untuk fokus mengerjakan task, sehingga saya dapat meningkatkan produktivitas dan melacak waktu fokus saya.

#### Acceptance Criteria

1. THE App SHALL menampilkan Pomodoro timer di halaman Personal Tasks
2. THE Pomodoro_Session SHALL memiliki durasi 25 menit untuk sesi kerja
3. WHEN sesi kerja selesai, THE App SHALL otomatis memulai break timer selama 5 menit
4. THE App SHALL mengizinkan User mengaitkan timer dengan Personal_Task tertentu
5. WHEN timer dimulai, THE Timer_State SHALL berubah menjadi "running"
6. THE App SHALL menampilkan countdown timer yang update setiap detik
7. WHEN timer mencapai 00:00, THE App SHALL memutar notifikasi suara
8. THE App SHALL menyediakan tombol untuk start, pause, dan reset timer
9. WHEN Pomodoro_Session selesai, THE App SHALL menyimpan data sesi ke tabel focus_sessions
10. THE Focus_Session SHALL menyimpan: user_id, task_id (optional), start_time, end_time, duration, dan session_type (work/break)
11. THE App SHALL menampilkan statistik total focus time untuk User
12. WHILE timer berjalan dan User berpindah halaman, THE App SHALL tetap menjalankan timer di background

### Requirement 5: Daily Task Reset dan Queue Management

**User Story:** Sebagai User, saya ingin tugas yang belum selesai dipindahkan ke queue setiap hari, sehingga saya dapat memulai hari dengan daftar tugas yang bersih dan mengelola backlog dengan lebih baik.

#### Acceptance Criteria

1. THE App SHALL menjalankan Daily_Reset setiap hari pada pukul 00:00 waktu server
2. WHEN Daily_Reset berjalan, THE App SHALL menghapus semua Personal_Task dengan Task_Status "done"
3. WHEN Daily_Reset berjalan, THE App SHALL memindahkan Personal_Task dengan status "pending" atau "in_progress" ke tabel task_queue
4. THE App SHALL menghapus Personal_Task yang sudah dipindahkan ke queue dari tabel personal_tasks
5. THE App SHALL menampilkan dua kolom di halaman Personal Tasks: "Today's Tasks" dan "Queue"
6. THE App SHALL menampilkan tasks dari tabel personal_tasks di kolom "Today's Tasks"
7. THE App SHALL menampilkan tasks dari tabel task_queue di kolom "Queue"
8. WHEN User men-drag task dari Queue ke Today, THE App SHALL memindahkan task dari task_queue ke personal_tasks
9. THE App SHALL menyediakan tombol "Move to Today" untuk setiap task di Queue
10. WHEN User mengklik tombol "Move to Today", THE App SHALL memindahkan task tersebut ke personal_tasks
11. THE App SHALL menggunakan Vercel Cron atau Supabase Edge Function untuk implementasi Cron_Job
12. THE Daily_Reset SHALL berjalan untuk semua User secara bersamaan
13. IF Daily_Reset gagal untuk seorang User, THEN THE App SHALL mencatat error log tanpa menghentikan proses untuk User lain

### Requirement 6: Database Schema untuk Focus Sessions

**User Story:** Sebagai Developer, saya perlu schema database untuk menyimpan data Pomodoro sessions, sehingga aplikasi dapat melacak dan menampilkan statistik fokus User.

#### Acceptance Criteria

1. THE App SHALL memiliki tabel focus_sessions dengan kolom: id, user_id, task_id, start_time, end_time, duration, session_type, created_at
2. THE focus_sessions.user_id SHALL mereferensi users.id dengan foreign key constraint
3. THE focus_sessions.task_id SHALL mereferensi personal_tasks.id dengan foreign key constraint dan nullable
4. THE focus_sessions.session_type SHALL berupa enum atau string dengan nilai "work" atau "break"
5. THE focus_sessions.duration SHALL menyimpan durasi dalam satuan menit (integer)
6. THE App SHALL membuat index pada kolom user_id untuk query performa
7. THE App SHALL membuat index pada kolom created_at untuk query statistik berdasarkan tanggal

### Requirement 7: Database Schema untuk Task Queue

**User Story:** Sebagai Developer, saya perlu schema database untuk menyimpan tasks yang di-queue, sehingga sistem daily reset dapat berfungsi dengan baik.

#### Acceptance Criteria

1. THE App SHALL memiliki tabel task_queue dengan kolom: id, user_id, title, status, original_created_at, queued_at, order
2. THE task_queue.user_id SHALL mereferensi users.id dengan foreign key constraint
3. THE task_queue.status SHALL menyimpan status terakhir task sebelum di-queue
4. THE task_queue.original_created_at SHALL menyimpan timestamp pembuatan task asli
5. THE task_queue.queued_at SHALL menyimpan timestamp saat task dipindahkan ke queue
6. THE task_queue.order SHALL menyimpan urutan task dalam queue (integer)
7. THE App SHALL membuat index pada kolom user_id untuk query performa
8. THE App SHALL membuat index pada kolom queued_at untuk sorting

### Requirement 8: UI Theme Consistency

**User Story:** Sebagai User, saya ingin semua fitur baru mengikuti tema visual earthtone/mafia vintage yang sudah ada, sehingga aplikasi terlihat konsisten dan profesional.

#### Acceptance Criteria

1. THE App SHALL menggunakan warna background gelap kecoklatan (#2C1A0E, #3E2C1B) untuk semua fitur baru
2. THE App SHALL menggunakan warna teks krem (#F5E6D3) untuk konten utama
3. THE App SHALL menggunakan warna aksen emas (#C9A53B) untuk highlight dan interactive elements
4. THE App SHALL menggunakan font Playfair Display untuk judul dan heading
5. THE App SHALL menggunakan font Inter untuk body text
6. THE App SHALL menampilkan card dengan border tipis emas (1px solid dengan opacity)
7. THE App SHALL menggunakan ikon dari Heroicons atau Lucide dengan warna emas
8. THE App SHALL menggunakan border-radius 10-12px untuk card dan button
9. WHEN User hover pada interactive element, THE App SHALL menampilkan subtle transition effect
10. THE App SHALL menggunakan CSS variables yang sudah didefinisikan (--bg-main, --bg-card, --text-main, --accent, --border)

### Requirement 9: Pomodoro Timer Audio Notification

**User Story:** Sebagai User, saya ingin mendengar notifikasi suara saat timer selesai, sehingga saya tahu kapan harus beristirahat atau kembali bekerja tanpa harus terus memantau layar.

#### Acceptance Criteria

1. THE App SHALL menyediakan file audio untuk notifikasi timer
2. WHEN Pomodoro_Session selesai, THE App SHALL memutar audio notification
3. THE App SHALL menggunakan Web Audio API atau HTML5 Audio untuk memutar suara
4. THE audio notification SHALL berdurasi 2-5 detik
5. THE App SHALL meminta permission dari browser untuk memutar audio jika diperlukan
6. WHERE browser memblokir autoplay audio, THE App SHALL menampilkan visual notification sebagai fallback
7. THE App SHALL menyediakan opsi untuk mute/unmute notifikasi suara

### Requirement 10: Drag-and-Drop Visual Feedback

**User Story:** Sebagai User, saya ingin melihat feedback visual yang jelas saat melakukan drag-and-drop, sehingga saya tahu elemen mana yang sedang saya drag dan ke mana saya bisa drop.

#### Acceptance Criteria

1. WHILE User men-drag task atau nama anggota, THE App SHALL menampilkan ghost image atau preview element
2. WHILE drag operation aktif, THE App SHALL mengubah opacity elemen yang di-drag menjadi 0.5
3. WHEN Drag_Source di-hover di atas Drop_Target yang valid, THE App SHALL menampilkan highlight border atau background color
4. WHEN Drag_Source di-hover di atas Drop_Target yang tidak valid, THE App SHALL menampilkan visual indicator (misalnya cursor not-allowed)
5. THE App SHALL menampilkan smooth transition animation saat task berpindah posisi
6. WHEN drag operation selesai, THE App SHALL mengembalikan opacity elemen ke normal dengan transition
7. THE App SHALL menggunakan cursor grab saat hover pada draggable element
8. WHILE dragging, THE App SHALL mengubah cursor menjadi grabbing

