Queue (cron job):

Tambah queued_at eksplisit saat insert ke task_queue — sebelumnya mengandalkan DEFAULT NOW() yang kadang bisa bermasalah
Tambah endpoint POST untuk manual trigger testing: POST /api/cron/daily-reset dengan header Authorization: Bearer <CRON_SECRET>
DraggableMember — mafia vintage:

Bentuk persegi (border-radius 4px) bukan pill, lebih berkarakter
Font Playfair Display untuk nama dan inisial
Warna per role: Papa = emas #c8a96e (BOSS ♦), Mama = coklat emas (CONSIGLIERE ♠), anak = abu emas (SOLDATO ♣)
Label role kecil di bawah nama dengan letter-spacing lebar
Avatar kotak dengan simbol kartu di sudut
Drop animation:

DroppableFamilyTask pakai motion.div dengan spring animation saat isOver — scale naik sedikit, border glow
Gold shimmer line muncul di atas card saat hover
Badge assigned user punya animasi masuk/keluar dengan AnimatePresence
DragOverlay punya dropAnimation dengan easing yang lebih smooth + drop-shadow glow


---

## v8 Changelog

### New Features
- **Task Comments** — add, edit, delete comments on family tasks with role-based access
- **Real-time updates** — comments sync live via Supabase Realtime (no refresh needed)
- **Emoji picker** — pick emoji reactions directly in the comment form
- **In-app toast notifications** — toast alerts for task assignments, comments, and completions
- **Browser push notifications** — Web Push API with VAPID key support via `send-push-notification` Edge Function
- **Daily deadline reminder** — cron-triggered Edge Function (`deadline-reminder`) sends push notifications H-1 before task deadlines

### Breaking Changes
- `family_tasks` table now requires a `deadline TIMESTAMPTZ` column — run `supabase-migrations-v8.sql` to apply the schema change before deploying v8
