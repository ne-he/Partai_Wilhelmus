'use client';

import React from 'react';

interface AccentPickerProps {
  currentAccent: string;
  onAccentChange: (hex: string) => void;
}

export default function AccentPicker({ currentAccent, onAccentChange }: AccentPickerProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const hex = e.target.value;
    document.documentElement.style.setProperty('--accent', hex);
    onAccentChange(hex);
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <label
        htmlFor="accent-picker"
        style={{ fontSize: '0.875rem', color: 'var(--text-main)', cursor: 'pointer' }}
      >
        Accent Color
      </label>
      <input
        id="accent-picker"
        type="color"
        value={currentAccent}
        onChange={handleChange}
        aria-label="Choose accent color"
        style={{
          width: '2rem',
          height: '2rem',
          border: 'none',
          borderRadius: '50%',
          cursor: 'pointer',
          padding: 0,
          background: 'none',
        }}
      />
    </div>
  );
}
