import type { Comment, FamilyTask, User } from '../../Lib/types';

/**
 * Data contoh untuk mode spectate (/spectate).
 * Semuanya fiktif dan hanya hidup di memori browser. Tidak ada yang dibaca dari
 * atau dikirim ke Supabase.
 */

export interface PersonalTask {
  id: string;
  user_id: string;
  title: string;
  status: 'pending' | 'in_progress' | 'done';
  order: number;
  created_at: string;
  updated_at: string;
}

export interface QueuedTask {
  id: string;
  user_id: string;
  title: string;
  status: 'pending' | 'in_progress' | 'done';
  original_created_at: string;
  queued_at: string;
  order: number;
}

const NOW = Date.now();
const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

function ago(ms: number) {
  return new Date(NOW - ms).toISOString();
}

function ahead(ms: number) {
  return new Date(NOW + ms).toISOString();
}

// Pengunjung mode spectate. Komentar yang dia tulis bisa dia edit/hapus sendiri.
export const VIEWER: User = { id: 'tamu', username: 'Tamu', role: 'tamu' };

export const SAMPLE_USERS: User[] = [
  { id: 'ayah', username: 'Ayah', role: 'papa' },
  { id: 'ibu', username: 'Ibu', role: 'mama' },
  { id: 'kakak', username: 'Kakak', role: 'kakak' },
  { id: 'adik', username: 'Adik', role: 'adik' },
];

export const DEFAULT_OWNER_ID = 'kakak';

const PERSONAL_ROWS: Record<string, [string, PersonalTask['status']][]> = {
  ayah: [
    ['Servis motor ke bengkel', 'pending'],
    ['Ganti lampu teras', 'in_progress'],
    ['Bayar tagihan air', 'done'],
    ['Cek tekanan ban mobil', 'pending'],
  ],
  ibu: [
    ['Transfer uang arisan', 'pending'],
    ['Masak rendang buat hari Minggu', 'in_progress'],
    ['Belanja sayur di pasar', 'done'],
    ['Jahit kancing seragam Adik', 'done'],
  ],
  kakak: [
    ['Jemput Adik les renang', 'pending'],
    ['Balikin buku ke perpustakaan', 'pending'],
    ['Kerjain laporan praktikum', 'in_progress'],
    ['Beli token listrik', 'done'],
    ['Olahraga pagi 30 menit', 'done'],
  ],
  adik: [
    ['Rapikan mainan di ruang tengah', 'pending'],
    ['PR matematika halaman 42', 'in_progress'],
    ['Latihan piano', 'done'],
  ],
};

export const SAMPLE_PERSONAL_TASKS: PersonalTask[] = Object.entries(PERSONAL_ROWS).flatMap(
  ([userId, rows]) =>
    rows.map(([title, status], i) => ({
      id: `p-${userId}-${i}`,
      user_id: userId,
      title,
      status,
      order: i,
      created_at: ago(8 * HOUR),
      updated_at: ago(2 * HOUR),
    }))
);

// Offset dipilih jauh dari batas hari supaya label "x hari lalu" stabil.
export const SAMPLE_QUEUE: QueuedTask[] = [
  { id: 'q-ayah-0', user_id: 'ayah', title: 'Telepon tukang AC', status: 'pending', original_created_at: ago(2 * DAY + 3 * HOUR), queued_at: ago(DAY + 5 * HOUR), order: 0 },
  { id: 'q-ibu-0', user_id: 'ibu', title: 'Cuci gorden kamar depan', status: 'pending', original_created_at: ago(3 * DAY + 3 * HOUR), queued_at: ago(2 * DAY + 5 * HOUR), order: 0 },
  { id: 'q-kakak-0', user_id: 'kakak', title: 'Cuci sepatu putih', status: 'pending', original_created_at: ago(2 * DAY + 3 * HOUR), queued_at: ago(DAY + 5 * HOUR), order: 0 },
  { id: 'q-kakak-1', user_id: 'kakak', title: 'Beresin meja belajar', status: 'in_progress', original_created_at: ago(3 * DAY + 3 * HOUR), queued_at: ago(2 * DAY + 5 * HOUR), order: 1 },
  { id: 'q-adik-0', user_id: 'adik', title: 'Sampul buku tulis baru', status: 'pending', original_created_at: ago(2 * DAY + 3 * HOUR), queued_at: ago(DAY + 5 * HOUR), order: 0 },
];

export const SAMPLE_FAMILY_TASKS: FamilyTask[] = [
  { id: 'f-1', title: 'Belanja bulanan', status: 'in_progress', created_by: 'ayah', assigned_to: 'ibu', created_at: ago(DAY + 2 * HOUR), deadline: ahead(2 * DAY) },
  { id: 'f-2', title: 'Bersih kamar mandi', status: 'pending', created_by: 'ibu', assigned_to: 'kakak', created_at: ago(DAY + 4 * HOUR), deadline: ahead(DAY + 6 * HOUR) },
  { id: 'f-3', title: 'Cuci mobil', status: 'pending', created_by: 'ayah', assigned_to: null, created_at: ago(6 * HOUR) },
  { id: 'f-4', title: 'Bayar iuran RT', status: 'in_progress', created_by: 'ibu', assigned_to: 'ayah', created_at: ago(2 * DAY + 3 * HOUR) },
  { id: 'f-5', title: 'Siram tanaman', status: 'pending', created_by: 'ibu', assigned_to: null, created_at: ago(3 * HOUR) },
  { id: 'f-6', title: 'Sapu halaman', status: 'done', created_by: 'ayah', assigned_to: 'adik', created_at: ago(DAY + 8 * HOUR) },
];

function comment(id: string, taskId: string, userId: string, content: string, when: number): Comment {
  const user = SAMPLE_USERS.find(u => u.id === userId);
  return {
    id,
    task_id: taskId,
    user_id: userId,
    content,
    created_at: ago(when),
    updated_at: ago(when),
    username: user?.username,
    role: user?.role,
  };
}

export const SAMPLE_COMMENTS: Record<string, Comment[]> = {
  'f-1': [
    comment('c-1', 'f-1', 'ayah', 'Jangan lupa beras 10 kg sama minyak goreng ya.', 3 * HOUR),
    comment('c-2', 'f-1', 'ibu', 'Siap, sekalian beli sabun cuci.', 2 * HOUR),
    comment('c-3', 'f-1', 'kakak', 'Titip susu kotak buat bekal Adik 🙏', 40 * MINUTE),
  ],
  'f-2': [
    comment('c-4', 'f-2', 'ibu', 'Kak, lantainya disikat juga ya, udah licin.', DAY + 2 * HOUR),
    comment('c-5', 'f-2', 'kakak', 'Oke Bu, abis pulang kuliah.', 20 * HOUR),
  ],
  'f-4': [
    comment('c-6', 'f-4', 'ayah', 'Nanti sore Ayah antar ke rumah Pak RT.', 5 * HOUR),
  ],
  'f-6': [
    comment('c-7', 'f-6', 'adik', 'Udah selesai! Daunnya banyak banget.', 5 * HOUR),
    comment('c-8', 'f-6', 'ayah', 'Mantap, makasih Dik ✦', 4 * HOUR),
  ],
};
