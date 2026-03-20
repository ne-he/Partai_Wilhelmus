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
