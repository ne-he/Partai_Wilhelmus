'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface PersonalTask {
  id: string;
  user_id: string;
  title: string;
  status: 'pending' | 'in_progress' | 'done';
  order: number;
  created_at: string;
  updated_at: string;
}

interface DraggableTaskProps {
  task: PersonalTask;
  onDelete?: (taskId: string) => void;
  isOverlay?: boolean;
}

const statusIcon: Record<string, string> = {
  pending: '○',
  in_progress: '◑',
  done: '●',
};

const statusColor: Record<string, string> = {
  pending: '#c8a96e',
  in_progress: '#00ffff',
  done: '#00ff9d',
};

export default function DraggableTask({ task, onDelete, isOverlay }: DraggableTaskProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: 'task', task },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const color = statusColor[task.status] || '#c8a96e';

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <div
        {...listeners}
        className="cyber-task-card"
        style={{
          background: isDragging || isOverlay ? 'rgba(0,30,30,0.95)' : 'rgba(0,20,20,0.75)',
          backdropFilter: 'blur(12px)',
          border: isDragging || isOverlay
            ? `1px solid ${color}`
            : '1px solid rgba(0,255,157,0.12)',
          borderRadius: '8px',
          padding: '0.7rem 0.9rem',
          cursor: isDragging ? 'grabbing' : 'grab',
          opacity: isDragging ? 0.4 : 1,
          boxShadow: isDragging || isOverlay
            ? `0 8px 24px rgba(0,255,157,0.2)`
            : '0 2px 8px rgba(0,0,0,0.3)',
          transform: isOverlay ? 'rotate(1.5deg) scale(1.03)' : undefined,
          display: 'flex',
          alignItems: 'center',
          gap: '0.7rem',
          userSelect: 'none',
          transition: 'border-color 0.2s, box-shadow 0.2s',
        }}
      >
        {/* Drag handle */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', opacity: 0.25, flexShrink: 0 }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{ display: 'flex', gap: '3px' }}>
              <div style={{ width: '3px', height: '3px', borderRadius: '50%', background: '#00ff9d' }} />
              <div style={{ width: '3px', height: '3px', borderRadius: '50%', background: '#00ff9d' }} />
            </div>
          ))}
        </div>

        {/* Status icon */}
        <span style={{ fontSize: '0.75rem', color, flexShrink: 0, textShadow: `0 0 4px ${color}` }}>
          {statusIcon[task.status]}
        </span>

        {/* Title */}
        <p style={{
          color: task.status === 'done' ? '#6b7b7b' : '#e0f2fe',
          textDecoration: task.status === 'done' ? 'line-through' : 'none',
          fontSize: '0.875rem',
          fontFamily: 'monospace',
          flex: 1,
          lineHeight: 1.4,
        }}>
          {task.title}
        </p>

        {/* Delete */}
        {onDelete && (
          <button
            onPointerDown={e => e.stopPropagation()}
            onClick={e => { e.stopPropagation(); onDelete(task.id); }}
            title="Hapus"
            className="cyber-del-btn"
            style={{
              flexShrink: 0,
              padding: '2px 8px',
              borderRadius: '4px',
              border: '1px solid rgba(255,59,59,0.2)',
              background: 'transparent',
              color: 'rgba(255,59,59,0.4)',
              cursor: 'pointer',
              fontSize: '0.6rem',
              fontFamily: 'monospace',
              letterSpacing: '1px',
              transition: 'all 0.2s',
              opacity: 0,
            }}
          >
            [DEL]
          </button>
        )}
      </div>

      <style jsx>{`
        .cyber-task-card:hover {
          border-color: rgba(0,255,157,0.35) !important;
          box-shadow: 0 0 12px rgba(0,255,157,0.1) !important;
        }
        .cyber-task-card:hover .cyber-del-btn {
          opacity: 1 !important;
        }
        .cyber-del-btn:hover {
          border-color: rgba(255,59,59,0.6) !important;
          color: #ff3b3b !important;
          background: rgba(255,59,59,0.1) !important;
        }
      `}</style>
    </div>
  );
}
