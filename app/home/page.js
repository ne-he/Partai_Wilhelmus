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
import PageTransition from "../../components/PageTransition";
import { useTheme } from "../../Lib/hooks/useTheme";
import useBreakpoint from "../../Lib/hooks/useBreakpoint";

export const dynamic = "force-dynamic";

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
  const [reducedMotion, setReducedMotion] = useState(false);
  // Task 9.2: showDigital toggle; defaults to true when reducedMotion is active
  const [showDigital, setShowDigital] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Task 6.5: useTheme replaces manual localStorage theme logic (Req 12.3, 12.4, 12.5)
  const { theme, setTheme } = useTheme();

  // Task 6.5: useBreakpoint for mobile vertical layout (Req 9.1)
  const { isMobile } = useBreakpoint();

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

  // Task 6.5: handle theme change via useTheme (Req 12.3, 12.4, 12.5)
  function handleThemeChange(newTheme) {
    // useTheme expects lowercase theme names; ThemePicker uses capitalized
    setTheme(newTheme.toLowerCase());
  }

  if (loading) return <LoadingScreen />;

  // ParticleCanvas and AnalogClock expect lowercase theme names
  const themeLower = theme.toLowerCase();

  // Task 9.3: show digital clock if showDigital OR reducedMotion
  const showDigitalClock = showDigital || reducedMotion;

  // Task 6.5: Req 9.1 — mobile clock layout uses CSS Grid with grid-template-columns: 1fr
  const clockContainerStyle = isMobile
    ? {
        display: "grid",
        gridTemplateColumns: "1fr",
        gap: "1rem",
        justifyItems: "center",
        width: "100%",
      }
    : {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "1rem",
      };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-main)",
        color: "var(--text-main)",
      }}
    >
      {/* Task 9.1: ParticleCanvas as fixed background at z-index 0 */}
      <ParticleCanvas theme={themeLower} reducedMotion={reducedMotion} />

      {/* Sidebar */}
      <Sidebar user={profile} />

      {/* Task 2.2: Wrap main content with PageTransition (Req 2.2) */}
      <PageTransition>
        {/* Task 9.1: Main content at z-index 1, offset for sidebar */}
        <main
          style={{
            position: "relative",
            zIndex: 1,
            marginLeft: isMobile ? "0" : "220px",
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            paddingBottom: isMobile ? "5rem" : undefined,
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
              width: "100%",
              maxWidth: isMobile ? "100%" : "auto",
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

            {/* Task 6.5: Req 9.1 — clock container with mobile vertical grid layout */}
            <div style={clockContainerStyle}>
              {/* Clock: Analog or Digital */}
              {showDigitalClock ? (
                <DigitalClock />
              ) : (
                <AnalogClock theme={themeLower} reducedMotion={reducedMotion} />
              )}
            </div>

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
      </PageTransition>

      {/* Task 9.1: ThemePicker — fixed bottom-right (positioned inside component) */}
      <ThemePicker
        theme={theme.charAt(0).toUpperCase() + theme.slice(1)}
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
        Bentar...
      </div>
    </div>
  );
}
