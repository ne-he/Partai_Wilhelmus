'use client';

import { useDraggable } from '@dnd-kit/core';

interface User {
  id: string;
  username: string;
  role: string;
}

interface DraggableMemberProps {
  user: User;
  disabled?: boolean;
}

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function getRoleColor(role: string) {
  return role === 'papa' || role === 'mama' ? '#C9A53B' : '#64a0c8';
}

export default function DraggableMember({ user, disabled = false }: DraggableMemberProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: user.id,
    data: { type: 'member', user },
    disabled,
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.6rem',
        padding: '6px 14px 6px 8px',
        background: isDragging ? 'rgba(201,165,59,0.15)' : 'rgba(26,24,18,0.8)',
        border: isDragging ? '1.5px solid var(--accent)' : '1px solid rgba(201,165,59,0.25)',
        borderRadius: '999px',
        opacity: isDragging ? 0.5 : 1,
        cursor: disabled ? 'not-allowed' : 'grab',
        transition: 'border-color 0.2s, background 0.2s, box-shadow 0.2s',
        boxShadow: isDragging ? '0 4px 16px rgba(201,165,59,0.2)' : 'none',
        // Critical: prevent text selection and browser drag behavior
        userSelect: 'none',
        WebkitUserSelect: 'none',
        touchAction: 'none',
        WebkitTouchCallout: 'none',
      }}
    >
      <div style={{
        width: '28px',
        height: '28px',
        borderRadius: '50%',
        background: getRoleColor(user.role),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#0f0e0b',
        fontWeight: '800',
        fontSize: '0.65rem',
        flexShrink: 0,
        letterSpacing: '0.5px',
      }}>
        {getInitials(user.username)}
      </div>
      <span style={{
        color: 'var(--text-main)',
        fontSize: '0.85rem',
        fontWeight: '500',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        pointerEvents: 'none',
      }}>
        {user.username}
      </span>
    </div>
  );
}
