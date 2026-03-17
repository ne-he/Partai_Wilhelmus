"use client";

import { useEffect, useRef, useCallback } from "react";

const THEMES = {
  vintage: {
    face: "#2a2218",
    bezel: "#3d3020",
    bezelborder: "#5a4830",
    innerShadow: "#1a1510",
    numbers: "#c8a96e",
    ticks: "#9c8a72",
    ticksMajor: "#c8a96e",
    hourHand: "#c8a96e",
    minuteHand: "#c8a96e",
    secondHand: "#e07050",
    center: "#c8a96e",
    centerInner: "#2a2218",
  },
  minimal: {
    face: "#111111",
    bezel: "#1a1a1a",
    bezelborder: "#2a2a2a",
    innerShadow: "#080808",
    numbers: "#e0e0e0",
    ticks: "#555555",
    ticksMajor: "#888888",
    hourHand: "#e0e0e0",
    minuteHand: "#e0e0e0",
    secondHand: "#ffffff",
    center: "#ffffff",
    centerInner: "#111111",
  },
  stellar: {
    face: "#050520",
    bezel: "#0a0a30",
    bezelborder: "#1a1a50",
    innerShadow: "#020210",
    numbers: "#7090e0",
    ticks: "#3050a0",
    ticksMajor: "#5070c0",
    hourHand: "#7090e0",
    minuteHand: "#7090e0",
    secondHand: "#a0c0ff",
    center: "#7090e0",
    centerInner: "#050520",
  },
};

function getAriaLabel(h, m, s) {
  return `Jam ${h} lewat ${m} menit ${s} detik`;
}

function getHandAngles(date) {
  const h = date.getHours() % 12;
  const m = date.getMinutes();
  const s = date.getSeconds();
  const ms = date.getMilliseconds();
  return {
    seconds: s * 6,
    minutes: m * 6 + s * 0.1,
    hours: h * 30 + m * 0.5,
    h: date.getHours(),
    m,
    s,
    ms,
  };
}

