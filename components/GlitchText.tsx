'use client';

import { useState, ElementType, CSSProperties } from 'react';

interface GlitchTextProps {
  children: string;
  as?: ElementType;
  style?: CSSProperties;
  className?: string;
}

export default function GlitchText({ children, as: Tag = 'span', style, className }: GlitchTextProps) {
  const [glitching, setGlitching] = useState(false);

  return (
    <>
      <Tag
        className={className}
        onMouseEnter={() => setGlitching(true)}
        onMouseLeave={() => setGlitching(false)}
        style={{
          position: 'relative',
          display: 'inline-block',
          cursor: 'default',
          ...style,
        }}
      >
        {/* Main text */}
        <span style={{ position: 'relative', zIndex: 1 }}>{children}</span>

        {/* Red glitch layer */}
        {glitching && (
          <span
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              color: '#ff3b3b',
              clipPath: 'polygon(0 20%, 100% 20%, 100% 40%, 0 40%)',
              transform: 'translate(-3px, 2px)',
              opacity: 0.8,
              animation: 'glitch-r 0.15s steps(2) infinite',
              pointerEvents: 'none',
              zIndex: 2,
              ...style,
            }}
          >
            {children}
          </span>
        )}

        {/* Cyan glitch layer */}
        {glitching && (
          <span
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              color: '#00ffff',
              clipPath: 'polygon(0 60%, 100% 60%, 100% 80%, 0 80%)',
              transform: 'translate(3px, -2px)',
              opacity: 0.8,
              animation: 'glitch-c 0.12s steps(2) infinite',
              pointerEvents: 'none',
              zIndex: 2,
              ...style,
            }}
          >
            {children}
          </span>
        )}
      </Tag>

      <style jsx global>{`
        @keyframes glitch-r {
          0%   { transform: translate(-3px, 2px); clip-path: polygon(0 20%, 100% 20%, 100% 40%, 0 40%); }
          50%  { transform: translate(3px, -1px); clip-path: polygon(0 55%, 100% 55%, 100% 70%, 0 70%); }
          100% { transform: translate(-2px, 3px); clip-path: polygon(0 10%, 100% 10%, 100% 30%, 0 30%); }
        }
        @keyframes glitch-c {
          0%   { transform: translate(3px, -2px); clip-path: polygon(0 60%, 100% 60%, 100% 80%, 0 80%); }
          50%  { transform: translate(-3px, 1px); clip-path: polygon(0 30%, 100% 30%, 100% 50%, 0 50%); }
          100% { transform: translate(2px, -3px); clip-path: polygon(0 70%, 100% 70%, 100% 90%, 0 90%); }
        }
      `}</style>
    </>
  );
}
