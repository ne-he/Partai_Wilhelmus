"use client";

import { useEffect, useRef } from "react";

interface Star {
  x: number;
  y: number;
  radius: number;
  alpha: number;
  delta: number; // speed of twinkle
  color: string;
  twinkleOffset: number;
}

interface TwinklingStarsProps {
  theme?: string;
  reducedMotion?: boolean;
}

function getStarColors(theme: string): string[] {
  switch (theme) {
    case "stellar":
      return ["#f0e6d3", "#c8a96e", "#ffffff", "#e8d5b0"];
    case "light":
      return ["#888888", "#aaaaaa", "#c8a96e"];
    case "minimal":
      return ["#aaaaaa", "#888888", "#4a7fa5"];
    default:
      // vintage / dark
      return ["#f0e6d3", "#c8a96e", "#ffffff"];
  }
}

function getStarOpacityRange(theme: string): [number, number] {
  // [min, max] — lebih redup di tema terang agar tidak mengganggu
  if (theme === "light") return [0.08, 0.3];
  if (theme === "minimal") return [0.1, 0.35];
  return [0.15, 0.85];
}

export default function TwinklingStars({ theme = "vintage", reducedMotion = false }: TwinklingStarsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const starsRef = useRef<Star[]>([]);
  const frameRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    function resize() {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initStars();
    }

    function initStars() {
      if (!canvas) return;
      const colors = getStarColors(theme);
      const [minAlpha, maxAlpha] = getStarOpacityRange(theme);
      const count = window.innerWidth < 768 ? 55 : 90;
      starsRef.current = Array.from({ length: count }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: 0.8 + Math.random() * 2.2,
        alpha: minAlpha + Math.random() * (maxAlpha - minAlpha),
        delta: 0.003 + Math.random() * 0.012, // twinkle speed
        color: colors[Math.floor(Math.random() * colors.length)],
        twinkleOffset: Math.random() * Math.PI * 2,
      }));
    }

    resize();
    window.addEventListener("resize", resize);

    if (reducedMotion) {
      // Draw static snapshot
      const [minAlpha] = getStarOpacityRange(theme);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const s of starsRef.current) {
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
        ctx.fillStyle = hexToRgba(s.color, minAlpha + 0.1);
        ctx.fill();
      }
      return () => window.removeEventListener("resize", resize);
    }

    function animate() {
      if (!canvas || !ctx) return;
      frameRef.current++;
      const f = frameRef.current;
      const [minAlpha, maxAlpha] = getStarOpacityRange(theme);
      const range = maxAlpha - minAlpha;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const s of starsRef.current) {
        // Smooth sinusoidal twinkle
        const alpha = minAlpha + (range / 2) * (1 + Math.sin(f * s.delta + s.twinkleOffset));

        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
        ctx.fillStyle = hexToRgba(s.color, alpha);
        ctx.fill();

        // Subtle glow for larger stars
        if (s.radius > 1.8) {
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.radius * 2.5, 0, Math.PI * 2);
          ctx.fillStyle = hexToRgba(s.color, alpha * 0.15);
          ctx.fill();
        }
      }

      rafRef.current = requestAnimationFrame(animate);
    }

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
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
  if (color.startsWith("rgba")) return color;
  const hex = color.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${opacity.toFixed(3)})`;
}
