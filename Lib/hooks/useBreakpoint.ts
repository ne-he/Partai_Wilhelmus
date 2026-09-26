import { useSyncExternalStore } from 'react';

const MOBILE_QUERY = '(max-width: 767px)';

function subscribe(onChange: () => void) {
  const mediaQuery = window.matchMedia(MOBILE_QUERY);
  mediaQuery.addEventListener('change', onChange);
  return () => mediaQuery.removeEventListener('change', onChange);
}

function getSnapshot() {
  return window.matchMedia(MOBILE_QUERY).matches;
}

// Server tidak tahu lebar layar. Saat hydration React pakai nilai ini dulu,
// baru render ulang dengan nilai asli, jadi HTML server dan client tidak mismatch (React #418).
function getServerSnapshot() {
  return false;
}

/**
 * Hook untuk mendeteksi breakpoint layar.
 * Reaktif: state diperbarui saat lebar layar melewati breakpoint 768px.
 * Handle SSR: aman digunakan di server (window tidak tersedia).
 *
 * Requirements: 7.1, 11.4
 */
function useBreakpoint(): { isMobile: boolean } {
  const isMobile = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return { isMobile };
}

export default useBreakpoint;
