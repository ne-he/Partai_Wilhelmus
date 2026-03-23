'use client';

import React from 'react';
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

const statusIcon: Record<string, string> = {
  pending: '○',
  in_progress: '◑',
  done: '●',
};

function DraggableTask({ task, onDelete, isOverlay }: DraggableTaskProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: 'task', task, status: task.status },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isActive = isDragging || isOverlay;

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <motion.div
        layout
        transition={{ duration: 0.2, type: 'spring' }}
        {...listeners}
        className="cyber-task-card"
        style={{
          background: isActive ? 'var(--bg-card2)' : 'var(--bg-card)',
          border: isActive
            ? '2px solid var(--accent)'
            : '1px solid var(--border)',
          borderRadius: '8px',
          padding: '0.7rem 0.9rem',
          cursor: isDragging ? 'grabbing' : 'grab',
          opacity: isDragging ? 0.35 : 1,
          boxShadow: isActive
            ? '0 12px 32px rgba(0,0,0,0.18), 0 0 0 3px var(--accent), 0 4px 12px rgba(0,0,0,0.12)'
            : '0 1px 4px rgba(0,0,0,0.06)',
          transform: isActive ? 'scale(1.03)' : undefined,
          display: 'flex',
          alignItems: 'center',
          gap: '0.7rem',
          userSelect: 'none',
          transition: 'all 0.15s ease',
        }}
      >
        {/* Drag handle */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', opacity: 0.3, flexShrink: 0 }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{ display: 'flex', gap: '3px' }}>
              <div style={{ width: '3px', height: '3px', borderRadius: '50%', background: 'var(--text-muted)' }} />
              <div style={{ width: '3px', height: '3px', borderRadius: '50%', background: 'var(--text-muted)' }} />
            </div>
          ))}
        </div>

        {/* Status icon */}
        <span style={{ fontSize: '0.75rem', color: 'var(--accent)', flexShrink: 0 }}>
          {statusIcon[task.status]}
        </span>

        {/* Title */}
        <p style={{
          color: task.status === 'done' ? 'var(--text-muted)' : 'var(--text-main)',
          textDecoration: task.status === 'done' ? 'line-through' : 'none',
          fontSize: '0.875rem',
          flex: 1,
          lineHeight: 1.4,
          margin: 0,
        }}>
          {task.title}
        </p>

        {/* Delete */}
        {onDelete && (
          <button
            onPointerDown={e => e.stopPropagation()}
            onClick={e => { e.stopPropagation(); onDelete(task.id); }}
            title="Hapus"
            aria-label={`Hapus tugas: ${task.title}`}
            className="cyber-del-btn"
            style={{
              flexShrink: 0,
              padding: '2px 8px',
              borderRadius: '4px',
              border: '1px solid rgba(220,60,60,0.25)',
              background: 'transparent',
              color: 'rgba(220,60,60,0.5)',
              cursor: 'pointer',
              fontSize: '0.6rem',
              letterSpacing: '1px',
              transition: 'all 0.2s',
              opacity: 0,
            }}
          >
            [DEL]
          </button>
        )}
      </motion.div>

      <style jsx>{`
        .cyber-task-card:hover {
          border-color: var(--accent) !important;
          background: var(--bg-card2) !important;
          box-shadow: 0 2px 12px rgba(0,0,0,0.1) !important;
        }
        .cyber-task-card:hover .cyber-del-btn {
          opacity: 1 !important;
        }
        .cyber-del-btn:hover {
          border-color: rgba(220,60,60,0.6) !important;
          color: #dc3c3c !important;
          background: rgba(220,60,60,0.1) !important;
        }
      `}</style>
    </div>
  );
}

export default React.memo(DraggableTask);
