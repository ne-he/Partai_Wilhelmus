'use client';

import { usePathname } from 'next/navigation';
import Navigation from './Navigation';

/**
 * Client wrapper untuk Navigation agar bisa menggunakan usePathname()
 * di dalam Server Component layout.
 */
export default function NavigationWrapper() {
  const pathname = usePathname();
  // Mode spectate punya navigasi sendiri, bottom-nav mengarah ke halaman yang butuh login.
  if (pathname === '/spectate') return null;
  return <Navigation currentPath={pathname} />;
}
