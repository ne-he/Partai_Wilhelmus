import { AnimatePresence, motion } from 'framer-motion';

interface ConfirmModalProps {
  isOpen: boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  title?: string;
  confirmLabel?: string;
}

export default function ConfirmModal({ isOpen, message, onConfirm, onCancel, title, confirmLabel }: ConfirmModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div
          onClick={onCancel}
          style={{
            position: 'fixed',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            zIndex: 1000,
          }}
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1.0, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              backgroundColor: 'var(--bg-card)',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '400px',
              width: '90%',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
              border: '1px solid var(--border)',
            }}
          >
            {title && (
              <p style={{
                color: 'var(--text-main)',
                fontSize: '1.1rem',
                fontWeight: '700',
                fontFamily: "'Playfair Display', Georgia, serif",
                marginBottom: '8px',
              }}>
                {title}
              </p>
            )}
            <p
              style={{
                color: 'var(--text-main)',
                fontSize: '1rem',
                marginBottom: '24px',
                lineHeight: 1.5,
              }}
            >
              {message}
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={onCancel}
                aria-label="Batal"
                style={{
                  padding: '8px 20px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  backgroundColor: 'transparent',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  transition: 'all 0.15s ease',
                }}
              >
                Batal
              </button>
              <button
                onClick={onConfirm}
                aria-label="Konfirmasi"
                style={{
                  padding: '8px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: 'var(--accent)',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  transition: 'all 0.15s ease',
                }}
              >
                {confirmLabel ?? 'Konfirmasi'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
