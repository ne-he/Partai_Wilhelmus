# Design Document — v8: Family Comments & Notifications

## Overview

Fitur v8 menambahkan dua kapabilitas utama ke aplikasi "Partai Wilhelmus":

1. **Thread komentar per task** — setiap family task memiliki ruang diskusi real-time yang dapat diakses via `TaskDetailModal`. Komentar muncul secara instan menggunakan Supabase Realtime, dengan dukungan emoji picker, edit/hapus berbasis role, dan pagination.

2. **Sistem notifikasi berlapis** — in-app toast via Supabase Realtime channel, dan push notification browser via Web Push API + VAPID + Supabase Edge Function. Notifikasi dikirim untuk event: task baru, assignment, komentar baru, dan deadline H-1.

Stack yang digunakan: Next.js 16 App Router, React 19, TypeScript, Supabase (PostgreSQL + RLS + Realtime + Edge Functions), Framer Motion, `fast-check` (sudah ada di devDependencies) untuk property-based testing.

---

## Architecture

### Diagram Alur Data

```mermaid
graph TD
    subgraph Client
        FP[family/page.tsx]
        TDM[TaskDetailModal]
        CS[CommentSection]
        CL[CommentList]
        CF[CommentForm]
        CI[CommentItem]
        URC[useRealtimeComments hook]
        UN[useNotifications hook]
        SW[public/sw.js - ServiceWorker]
        SP[/settings/page.tsx]
    end

    subgraph Supabase
        DB[(PostgreSQL)]
        RT[Realtime]
        EF[Edge Function: send-push-notification]
        EFD[Edge Function: deadline-reminder]
    end

    subgraph Browser
        PA[Push API]
        NA[Notification API]
    end

    FP -->|klik task| TDM
    TDM --> CS
    CS --> CL
    CS --> CF
    CL --> CI
    CF -->|INSERT| DB
    CI -->|UPDATE/DELETE| DB
    DB -->|trigger| EF
    EF -->|web-push| PA
    PA -->|push event| SW
    SW -->|showNotification| NA
    URC -->|subscribe| RT
    RT -->|INSERT/UPDATE/DELETE events| URC
    URC --> CL
    UN -->|subscribe family/user channels| RT
    RT -->|family events| UN
    UN -->|showToast| FP
    SP -->|subscribe + store endpoint| DB
    EFD -->|query deadline tasks| DB
    EFD -->|call| EF
```

### Prinsip Arsitektur

- **Separation of concerns**: logika Realtime di hooks (`useRealtimeComments`, `useNotifications`), UI di komponen, data di Supabase.
- **Minimal re-fetch**: komentar baru dari Realtime langsung di-append ke state lokal tanpa refetch seluruh list.
- **Graceful degradation**: push notification opsional; in-app toast tetap berfungsi tanpa service worker.
- **Role-based rendering**: komponen memeriksa role dari `profile` yang sudah di-fetch di `family/page.tsx`.

---

## Components and Interfaces

### 1. TaskDetailModal

**Path**: `components/TaskDetailModal.tsx`

```typescript
interface TaskDetailModalProps {
  task: FamilyTask | null;       // null = modal tertutup
  users: User[];                  // untuk resolve assignee name
  profile: User;                  // user yang sedang login
  onClose: () => void;
}
```

Bertanggung jawab untuk:
- Render overlay backdrop dengan `AnimatePresence` (scale 0.9→1.0, opacity 0→1)
- Menampilkan info task: judul, status badge, assignee alias, tanggal dibuat
- Merender `<CommentSection>` di bawah info task
- Mengunci scroll body saat terbuka (`document.body.style.overflow = 'hidden'`)
- Layout responsif: modal centered di desktop, full-screen bottom sheet di mobile (`isMobile` dari `useBreakpoint`)

### 2. CommentSection

**Path**: `components/CommentSection.tsx`

```typescript
interface CommentSectionProps {
  taskId: string;
  profile: User;
}
```

Orchestrator untuk `CommentList` + `CommentForm`. Menginisialisasi `useRealtimeComments` dan meneruskan state ke child components.

### 3. CommentList

**Path**: `components/CommentList.tsx`

