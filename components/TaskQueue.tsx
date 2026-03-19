'use client';

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

export default function TaskQueue({ queuedTasks, onMoveToToday }: TaskQueueProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
    });
  };

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        padding: '1.5rem',
        marginTop: '2rem',
      }}
    >
      <div
        style={{
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
          letterSpacing: '2px',
          marginBottom: '1rem',
          fontWeight: 'bold',
        }}
      >
        📋 QUEUE (Tasks from previous days)
      </div>

      {queuedTasks.length === 0 ? (
        <div
          style={{
            color: 'var(--text-muted)',
            fontSize: '0.85rem',
            textAlign: 'center',
            padding: '2rem 0',
            fontStyle: 'italic',
          }}
        >
          No queued tasks
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
          {queuedTasks.map(task => (
            <div
              key={task.id}
              style={{
                background: 'var(--bg-main)',
                border: '1px solid var(--border)',
                borderRadius: '10px',
                padding: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
              }}
            >
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    color: 'var(--text-main)',
                    fontSize: '0.9rem',
                    marginBottom: '0.3rem',
                  }}
                >
                  {task.title}
                </div>
                <div
                  style={{
                    fontSize: '0.7rem',
                    color: 'var(--text-muted)',
                  }}
                >
                  Queued: {formatDate(task.queued_at)}
                </div>
              </div>

              <button
                onClick={() => onMoveToToday(task.id)}
                style={{
                  padding: '0.5rem 1rem',
                  background: 'var(--accent)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#1a1612',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  whiteSpace: 'nowrap',
                }}
              >
                → Move to Today
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
