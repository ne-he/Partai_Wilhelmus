'use client';

import { useDroppable } from '@dnd-kit/core';
import { motion, AnimatePresence } from 'framer-motion';

interface FamilyTask {
  id: string;
  title: string;
  status: 'pending' | 'in_progress' | 'done';
  created_by: string;
  assigned_to: string | null;
  created_at: string;
}

interface User {
  id: string;
  username: string;
  role: string;
}

interface DroppableFamilyTaskProps {
  task: FamilyTask;
  assignedUser?: User | null;
  onStatusChange?: (taskId: string, status: string) => void;
  onDelete?: (taskId: string) => void;
}

const statusConfig = {
  pending: { color: '#c8a96e', label: 'Pending', icon: '○' },
  in_progress: { color: '#64a0c8', label: 'In Progress', icon: '◑' },
  done: { color: '#7a9e6e', label: 'Done', icon: '●' },
};

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function getRoleConfig(role: string) {
  switch (role) {
    case 'papa': return { color: '#c8a96e', symbol: '♦' };
    case 'mama': return { color: '#b8956a', symbol: '♠' };
    default: return { color: '#9c8a72', symbol: '♣' };
  }
}

export default function DroppableFamilyTask({
  task, assignedUser, onStatusChange, onDelete,
}: DroppableFamilyTaskProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: task.id,
    data: { type: 'familyTask', taskId: task.id },
  });

  const s = statusConfig[task.status] || statusConfig.pending;

  return (
    <motion.div
      ref={setNodeRef}
      animate={{
        scale: isOver ? 1.015 : 1,
      }}
      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
      style={{
        background: isOver ? 'var(--bg-card2)' : 'var(--bg-card)',
        border: isOver
          ? '2px solid var(--accent)'
          : '1px solid var(--border)',
        borderRadius: '8px',
        padding: '0.9rem 1.1rem',
        boxShadow: isOver
          ? '0 0 0 3px var(--accent), 0 8px 24px rgba(0,0,0,0.12)'
          : '0 1px 4px rgba(0,0,0,0.06)',
        position: 'relative',
        overflow: 'hidden',
        transition: 'background 0.2s, border-color 0.2s, box-shadow 0.2s',
      }}
    >
      {/* Accent shimmer line saat isOver */}
      <AnimatePresence>
        {isOver && (
          <motion.div
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            exit={{ scaleX: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'absolute', top: 0, left: 0, right: 0,
              height: '2px',
              background: 'linear-gradient(to right, transparent, var(--accent), transparent)',
              transformOrigin: 'left',
            }}
          />
        )}
      </AnimatePresence>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
        {/* Status icon */}
        <span style={{ fontSize: '0.8rem', color: s.color, flexShrink: 0 }}>{s.icon}</span>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            color: task.status === 'done' ? 'var(--text-muted)' : 'var(--text-main)',
            textDecoration: task.status === 'done' ? 'line-through' : 'none',
            fontSize: '0.875rem',
            fontFamily: "'Playfair Display', Georgia, serif",
            marginBottom: '0.35rem',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {task.title}
          </p>

          {/* Assigned user badge */}
          <AnimatePresence mode="wait">
            {assignedUser ? (
              <motion.div
                key={assignedUser.id}
                initial={{ opacity: 0, y: 4, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '2px 10px 2px 6px',
                  background: 'var(--bg-card2)',
                  border: '1px solid var(--border)',
                  borderRadius: '3px',
                  fontSize: '0.7rem',
                  color: 'var(--accent)',
                }}
              >
                <div style={{
                  width: '16px', height: '16px', borderRadius: '2px',
                  background: getRoleConfig(assignedUser.role).color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#1a1612', fontWeight: '800', fontSize: '0.5rem',
                  fontFamily: "'Playfair Display', Georgia, serif",
                  flexShrink: 0,
                }}>
                  {getInitials(assignedUser.username)}
                </div>
                <span style={{ fontFamily: "'Playfair Display', Georgia, serif", letterSpacing: '0.3px' }}>
                  {assignedUser.username}
                </span>
                <span style={{ fontSize: '0.5rem', opacity: 0.6, letterSpacing: '1px' }}>
                  {getRoleConfig(assignedUser.role).symbol}
                </span>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                  fontSize: '0.68rem',
                  color: isOver ? 'var(--accent)' : 'var(--text-muted)',
                  fontStyle: 'italic',
                  transition: 'color 0.2s',
                }}
              >
                {isOver ? '✦ Lepaskan untuk assign' : 'Drag anggota ke sini'}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Status selector */}
        {onStatusChange && (
          <select
            value={task.status}
            onChange={e => onStatusChange(task.id, e.target.value)}
            style={{
              background: 'var(--bg-card2)',
              border: `1px solid ${s.color}60`,
              borderRadius: '4px',
              color: s.color,
              padding: '4px 8px',
              fontSize: '0.68rem',
              cursor: 'pointer',
              outline: 'none',
              flexShrink: 0,
              fontFamily: 'Georgia, serif',
            }}
          >
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="done">Done</option>
          </select>
        )}

        {/* Delete button */}
        {onDelete && (
          <button
            onClick={() => onDelete(task.id)}
            title="Hapus tugas"
            className="family-del-btn"
            style={{
              flexShrink: 0,
              padding: '3px 9px',
              borderRadius: '3px',
              border: '1px solid var(--border)',
              background: 'transparent',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: '0.6rem',
              letterSpacing: '1px',
              transition: 'all 0.2s',
            }}
          >
            [DEL]
          </button>
        )}
      </div>

      <style jsx>{`
        .family-del-btn:hover {
          border-color: rgba(220,60,60,0.5) !important;
          color: #dc3c3c !important;
          background: rgba(220,60,60,0.08) !important;
        }
      `}</style>
    </motion.div>
  );
}
