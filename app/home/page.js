"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../Lib/supabaseClient";
import { useRouter } from "next/navigation";
import Sidebar from "../../components/Sidebar";
import ParticleCanvas from "../../components/ParticleCanvas";
import AnalogClock from "../../components/AnalogClock";
import GreetingText from "../../components/GreetingText";
import ThemePicker from "../../components/ThemePicker";
import TaskSummary from "../../components/TaskSummary";

export const dynamic = "force-dynamic";

// Task 10.1: Theme CSS variable overrides
// Vintage uses existing globals.css vars — no override needed
// Minimal and Stellar override the CSS custom properties inline
const THEMES = {
  Vintage: {},
  Minimal: {
    "--bg-main": "#0d0d0d",
    "--text-main": "#e0e0e0",
    "--accent": "#ffffff",
    "--bg-card": "#111111",
    "--bg-card2": "#1a1a1a",
    "--border": "#2a2a2a",
    "--text-muted": "#888888",
  },
  Stellar: {
    "--bg-main": "#050510",
    "--text-main": "#c8d8f0",
    "--accent": "#7090e0",
    "--bg-card": "#0a0a20",
    "--bg-card2": "#0f0f28",
    "--border": "#1a1a40",
    "--text-muted": "#5070a0",
  },
};

// Task 9.3: Inline DigitalClock component
function DigitalClock() {
  const [time, setTime] = useState("");
  const [ariaTime, setAriaTime] = useState("");

  useEffect(() => {
    function tick() {
      const now = new Date();
      setTime(
        now.toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
      if (now.getSeconds() === 0) {
        setAriaTime(
          now.toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
          })
        );
      }
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{ textAlign: "center" }}>
      {/* aria-live region updated every minute for screen readers (Req 8.1) */}
      <span
        aria-live="polite"
        style={{ position: "absolute", width: 1, height: 1, overflow: "hidden" }}
      >
        {ariaTime}
      </span>
      <div
        style={{
          fontSize: "4rem",
          fontFamily: "Georgia, serif",
          color: "var(--accent)",
          letterSpacing: "0.1em",
          fontWeight: "normal",
        }}
      >
        {time}
      </div>
    </div>
  );
}