```typescript
interface CommentListProps {
  comments: Comment[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  onLoadMore: () => void;
  loadingMore: boolean;
  profile: User;
  onEdit: (id: string, content: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}
```

Merender daftar `CommentItem`, skeleton saat loading, pesan kosong, tombol "Muat lebih banyak".

### 4. CommentItem

**Path**: `components/CommentItem.tsx`

```typescript
interface CommentItemProps {
  comment: Comment;
  profile: User;
  onEdit: (id: string, content: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}
```

Merender satu komentar. Menampilkan three-dots menu (⋯) hanya jika user berhak edit/hapus. Inline edit mode dengan textarea pre-filled.

### 5. CommentForm

**Path**: `components/CommentForm.tsx`

```typescript
interface CommentFormProps {
  taskId: string;
  userId: string;
  onSubmit: (content: string) => Promise<void>;
}
```

Textarea + tombol emoji (menggunakan `emoji-picker-react`) + tombol Kirim. Mendukung Ctrl+Enter / Cmd+Enter.

### 6. useRealtimeComments

**Path**: `Lib/hooks/useRealtimeComments.ts`

```typescript
interface UseRealtimeCommentsReturn {
  comments: Comment[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  loadingMore: boolean;
  addComment: (content: string) => Promise<void>;
  editComment: (id: string, content: string) => Promise<void>;
  deleteComment: (id: string) => Promise<void>;
}

function useRealtimeComments(
  taskId: string,
  showToast: (msg: string, type: ToastItem['type']) => void
): UseRealtimeCommentsReturn
```

- Fetch awal 10 komentar (ascending `created_at`)
- Subscribe ke channel `comments:task_id=eq.{taskId}`
- Handle INSERT → append ke state, UPDATE → update in-place, DELETE → remove dengan animasi
- Unsubscribe saat unmount

### 7. useNotifications

**Path**: `Lib/hooks/useNotifications.ts`

```typescript
function useNotifications(
  userId: string,
  showToast: (msg: string, type: ToastItem['type']) => void
): void
```

- Subscribe ke channel `family-events` (broadcast) dan `user-{userId}` (private)
- Handle event: `new_task`, `new_comment`, `assignment`, `deadline_warning`
- Unsubscribe saat unmount

### 8. Settings Page

**Path**: `app/settings/page.tsx`

Halaman baru dengan toggle "Aktifkan Notifikasi Browser". Mengelola:
- `Notification.requestPermission()`
- Service Worker registration
- Push subscription creation dengan VAPID public key
- Simpan/hapus endpoint ke tabel `push_subscriptions`

---

## Data Models

### Tabel: task_comments

```sql
CREATE TABLE task_comments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id     UUID NOT NULL REFERENCES family_tasks(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id),
  content     TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;

-- SELECT: semua authenticated user bisa baca (family app, semua task visible)
CREATE POLICY "Authenticated can read comments"
  ON task_comments FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- INSERT: hanya bisa insert dengan user_id = auth.uid()
CREATE POLICY "Users can insert own comments"
  ON task_comments FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- UPDATE: SOLDATO hanya milik sendiri; BOSS/CONSIGLIERE semua
CREATE POLICY "Users can update comments"
  ON task_comments FOR UPDATE
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('papa', 'mama')
    )
  );

-- DELETE: SOLDATO hanya milik sendiri; BOSS/CONSIGLIERE semua
CREATE POLICY "Users can delete comments"
  ON task_comments FOR DELETE
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('papa', 'mama')
    )
  );

-- Index untuk performa query per task
CREATE INDEX idx_task_comments_task_id ON task_comments(task_id, created_at);
```

### Tabel: push_subscriptions

```sql
CREATE TABLE push_subscriptions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  endpoint    TEXT NOT NULL UNIQUE,
  keys        JSONB NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own subscriptions"
  ON push_subscriptions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own subscriptions"
  ON push_subscriptions FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own subscriptions"
  ON push_subscriptions FOR DELETE
  USING (user_id = auth.uid());
```

### Kolom deadline pada family_tasks

```sql
ALTER TABLE family_tasks
  ADD COLUMN IF NOT EXISTS deadline TIMESTAMPTZ;
```

### TypeScript Types

