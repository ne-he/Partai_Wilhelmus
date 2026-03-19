'use client';

import { useEffect, useRef } from 'react';

const CHARS = ['0', '1', '>', '$', '#', '·'];
const COUNT = 120;

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  opacity: number;
  char: string | null; // null = dot
  color: string;
  fontSize: number;
}

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function createParticle(w: number, h: number): Particle {
  const isChar = Math.random() < 0.25;
  const colors = ['#00ff9d', '#00ffff', '#00cc7a'];
  return {
    x: rand(0, w),
    y: rand(0, h),
    vx: rand(-0.3, 0.3),
    vy: rand(-0.3, 0.3),
    r: isChar ? 0 : rand(1, 2.5),
    opacity: rand(0.15, 0.55),
    char: isChar ? CHARS[Math.floor(Math.random() * CHARS.length)] : null,
    color: colors[Math.floor(Math.random() * colors.length)],
    fontSize: rand(8, 13),
  };
}

export default function CyberParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    let rafId: number;
    let mouseX = -9999;
    let mouseY = -9999;

    function resize() {
      canvas!.width = window.innerWidth;
      canvas!.height = window.innerHeight;
    }
    resize();

    const particles: Particle[] = Array.from({ length: COUNT }, () =>
      createParticle(canvas!.width, canvas!.height)
    );

    function draw() {
      ctx.clearRect(0, 0, canvas!.width, canvas!.height);

      // Draw links between nearby particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(0,255,255,${0.06 * (1 - dist / 100)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      // Draw particles
      for (const p of particles) {
        // Mouse repulsion
        const dx = p.x - mouseX;
        const dy = p.y - mouseY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 100 && dist > 0) {
          const force = (100 - dist) / 100;
          p.vx += (dx / dist) * force * 1.5;
          p.vy += (dy / dist) * force * 1.5;
        }

        p.vx *= 0.97;
        p.vy *= 0.97;
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = canvas!.width;
        if (p.x > canvas!.width) p.x = 0;
        if (p.y < 0) p.y = canvas!.height;
        if (p.y > canvas!.height) p.y = 0;

        if (p.char) {
          ctx.font = `${p.fontSize}px monospace`;
          ctx.fillStyle = p.color.replace(')', `,${p.opacity})`).replace('rgb', 'rgba');
          // parse hex to rgba
          const hex = p.color.replace('#', '');
          const r = parseInt(hex.slice(0, 2), 16);
          const g = parseInt(hex.slice(2, 4), 16);
          const b = parseInt(hex.slice(4, 6), 16);
          ctx.fillStyle = `rgba(${r},${g},${b},${p.opacity})`;
          ctx.fillText(p.char, p.x, p.y);
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          const hex = p.color.replace('#', '');
          const r = parseInt(hex.slice(0, 2), 16);
          const g = parseInt(hex.slice(2, 4), 16);
          const b = parseInt(hex.slice(4, 6), 16);
          ctx.fillStyle = `rgba(${r},${g},${b},${p.opacity})`;
          // Glow for dots
          ctx.shadowBlur = 6;
          ctx.shadowColor = p.color;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }

      rafId = requestAnimationFrame(draw);
    }

    rafId = requestAnimationFrame(draw);

    const onMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('resize', resize);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
      }}
      aria-hidden="true"
    />
  );
}
