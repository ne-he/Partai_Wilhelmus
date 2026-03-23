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

const statusColor: Record<string, string> = {
  pending: '#c8a96e',
  in_progress: '#00ffff',
  done: '#00ff9d',
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

  const color = statusColor[task.status] || '#c8a96e';

  const isActive = isDragging || isOverlay;

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <motion.div
        layout
        transition={{ duration: 0.2, type: 'spring' }}
        {...listeners}
        className="cyber-task-card"
        style={{
          background: isActive ? 'rgba(0,30,30,0.95)' : 'rgba(0,20,20,0.75)',
          backdropFilter: 'blur(12px)',
          border: isActive
            ? `1px solid ${color}`
            : '1px solid rgba(0,255,157,0.12)',
          borderRadius: '8px',
          padding: '0.7rem 0.9rem',
          cursor: isDragging ? 'grabbing' : 'grab',
          opacity: isDragging ? 0.4 : 1,
          boxShadow: isActive
            ? '0 12px 32px rgba(0,255,157,0.3), 0 4px 12px rgba(0,0,0,0.5)'
            : '0 2px 8px rgba(0,0,0,0.3)',
          transform: isActive ? 'scale(1.02)' : undefined,
          display: 'flex',
          alignItems: 'center',
          gap: '0.7rem',
          userSelect: 'none',
          transition: 'all 0.15s ease',
        }}
      >
        {/* Drag handle */}
        <div
          role="button"
          aria-grabbed={isDragging}
          aria-label="Drag handle"
          style={{ display: 'flex', flexDirection: 'column', gap: '3px', opacity: 0.25, flexShrink: 0 }}
        >
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
            aria-label={`Hapus tugas: ${task.title}`}
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
      </motion.div>

      <style jsx>{`
        .cyber-task-card:hover {
          border-color: var(--accent) !important;
          background: rgba(0,30,30,0.9) !important;
          box-shadow: 0 0 16px rgba(0,255,157,0.15) !important;
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

export default React.memo(DraggableTask);