```typescript
// Lib/types.ts (baru)
export interface Comment {
  id: string;
  task_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  // joined dari users
  username?: string;
  role?: string;
}

export interface PushSubscriptionRecord {
  id: string;
  user_id: string;
  endpoint: string;
  keys: { p256dh: string; auth: string };
  created_at: string;
}

export interface FamilyTask {
  id: string;
  title: string;
  status: 'pending' | 'in_progress' | 'done';
  created_by: string;
  assigned_to: string | null;
  created_at: string;
  deadline?: string | null;
}
```

### Supabase Edge Function: send-push-notification

**Path**: `supabase/functions/send-push-notification/index.ts`

```typescript
// Payload yang diterima
interface PushPayload {
  user_id: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

// Response
interface PushResponse {
  sent: number;
  failed: number;
}
```

Alur:
1. Validasi `Authorization: Bearer {SERVICE_ROLE_KEY}`
2. Query `push_subscriptions` WHERE `user_id = payload.user_id`
3. Untuk setiap endpoint, kirim via `web-push` dengan VAPID credentials
4. Jika endpoint return HTTP 410, hapus dari tabel
5. Return `{ sent, failed }`

### Supabase Edge Function: deadline-reminder

**Path**: `supabase/functions/deadline-reminder/index.ts`

Dijadwalkan via `vercel.json` cron atau Supabase cron (00:00 UTC = 07:00 WIB):

```typescript
// Query tasks dengan deadline H-1
const { data: tasks } = await supabase
  .from('family_tasks')
  .select('*, users!assigned_to(username, role)')
  .neq('status', 'done')
  .gte('deadline', new Date(now + 20 * 3600 * 1000).toISOString())
  .lte('deadline', new Date(now + 28 * 3600 * 1000).toISOString());
```

### Database Triggers

```sql
-- Fungsi helper untuk memanggil Edge Function
CREATE OR REPLACE FUNCTION call_push_notification(payload JSONB)
RETURNS void AS $$
BEGIN
  PERFORM net.http_post(
    url := current_setting('app.edge_function_url') || '/send-push-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.service_role_key')
    ),
    body := payload::text
  );
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Push notification failed: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: task baru
CREATE OR REPLACE FUNCTION notify_on_family_task_insert()
RETURNS TRIGGER AS $$
DECLARE
  recipient RECORD;
BEGIN
  FOR recipient IN
    SELECT id FROM users WHERE id != NEW.created_by
  LOOP
    PERFORM call_push_notification(jsonb_build_object(
      'user_id', recipient.id,
      'title', 'Tugas Baru',
      'body', NEW.title,
      'data', jsonb_build_object('task_id', NEW.id, 'url', '/family')
    ));
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_family_task_insert
  AFTER INSERT ON family_tasks
  FOR EACH ROW EXECUTE FUNCTION notify_on_family_task_insert();

-- Trigger: komentar baru
CREATE OR REPLACE FUNCTION notify_on_comment_insert()
RETURNS TRIGGER AS $$
DECLARE
  task_record RECORD;
  recipient RECORD;
BEGIN
  SELECT * INTO task_record FROM family_tasks WHERE id = NEW.task_id;

  FOR recipient IN
    SELECT DISTINCT u.id FROM users u
    WHERE u.id != NEW.user_id
      AND (
        u.id = task_record.assigned_to
        OR u.role IN ('papa', 'mama')
      )
  LOOP
    PERFORM call_push_notification(jsonb_build_object(
      'user_id', recipient.id,
      'title', 'Komentar Baru',
      'body', LEFT(NEW.content, 50),
      'data', jsonb_build_object('task_id', NEW.task_id, 'url', '/family')
    ));
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_comment_insert
  AFTER INSERT ON task_comments
  FOR EACH ROW EXECUTE FUNCTION notify_on_comment_insert();

-- Trigger: assignment
CREATE OR REPLACE FUNCTION notify_on_assignment()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.assigned_to IS NOT NULL AND NEW.assigned_to IS DISTINCT FROM OLD.assigned_to THEN
    PERFORM call_push_notification(jsonb_build_object(
      'user_id', NEW.assigned_to,
      'title', 'Kamu Ditugaskan',
      'body', NEW.title,
      'data', jsonb_build_object('task_id', NEW.id, 'url', '/family')
    ));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_task_assignment
  AFTER UPDATE OF assigned_to ON family_tasks
  FOR EACH ROW EXECUTE FUNCTION notify_on_assignment();
```

