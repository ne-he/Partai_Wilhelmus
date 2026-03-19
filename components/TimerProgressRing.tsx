'use client';

import { motion } from 'framer-motion';

interface TimerProgressRingProps {
  timeLeft: number;
  totalTime: number;
  isRunning: boolean;
}

export default function TimerProgressRing({
  timeLeft,
  totalTime,
  isRunning,
}: TimerProgressRingProps) {
  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const progress = timeLeft / totalTime;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <svg width="280" height="280" viewBox="0 0 280 280">
      {/* Background circle */}
      <circle
        cx="140"
        cy="140"
        r={radius}
        fill="none"
        stroke="var(--border)"
        strokeWidth="8"
      />

      {/* Progress circle */}
      <motion.circle
        cx="140"
        cy="140"
        r={radius}
        fill="none"
        stroke="var(--accent)"
        strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        transform="rotate(-90 140 140)"
        animate={{
          strokeDashoffset,
          opacity: isRunning ? [1, 0.8, 1] : 1,
        }}
        transition={{
          strokeDashoffset: { duration: 1, ease: 'linear' },
          opacity: { duration: 2, repeat: Infinity },
        }}
      />
    </svg>
  );
}
