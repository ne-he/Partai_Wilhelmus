"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../Lib/supabaseClient";
import { useRouter } from "next/navigation";
import Sidebar from "../../components/Sidebar";
import { getDailyVerse, fetchRandomVerse } from "../../Lib/utils/bibleApi";
import { FiCopy, FiShare2, FiRefreshCw } from "react-icons/fi";
import PageTransition from "../../components/PageTransition";
import Skeleton from "../../components/Skeleton";
import useBreakpoint from "../../Lib/hooks/useBreakpoint";

export const dynamic = "force-dynamic";

export default function DailyVersePage() {
  const [verse, setVerse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [visible, setVisible] = useState(false);
  const [profile, setProfile] = useState(null);
  const [toast, setToast] = useState("");
  const router = useRouter();
  const { isMobile } = useBreakpoint();

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
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-main)" }}>
      <Sidebar user={profile} />
      <main style={{ marginLeft: "220px", flex: 1, padding: "2.5rem 3rem", display: "flex", flexDirection: "column", alignItems: "center", paddingBottom: isMobile ? "5rem" : undefined }}>

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

function VerseCard({ verse, visible, refreshing, onCopy, onShare, onRefresh }) {
  if (!verse) return null;

  return (
    <div style={{
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(16px)",
      transition: "opacity 0.7s ease, transform 0.7s ease",
      width: "100%", maxWidth: "720px",
    }}>
      {/* Glass card */}
      <div style={{
        position: "relative",
        background: "linear-gradient(135deg, rgba(0,0,0,0.5) 0%, rgba(36,32,24,0.6) 50%, rgba(0,0,0,0.4) 100%)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "1px solid rgba(212,175,55,0.2)",
        borderRadius: "20px",
        padding: "clamp(1rem, 5vw, 2rem)",
        boxShadow: "0 25px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)",
        overflow: "hidden",
      }}>
        {/* Corner ornaments */}
        {["topLeft","topRight","bottomLeft","bottomRight"].map((pos) => (
          <span key={pos} style={{
            position: "absolute",
            fontSize: "1.4rem", opacity: 0.15, color: "#D4AF37",
            ...(pos === "topLeft" && { top: "1rem", left: "1.2rem" }),
            ...(pos === "topRight" && { top: "1rem", right: "1.2rem" }),
            ...(pos === "bottomLeft" && { bottom: "1rem", left: "1.2rem" }),
            ...(pos === "bottomRight" && { bottom: "1rem", right: "1.2rem" }),
          }}>❦</span>
        ))}

        {/* Ornamen atas */}
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2.5rem" }}>
          <span style={{ color: "#D4AF37", fontSize: "0.75rem" }}>✦</span>
          <div style={{ flex: 1, height: "1px", background: "linear-gradient(to right, rgba(212,175,55,0.5), rgba(212,175,55,0.1))" }} />
          <span style={{ color: "#D4AF37", fontSize: "0.75rem" }}>✦</span>
        </div>

        {/* Label */}
        <div style={{ fontSize: "0.65rem", color: "#D4AF37", letterSpacing: "3px", marginBottom: "2rem", textAlign: "center" }}>
          AYAT RENUNGAN HARIAN
        </div>

        {/* Teks ayat dengan tanda kutip besar */}
        <div style={{ position: "relative", marginBottom: "2.5rem" }}>
          <span style={{
            position: "absolute", top: "-1.5rem", left: "-0.5rem",
            fontSize: "5rem", color: "#D4AF37", opacity: 0.12,
            fontFamily: "Georgia, serif", lineHeight: 1,
          }}>"</span>
          <p style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontStyle: "italic",
            fontSize: "clamp(1rem, 4vw, 1.5rem)",
            lineHeight: 1.9,
            color: "#f0e6d3",
            textAlign: "center",
            position: "relative", zIndex: 1,
            padding: "0 1rem",
          }}>
            {verse.text}
          </p>
          <span style={{
            position: "absolute", bottom: "-2.5rem", right: "-0.5rem",
            fontSize: "5rem", color: "#D4AF37", opacity: 0.12,
            fontFamily: "Georgia, serif", lineHeight: 1,
          }}>"</span>
        </div>

        {/* Ornamen pemisah */}
        <div style={{ textAlign: "center", color: "#D4AF37", fontSize: "1rem", margin: "2rem 0 1.5rem", letterSpacing: "8px" }}>
          ✦ ◆ ✦
        </div>

        {/* Referensi */}
        <div style={{
          textAlign: "center",
          fontFamily: "'Playfair Display', Georgia, serif",
          fontStyle: "italic",
          fontSize: "1.1rem",
          color: "#D4AF37",
          letterSpacing: "1px",
          marginBottom: "1rem",
        }}>
          — {verse.reference}
        </div>

        {/* Badge terjemahan */}
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <span style={{
            display: "inline-block",
            background: "rgba(212,175,55,0.15)",
            border: "1px solid rgba(212,175,55,0.3)",
            borderRadius: "20px",
            padding: "3px 14px",
            fontSize: "0.65rem",
            color: "#D4AF37",
            letterSpacing: "2px",
            fontFamily: "monospace",
          }}>
            {verse.translationId}
          </span>
        </div>

        {/* Ornamen bawah */}
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem" }}>
          <span style={{ color: "#D4AF37", fontSize: "0.75rem" }}>✦</span>
          <div style={{ flex: 1, height: "1px", background: "linear-gradient(to left, rgba(212,175,55,0.5), rgba(212,175,55,0.1))" }} />
          <span style={{ color: "#D4AF37", fontSize: "0.75rem" }}>✦</span>
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", justifyContent: "center", gap: "0.75rem" }}>
          {[
            { icon: <FiCopy size={16} />, label: "Salin", onClick: onCopy },
            { icon: <FiShare2 size={16} />, label: "Bagikan", onClick: onShare },
            { icon: <FiRefreshCw size={16} style={{ animation: refreshing ? "spin 1s linear infinite" : "none" }} />, label: "Ayat Baru", onClick: onRefresh },
          ].map(({ icon, label, onClick }) => (
            <button key={label} onClick={onClick} title={label} style={{
              display: "flex", alignItems: "center", gap: "6px",
              padding: "0.5rem 1rem",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(212,175,55,0.2)",
              borderRadius: "20px",
              color: "var(--text-muted)",
              cursor: "pointer",
              fontSize: "0.75rem",
              letterSpacing: "1px",
              transition: "all 0.2s",
            }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(212,175,55,0.15)"; e.currentTarget.style.color = "#D4AF37"; e.currentTarget.style.borderColor = "rgba(212,175,55,0.5)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = "var(--text-muted)"; e.currentTarget.style.borderColor = "rgba(212,175,55,0.2)"; }}
            >
              {icon} {label}
            </button>
          ))}
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
