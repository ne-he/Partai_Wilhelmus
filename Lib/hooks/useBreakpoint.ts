import { useState, useEffect } from 'react';

/**
 * Hook untuk mendeteksi breakpoint layar.
 * Reaktif: state diperbarui saat lebar layar melewati breakpoint 768px.
 * Handle SSR: aman digunakan di server (window tidak tersedia).
 *
 * Requirements: 7.1, 11.4
 */
function useBreakpoint(): { isMobile: boolean } {
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    // SSR guard: window tidak tersedia di server
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(max-width: 767px)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(max-width: 767px)');

    const handleChange = (event: MediaQueryListEvent) => {
      setIsMobile(event.matches);
    };

    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  return { isMobile };
}

export default useBreakpoint;
