'use client';

import { useState, useEffect } from 'react';

// Requirement 4.2–4.5: nickname per family role (role comes from the
// user's own row in the users table, so no email addresses live in the code)
export const GREETING_MAP = {
  papa: 'Abah',
  mama: 'Emak',
  nemi: 'Tuan Muda',
  venly: 'Penly',
};

// Requirement 4.1: determine time period from hour (0–23)
export function getTimePeriod(hour) {
  if (hour >= 5 && hour <= 11) return 'Morning';
  if (hour >= 12 && hour <= 17) return 'Afternoon';
  if (hour >= 18 && hour <= 20) return 'Evening';
  return 'Night'; // 21–4
}

// Requirement 4.2–4.7: build full greeting string
export function getGreeting(email, hour, role) {
  const period = getTimePeriod(hour);
  const name = GREETING_MAP[role] ?? (email ? email.split('@')[0] : 'Friend');
  return `Good ${period} ${name}`;
}

function getCurrentDate() {
  return new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function GreetingText({ email, role }) {
  const [greeting, setGreeting] = useState('');
  const [dateStr, setDateStr] = useState('');

  function refresh() {
    const now = new Date();
    setGreeting(getGreeting(email, now.getHours(), role));
    setDateStr(getCurrentDate());
  }

  useEffect(() => {
    refresh();
    // Requirement 4.6: auto-update every minute so period changes are reflected
    const timer = setInterval(refresh, 60000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email, role]);

  // Split greeting into "Good Morning" part and name part for styling
  const parts = greeting.split(' ');
  // name is the last token(s); "Good <Period>" is the first two tokens
  const periodPart = parts.slice(0, 2).join(' ');   // e.g. "Good Morning"
  const namePart = parts.slice(2).join(' ');         // e.g. "Abah" or "Tuan Muda"

  return (
    // Requirement 8.2: aria-live for screen reader announcements
    <div
      aria-live="polite"
      style={{
        textAlign: 'center',
        lineHeight: 1.3,
      }}
    >
      <div
        style={{
          fontSize: '1.6rem',
          color: 'var(--text-muted)',
          fontFamily: 'Georgia, serif',
          letterSpacing: '0.05em',
        }}
      >
        {periodPart}
      </div>
      <div
        style={{
          fontSize: '2.4rem',
          fontWeight: 'bold',
          color: 'var(--accent)',
          fontFamily: 'Georgia, serif',
          letterSpacing: '0.08em',
        }}
      >
        {namePart}
      </div>
      <div
        style={{
          marginTop: '0.5rem',
          fontSize: '0.95rem',
          color: 'var(--text-muted)',
          fontFamily: 'Georgia, serif',
          letterSpacing: '0.04em',
        }}
      >
        {dateStr}
      </div>
    </div>
  );
}