### Service Worker: public/sw.js

```javascript
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {};
  event.waitUntil(
    self.registration.showNotification(data.title ?? 'Partai Wilhelmus', {
      body: data.body ?? '',
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      data: data.data ?? {},
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? '/family';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(url) && 'focus' in client) return client.focus();
      }
      return clients.openWindow(url);
    })
  );
});
```

### VAPID Setup

Environment variables yang diperlukan:

```env
# .env.local
NEXT_PUBLIC_VAPID_PUBLIC_KEY=<generated_public_key>
VAPID_PRIVATE_KEY=<generated_private_key>        # hanya di server/Edge Function
VAPID_SUBJECT=mailto:admin@partaiwilhelmus.app
```

Generate VAPID keys:
```bash
npx web-push generate-vapid-keys
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Comment Insert Round-Trip

*For any* valid comment (non-empty content, valid task_id, valid user_id), inserting it into `task_comments` and then querying by `id` should return a record with identical `content`, `user_id`, and `task_id`.

**Validates: Requirements 17.1, 6.4**

---

### Property 2: updated_at Invariant

*For any* comment that has been updated, the `updated_at` timestamp SHALL always be greater than or equal to `created_at`.

**Validates: Requirements 17.2**

---

### Property 3: Cascade Delete — No Orphan Comments

*For any* family task that has associated comments, deleting the task SHALL result in zero comments remaining with that `task_id` (ON DELETE CASCADE invariant).

**Validates: Requirements 17.3, 1.2**

---

### Property 4: RLS — SOLDATO Can Only Modify Own Comments

*For any* SOLDATO user and *any* comment not authored by that user, attempting UPDATE or DELETE on that comment SHALL be rejected by RLS. Conversely, UPDATE or DELETE on their own comment SHALL succeed.

**Validates: Requirements 1.7, 1.9**

---

### Property 5: RLS — BOSS/CONSIGLIERE Can Modify All Comments

*For any* user with role `papa` or `mama`, and *any* comment regardless of authorship, UPDATE and DELETE operations SHALL succeed (subject to valid content).

**Validates: Requirements 1.8, 1.10**

---

### Property 6: RLS — INSERT Requires Matching user_id

*For any* authenticated user, attempting to INSERT a comment with a `user_id` different from `auth.uid()` SHALL be rejected. Inserting with `user_id = auth.uid()` SHALL succeed.

**Validates: Requirements 1.6**

---

### Property 7: Pagination — First Load Returns At Most 10 Comments

*For any* task with N comments (N ≥ 0), the initial load from `useRealtimeComments` SHALL return `min(N, 10)` comments. If N > 10, `hasMore` SHALL be `true`.

**Validates: Requirements 5.1, 5.3**

---

### Property 8: Comment Rendering Contains Required Fields

*For any* comment object with valid `username`, `role`, `content`, `created_at`, the rendered `CommentItem` output SHALL contain the alias name (from DISPLAY_NAME_MAP), a relative timestamp string, and the comment content.

**Validates: Requirements 5.2, 5.7, 4.2**

---

### Property 9: Empty Input Rejection

*For any* string composed entirely of whitespace (including empty string), submitting it via `CommentForm` SHALL NOT trigger an INSERT and the submit button SHALL remain disabled.

**Validates: Requirements 6.8**

---

### Property 10: Realtime State Consistency

*For any* sequence of INSERT, UPDATE, DELETE events received via Supabase Realtime on a given `task_id`, the local `comments` state in `useRealtimeComments` SHALL reflect the final expected state: inserted comments present, updated comments with new content, deleted comments absent.

**Validates: Requirements 8.2, 8.3, 8.4, 17.5**

---

### Property 11: Push Subscription Round-Trip

*For any* user who grants notification permission, the push subscription endpoint stored in `push_subscriptions` SHALL be retrievable by querying with that user's `user_id`, and the stored `keys` SHALL match the original `PushSubscription.toJSON()` output.

**Validates: Requirements 10.4, 2.1**

---

### Property 12: Error Preservation — Textarea Content on Failed Submit

*For any* comment submission that fails (network error or DB error), the `CommentForm` textarea SHALL retain the original input text so the user does not lose their draft.

**Validates: Requirements 16.4**

---

### Property 13: Deadline Query Window

*For any* execution of `DeadlineReminderJob`, the tasks returned SHALL have `deadline` values strictly within the window [now + 20h, now + 28h], and tasks with `status = 'done'` SHALL be excluded.

**Validates: Requirements 14.2**

---

## Error Handling

| Scenario | Handling |
|---|---|
| Supabase fetch gagal (komentar) | Tampilkan pesan error + tombol "Coba Lagi"; state komentar tidak berubah |
| INSERT komentar gagal | Toast error; textarea dipertahankan (tidak dikosongkan) |
| UPDATE komentar gagal | Toast error; inline edit tetap terbuka |
| DELETE komentar gagal | Toast error; komentar tetap tampil di list |
| Realtime disconnect | Supabase client auto-reconnect; tidak perlu handling manual |
| Push endpoint 410 Gone | Edge Function hapus endpoint dari `push_subscriptions` |
| `Notification.requestPermission()` denied | Tampilkan pesan informatif; toggle dinonaktifkan |
| Browser tidak support Push API | Toggle dinonaktifkan dengan pesan; in-app toast tetap berfungsi |
| Edge Function tidak tersedia saat trigger | `RAISE WARNING` di PostgreSQL; transaksi utama tidak gagal |
| TaskDetailModal ditutup saat async berjalan | Gunakan `AbortController` atau flag `isMounted` untuk cancel operasi |

---

## Testing Strategy

### Dual Testing Approach

Fitur ini menggunakan dua lapisan testing yang saling melengkapi:

**Unit Tests** (spesifik, deterministik):
- Verifikasi rendering komponen dengan data tertentu
- Edge cases: komentar kosong, modal di mobile, browser tanpa Push API
- Integration points: `useRealtimeComments` dengan mock Supabase client
- Error conditions: network failure, RLS rejection

**Property-Based Tests** (universal, randomized):
- Menggunakan `fast-check` (sudah ada di `devDependencies`)
- Minimum 100 iterasi per property
- Setiap test di-tag dengan referensi ke property di dokumen ini

### Property-Based Test Configuration

```typescript
// Contoh konfigurasi fast-check
import fc from 'fast-check';

