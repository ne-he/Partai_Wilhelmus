"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../Lib/supabaseClient";
import { useRouter } from "next/navigation";
import Sidebar from "../../components/Sidebar";
import { getDailyVerse, fetchRandomVerse } from "../../Lib/utils/bibleApi";
import { FiCopy, FiShare2, FiRefreshCw, FiGlobe } from "react-icons/fi";
import PageTransition from "../../components/PageTransition";
import Skeleton from "../../components/Skeleton";
import useBreakpoint from "../../Lib/hooks/useBreakpoint";
import TwinklingStars from "../../components/TwinklingStars";

export const dynamic = "force-dynamic";

export default function DailyVersePage() {
  const [verse, setVerse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [visible, setVisible] = useState(false);
  const [profile, setProfile] = useState(null);
  const [toast, setToast] = useState("");
  const [theme, setTheme] = useState("vintage");
  const [reducedMotion, setReducedMotion] = useState(false);
  const router = useRouter();
  const { isMobile } = useBreakpoint();

  useEffect(() => {
    // Baca tema aktif dari localStorage
    try {
      const raw = localStorage.getItem("theme_prefs");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.theme) setTheme(parsed.theme);
      }
    } catch {}
    // Deteksi prefers-reduced-motion
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => { init(); }, []);

  async function init() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }
    const { data: prof } = await supabase.from("users").select("*").eq("id", user.id).single();
    setProfile(prof);
    await loadVerse();
  }

  async function loadVerse() {
    setLoading(true);
    setError("");
    setVisible(false);
    try {
      const v = await getDailyVerse();
      setVerse(v);
      setTimeout(() => setVisible(true), 60);
    } catch (err) {
      setError(err.message || "Gagal memuat ayat.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    setVisible(false);
    try {
      const v = await fetchRandomVerse();
      setVerse(v);
      setTimeout(() => setVisible(true), 60);
    } catch {
      showToast("Gagal mengambil ayat baru.");
    } finally {
      setRefreshing(false);
    }
  }

  function handleCopy() {
    if (!verse) return;
    const text = `"${verse.text}"\n— ${verse.reference} (${verse.translationId})`;
    navigator.clipboard.writeText(text).then(() => showToast("Ayat disalin ✦"));
  }

  function handleShare() {
    if (!verse) return;
    const text = `"${verse.text}"\n— ${verse.reference} (${verse.translationId})`;
    if (navigator.share) {
      navigator.share({ title: "Ayat Renungan Harian", text });
    } else {
      navigator.clipboard.writeText(text).then(() => showToast("Link disalin ✦"));
    }
  }

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  }

  const dateLabel = new Date().toLocaleDateString("id-ID", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  }).toUpperCase();

  if (loading) return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-main)" }}>
      <Sidebar user={profile} />
      <main style={{ marginLeft: "220px", flex: 1, padding: "2.5rem 3rem", display: "flex", flexDirection: "column", alignItems: "center", paddingBottom: isMobile ? "5rem" : undefined }}>
        <div style={{ width: "100%", maxWidth: "720px" }}>
          <Skeleton variant="verse-card" />
        </div>
      </main>
    </div>
  );

  return (
    <PageTransition>
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-main)", position: "relative" }}>
      {/* Bintang kelap-kelip di belakang semua konten */}
      <TwinklingStars theme={theme} reducedMotion={reducedMotion} />

      <Sidebar user={profile} />
      <main style={{ marginLeft: "220px", flex: 1, padding: "2.5rem 3rem", display: "flex", flexDirection: "column", alignItems: "center", paddingBottom: isMobile ? "5rem" : undefined, position: "relative", zIndex: 1 }}>

        {/* Header */}
        <div style={{ width: "100%", maxWidth: "720px", marginBottom: "2.5rem" }}>
          <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", letterSpacing: "3px", marginBottom: "6px" }}>
            SCRIPTURE
          </div>
          <h1 style={{
            fontSize: "2rem", fontWeight: "normal",
            background: "linear-gradient(135deg, #D4AF37, #f5e09a, #D4AF37)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            backgroundClip: "text", fontFamily: "'Playfair Display', Georgia, serif",
          }}>
            Daily Verse
          </h1>
          {/* Garis dekoratif */}
          <div style={{ height: "1px", background: "linear-gradient(to right, transparent, #D4AF37, transparent)", marginTop: "0.75rem" }} />
        </div>

        {/* Date badge */}
        <div style={{
          marginBottom: "2rem",
          padding: "0.4rem 1.2rem",
          border: "1px solid rgba(212,175,55,0.3)",
          borderRadius: "20px",
          background: "rgba(212,175,55,0.05)",
          fontSize: "0.65rem",
          color: "#D4AF37",
          letterSpacing: "3px",
        }}>
          {dateLabel}
        </div>

        {error ? (
          <ErrorState message={error} onRetry={loadVerse} />
        ) : (
          <VerseCard
            verse={verse}
            visible={visible}
            refreshing={refreshing}
            onCopy={handleCopy}
            onShare={handleShare}
            onRefresh={handleRefresh}
            onTranslateError={(msg) => showToast(msg)}
          />
        )}

        {/* Footer motto */}
        <div style={{
          marginTop: "3rem", paddingTop: "1.5rem",
          borderTop: "1px solid rgba(212,175,55,0.15)",
          width: "100%", maxWidth: "720px",
          textAlign: "center",
          fontSize: "0.7rem", color: "var(--text-muted)", letterSpacing: "2px",
          fontStyle: "italic",
        }}>
          "Keluarga adalah Kekuatan, Iman adalah Senjata"
        </div>
      </main>

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", bottom: "2rem", left: "50%", transform: "translateX(-50%)",
          background: "rgba(212,175,55,0.15)", border: "1px solid rgba(212,175,55,0.4)",
          backdropFilter: "blur(12px)", borderRadius: "20px",
          padding: "0.6rem 1.5rem", fontSize: "0.8rem", color: "#D4AF37",
          letterSpacing: "1px", zIndex: 9999,
          animation: "fadeIn 0.3s ease",
        }}>
          {toast}
        </div>
      )}
    </div>
    </PageTransition>
  );
}

