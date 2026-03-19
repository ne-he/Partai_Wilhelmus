'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';

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

const statusIcon = {
  pending: '○',
  in_progress: '◑',
  done: '●',
};

export default function DraggableTask({ task, onDelete, isOverlay }: DraggableTaskProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: { type: 'task', task },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <div
        {...listeners}
        style={{
          background: isDragging || isOverlay
            ? 'rgba(62,44,27,0.95)'
            : 'rgba(62,44,27,0.7)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: isDragging || isOverlay
            ? '1px solid rgba(201,165,59,0.8)'
            : '1px solid rgba(201,165,59,0.2)',
          borderRadius: '10px',
          padding: '0.75rem 1rem',
          cursor: isDragging ? 'grabbing' : 'grab',
          opacity: isDragging ? 0.4 : 1,
          boxShadow: isDragging || isOverlay
            ? '0 8px 32px rgba(201,165,59,0.25), 0 2px 8px rgba(0,0,0,0.4)'
            : '0 2px 8px rgba(0,0,0,0.2)',
          transform: isOverlay ? 'rotate(2deg) scale(1.03)' : undefined,
          transition: 'border-color 0.2s, box-shadow 0.2s',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          userSelect: 'none',
        }}
        className="group"
      >
        {/* Drag handle dots */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '3px',
          opacity: 0.3,
          flexShrink: 0,
        }}>
          {[0,1,2].map(i => (
            <div key={i} style={{ display: 'flex', gap: '3px' }}>
              <div style={{ width: '3px', height: '3px', borderRadius: '50%', background: 'var(--accent)' }} />
              <div style={{ width: '3px', height: '3px', borderRadius: '50%', background: 'var(--accent)' }} />
            </div>
          ))}
        </div>

        {/* Status icon */}
        <span style={{
          fontSize: '0.75rem',
          color: task.status === 'done' ? '#64b478' : task.status === 'in_progress' ? '#64a0c8' : 'var(--text-muted)',
          flexShrink: 0,
        }}>
          {statusIcon[task.status]}
        </span>

        {/* Title */}
        <p style={{
          color: task.status === 'done' ? 'var(--text-muted)' : 'var(--text-main)',
          textDecoration: task.status === 'done' ? 'line-through' : 'none',
          fontSize: '0.875rem',
          flex: 1,
          lineHeight: 1.4,
        }}>
          {task.title}
        </p>

        {/* Delete button */}
        {onDelete && (
          <button
            onPointerDown={e => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onDelete(task.id);
            }}
            title="Hapus tugas"
            style={{
              flexShrink: 0,
              width: '26px',
              height: '26px',
              borderRadius: '6px',
              border: '1px solid rgba(201,165,59,0.2)',
              background: 'transparent',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.7rem',
              letterSpacing: '0.5px',
              transition: 'all 0.2s',
              opacity: 0,
            }}
            className="delete-btn"
          >
            DEL
          </button>
        )}
      </div>

      <style jsx>{`
        .group:hover .delete-btn {
          opacity: 1 !important;
          border-color: rgba(220, 80, 80, 0.5) !important;
          color: #dc5050 !important;
        }
        .delete-btn:hover {
          background: rgba(220, 80, 80, 0.15) !important;
        }
      `}</style>
    </div>
  );
}