export default function AnalogClock({ theme = "vintage", reducedMotion = false }) {
  const palette = THEMES[theme] || THEMES.vintage;

  const svgRef = useRef(null);
  const rafRef = useRef(null);
  const intervalRef = useRef(null);

  const updateHands = useCallback(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const now = new Date();
    const { seconds, minutes, hours, h, m, s } = getHandAngles(now);

    const hourHand = svg.querySelector("#hour-hand");
    const minuteHand = svg.querySelector("#minute-hand");
    const secondHand = svg.querySelector("#second-hand");
    const ariaEl = svg.closest("[data-clock-wrapper]");

    if (hourHand) hourHand.setAttribute("transform", `rotate(${hours}, 150, 150)`);
    if (minuteHand) minuteHand.setAttribute("transform", `rotate(${minutes}, 150, 150)`);
    if (secondHand) secondHand.setAttribute("transform", `rotate(${seconds}, 150, 150)`);

    if (ariaEl) {
      ariaEl.setAttribute("aria-label", getAriaLabel(h, m, s));
    }
  }, []);

  useEffect(() => {
    if (reducedMotion) {
      updateHands();
      intervalRef.current = setInterval(updateHands, 1000);
    } else {
      const loop = () => {
        updateHands();
        rafRef.current = requestAnimationFrame(loop);
      };
      rafRef.current = requestAnimationFrame(loop);
    }

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [reducedMotion, updateHands]);

  // Initial time for SSR/first render
  const now = new Date();
  const { seconds: initS, minutes: initM, hours: initH, h, m, s } = getHandAngles(now);

  const cx = 150;
  const cy = 150;
  const r = 130;

  // Generate tick marks
  const ticks = [];
  for (let i = 0; i < 60; i++) {
    const isMajor = i % 5 === 0;
    const angle = (i * 6 * Math.PI) / 180;
    const outerR = r - 4;
    const innerR = isMajor ? outerR - 8 : outerR - 4;
    const x1 = cx + outerR * Math.sin(angle);
    const y1 = cy - outerR * Math.cos(angle);
    const x2 = cx + innerR * Math.sin(angle);
    const y2 = cy - innerR * Math.cos(angle);
    ticks.push(
      <line
        key={i}
        x1={x1} y1={y1}
        x2={x2} y2={y2}
        stroke={isMajor ? palette.ticksMajor : palette.ticks}
        strokeWidth={isMajor ? 2 : 1}
        strokeLinecap="round"
      />
    );
  }

  // Generate hour numbers
  const numbers = [];
  for (let i = 1; i <= 12; i++) {
    const angle = ((i * 30 - 90) * Math.PI) / 180;
    const numR = r - 22;
    const nx = cx + numR * Math.cos(angle);
    const ny = cy + numR * Math.sin(angle);
    numbers.push(
      <text
        key={i}
        x={nx}
        y={ny}
        textAnchor="middle"
        dominantBaseline="central"
        fill={palette.numbers}
        fontSize="13"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontWeight="bold"
      >
        {i}
      </text>
    );
  }

  return (
    <div
      data-clock-wrapper=""
      aria-label={getAriaLabel(h, m, s)}
      role="img"
      style={{ width: 280, height: 280, display: "inline-block" }}
    >
      <svg
        ref={svgRef}
        viewBox="0 0 300 300"
        width="280"
        height="280"
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: "block" }}
      >
        <defs>
          {/* Face drop shadow */}
          <filter id="face-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor="#000000" floodOpacity="0.6" />
          </filter>
          {/* Hand drop shadow */}
          <filter id="hand-shadow" x="-40%" y="-40%" width="180%" height="180%">
            <feDropShadow dx="1" dy="2" stdDeviation="3" floodColor="#000000" floodOpacity="0.7" />
          </filter>
          {/* Second hand shadow */}
          <filter id="second-shadow" x="-40%" y="-40%" width="180%" height="180%">
            <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="#000000" floodOpacity="0.5" />
          </filter>
          {/* Bezel gradient */}
          <radialGradient id="bezel-grad" cx="40%" cy="35%" r="65%">
            <stop offset="0%" stopColor={palette.bezelborder} />
            <stop offset="60%" stopColor={palette.bezel} />
            <stop offset="100%" stopColor={palette.innerShadow} />
          </radialGradient>
          {/* Face gradient */}
          <radialGradient id="face-grad" cx="40%" cy="35%" r="70%">
            <stop offset="0%" stopColor={lighten(palette.face, 18)} />
            <stop offset="50%" stopColor={palette.face} />
            <stop offset="100%" stopColor={darken(palette.face, 10)} />
          </radialGradient>
          {/* Center cap gradient */}
          <radialGradient id="center-grad" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor={lighten(palette.center, 30)} />
            <stop offset="100%" stopColor={palette.center} />
          </radialGradient>
        </defs>

        {/* Outer bezel ring */}
        <circle cx={cx} cy={cy} r={r + 14} fill="url(#bezel-grad)" filter="url(#face-shadow)" />

        {/* Bezel border highlight */}
        <circle cx={cx} cy={cy} r={r + 14} fill="none" stroke={palette.bezelborder} strokeWidth="1.5" opacity="0.6" />

        {/* Inner bezel shadow ring */}
        <circle cx={cx} cy={cy} r={r + 4} fill={palette.innerShadow} opacity="0.8" />

        {/* Clock face */}
        <circle cx={cx} cy={cy} r={r} fill="url(#face-grad)" />

        {/* Inner shadow ring for depth */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={palette.innerShadow} strokeWidth="4" opacity="0.5" />

        {/* Subtle inner glow ring */}
        <circle cx={cx} cy={cy} r={r - 6} fill="none" stroke={palette.ticks} strokeWidth="0.5" opacity="0.3" />

        {/* Tick marks */}
        {ticks}

        {/* Hour numbers */}
        {numbers}

        {/* Hour hand */}
        <g id="hour-hand" transform={`rotate(${initH}, ${cx}, ${cy})`} filter="url(#hand-shadow)">
          <polygon
            points={`${cx - 3},${cy + 18} ${cx + 3},${cy + 18} ${cx + 3.5},${cy - 68} ${cx},${cy - 72} ${cx - 3.5},${cy - 68}`}
            fill={palette.hourHand}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Hour hand tip cap */}
          <circle cx={cx} cy={cy - 70} r="3.5" fill={palette.hourHand} />
          {/* Hour hand base cap */}
          <circle cx={cx} cy={cy + 16} r="3" fill={palette.hourHand} />
        </g>

        {/* Minute hand */}
        <g id="minute-hand" transform={`rotate(${initM}, ${cx}, ${cy})`} filter="url(#hand-shadow)">
          <polygon
            points={`${cx - 2},${cy + 22} ${cx + 2},${cy + 22} ${cx + 2.5},${cy - 92} ${cx},${cy - 96} ${cx - 2.5},${cy - 92}`}
            fill={palette.minuteHand}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Minute hand tip cap */}
          <circle cx={cx} cy={cy - 94} r="2.5" fill={palette.minuteHand} />
          {/* Minute hand base cap */}
          <circle cx={cx} cy={cy + 20} r="2" fill={palette.minuteHand} />
        </g>

        {/* Second hand */}
        <g id="second-hand" transform={`rotate(${initS}, ${cx}, ${cy})`} filter="url(#second-shadow)">
          {/* Counterweight tail */}
          <rect
            x={cx - 1}
            y={cy + 10}
            width="2"
            height="20"
            rx="1"
            fill={palette.secondHand}
          />
          <line
            x1={cx} y1={cy - 105}
            x2={cx} y2={cy + 10}
            stroke={palette.secondHand}
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          {/* Counterweight accent circle */}
          <circle cx={cx} cy={cy + 22} r="3" fill={palette.secondHand} />
        </g>

        {/* Center cap — on top of all hands */}
        <circle cx={cx} cy={cy} r="8" fill="url(#center-grad)" />
        <circle cx={cx} cy={cy} r="4" fill={palette.centerInner} />
        <circle cx={cx} cy={cy} r="8" fill="none" stroke={palette.center} strokeWidth="1" opacity="0.6" />
      </svg>
    </div>
  );
}

// Utility: lighten a hex color by amount (0-100)
function lighten(hex, amount) {
  return adjustColor(hex, amount);
}

// Utility: darken a hex color by amount (0-100)
function darken(hex, amount) {
  return adjustColor(hex, -amount);
}

function adjustColor(hex, amount) {
  const h = hex.replace("#", "");
  if (h.length !== 6) return hex;
  const r = Math.min(255, Math.max(0, parseInt(h.slice(0, 2), 16) + amount));
  const g = Math.min(255, Math.max(0, parseInt(h.slice(2, 4), 16) + amount));
  const b = Math.min(255, Math.max(0, parseInt(h.slice(4, 6), 16) + amount));
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}
