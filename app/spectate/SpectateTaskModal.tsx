'use client';

import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import useBreakpoint from '../../Lib/hooks/useBreakpoint';
import CommentForm from '../../components/CommentForm';
import CommentList from '../../components/CommentList';
import type { Comment, FamilyTask, User } from '../../Lib/types';
import type { ToastItem } from '../../Lib/hooks/useToast';

/**
 * Versi mode spectate dari TaskDetailModal.
 * Tampilannya sama, tapi komentar diambil dari state lokal, bukan dari
 * useRealtimeComments (Supabase).
 */

interface SpectateTaskModalProps {
  task: FamilyTask | null;
  users: User[];
  viewer: User;
  comments: Comment[];
  onAddComment: (taskId: string, content: string) => Promise<void>;
  onEditComment: (taskId: string, id: string, content: string) => Promise<void>;
  onDeleteComment: (taskId: string, id: string) => Promise<void>;
  showToast: (msg: string, type: ToastItem['type']) => void;
  onClose: () => void;
}

const statusConfig = {
  pending: { color: '#c8a96e', label: 'Pending', icon: '○' },
  in_progress: { color: '#a07850', label: 'In Progress', icon: '◑' },
  done: { color: '#7a9e6e', label: 'Done', icon: '●' },
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

const labelStyle: React.CSSProperties = {
  fontSize: '0.6rem',
  color: 'var(--text-muted)',
  letterSpacing: '2px',
  minWidth: '80px',
};

function noop() {}

export default function SpectateTaskModal({
  task, users, viewer, comments, onAddComment, onEditComment, onDeleteComment, showToast, onClose,
}: SpectateTaskModalProps) {
  const { isMobile } = useBreakpoint();
  const isOpen = task !== null;

  // Lock/unlock body scroll
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const assignedUser = task ? users.find(u => u.id === task.assigned_to) : null;
  const status = task ? statusConfig[task.status] : null;

  // Modal style: desktop = centered, mobile = bottom sheet
  const modalStyle: React.CSSProperties = isMobile
    ? {
        position: 'fixed', bottom: 0, left: 0, right: 0, width: '100%',
        maxHeight: '90vh', overflowY: 'auto',
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: '20px 20px 0 0', padding: '1.5rem 1.25rem', zIndex: 1001,
      }
    : {
        position: 'relative', width: '100%', maxWidth: '600px',
        maxHeight: '85vh', overflowY: 'auto',
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: '16px', padding: '2rem', zIndex: 1001,
      };

  const motionProps = isMobile
    ? {
        initial: { y: '100%', opacity: 0 },
        animate: { y: 0, opacity: 1 },
        exit: { y: '100%', opacity: 0 },
        transition: { duration: 0.25, ease: 'easeOut' as const },
      }
    : {
        initial: { scale: 0.9, opacity: 0 },
        animate: { scale: 1.0, opacity: 1 },
        exit: { scale: 0.9, opacity: 0 },
        transition: { duration: 0.2, ease: 'easeOut' as const },
      };

  return (
    <AnimatePresence>
      {isOpen && task && (
        /* Backdrop */
        <div
          onClick={onClose}
          style={{
            position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1000,
            display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center',
          }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={task.title}
            onClick={e => e.stopPropagation()}
            style={modalStyle}
            {...motionProps}
          >
            <button
              onClick={onClose}
              aria-label="Tutup modal"
              style={{
                position: 'absolute', top: '1rem', right: '1rem',
                background: 'transparent', border: '1px solid var(--border)', borderRadius: '50%',
                width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1rem', lineHeight: 1,
              }}
            >
              ✕
            </button>

            <div style={{ height: '2px', width: '48px', background: 'linear-gradient(to right, var(--accent), transparent)', marginBottom: '1.25rem' }} />

            <h2 style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: isMobile ? '1.3rem' : '1.6rem',
              fontWeight: '700',
              color: 'var(--text-main)',
              marginBottom: '1.25rem',
              paddingRight: '2rem',
              lineHeight: 1.3,
            }}>
              {task.title}
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
              {status && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={labelStyle}>STATUS</span>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                    padding: '3px 10px', borderRadius: '20px',
                    border: `1px solid ${status.color}40`, background: `${status.color}15`,
                    color: status.color, fontSize: '0.78rem', fontWeight: '600', letterSpacing: '0.5px',
                  }}>
                    <span>{status.icon}</span>
                    <span>{status.label}</span>
                  </span>
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={labelStyle}>ASSIGNEE</span>
                <span style={{
                  fontSize: '0.85rem',
                  color: assignedUser ? 'var(--accent)' : 'var(--text-muted)',
                  fontStyle: assignedUser ? 'normal' : 'italic',
                }}>
                  {assignedUser ? assignedUser.username : 'Belum diassign'}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={labelStyle}>DIBUAT</span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{formatDate(task.created_at)}</span>
              </div>

              {task.deadline && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={labelStyle}>DEADLINE</span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{formatDate(task.deadline)}</span>
                </div>
              )}
            </div>

            <div style={{ height: '1px', background: 'var(--border)', marginBottom: '1.5rem' }} />

            {/* Komentar: sama seperti CommentSection, tapi sumbernya state lokal */}
            <h3 style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: '0.7rem',
              fontWeight: '700',
              color: 'var(--text-muted)',
              letterSpacing: '3px',
              textTransform: 'uppercase',
              marginBottom: '1rem',
            }}>
              KOMENTAR
            </h3>

            <CommentForm
              taskId={task.id}
              userId={viewer.id}
              onSubmit={content => onAddComment(task.id, content)}
            />

            <CommentList
              comments={comments}
              loading={false}
              error={null}
              hasMore={false}
              onLoadMore={noop}
              onRetry={noop}
              loadingMore={false}
              profile={viewer}
              onEdit={(id, content) => onEditComment(task.id, id, content)}
              onDelete={id => onDeleteComment(task.id, id)}
              showToast={showToast}
            />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