export default function HomePage() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  // Task 10.1: theme state uses capitalized keys matching ThemePicker
  const [theme, setTheme] = useState("Vintage");
  const [reducedMotion, setReducedMotion] = useState(false);
  // Task 9.2: showDigital toggle; defaults to true when reducedMotion is active
  const [showDigital, setShowDigital] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Req 8.5: detect OS-level prefers-reduced-motion on mount
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) {
      setReducedMotion(true);
      setShowDigital(true);
    }
    init();
  }, []);

  async function init() {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    // Req 1.2: redirect to /login if no session
    if (!authUser) {
      router.push("/login");
      return;
    }
    setUser(authUser);

    const { data: prof } = await supabase
      .from("users")
      .select("*")
      .eq("id", authUser.id)
      .single();
    setProfile(prof);

    // Req 6.3: read saved theme from localStorage (capitalized key)
    const savedTheme = localStorage.getItem(`home_theme_${authUser.id}`);
    if (savedTheme && THEMES[savedTheme] !== undefined) setTheme(savedTheme);

    // Req 8.4: read saved reduced motion preference
    const savedRM = localStorage.getItem(`reduced_motion_${authUser.id}`);
    if (savedRM === "true") {
      setReducedMotion(true);
      setShowDigital(true);
    }

    setLoading(false);
  }

  // Task 9.2: toggle reduced motion and persist to localStorage
  function handleToggleReducedMotion() {
    const next = !reducedMotion;
    setReducedMotion(next);
    // If reducedMotion is activated, default showDigital to true (Req 3.2)
    if (next) setShowDigital(true);
    if (user) {
      localStorage.setItem(`reduced_motion_${user.id}`, String(next));
    }
  }

  // Task 9.2: toggle digital clock display
  function handleToggleDigital() {
    setShowDigital((prev) => !prev);
  }

  // Task 10.1: handle theme change — ThemePicker already saves to localStorage
  function handleThemeChange(newTheme) {
    setTheme(newTheme);
  }

  if (loading) return <LoadingScreen />;

  // Task 10.1: build inline style object with CSS custom property overrides
  const themeVars = THEMES[theme] || {};
  // ParticleCanvas and AnalogClock expect lowercase theme names
  const themeLower = theme.toLowerCase();

  // Task 9.3: show digital clock if showDigital OR reducedMotion
  const showDigitalClock = showDigital || reducedMotion;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-main)",
        color: "var(--text-main)",
        // Task 10.1: apply theme CSS variable overrides inline
        ...themeVars,
      }}
    >
      {/* Task 9.1: ParticleCanvas as fixed background at z-index 0 */}
      <ParticleCanvas theme={themeLower} reducedMotion={reducedMotion} />

      {/* Sidebar */}
      <Sidebar user={profile} />

      {/* Task 9.1: Main content at z-index 1, offset for sidebar */}
      <main
        style={{
          position: "relative",
          zIndex: 1,
          marginLeft: "220px",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "1.5rem",
            padding: "2rem",
            position: "relative",
          }}
        >
          {/* Small HOME label */}
          <div
            style={{
              fontSize: "0.6rem",
              color: "var(--text-muted)",
              letterSpacing: "4px",
              textTransform: "uppercase",
            }}
          >
            HOME
          </div>

          {/* Radial glow behind clock */}
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              top: "50px",
              left: "50%",
              transform: "translateX(-50%)",
              width: "420px",
              height: "420px",
              background:
                "radial-gradient(ellipse at center, var(--accent) 0%, transparent 70%)",
              opacity: 0.07,
              filter: "blur(40px)",
              pointerEvents: "none",
              zIndex: -1,
            }}
          />

          {/* Clock: Analog or Digital */}
          {showDigitalClock ? (
            <DigitalClock />
          ) : (
            <AnalogClock theme={themeLower} reducedMotion={reducedMotion} />
          )}

          {/* Task 9.1: GreetingText */}
          <GreetingText
            email={user?.email}
            reducedMotion={reducedMotion}
          />

          {/* Task 9.1: TaskSummary */}
          <div style={{ width: "100%", maxWidth: "400px" }}>
            <TaskSummary userId={user?.id} router={router} />
          </div>

          {/* Task 9.2: Control buttons */}
          <div
            style={{
              display: "flex",
              gap: "0.75rem",
              marginTop: "0.5rem",
            }}
          >
            {/* Digital/Analog toggle */}
            <button
              onClick={handleToggleDigital}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleToggleDigital();
                }
              }}
              aria-pressed={showDigital}
              style={{
                background: "rgba(0,0,0,0.25)",
                border: `1px solid ${showDigital ? "var(--accent)" : "rgba(255,255,255,0.1)"}`,
                borderRadius: "20px",
                padding: "5px 14px",
                fontSize: "0.65rem",
                letterSpacing: "1.5px",
                color: showDigital ? "var(--accent)" : "var(--text-muted)",
                cursor: "pointer",
                transition: "border-color 0.2s, color 0.2s",
                backdropFilter: "blur(6px)",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.filter = "brightness(1.3)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.filter = "brightness(1)")
              }
            >
              {showDigitalClock ? "ANALOG" : "DIGITAL"}
            </button>

            {/* Reduced Motion toggle */}
            <button
              onClick={handleToggleReducedMotion}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleToggleReducedMotion();
                }
              }}
              aria-pressed={reducedMotion}
              style={{
                background: "rgba(0,0,0,0.25)",
                border: `1px solid ${reducedMotion ? "var(--accent)" : "rgba(255,255,255,0.1)"}`,
                borderRadius: "20px",
                padding: "5px 14px",
                fontSize: "0.65rem",
                letterSpacing: "1.5px",
                color: reducedMotion ? "var(--accent)" : "var(--text-muted)",
                cursor: "pointer",
                transition: "border-color 0.2s, color 0.2s",
                backdropFilter: "blur(6px)",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.filter = "brightness(1.3)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.filter = "brightness(1)")
              }
            >
              {reducedMotion ? "MOTION ON" : "REDUCE MOTION"}
            </button>
          </div>
        </div>
      </main>

      {/* Task 9.1: ThemePicker — fixed bottom-right (positioned inside component) */}
      <ThemePicker
        theme={theme}
        onThemeChange={handleThemeChange}
        userId={user?.id}
      />
    </div>
  );
}

function LoadingScreen() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg-main)",
      }}
    >
      <div
        style={{
          color: "var(--accent)",
          letterSpacing: "4px",
          fontSize: "0.8rem",
        }}
      >
        LOADING...
      </div>
    </div>
  );
}
