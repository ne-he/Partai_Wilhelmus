"use client";

/**
 * TwinklingStars — partikel bintang interaktif untuk Daily Verse
 * Fitur: twinkle (alpha sinusoidal), gerakan Brownian, repulsi kursor
 * Warna & intensitas menyesuaikan tema aktif
 */

import { useEffect, useRef } from "react";

interface Star {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  alphaSpeed: number;
  color: string;
  twinkleOffset: number;
}

interface TwinklingStarsProps {
  theme?: string;
  reducedMotion?: boolean;
}

const REPULSION_RADIUS = 130;
const MAX_SPEED = 1.8;

function getStarColors(theme: string): string[] {
  switch (theme) {
    case "stellar":
      return ["#f0e6d3", "#c8a96e", "#ffffff", "#e8d5b0"];
    case "light":
      return ["#999999", "#bbbbbb", "#c8a96e", "#aaaaaa"];
    case "minimal":
      return ["#aaaaaa", "#888888", "#4a7fa5", "#6699bb"];
    default:
      return ["#f0e6d3", "#c8a96e", "#ffffff", "#d4b896"];
  }
}

function getAlphaRange(theme: string): [number, number] {
  if (theme === "light") return [0.1, 0.35];
  if (theme === "minimal") return [0.12, 0.4];
  return [0.2, 0.9];
}

function clamp(val: number, min: number, max: number) {
  return Math.min(Math.max(val, min), max);
}

export default function TwinklingStars({ theme = "vintage", reducedMotion = false }: TwinklingStarsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const starsRef = useRef<Star[]>([]);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const frameRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    function initStars() {
      if (!canvas) return;
      const colors = getStarColors(theme);
      const [minA, maxA] = getAlphaRange(theme);
      const isMobile = window.innerWidth < 768;
      const count = isMobile ? 50 : 80;

      starsRef.current = Array.from({ length: count }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        // kecepatan awal sangat kecil — gerakan Brownian
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        radius: 0.8 + Math.random() * 2.2,
        alpha: minA + Math.random() * (maxA - minA),
        alphaSpeed: (0.004 + Math.random() * 0.008) * (Math.random() < 0.5 ? 1 : -1),
        color: colors[Math.floor(Math.random() * colors.length)],
        twinkleOffset: Math.random() * Math.PI * 2,
      }));
    }

    function resize() {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initStars();
    }

    resize();
    window.addEventListener("resize", resize);

    // Mouse / touch tracking — posisi relatif ke window (canvas fixed)
    function onMouseMove(e: MouseEvent) {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    }
    function onTouchMove(e: TouchEvent) {
      if (e.touches[0]) {
        mouseRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    }
    function onMouseLeave() {
      mouseRef.current = { x: -9999, y: -9999 };
    }

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("mouseleave", onMouseLeave);

    // Static snapshot untuk reduced motion
    if (reducedMotion) {
      const [minA] = getAlphaRange(theme);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const s of starsRef.current) {
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
        ctx.fillStyle = hexToRgba(s.color, minA + 0.1);
        ctx.fill();
      }
      return () => {
        window.removeEventListener("resize", resize);
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("touchmove", onTouchMove);
        window.removeEventListener("mouseleave", onMouseLeave);
      };
    }

    function animate() {
      if (!canvas || !ctx) return;
      frameRef.current++;
      const f = frameRef.current;
      const [minA, maxA] = getAlphaRange(theme);
      const { x: mx, y: my } = mouseRef.current;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const s of starsRef.current) {
        // --- Gerakan Brownian: tambah noise kecil tiap frame ---
        s.vx += (Math.random() - 0.5) * 0.04;
        s.vy += (Math.random() - 0.5) * 0.04;

        // --- Repulsi kursor ---
        const dx = s.x - mx;
        const dy = s.y - my;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < REPULSION_RADIUS && dist > 0.5) {
          const force = ((REPULSION_RADIUS - dist) / REPULSION_RADIUS) * 1.6;
          s.vx += (dx / dist) * force;
          s.vy += (dy / dist) * force;
        }

        // --- Damping & clamp kecepatan ---
        s.vx *= 0.97;
        s.vy *= 0.97;
        s.vx = clamp(s.vx, -MAX_SPEED, MAX_SPEED);
        s.vy = clamp(s.vy, -MAX_SPEED, MAX_SPEED);

        // --- Update posisi ---
        s.x += s.vx;
        s.y += s.vy;

        // --- Bounce di tepi (lebih natural dari wrap) ---
        if (s.x < 0) { s.x = 0; s.vx *= -0.8; }
        if (s.x > canvas.width) { s.x = canvas.width; s.vx *= -0.8; }
        if (s.y < 0) { s.y = 0; s.vy *= -0.8; }
        if (s.y > canvas.height) { s.y = canvas.height; s.vy *= -0.8; }

        // --- Twinkle: alpha sinusoidal independen per bintang ---
        const alpha = minA + ((maxA - minA) / 2) * (1 + Math.sin(f * Math.abs(s.alphaSpeed) * 8 + s.twinkleOffset));

        // --- Gambar bintang ---
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
        ctx.fillStyle = hexToRgba(s.color, alpha);
        ctx.fill();

        // Glow halus untuk bintang lebih besar
        if (s.radius > 1.6) {
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.radius * 2.8, 0, Math.PI * 2);
          ctx.fillStyle = hexToRgba(s.color, alpha * 0.12);
          ctx.fill();
        }
      }

      rafRef.current = requestAnimationFrame(animate);
    }

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("mouseleave", onMouseLeave);
    };
  }, [theme, reducedMotion]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
        pointerEvents: "none",
      }}
    />
  );
}

function hexToRgba(color: string, opacity: number): string {
  if (color.startsWith("rgba") || color.startsWith("rgb")) return color;
  const hex = color.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${opacity.toFixed(3)})`;
}
