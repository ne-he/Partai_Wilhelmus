"use client";

import { useEffect, useRef, useCallback } from "react";

const PARTICLE_COUNT_DESKTOP = 80;
const PARTICLE_COUNT_MOBILE = 40;
const REPULSION_RADIUS = 120;

function getParticleColors(theme) {
  switch (theme) {
    case "stellar":
      return ["#c8d8f0", "#ffffff"];
    case "minimal":
      return ["rgba(80,80,80,0.4)"];
    case "vintage":
    default:
      return ["#c8a96e", "#9c8a72"];
  }
}

function createParticle(width, height, theme, index, total) {
  const colors = getParticleColors(theme);
  const color = colors[Math.floor(Math.random() * colors.length)];
  const isStellar = theme === "stellar";
  const isStellarLarge = isStellar && index < total * 0.2;

  let r, baseOpacity;
  if (isStellarLarge) {
    r = 2 + Math.random() * 2; // 2–4px
    baseOpacity = 0.4 + Math.random() * 0.4;
  } else if (isStellar) {
    r = 1 + Math.random() * 2; // 1–3px
    baseOpacity = 0.2 + Math.random() * 0.6;
  } else if (theme === "vintage") {
    r = 1 + Math.random() * 2;
    baseOpacity = 0.3 + Math.random() * 0.4;
  } else {
    r = 1 + Math.random() * 2;
    baseOpacity = 0.4;
  }

  // Vintage: slower drift
  const speedFactor = theme === "vintage" ? 0.3 : 1;
  const vx = (Math.random() - 0.5) * 1.5 * speedFactor;
  const vy = (Math.random() - 0.5) * 1.5 * speedFactor;

  return {
    x: Math.random() * width,
    y: Math.random() * height,
    vx,
    vy,
    r,
    opacity: baseOpacity,
    baseOpacity,
    color,
    isStellarLarge,
    twinkleOffset: Math.random() * Math.PI * 2,
  };
}

export default function ParticleCanvas({ theme = "vintage", reducedMotion = false }) {
  const canvasRef = useRef(null);
  const stateRef = useRef({
    particles: [],
    rafId: null,
    mouseX: -9999,
    mouseY: -9999,
    frame: 0,
  });

  const initParticles = useCallback((canvas) => {
    const isMobile = window.innerWidth < 768;
    const count = isMobile ? PARTICLE_COUNT_MOBILE : PARTICLE_COUNT_DESKTOP;
    const particles = [];
    for (let i = 0; i < count; i++) {
      particles.push(createParticle(canvas.width, canvas.height, theme, i, count));
    }
    stateRef.current.particles = particles;
  }, [theme]);

  const drawStatic = useCallback((canvas) => {
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const p of stateRef.current.particles) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = buildFillStyle(p, theme, 0);
      ctx.fill();
    }
  }, [theme]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    initParticles(canvas);

    if (reducedMotion) {
      drawStatic(canvas);
      return;
    }

    const ctx = canvas.getContext("2d");

    function animate() {
      const { particles, mouseX, mouseY } = stateRef.current;
      stateRef.current.frame++;
      const frame = stateRef.current.frame;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const p of particles) {
        // Mouse repulsion
        const dx = p.x - mouseX;
        const dy = p.y - mouseY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < REPULSION_RADIUS && dist > 0) {
          const force = (REPULSION_RADIUS - dist) / REPULSION_RADIUS;
          p.vx += (dx / dist) * force * 2;
          p.vy += (dy / dist) * force * 2;
        }

        // Velocity damping
        p.vx *= 0.98;
        p.vy *= 0.98;

        // Update position
        p.x += p.vx;
        p.y += p.vy;

        // Wrap edges
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        // Draw
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = buildFillStyle(p, theme, frame);
        ctx.fill();
      }

      stateRef.current.rafId = requestAnimationFrame(animate);
    }

    stateRef.current.rafId = requestAnimationFrame(animate);

    function onMouseMove(e) {
      stateRef.current.mouseX = e.clientX;
      stateRef.current.mouseY = e.clientY;
    }

    function onResize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initParticles(canvas);
    }

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("resize", onResize);

    return () => {
      if (stateRef.current.rafId) cancelAnimationFrame(stateRef.current.rafId);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", onResize);
    };
  }, [theme, reducedMotion, initParticles, drawStatic]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
        pointerEvents: "none",
      }}
      aria-hidden="true"
    />
  );
}

function buildFillStyle(p, theme, frame) {
  if (theme === "minimal") {
    return "rgba(80,80,80,0.4)";
  }

  if (theme === "stellar" && p.isStellarLarge) {
    // Twinkle: opacity oscillates with sin
    const twinkle = 0.3 + 0.5 * (0.5 + 0.5 * Math.sin(frame * 0.05 + p.twinkleOffset));
    return hexToRgba(p.color, twinkle);
  }

  return hexToRgba(p.color, p.baseOpacity);
}

function hexToRgba(color, opacity) {
  // Already rgba string
  if (color.startsWith("rgba")) return color;
  // hex
  const hex = color.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${opacity})`;
}
