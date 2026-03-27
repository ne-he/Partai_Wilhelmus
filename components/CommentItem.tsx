'use client';

import React from 'react';
import type { Comment, User } from '../Lib/types';

const DISPLAY_NAME_MAP: Record<string, string> = {
  papa: 'Abi',
  mama: 'Umi',
  nemi: 'Baginda',
  venly: 'Mbah',
};

const ROLE_AVATAR_COLOR: Record<string, string> = {
  papa: '#c8a96e',
  mama: '#b8956a',
};

function getDisplayName(username: string): string {
  return DISPLAY_NAME_MAP[username?.toLowerCase()] ?? username;
}

function getAvatarColor(role?: string): string {
  return ROLE_AVATAR_COLOR[role ?? ''] ?? '#9c8a72';
}

function getInitials(username?: string): string {
  if (!username) return '??';
  const display = getDisplayName(username);
  return display.slice(0, 2).toUpperCase();
}

export function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'baru saja';
  if (diffMin < 60) return `${diffMin} menit lalu`;
  if (diffHour < 24) return `${diffHour} jam lalu`;
  if (diffDay === 1) return 'kemarin';
  return `${diffDay} hari lalu`;
}

function isEdited(comment: Comment): boolean {
  const created = new Date(comment.created_at).getTime();
  const updated = new Date(comment.updated_at).getTime();
  return updated - created > 1000;
}

interface CommentItemProps {
  comment: Comment;
  profile: User;
  onEdit: (id: string, content: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export default function CommentItem({ comment, profile, onEdit, onDelete }: CommentItemProps) {
  const canModify =
    comment.user_id === profile.id ||
    profile.role === 'papa' ||
    profile.role === 'mama';

  const avatarColor = getAvatarColor(comment.role);
  const initials = getInitials(comment.username);
  const displayName = comment.username ? getDisplayName(comment.username) : '—';
  const edited = isEdited(comment);

  return (
    <div
      style={{
        display: 'flex',
        gap: '0.75rem',
        padding: '0.75rem 0',
        borderBottom: '1px solid var(--border)',
      }}
    >
      {/* Avatar */}
      <div
        style={{
          width: '36px',
          height: '36px',
          minWidth: '36px',
          borderRadius: '4px',
          background: avatarColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.75rem',
          fontWeight: '700',
          color: '#1a1510',
          letterSpacing: '0.5px',
          flexShrink: 0,
        }}
      >
        {initials}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
          <span style={{
            fontSize: '0.8rem',
            fontWeight: '600',
            color: 'var(--accent)',
          }}>
            {displayName}
          </span>
          <span style={{
            fontSize: '0.7rem',
            color: 'var(--text-muted)',
          }}>
            {formatRelativeTime(comment.created_at)}
          </span>
          {edited && (
            <span style={{
              fontSize: '0.65rem',
              color: 'var(--text-muted)',
              fontStyle: 'italic',
            }}>
              (diedit)
            </span>
          )}
        </div>

        {/* Comment text */}
        <p style={{
          fontSize: '0.85rem',
          color: 'var(--text-main)',
          lineHeight: 1.5,
          margin: 0,
          wordBreak: 'break-word',
        }}>
          {comment.content}
        </p>
      </div>

      {/* Three-dots menu — PLACEHOLDER (akan diisi di task 2.4) */}
      {canModify && (
        <button
          aria-label="Opsi komentar"
          onClick={() => {
            // TODO (task 2.4): tampilkan dropdown edit/hapus
            void onEdit;
            void onDelete;
          }}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            fontSize: '1.1rem',
            padding: '0 0.25rem',
            lineHeight: 1,
            alignSelf: 'flex-start',
            flexShrink: 0,
          }}
        >
          ⋯
        </button>
      )}
    </div>
  );
}
