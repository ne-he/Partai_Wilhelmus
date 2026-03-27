'use client';

import { useState, useEffect, useRef } from 'react';
import type { Comment, User } from '../Lib/types';
import ConfirmModal from './ConfirmModal';
import type { ToastItem } from '../Lib/hooks/useToast';

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
  showToast: (msg: string, type: ToastItem['type']) => void;
}

export default function CommentItem({ comment, profile, onEdit, onDelete, showToast }: CommentItemProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);

  const canModify =
    comment.user_id === profile.id ||
    profile.role === 'papa' ||
    profile.role === 'mama';

  const avatarColor = getAvatarColor(comment.role);
  const initials = getInitials(comment.username);
  const displayName = comment.username ? getDisplayName(comment.username) : '—';
  const edited = isEdited(comment);

  // Close dropdown on outside click
  useEffect(() => {
    if (!showMenu) return;
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

  async function handleSaveEdit() {
    const trimmed = editContent.trim();
    if (!trimmed) return;
    setEditLoading(true);
    try {
      await onEdit(comment.id, trimmed);
      setEditMode(false);
    } catch (err) {
      console.error('Gagal mengedit komentar:', err);
      const msg = err instanceof Error ? err.message : 'Gagal mengedit komentar';
      showToast(msg, 'error');
      // pertahankan editMode=true agar user bisa coba lagi
    } finally {
      setEditLoading(false);
    }
  }

  async function handleDelete() {
    setDeleteLoading(true);
    try {
      await onDelete(comment.id);
      setShowConfirm(false);
    } catch (err) {
      console.error('Gagal menghapus komentar:', err);
      const msg = err instanceof Error ? err.message : 'Gagal menghapus komentar';
      showToast(msg, 'error');
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <>
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
            <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--accent)' }}>
              {displayName}
            </span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              {formatRelativeTime(comment.created_at)}
            </span>
            {edited && (
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                (diedit)
              </span>
            )}
          </div>

          {/* Edit mode or normal text */}
          {editMode ? (
            <div>
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                disabled={editLoading}
                rows={3}
                style={{
                  width: '100%',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  color: 'var(--text-main)',
                  fontSize: '0.85rem',
                  padding: '0.5rem',
                  resize: 'vertical',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.4rem' }}>
                <button
                  onClick={handleSaveEdit}
                  disabled={editLoading || !editContent.trim()}
                  style={{
                    padding: '4px 14px',
                    borderRadius: '6px',
                    border: 'none',
                    background: 'var(--accent)',
                    color: '#fff',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: editLoading || !editContent.trim() ? 'not-allowed' : 'pointer',
                    opacity: editLoading || !editContent.trim() ? 0.6 : 1,
                  }}
                >
                  {editLoading ? '...' : 'Simpan'}
                </button>
                <button
                  onClick={() => setEditMode(false)}
                  disabled={editLoading}
                  style={{
                    padding: '4px 14px',
                    borderRadius: '6px',
                    border: '1px solid var(--border)',
                    background: 'transparent',
                    color: 'var(--text-muted)',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                  }}
                >
                  Batal
                </button>
              </div>
            </div>
          ) : (
            <p style={{
              fontSize: '0.85rem',
              color: 'var(--text-main)',
              lineHeight: 1.5,
              margin: 0,
              wordBreak: 'break-word',
            }}>
              {comment.content}
            </p>
          )}
        </div>

        {/* Three-dots menu */}
        {canModify && !editMode && (
          <div ref={menuRef} style={{ position: 'relative', flexShrink: 0, alignSelf: 'flex-start' }}>
            <button
              aria-label="Opsi komentar"
              onClick={() => setShowMenu((prev) => !prev)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: '1.1rem',
                padding: '0 0.25rem',
                lineHeight: 1,
              }}
            >
              ⋯
            </button>

            {showMenu && (
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '100%',
                  zIndex: 10,
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  padding: '0.25rem',
                  minWidth: '100px',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
                }}
              >
                <button
                  onClick={() => {
                    setEditContent(comment.content);
                    setEditMode(true);
                    setShowMenu(false);
                  }}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-main)',
                    fontSize: '0.85rem',
                    padding: '0.4rem 0.75rem',
                    cursor: 'pointer',
                    borderRadius: '6px',
                  }}
                >
                  Edit
                </button>
                <button
                  onClick={() => {
                    setShowConfirm(true);
                    setShowMenu(false);
                  }}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    background: 'transparent',
                    border: 'none',
                    color: '#e05c5c',
                    fontSize: '0.85rem',
                    padding: '0.4rem 0.75rem',
                    cursor: 'pointer',
                    borderRadius: '6px',
                  }}
                >
                  Hapus
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={showConfirm}
        message="Hapus komentar ini?"
        onConfirm={handleDelete}
        onCancel={() => setShowConfirm(false)}
      />
    </>
  );
}
