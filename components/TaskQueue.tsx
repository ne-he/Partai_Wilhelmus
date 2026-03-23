'use client';

import { motion, AnimatePresence } from 'framer-motion';

interface QueuedTask {
  id: string;
  user_id: string;
  title: string;
  status: 'pending' | 'in_progress' | 'done';
  original_created_at: string;
  queued_at: string;
  order: number;
}

interface TaskQueueProps {
  queuedTasks: QueuedTask[];
  onMoveToToday: (taskId: string) => void;
}

function daysAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return 'hari ini';
  if (diff === 1) return '1 hari lalu';
  return `${diff} hari lalu`;
}

export default function TaskQueue({ queuedTasks, onMoveToToday }: TaskQueueProps) {
  return (
    <div style={{
      marginTop: '2.5rem',
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: '14px',
      padding: '1.5rem',
      borderStyle: 'dashed',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <span style={{ fontSize: '1rem', opacity: 0.7 }}>📋</span>
        <div>
          <div style={{
            fontSize: '0.6rem',
            letterSpacing: '3px',
            color: 'var(--text-muted)',
            fontWeight: '600',
          }}>
            QUEUE
          </div>
          <div style={{
            fontSize: '0.95rem',
            color: 'var(--text-main)',
            fontFamily: "'Playfair Display', Georgia, serif",
          }}>
            Tugas dari Hari Sebelumnya
          </div>
        </div>
        {queuedTasks.length > 0 && (
          <span style={{
            marginLeft: 'auto',
            fontSize: '0.7rem',
            color: 'var(--accent)',
            background: 'rgba(201,165,59,0.1)',
            border: '1px solid rgba(201,165,59,0.2)',
            borderRadius: '20px',
            padding: '2px 10px',
          }}>
            {queuedTasks.length} item
          </span>
        )}
      </div>

      {/* Gold divider */}
      <div style={{
        height: '1px',
        background: 'linear-gradient(to right, rgba(201,165,59,0.4), transparent)',
        marginBottom: '1.25rem',
      }} />

      <AnimatePresence>
        {queuedTasks.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '2.5rem 0',
              gap: '0.75rem',
            }}
          >
            <div style={{ fontSize: '2rem', opacity: 0.2 }}>◻</div>
            <p style={{
              color: 'var(--text-muted)',
              fontSize: '0.8rem',
              fontStyle: 'italic',
              textAlign: 'center',
            }}>
              Queue kosong — semua tugas sudah diselesaikan
            </p>
          </motion.div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '0.75rem' }}>
            {queuedTasks.map((task, i) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.05 }}
                style={{
                  background: 'var(--bg-card2)',
                  border: '1px dashed var(--border)',
                  borderRadius: '10px',
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  opacity: 0.85,
                }}
              >
                <p style={{
                  color: 'var(--text-main)',
                  fontSize: '0.875rem',
                  lineHeight: 1.4,
                  flex: 1,
                }}>
                  {task.title}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{
                    fontSize: '0.65rem',
                    color: 'var(--text-muted)',
                    fontStyle: 'italic',
                  }}>
                    dari {daysAgo(task.queued_at)}
                  </span>
                  <button
                    onClick={() => onMoveToToday(task.id)}
                    style={{
                      padding: '4px 12px',
                      background: 'transparent',
                      border: '1px solid rgba(201,165,59,0.5)',
                      borderRadius: '6px',
                      color: 'var(--accent)',
                      fontSize: '0.7rem',
                      cursor: 'pointer',
                      letterSpacing: '0.5px',
                      fontWeight: '500',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => {
                      (e.target as HTMLButtonElement).style.background = 'rgba(201,165,59,0.15)';
                      (e.target as HTMLButtonElement).style.borderColor = 'var(--accent)';
                    }}
                    onMouseLeave={e => {
                      (e.target as HTMLButtonElement).style.background = 'transparent';
                      (e.target as HTMLButtonElement).style.borderColor = 'rgba(201,165,59,0.5)';
                    }}
                  >
                    → Hari Ini
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
