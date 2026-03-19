'use client';

import { useDroppable } from '@dnd-kit/core';

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

const statusColors = {
  pending: { bg: 'rgba(200,169,110,0.1)', color: '#c8a96e', label: 'Pending' },
  in_progress: { bg: 'rgba(100,160,200,0.1)', color: '#64a0c8', label: 'In Progress' },
  done: { bg: 'rgba(100,180,120,0.1)', color: '#64b478', label: 'Done' },
};

export default function DroppableFamilyTask({
  task,
  assignedUser,
  onStatusChange,
  onDelete
}: DroppableFamilyTaskProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: task.id,
    data: {
      type: 'task',
      task
    }
  });

  const s = statusColors[task.status] || statusColors.pending;

  return (
    <div
      ref={setNodeRef}
      style={{
        background: 'var(--bg-card)',
        border: isOver ? '2px solid var(--accent)' : '1px solid var(--border)',
        borderRadius: '12px',
        padding: '1rem 1.2rem',
        transition: 'all 0.2s',
        backgroundColor: isOver ? 'rgba(201, 165, 59, 0.05)' : 'var(--bg-card)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {/* Status dot */}
        <div
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: s.color,
            flexShrink: 0,
          }}
        />

        <div style={{ flex: 1 }}>
          <div
            style={{
              color: task.status === 'done' ? 'var(--text-muted)' : 'var(--text-main)',
              textDecoration: task.status === 'done' ? 'line-through' : 'none',
              fontSize: '0.95rem',
              marginBottom: '0.5rem',
            }}
          >
            {task.title}
          </div>

          {/* Assigned user */}
          {assignedUser && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.25rem 0.75rem',
                background: 'rgba(201, 165, 59, 0.1)',
                borderRadius: '20px',
                fontSize: '0.75rem',
                color: 'var(--accent)',
              }}
            >
              <span>👤</span>
              <span>{assignedUser.username}</span>
            </div>
          )}
          {!assignedUser && (
            <div
              style={{
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                fontStyle: 'italic',
              }}
            >
              {isOver ? 'Drop to assign' : 'Drag member here to assign'}
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
              border: `1px solid ${s.color}40`,
              borderRadius: '20px',
              color: s.color,
              padding: '4px 10px',
              fontSize: '0.75rem',
              cursor: 'pointer',
              outline: 'none',
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
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: '1rem',
              padding: '4px',
              lineHeight: 1,
            }}
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}
