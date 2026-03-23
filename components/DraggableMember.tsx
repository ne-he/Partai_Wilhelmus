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

function getRoleConfig(role: string) {
  switch (role) {
    case 'papa':
      return { color: '#c8a96e', symbol: '♦', label: 'BOSS' };
    case 'mama':
      return { color: '#b8956a', symbol: '♠', label: 'CONSIGLIERE' };
    default:
      return { color: '#9c8a72', symbol: '♣', label: 'SOLDATO' };
  }
}

export default function DraggableMember({ user, disabled = false }: DraggableMemberProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: user.id,
    data: { type: 'member', user },
    disabled,
  });

  const cfg = getRoleConfig(user.role);

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.6rem',
        padding: '7px 16px 7px 10px',
        background: isDragging ? 'var(--bg-card2)' : 'var(--bg-card)',
        border: isDragging
          ? `2px solid var(--accent)`
          : `1px solid var(--border)`,
        borderTop: isDragging ? `2px solid ${cfg.color}` : `1px solid ${cfg.color}60`,
        borderRadius: '4px',
        opacity: isDragging ? 0.5 : 1,
        cursor: disabled ? 'not-allowed' : isDragging ? 'grabbing' : 'grab',
        transition: 'border-color 0.2s, background 0.2s, box-shadow 0.2s',
        boxShadow: isDragging
          ? `0 8px 24px rgba(0,0,0,0.2), 0 0 0 3px var(--accent)`
          : '0 1px 4px rgba(0,0,0,0.06)',
        userSelect: 'none',
        WebkitUserSelect: 'none',
      } as React.CSSProperties}
    >
      {/* Avatar */}
      <div style={{
        width: '30px',
        height: '30px',
        borderRadius: '3px',
        background: 'var(--bg-card2)',
        border: `1px solid ${cfg.color}50`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        pointerEvents: 'none',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: '2px', right: '2px',
          fontSize: '0.45rem', color: cfg.color, opacity: 0.6, lineHeight: 1,
        }}>
          {cfg.symbol}
        </div>
        <span style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: '0.7rem',
          fontWeight: '700',
          color: cfg.color,
          letterSpacing: '0.5px',
          lineHeight: 1,
        }}>
          {getInitials(user.username)}
        </span>
      </div>

      {/* Name + role */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', pointerEvents: 'none' }}>
        <span style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: '0.82rem',
          fontWeight: '600',
          color: 'var(--text-main)',
          letterSpacing: '0.3px',
          lineHeight: 1.2,
          userSelect: 'none',
        } as React.CSSProperties}>
          {user.username}
        </span>
        <span style={{
          fontSize: '0.5rem',
          color: cfg.color,
          letterSpacing: '2px',
          fontWeight: '600',
          opacity: 0.8,
          userSelect: 'none',
        } as React.CSSProperties}>
          {cfg.label}
        </span>
      </div>
    </div>
  );
}
