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

// Mafia role config — warna dan simbol per role
function getRoleConfig(role: string) {
  switch (role) {
    case 'papa':
      return { color: '#c8a96e', bg: 'rgba(200,169,110,0.12)', symbol: '♦', label: 'BOSS' };
    case 'mama':
      return { color: '#b8956a', bg: 'rgba(184,149,106,0.12)', symbol: '♠', label: 'CONSIGLIERE' };
    default:
      return { color: '#9c8a72', bg: 'rgba(156,138,114,0.1)', symbol: '♣', label: 'SOLDATO' };
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
        background: isDragging
          ? 'rgba(30,26,18,0.98)'
          : 'rgba(22,20,14,0.9)',
        border: isDragging
          ? `1.5px solid ${cfg.color}`
          : `1px solid rgba(201,165,59,0.25)`,
        borderRadius: '4px',
        opacity: isDragging ? 0.6 : 1,
        cursor: disabled ? 'not-allowed' : 'grab',
        transition: 'border-color 0.2s, background 0.2s, box-shadow 0.2s',
        boxShadow: isDragging
          ? `0 8px 24px rgba(0,0,0,0.5), 0 0 12px ${cfg.color}30`
          : '0 2px 8px rgba(0,0,0,0.3)',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none',
        WebkitTouchCallout: 'none',
        draggable: false,
        // Subtle top border accent
        borderTop: isDragging ? `1.5px solid ${cfg.color}` : `1px solid ${cfg.color}60`,
      } as React.CSSProperties}
    >
      {/* Avatar — monogram dengan latar gelap */}
      <div style={{
        width: '30px',
        height: '30px',
        borderRadius: '3px',
        background: `linear-gradient(135deg, rgba(30,26,18,0.95), rgba(20,18,12,0.95))`,
        border: `1px solid ${cfg.color}50`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        pointerEvents: 'none',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Subtle corner decoration */}
        <div style={{
          position: 'absolute', top: '2px', right: '2px',
          fontSize: '0.45rem', color: cfg.color, opacity: 0.6,
          lineHeight: 1,
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
          WebkitUserSelect: 'none',
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