function VerseCard({ verse, visible, refreshing, onCopy, onShare, onRefresh, onTranslateError }) {
  const [translated, setTranslated] = useState(null);
  const [translating, setTranslating] = useState(false);

  if (!verse) return null;

  async function handleTranslate() {
    if (translated) { setTranslated(null); return; }
    setTranslating(true);
    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: verse.text }),
      });
      const data = await res.json();
      if (data.translatedText) setTranslated(data.translatedText);
      else onTranslateError("Gagal menerjemahkan.");
    } catch {
      onTranslateError("Gagal menerjemahkan.");
    } finally {
      setTranslating(false);
    }
  }

  // Style tombol yang seragam — menggunakan CSS variables agar menyesuaikan tema
  const btnStyle = {
    display: "flex", alignItems: "center", gap: "6px",
    padding: "0.5rem 1.1rem",
    background: "var(--btn-verse-bg, rgba(255,255,255,0.04))",
    border: "1px solid var(--btn-verse-border, rgba(212,175,55,0.25))",
    borderRadius: "20px",
    color: "var(--btn-verse-color, var(--text-muted))",
    cursor: "pointer",
    fontSize: "0.75rem",
    letterSpacing: "1px",
    transition: "all 0.2s ease",
    fontFamily: "inherit",
    whiteSpace: "nowrap",
  };

  function btnEnter(e) {
    e.currentTarget.style.background = "var(--btn-verse-hover-bg, rgba(212,175,55,0.15))";
    e.currentTarget.style.color = "var(--accent)";
    e.currentTarget.style.borderColor = "var(--accent)";
  }
  function btnLeave(e) {
    e.currentTarget.style.background = "var(--btn-verse-bg, rgba(255,255,255,0.04))";
    e.currentTarget.style.color = "var(--btn-verse-color, var(--text-muted))";
    e.currentTarget.style.borderColor = "var(--btn-verse-border, rgba(212,175,55,0.25))";
  }

  return (
    <div style={{
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(16px)",
      transition: "opacity 0.7s ease, transform 0.7s ease",
      width: "100%", maxWidth: "720px",
    }}>
      {/* Card — background menyesuaikan tema via CSS variables */}
      <div style={{
        position: "relative",
        background: "var(--verse-card-bg, linear-gradient(135deg, rgba(0,0,0,0.5) 0%, rgba(36,32,24,0.6) 50%, rgba(0,0,0,0.4) 100%))",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "1px solid var(--verse-card-border, rgba(212,175,55,0.2))",
        borderRadius: "20px",
        padding: "clamp(1rem, 5vw, 2rem)",
        boxShadow: "var(--verse-shadow, 0 25px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05))",
        overflow: "hidden",
      }}>
        {/* Corner ornaments */}
        {["topLeft","topRight","bottomLeft","bottomRight"].map((pos) => (
          <span key={pos} style={{
            position: "absolute",
            fontSize: "1.4rem", opacity: 0.15, color: "var(--accent)",
            ...(pos === "topLeft" && { top: "1rem", left: "1.2rem" }),
            ...(pos === "topRight" && { top: "1rem", right: "1.2rem" }),
            ...(pos === "bottomLeft" && { bottom: "1rem", left: "1.2rem" }),
            ...(pos === "bottomRight" && { bottom: "1rem", right: "1.2rem" }),
          }}>❦</span>
        ))}

        {/* Ornamen atas */}
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2.5rem" }}>
          <span style={{ color: "var(--accent)", fontSize: "0.75rem" }}>✦</span>
          <div style={{ flex: 1, height: "1px", background: "linear-gradient(to right, var(--accent), transparent)" }} />
          <span style={{ color: "var(--accent)", fontSize: "0.75rem" }}>✦</span>
        </div>

        {/* Label */}
        <div style={{ fontSize: "0.65rem", color: "var(--accent)", letterSpacing: "3px", marginBottom: "2rem", textAlign: "center" }}>
          AYAT RENUNGAN HARIAN
        </div>

        {/* Teks ayat */}
        <div style={{ position: "relative", marginBottom: "2.5rem" }}>
          <span style={{
            position: "absolute", top: "-1.5rem", left: "-0.5rem",
            fontSize: "5rem", color: "var(--accent)", opacity: 0.12,
            fontFamily: "Georgia, serif", lineHeight: 1,
          }}>"</span>
          <p style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontStyle: "italic",
            fontSize: "clamp(1rem, 4vw, 1.5rem)",
            lineHeight: 1.9,
            color: "var(--verse-text, var(--text-main))",
            textAlign: "center",
            position: "relative", zIndex: 1,
            padding: "0 1rem",
          }}>
            {verse.text}
          </p>
          <span style={{
            position: "absolute", bottom: "-2.5rem", right: "-0.5rem",
            fontSize: "5rem", color: "var(--accent)", opacity: 0.12,
            fontFamily: "Georgia, serif", lineHeight: 1,
          }}>"</span>
        </div>

        {/* Terjemahan (jika ada) */}
        {translated && (
          <div style={{
            margin: "0 0 1.5rem",
            padding: "1rem 1.25rem",
            background: "rgba(212,175,55,0.06)",
            border: "1px solid rgba(212,175,55,0.15)",
            borderRadius: "12px",
            textAlign: "center",
          }}>
            <div style={{ fontSize: "0.55rem", color: "var(--accent)", letterSpacing: "2px", marginBottom: "0.5rem" }}>
              TERJEMAHAN
            </div>
            <p style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontStyle: "italic",
              fontSize: "clamp(0.9rem, 3vw, 1.2rem)",
              lineHeight: 1.8,
              color: "var(--verse-text-secondary, var(--text-main))",
            }}>
              {translated}
            </p>
          </div>
        )}

        {/* Ornamen pemisah */}
        <div style={{ textAlign: "center", color: "var(--accent)", fontSize: "1rem", margin: "2rem 0 1.5rem", letterSpacing: "8px" }}>
          ✦ ◆ ✦
        </div>

        {/* Referensi */}
        <div style={{
          textAlign: "center",
          fontFamily: "'Playfair Display', Georgia, serif",
          fontStyle: "italic",
          fontSize: "1.1rem",
          color: "var(--accent)",
          letterSpacing: "1px",
          marginBottom: "1rem",
        }}>
          — {verse.reference}
        </div>

        {/* Ornamen bawah */}
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem" }}>
          <span style={{ color: "var(--accent)", fontSize: "0.75rem" }}>✦</span>
          <div style={{ flex: 1, height: "1px", background: "linear-gradient(to left, var(--accent), transparent)" }} />
          <span style={{ color: "var(--accent)", fontSize: "0.75rem" }}>✦</span>
        </div>

        {/* Action buttons — urutan: Salin | Bagikan | Terjemahkan | Ayat Baru */}
        <div style={{ display: "flex", justifyContent: "center", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
          <button onClick={onCopy} title="Salin" style={btnStyle} onMouseEnter={btnEnter} onMouseLeave={btnLeave}>
            <FiCopy size={15} /> Salin
          </button>
          <button onClick={onShare} title="Bagikan" style={btnStyle} onMouseEnter={btnEnter} onMouseLeave={btnLeave}>
            <FiShare2 size={15} /> Bagikan
          </button>
          <button onClick={handleTranslate} title="Terjemahkan" disabled={translating} style={{
            ...btnStyle,
            opacity: translating ? 0.7 : 1,
            background: translated ? "rgba(212,175,55,0.12)" : btnStyle.background,
            borderColor: translated ? "var(--accent)" : btnStyle.border,
            color: translated ? "var(--accent)" : btnStyle.color,
          }} onMouseEnter={btnEnter} onMouseLeave={btnLeave}>
            <FiGlobe size={15} style={{ animation: translating ? "spin 1s linear infinite" : "none" }} />
            {translating ? "..." : translated ? "Sembunyikan" : "Terjemahkan"}
          </button>
          <button onClick={onRefresh} title="Ayat Baru" style={btnStyle} onMouseEnter={btnEnter} onMouseLeave={btnLeave}>
            <FiRefreshCw size={15} style={{ animation: refreshing ? "spin 1s linear infinite" : "none" }} /> Ayat Baru
          </button>
        </div>
      </div>
    </div>
  );
}


function ErrorState({ message, onRetry }) {
  return (
    <div style={{
      maxWidth: "480px", width: "100%",
      background: "rgba(0,0,0,0.4)", backdropFilter: "blur(12px)",
      border: "1px solid rgba(212,175,55,0.2)", borderRadius: "16px",
      padding: "2.5rem", textAlign: "center",
    }}>
      <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>⚠</div>
      <div style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "1.5rem", lineHeight: 1.6 }}>
        {message || "Terjadi kesalahan saat memuat ayat harian."}
      </div>
      <button onClick={onRetry} style={{
        border: "1px solid rgba(212,175,55,0.4)", color: "#D4AF37",
        background: "rgba(212,175,55,0.08)", borderRadius: "8px",
        padding: "0.6rem 1.5rem", cursor: "pointer", fontSize: "0.85rem",
        letterSpacing: "1px", transition: "all 0.2s",
      }}
        onMouseEnter={e => e.currentTarget.style.background = "rgba(212,175,55,0.2)"}
        onMouseLeave={e => e.currentTarget.style.background = "rgba(212,175,55,0.08)"}
      >
        Coba Lagi
      </button>
    </div>
  );
}
