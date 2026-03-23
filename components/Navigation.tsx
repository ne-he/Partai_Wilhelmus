'use client';

import Link from 'next/link';
import useBreakpoint from '@/Lib/hooks/useBreakpoint';

/**
 * Bottom navigation bar untuk mobile.
 * Hanya ditampilkan saat isMobile=true.
 *
 * Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6
 */

interface NavigationProps {
  currentPath: string;
}

const NAV_ITEMS = [
  { label: 'Home',     href: '/home',        icon: '🏠' },
  { label: 'Personal', href: '/personal',    icon: '👤' },
  { label: 'Family',   href: '/family',      icon: '👨‍👩‍👧' },
  { label: 'Summary',  href: '/summary',     icon: '📖' },
  { label: 'Profile',  href: '/spectate/me', icon: '👤' },
];

export default function Navigation({ currentPath }: NavigationProps) {
  const { isMobile } = useBreakpoint();

  if (!isMobile) return null;

  return (
    <nav
      role="navigation"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        width: '100%',
        zIndex: 1000,
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        backgroundColor: 'var(--bg-card)',
        borderTop: '1px solid var(--border)',
        padding: '8px 0 env(safe-area-inset-bottom, 8px)',
      }}
    >
      {NAV_ITEMS.map(({ label, href, icon }) => {
        const isActive = currentPath === href;
        const color = isActive ? 'var(--accent)' : 'var(--text-muted)';

        return (
          <Link
            key={href}
            href={href}
            aria-label={label}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '2px',
              textDecoration: 'none',
              padding: '4px 12px',
              transition: 'all 0.15s ease',
            }}
          >
            <span style={{ fontSize: '1.4rem', lineHeight: 1, color }}>
              {icon}
            </span>
            <span
              style={{
                fontSize: '0.65rem',
                fontWeight: isActive ? 600 : 400,
                color,
                letterSpacing: '0.02em',
              }}
            >
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
