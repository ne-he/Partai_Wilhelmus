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
  pending: {
    accent: '#c8a96e',
    label: 'PENDING',
    emptyMsg: 'Belum ada tugas',
    dot: 'rgba(200,169,110,0.6)',
  },
  in_progress: {
    accent: '#64a0c8',
    label: 'IN PROGRESS',
    emptyMsg: 'Tidak ada yang dikerjakan',
    dot: 'rgba(100,160,200,0.6)',
  },
  done: {
    accent: '#64b478',
    label: 'DONE',
    emptyMsg: 'Belum ada yang selesai',
    dot: 'rgba(100,180,120,0.6)',
  },
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
        background: isOver
          ? `rgba(62,44,27,0.9)`
          : 'rgba(44,26,14,0.6)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: isOver
          ? `1.5px solid ${cfg.accent}`
          : '1px solid rgba(201,165,59,0.15)',
        borderRadius: '14px',
        padding: '1.25rem',
        transition: 'all 0.2s ease',
        boxShadow: isOver
          ? `0 0 24px ${cfg.accent}22`
          : '0 4px 16px rgba(0,0,0,0.2)',
      }}
    >
      {/* Column header */}
      <div style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
          <div style={{
            width: '8px', height: '8px', borderRadius: '50%',
            background: cfg.dot,
            boxShadow: `0 0 6px ${cfg.dot}`,
          }} />
          <span style={{
            fontSize: '0.65rem',
            letterSpacing: '2.5px',
            color: cfg.accent,
            fontWeight: '600',
            fontFamily: 'Inter, sans-serif',
          }}>
            {cfg.label}
          </span>
          <span style={{
            marginLeft: 'auto',
            fontSize: '0.7rem',
            color: 'var(--text-muted)',
            background: 'rgba(201,165,59,0.1)',
            border: '1px solid rgba(201,165,59,0.15)',
            borderRadius: '20px',
            padding: '1px 8px',
          }}>
            {tasks.length}
          </span>
        </div>
        <h3 style={{
          fontSize: '1.1rem',
          color: 'var(--text-main)',
          fontFamily: "'Playfair Display', Georgia, serif",
          fontWeight: '600',
          letterSpacing: '0.3px',
        }}>
          {title}
        </h3>
        {/* Gold underline */}
        <div style={{
          height: '1px',
          background: `linear-gradient(to right, ${cfg.accent}60, transparent)`,
          marginTop: '0.6rem',
        }} />
      </div>

      <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
        <div style={{ minHeight: '180px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <AnimatePresence>
            {tasks.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '2rem 0',
                  gap: '0.5rem',
                }}
              >
                <div style={{ fontSize: '1.5rem', opacity: 0.3 }}>◇</div>
                <p style={{
                  color: 'var(--text-muted)',
                  fontSize: '0.75rem',
                  textAlign: 'center',
                  fontStyle: 'italic',
                }}>
                  {cfg.emptyMsg}
                </p>
              </motion.div>
            ) : (
              tasks.map(task => (
                <motion.div
                  key={task.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.18 }}
                >
                  <DraggableTask task={task} onDelete={onDelete} />
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </SortableContext>
    </div>
  );
}
