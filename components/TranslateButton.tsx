'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TranslateButtonProps {
  verseText: string;
  verseId: string;
  onError: (msg: string) => void;
}

export default function TranslateButton({ verseText, verseId, onError }: TranslateButtonProps) {
  const cacheKey = `translated_${verseId.replace(/\s+/g, '_')}`;

  const [translated, setTranslated] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Baca cache dari localStorage saat mount
  useEffect(() => {
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        setTranslated(cached);
      }
    } catch {
      // localStorage tidak tersedia (SSR atau private mode)
    }
  }, [cacheKey]);

  async function fetchTranslation() {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/translate?text=${encodeURIComponent(verseText)}`);
      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || 'Translation failed');
      }

      const result: string = data.translatedText;
      setTranslated(result);
      setIsVisible(true);

      // Simpan ke localStorage
      try {
        localStorage.setItem(cacheKey, result);
      } catch {
        // ignore storage errors
      }
    } catch {
      onError('Gagal menerjemahkan, coba lagi nanti');
    } finally {
      setIsLoading(false);
    }
  }

  function handleClick() {
    if (isVisible) {
      setIsVisible(false);
    } else if (translated) {
      setIsVisible(true);
    } else {
      fetchTranslation();
    }
  }

  const buttonLabel = isLoading ? 'Memuat...' : isVisible ? 'Sembunyikan' : 'Terjemahkan';

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={isLoading}
        aria-label={buttonLabel}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem',
          padding: '0.4rem 0.85rem',
          borderRadius: '6px',
          border: '1px solid var(--border)',
          background: 'transparent',
          color: 'var(--text-main)',
          fontSize: '0.85rem',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          opacity: isLoading ? 0.6 : 1,
          transition: 'all 0.2s ease',
        }}
      >
        {isLoading && (
          <span
            aria-hidden="true"
            style={{
              display: 'inline-block',
              width: '0.85rem',
              height: '0.85rem',
              border: '2px solid var(--border)',
              borderTopColor: 'var(--accent)',
              borderRadius: '50%',
              animation: 'spin 0.7s linear infinite',
            }}
          />
        )}
        {buttonLabel}
      </button>

      <AnimatePresence>
        {isVisible && translated && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.4 }}
            style={{
              marginTop: '0.75rem',
              paddingTop: '0.75rem',
              borderTop: '1px solid var(--border)',
              color: 'var(--text-muted)',
              fontSize: '0.95rem',
              lineHeight: 1.6,
              fontStyle: 'italic',
            }}
          >
            {translated}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