// Tag format: Feature: family-comments-notifications, Property N: <text>
// Feature: family-comments-notifications, Property 1: Comment Insert Round-Trip
test('comment insert round-trip', async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.record({
        content: fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
        task_id: fc.uuid(),
        user_id: fc.uuid(),
      }),
      async ({ content, task_id, user_id }) => {
        // insert → query → compare
        const inserted = await insertComment({ content, task_id, user_id });
        const fetched = await getComment(inserted.id);
        return fetched.content === content
          && fetched.task_id === task_id
          && fetched.user_id === user_id;
      }
    ),
    { numRuns: 100 }
  );
});
```

### Unit Test Coverage Targets

| Komponen/Hook | Test Cases |
|---|---|
| `CommentForm` | render, submit valid, submit empty (disabled), Ctrl+Enter, emoji insert, loading state |
| `CommentItem` | render dengan role berbeda, show/hide three-dots, inline edit mode, confirm delete |
| `CommentList` | render empty state, render with comments, skeleton loading, error state, load more |
| `TaskDetailModal` | open/close animation, scroll lock, mobile layout, backdrop click |
| `useRealtimeComments` | initial fetch, realtime INSERT/UPDATE/DELETE, unsubscribe on unmount |
| `useNotifications` | subscribe/unsubscribe, toast on events |
| `send-push-notification` | valid payload, 410 cleanup, missing endpoint |
| `deadline-reminder` | query window correctness, skip done tasks |

### Property Test Coverage

Setiap property di bagian "Correctness Properties" diimplementasikan oleh **satu** property-based test menggunakan `fast-check`. Test file: `__tests__/properties/family-comments-notifications.test.ts`.

Tag format yang digunakan di setiap test:
```
// Feature: family-comments-notifications, Property {N}: {property_title}
```
