'use client';

// Req 12.1: Tambah opsi "Light" ke array THEMES
const THEMES = [
  { name: 'Vintage', swatch: '#c8a96e' },
  { name: 'Minimal', swatch: '#ffffff' },
  { name: 'Stellar', swatch: '#7090e0' },
  { name: 'Light', swatch: '#f9f7f5' },
];

// ThemePicker menerima props `theme` dan `onThemeChange` dari parent (home/page.js).
// Persistensi dikelola oleh useTheme hook di parent — tidak ada logika localStorage manual di sini.
export default function ThemePicker({ theme, onThemeChange }) {
  function handleSelect(name) {
    onThemeChange(name);
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '2rem',
      right: '2rem',
      zIndex: 10,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-end',
      gap: '6px',
    }}>
      <span style={{
        fontSize: '0.6rem',
        letterSpacing: '2px',
        color: 'var(--text-muted)',
        textTransform: 'uppercase',
      }}>
        THEME
      </span>

      <div style={{
        display: 'flex',
        flexDirection: 'row',
        gap: '4px',
        background: 'rgba(0,0,0,0.3)',
        backdropFilter: 'blur(8px)',
        borderRadius: '30px',
        padding: '4px',
        border: '1px solid rgba(255,255,255,0.05)',
      }}>
        {THEMES.map(({ name, swatch }) => {
          const isActive = theme === name;
          return (
            <button
              key={name}
              aria-pressed={isActive}
              onClick={() => handleSelect(name)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: isActive ? 'rgba(200,169,110,0.1)' : 'transparent',
                border: isActive
                  ? '1px solid var(--accent)'
                  : '1px solid rgba(255,255,255,0.1)',
                borderRadius: '20px',
                padding: '6px 12px',
                fontSize: '0.7rem',
                letterSpacing: '1px',
                cursor: 'pointer',
                color: isActive ? 'var(--text-main)' : 'var(--text-muted)',
                transition: 'filter 0.15s ease',
              }}
              onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.3)'}
              onMouseLeave={e => e.currentTarget.style.filter = 'brightness(1)'}
            >
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: swatch,
                flexShrink: 0,
                border: name === 'Light' ? '1px solid rgba(0,0,0,0.15)' : 'none',
              }} />
              {name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
