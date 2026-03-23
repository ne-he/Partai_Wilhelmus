import React from 'react';

interface SkeletonProps {
  variant: 'task-card' | 'task-list' | 'verse-card';
  count?: number;
}

const pulseStyle: React.CSSProperties = {
  animation: 'pulse 1.5s ease-in-out infinite',
  background: 'linear-gradient(135deg, var(--bg-card), var(--bg-card2))',
  borderRadius: '8px',
};

function TaskCardSkeleton() {
  return (
    <div
      style={{
        ...pulseStyle,
        padding: '1rem',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.6rem',
      }}
    >
      {/* Title bar */}
      <div style={{ ...pulseStyle, height: '14px', width: '70%', borderRadius: '4px' }} />
      {/* Subtitle bar */}
      <div style={{ ...pulseStyle, height: '12px', width: '45%', borderRadius: '4px' }} />
      {/* Bottom row */}
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
        <div style={{ ...pulseStyle, height: '10px', width: '30%', borderRadius: '4px' }} />
        <div style={{ ...pulseStyle, height: '10px', width: '20%', borderRadius: '4px' }} />
      </div>
    </div>
  );
}

function TaskListSkeleton() {
  return (
    <div
      style={{
        ...pulseStyle,
        padding: '0.75rem 1rem',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
      }}
    >
      {/* Avatar / icon placeholder */}
      <div style={{ ...pulseStyle, width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0 }} />
      {/* Text lines */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        <div style={{ ...pulseStyle, height: '12px', width: '60%', borderRadius: '4px' }} />
        <div style={{ ...pulseStyle, height: '10px', width: '35%', borderRadius: '4px' }} />
      </div>
      {/* Status badge placeholder */}
      <div style={{ ...pulseStyle, height: '22px', width: '64px', borderRadius: '12px', flexShrink: 0 }} />
    </div>
  );
}

function VerseCardSkeleton() {
  return (
    <div
      style={{
        ...pulseStyle,
        padding: '1.5rem',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
      }}
    >
      {/* Verse lines */}
      <div style={{ ...pulseStyle, height: '14px', width: '90%', borderRadius: '4px' }} />
      <div style={{ ...pulseStyle, height: '14px', width: '80%', borderRadius: '4px' }} />
      <div style={{ ...pulseStyle, height: '14px', width: '85%', borderRadius: '4px' }} />
      <div style={{ ...pulseStyle, height: '14px', width: '55%', borderRadius: '4px' }} />
      {/* Reference line */}
      <div style={{ ...pulseStyle, height: '11px', width: '30%', borderRadius: '4px', marginTop: '0.5rem' }} />
    </div>
  );
}

const VARIANT_MAP = {
  'task-card': TaskCardSkeleton,
  'task-list': TaskListSkeleton,
  'verse-card': VerseCardSkeleton,
};

export default function Skeleton({ variant, count = 1 }: SkeletonProps) {
  const SkeletonItem = VARIANT_MAP[variant];
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <SkeletonItem key={i} />
      ))}
    </>
  );
}
