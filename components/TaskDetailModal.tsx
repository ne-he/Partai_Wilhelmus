'use client';

import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import useBreakpoint from '../Lib/hooks/useBreakpoint';

interface FamilyTask {
  id: string;
  title: string;
  status: 'pending' | 'in_progress' | 'done';
  created_by: string;
  assigned_to: string | null;
  created_at: string;
  deadline?: string | null;
}

interface User {
  id: string;
  username: string;
  role: string;
  email?: string;
}

interface TaskDetailModalProps {
  task: FamilyTask | null;
  users: User[];
  profile: User;
  onClose: () => void;
}

const DISPLAY_NAME_MAP: Record<string, string> = {
  papa: 'Abi',
  mama: 'Umi',
  nemi: 'Baginda',
  venly: 'Mbah',
};

const statusConfig = {
  pending: { color: '#c8a96e', label: 'Pending', icon: '○' },
  in_progress: { color: '#a07850', label: 'In Progress', icon: '◑' },
  done: { color: '#7a9e6e', label: 'Done', icon: '●' },
};

function getDisplayName(username: string): string {
  return DISPLAY_NAME_MAP[username.toLowerCase()] ?? username;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function TaskDetailModal({ task, users, onClose }: TaskDetailModalProps) {
  const { isMobile } = useBreakpoint();
  const isOpen = task !== null;

  // Lock/unlock body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const assignedUser = task ? users.find(u => u.id === task.assigned_to) : null;
  const status = task ? statusConfig[task.status] : null;

  // Modal style: desktop = centered, mobile = bottom sheet
  const modalStyle: React.CSSProperties = isMobile
    ? {
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '20px 20px 0 0',
        padding: '1.5rem 1.25rem',
        zIndex: 1001,
      }
    : {
        position: 'relative',
        width: '100%',
        maxWidth: '600px',
        maxHeight: '85vh',
        overflowY: 'auto',
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        padding: '2rem',
        zIndex: 1001,
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
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            zIndex: 1000,
            display: 'flex',
            alignItems: isMobile ? 'flex-end' : 'center',
            justifyContent: 'center',
          }}
        >
          {/* Modal */}
          <motion.div
            onClick={e => e.stopPropagation()}
            style={modalStyle}
            {...motionProps}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              aria-label="Tutup modal"
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'transparent',
                border: '1px solid var(--border)',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: '1rem',
                lineHeight: 1,
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'var(--accent)';
                e.currentTarget.style.color = 'var(--accent)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.color = 'var(--text-muted)';
              }}
            >
              ✕
            </button>

            {/* Decorative top bar */}
            <div style={{
              height: '2px',
              width: '48px',
              background: 'linear-gradient(to right, var(--accent), transparent)',
              marginBottom: '1.25rem',
            }} />

            {/* Task title */}
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

            {/* Task info grid */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
              marginBottom: '1.5rem',
            }}>
              {/* Status badge */}
              {status && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{
                    fontSize: '0.6rem',
                    color: 'var(--text-muted)',
                    letterSpacing: '2px',
                    minWidth: '80px',
                  }}>
                    STATUS
                  </span>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '3px 10px',
                    borderRadius: '20px',
                    border: `1px solid ${status.color}40`,
                    background: `${status.color}15`,
                    color: status.color,
                    fontSize: '0.78rem',
                    fontWeight: '600',
                    letterSpacing: '0.5px',
                  }}>
                    <span>{status.icon}</span>
                    <span>{status.label}</span>
                  </span>
                </div>
              )}

              {/* Assignee */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{
                  fontSize: '0.6rem',
                  color: 'var(--text-muted)',
                  letterSpacing: '2px',
                  minWidth: '80px',
                }}>
                  ASSIGNEE
                </span>
                <span style={{
                  fontSize: '0.85rem',
                  color: assignedUser ? 'var(--accent)' : 'var(--text-muted)',
                  fontStyle: assignedUser ? 'normal' : 'italic',
                }}>
                  {assignedUser
                    ? getDisplayName(assignedUser.username)
                    : 'Belum diassign'}
                </span>
              </div>

              {/* Created at */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{
                  fontSize: '0.6rem',
                  color: 'var(--text-muted)',
                  letterSpacing: '2px',
                  minWidth: '80px',
                }}>
                  DIBUAT
                </span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  {formatDate(task.created_at)}
                </span>
              </div>

              {/* Deadline (optional) */}
              {task.deadline && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{
                    fontSize: '0.6rem',
                    color: 'var(--text-muted)',
                    letterSpacing: '2px',
                    minWidth: '80px',
                  }}>
                    DEADLINE
                  </span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    {formatDate(task.deadline)}
                  </span>
                </div>
              )}
            </div>

            {/* Divider */}
            <div style={{
              height: '1px',
              background: 'var(--border)',
              marginBottom: '1.5rem',
            }} />

            {/* CommentSection akan diisi di task 2.2 */}

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
