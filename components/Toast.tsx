'use client';

import { AnimatePresence, motion } from 'framer-motion';
import type { ToastItem } from '@/Lib/hooks/useToast';

interface ToastProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

function getToastColor(type: ToastItem['type']): string {
  switch (type) {
    case 'success':
      return '#22c55e';
    case 'error':
      return '#ef4444';
    case 'info':
    default:
      return 'var(--accent)';
  }
}

export default function Toast({ toasts, onDismiss }: ToastProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        bottom: '1.5rem',
        right: '1.5rem',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        alignItems: 'flex-end',
      }}
    >
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.75rem 1rem',
              borderRadius: '0.5rem',
              backgroundColor: 'var(--bg-card, #1e1e1e)',
              color: 'var(--text-main, #fff)',
              borderLeft: `4px solid ${getToastColor(toast.type)}`,
              boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
              minWidth: '220px',
              maxWidth: '360px',
              fontSize: '0.9rem',
            }}
          >
            <span style={{ flex: 1 }}>{toast.message}</span>
            <button
              onClick={() => onDismiss(toast.id)}
              aria-label="Tutup notifikasi"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-main, #fff)',
                opacity: 0.6,
                fontSize: '1rem',
                lineHeight: 1,
                padding: '0.1rem 0.25rem',
                transition: 'opacity 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.6')}
            >
              ✕
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
