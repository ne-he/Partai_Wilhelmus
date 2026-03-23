import { useState, useEffect } from 'react';

/**
 * Hook untuk mendeteksi preferensi `prefers-reduced-motion` dari sistem pengguna.
 * Reaktif: state diperbarui saat media query berubah.
 * Handle SSR: aman digunakan di server (window tidak tersedia).
 *
 * Requirements: 6.1, 6.4, 6.5
 */
function useReducedMotion(): { shouldReduceMotion: boolean } {
  const [shouldReduceMotion, setShouldReduceMotion] = useState<boolean>(() => {
    // SSR guard: window tidak tersedia di server
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const handleChange = (event: MediaQueryListEvent) => {
      setShouldReduceMotion(event.matches);
    };

    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  return { shouldReduceMotion };
}

export default useReducedMotion;
