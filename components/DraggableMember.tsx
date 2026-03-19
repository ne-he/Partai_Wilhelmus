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

export default function DraggableMember({ user, disabled = false }: DraggableMemberProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: user.id,
    data: {
      type: 'member',
      user
    },
    disabled
  });

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'papa':
        return '#C9A53B'; // Gold
      case 'mama':
        return '#C9A53B'; // Gold
      default:
        return '#64a0c8'; // Blue
    }
  };

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{
        opacity: isDragging ? 0.5 : 1,
        cursor: disabled ? 'not-allowed' : 'grab',
        transition: 'all 0.2s',
      }}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border-2 ${
        disabled ? 'opacity-50' : 'hover:scale-105'
      }`}
    >
      <div
        style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          background: getRoleColor(user.role),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#1a1612',
          fontWeight: 'bold',
          fontSize: '0.75rem',
        }}
      >
        {getInitials(user.username)}
      </div>
      <span style={{ color: 'var(--text-main)', fontSize: '0.9rem', fontWeight: '500' }}>
        {user.username}
      </span>
    </div>
  );
}
