'use client';

import { useDroppable } from '@dnd-kit/core';
import { motion } from 'framer-motion';

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
  pending: { color: '#c8a96e', bg: 'rgba(200,169,110,0.1)', label: 'Pending', icon: '○' },
  in_progress: { color: '#64a0c8', bg: 'rgba(100,160,200,0.1)', label: 'In Progress', icon: '◑' },
  done: { color: '#64b478', bg: 'rgba(100,180,120,0.1)', label: 'Done', icon: '●' },
};

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function getRoleColor(role: string) {
  return role === 'papa' || role === 'mama' ? '#C9A53B' : '#64a0c8';
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
    <div
      ref={setNodeRef}
      style={{
        background: isOver ? 'rgba(62,44,27,0.95)' : 'rgba(62,44,27,0.7)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: isOver ? `1.5px solid var(--accent)` : '1px solid rgba(201,165,59,0.18)',
        borderRadius: '12px',
        padding: '1rem 1.25rem',
        transition: 'all 0.2s ease',
        boxShadow: isOver
          ? '0 0 20px rgba(201,165,59,0.2), 0 4px 16px rgba(0,0,0,0.3)'
          : '0 2px 8px rgba(0,0,0,0.15)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {/* Status icon */}
        <span style={{ fontSize: '0.85rem', color: s.color, flexShrink: 0 }}>{s.icon}</span>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            color: task.status === 'done' ? 'var(--text-muted)' : 'var(--text-main)',
            textDecoration: task.status === 'done' ? 'line-through' : 'none',
            fontSize: '0.9rem',
            marginBottom: assignedUser || isOver ? '0.5rem' : 0,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {task.title}
          </p>

          {/* Assigned user badge */}
          {assignedUser ? (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '3px 10px',
              background: 'rgba(201,165,59,0.1)',
              border: '1px solid rgba(201,165,59,0.2)',
              borderRadius: '20px',
              fontSize: '0.72rem',
              color: 'var(--accent)',
            }}>
              <div style={{
                width: '18px', height: '18px', borderRadius: '50%',
                background: getRoleColor(assignedUser.role),
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#1a1612', fontWeight: '700', fontSize: '0.55rem',
              }}>
                {getInitials(assignedUser.username)}
              </div>
              {assignedUser.username}
            </div>
          ) : (
            <div style={{
              fontSize: '0.7rem',
              color: isOver ? 'var(--accent)' : 'var(--text-muted)',
              fontStyle: 'italic',
              transition: 'color 0.2s',
            }}>
              {isOver ? '✦ Drop untuk assign' : 'Drag anggota ke sini untuk assign'}
            </div>
          )}
        </div>

        {/* Status selector */}
        {onStatusChange && (
          <select
            value={task.status}
            onChange={e => onStatusChange(task.id, e.target.value)}
            style={{
              background: s.bg,
              border: `1px solid ${s.color}50`,
              borderRadius: '20px',
              color: s.color,
              padding: '4px 10px',
              fontSize: '0.72rem',
              cursor: 'pointer',
              outline: 'none',
              flexShrink: 0,
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
            style={{
              flexShrink: 0,
              padding: '4px 10px',
              borderRadius: '6px',
              border: '1px solid rgba(201,165,59,0.15)',
              background: 'transparent',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: '0.65rem',
              letterSpacing: '0.5px',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => {
              const btn = e.currentTarget;
              btn.style.borderColor = 'rgba(220,80,80,0.5)';
              btn.style.color = '#dc5050';
              btn.style.background = 'rgba(220,80,80,0.1)';
            }}
            onMouseLeave={e => {
              const btn = e.currentTarget;
              btn.style.borderColor = 'rgba(201,165,59,0.15)';
              btn.style.color = 'var(--text-muted)';
              btn.style.background = 'transparent';
            }}
          >
            DEL
          </button>
        )}
      </div>
    </div>
  );
}
