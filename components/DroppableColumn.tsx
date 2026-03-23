'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { motion, AnimatePresence } from 'framer-motion';
import DraggableTask from './DraggableTask';

interface PersonalTask {
  id: string;
  user_id: string;
  title: string;
  status: 'pending' | 'in_progress' | 'done';
  order: number;
  created_at: string;
  updated_at: string;
}

interface DroppableColumnProps {
  status: 'pending' | 'in_progress' | 'done';
  tasks: PersonalTask[];
  title: string;
  onDelete?: (taskId: string) => void;
}

const columnConfig = {
  pending: { accent: '#c8a96e', label: 'PENDING', emptyMsg: 'Belum ada tugas' },
  in_progress: { accent: '#64a0c8', label: 'IN PROGRESS', emptyMsg: 'Tidak ada yang dikerjakan' },
  done: { accent: '#7a9e6e', label: 'DONE', emptyMsg: 'Belum ada yang selesai' },
};

export default function DroppableColumn({ status, tasks, title, onDelete }: DroppableColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `column-${status}`,
    data: { type: 'column', status },
  });

  const cfg = columnConfig[status];

  return (
    <div
      ref={setNodeRef}
      style={{
        flex: 1,
        minWidth: '260px',
        background: isOver ? 'var(--bg-card2)' : 'var(--bg-card)',
        border: isOver ? `1.5px solid ${cfg.accent}` : '1px solid var(--border)',
        borderRadius: '10px',
        padding: '1.25rem',
        transition: 'all 0.2s ease',
        boxShadow: isOver ? `0 0 20px ${cfg.accent}20` : '0 2px 8px rgba(0,0,0,0.06)',
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
          <div style={{
            width: '7px', height: '7px', borderRadius: '50%',
            background: cfg.accent, boxShadow: `0 0 6px ${cfg.accent}60`,
          }} />
          <span style={{
            fontSize: '0.6rem', letterSpacing: '3px', color: cfg.accent,
            fontWeight: '600',
          }}>
            {cfg.label}
          </span>
          <span style={{
            marginLeft: 'auto', fontSize: '0.7rem', color: 'var(--text-muted)',
            background: 'var(--bg-card2)', border: '1px solid var(--border)',
            borderRadius: '20px', padding: '1px 8px',
          }}>
            {tasks.length}
          </span>
        </div>
        <h3 style={{
          fontSize: '1rem', color: 'var(--text-main)',
          fontWeight: '600', letterSpacing: '1px',
        }}>
          {title}
        </h3>
        <div style={{
          height: '1px', marginTop: '0.6rem',
          background: `linear-gradient(to right, ${cfg.accent}60, transparent)`,
        }} />
      </div>

      <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
        <div style={{ minHeight: '180px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {/* Drop indicator — always rendered at top when isOver */}
          <AnimatePresence>
            {isOver && (
              <motion.div
                key="drop-indicator"
                initial={{ scaleX: 0, opacity: 0 }}
                animate={{ scaleX: 1, opacity: 1 }}
                exit={{ scaleX: 0, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                style={{
                  height: '2px',
                  background: cfg.accent,
                  borderRadius: '2px',
                  transformOrigin: 'left',
                  boxShadow: `0 0 8px ${cfg.accent}`,
                  flexShrink: 0,
                }}
              />
            )}
          </AnimatePresence>

          {tasks.length === 0 ? (
            <div style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', padding: '2rem 0', gap: '0.5rem',
            }}>
              <div style={{ fontSize: '1.2rem', opacity: 0.2, color: cfg.accent }}>[ ]</div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.72rem', fontStyle: 'italic' }}>
                {cfg.emptyMsg}
              </p>
            </div>
          ) : (
            tasks.map(task => (
              <DraggableTask key={task.id} task={task} onDelete={onDelete} />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  );
}
