"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../Lib/supabaseClient";
import { computeDateSeed, pickWithSeed, formatReference } from "../../Lib/verse-utils";
import Sidebar from "../../components/Sidebar";

export const dynamic = "force-dynamic";

function ScriptureCard({ verse, reference, bookName }) {
  return (
    <div style={{
      position: "relative",
      maxWidth: "680px",
      width: "100%",
    }}>
      {/* Glow effect behind card */}
      <div style={{
        position: "absolute",
        inset: "-2px",
        borderRadius: "20px",
        background: "linear-gradient(135deg, var(--accent) 0%, transparent 50%, var(--accent2, var(--accent)) 100%)",
        opacity: 0.15,
        filter: "blur(8px)",
        zIndex: 0,
      }} />

      {/* Main card */}
      <div style={{
        position: "relative",
        zIndex: 1,
        border: "1px solid var(--border)",
        background: "var(--bg-card)",
        borderRadius: "20px",
        padding: "3rem",
        overflow: "hidden",
      }}>
        {/* Top decorative line */}
        <div style={{
          position: "absolute",
          top: 0,
          left: "3rem",
          right: "3rem",
          height: "2px",
          background: "linear-gradient(90deg, transparent, var(--accent), transparent)",
          opacity: 0.6,
        }} />

        {/* Cross ornament top-right */}
        <div style={{
          position: "absolute",
          top: "1.5rem",
          right: "2rem",
          fontSize: "1rem",
          color: "var(--accent)",
          opacity: 0.3,
          letterSpacing: "2px",
        }}>✝</div>

        {/* Book label */}
        <div style={{
          fontSize: "0.6rem",
          color: "var(--accent)",
          letterSpacing: "4px",
          textTransform: "uppercase",
          marginBottom: "1.8rem",
          opacity: 0.8,
        }}>
          {bookName} · Terjemahan Baru
        </div>

        {/* Opening quote mark */}
        <div style={{
          fontFamily: "Georgia, serif",
          fontSize: "5rem",
          color: "var(--accent)",
          lineHeight: 0.6,
          marginBottom: "1rem",
          opacity: 0.2,
          userSelect: "none",
        }}>"</div>

        {/* Verse text */}
        <p style={{
          fontFamily: "Georgia, 'Times New Roman', serif",
          fontStyle: "italic",
          fontSize: "1.35rem",
          color: "var(--text-main)",
          lineHeight: 1.9,
          margin: 0,
          paddingLeft: "0.5rem",
          borderLeft: "3px solid var(--accent)",
        }}>
          {verse.text}
        </p>

        {/* Divider */}
        <div style={{
          margin: "2rem 0 1.2rem",
          height: "1px",
          background: "linear-gradient(90deg, var(--border), transparent)",
        }} />

        {/* Reference row */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          <div style={{
            fontFamily: "Georgia, serif",
            color: "var(--accent)",
            fontSize: "1rem",
            fontWeight: "600",
            letterSpacing: "0.5px",
          }}>
            — {reference}
          </div>
          <div style={{
            fontSize: "0.6rem",
            color: "var(--text-muted)",
            letterSpacing: "3px",
            border: "1px solid var(--border)",
            padding: "3px 10px",
            borderRadius: "20px",
          }}>
            TB
          </div>
        </div>

        {/* Bottom decorative line */}
        <div style={{
          position: "absolute",
          bottom: 0,
          left: "3rem",
          right: "3rem",
          height: "2px",
          background: "linear-gradient(90deg, transparent, var(--accent), transparent)",
          opacity: 0.6,
        }} />
      </div>
    </div>
  );
}

function LoadingCard() {
  return (
    <div style={{
      maxWidth: "680px",
      width: "100%",
      border: "1px solid var(--border)",
      background: "var(--bg-card)",
      borderRadius: "20px",
      padding: "3rem",
    }}>
      {[80, 100, 60, 40].map((w, i) => (
        <div key={i} style={{
          height: i === 0 ? "0.6rem" : "1rem",
          width: `${w}%`,
          background: "var(--border)",
          borderRadius: "4px",
          marginBottom: i === 0 ? "2rem" : "0.8rem",
          opacity: 0.5,
          animation: "pulse 1.5s ease-in-out infinite",
          animationDelay: `${i * 0.15}s`,
        }} />
      ))}
      <style>{`@keyframes pulse { 0%,100%{opacity:.3} 50%{opacity:.7} }`}</style>
    </div>
  );
}

export default function VersePage() {
  const [profile, setProfile] = useState(null);
  const [verse, setVerse] = useState(null);
  const [reference, setReference] = useState(null);
  const [bookName, setBookName] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => { init(); }, []);

  async function init() {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) { router.push("/login"); return; }

    const { data: prof } = await supabase.from("users").select("*").eq("id", authUser.id).single();
    setProfile(prof);

    // Fetch via internal proxy to avoid CORS
    let bookList;
    try {
      const res = await fetch("/api/beeble/list");
      if (!res.ok) { setError(`Gagal memuat daftar kitab (${res.status})`); setLoading(false); return; }
      bookList = await res.json();
    } catch {
      setError("Gagal memuat daftar kitab. Periksa koneksi internet.");
      setLoading(false);
      return;
    }

    if (!bookList || bookList.length === 0) {
      setError("Daftar kitab kosong."); setLoading(false); return;
    }

    const dateSeed = computeDateSeed(new Date());
    const selectedBook = pickWithSeed(bookList, dateSeed * 1);
    const chaptersArr = Array.from({ length: selectedBook.chapters }, (_, i) => i + 1);
    const selectedChapter = pickWithSeed(chaptersArr, dateSeed * 2);

    let verseList;
    try {
      const res = await fetch(`/api/beeble/passage?abbr=${selectedBook.abbr}&chapter=${selectedChapter}`);
      if (!res.ok) { setError(`Gagal memuat pasal (${res.status})`); setLoading(false); return; }
      const data = await res.json();
      verseList = data.verses;
    } catch {
      setError("Gagal memuat isi pasal."); setLoading(false); return;
    }

    if (!verseList || verseList.length === 0) {
      setError("Tidak ada ayat ditemukan."); setLoading(false); return;
    }

    const selectedVerse = pickWithSeed(verseList, dateSeed * 3);
    setVerse(selectedVerse);
    setReference(formatReference(selectedBook.name, selectedChapter, selectedVerse.verse));
    setBookName(selectedBook.name);
    setLoading(false);
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-main)", color: "var(--text-main)" }}>
      <Sidebar user={profile} />
      <main style={{
        marginLeft: "220px",
        flex: 1,
        padding: "2.5rem 3rem",
        display: "flex",
        flexDirection: "column",
      }}>
        {/* Header */}
        <div style={{ marginBottom: "2.5rem" }}>
          <div style={{
            fontSize: "0.6rem",
            color: "var(--text-muted)",
            letterSpacing: "4px",
            textTransform: "uppercase",
            marginBottom: "0.5rem",
          }}>
            ✝ Firman Hari Ini
          </div>
          <div style={{
            fontSize: "1.6rem",
            color: "var(--text-main)",
            fontFamily: "Georgia, serif",
            fontWeight: "600",
          }}>
            Verse of The Day
          </div>
          <div style={{
            fontSize: "0.75rem",
            color: "var(--text-muted)",
            marginTop: "0.3rem",
          }}>
            {new Date().toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </div>
        </div>

        {/* Content */}
        {loading && <LoadingCard />}
        {error && (
          <div style={{
            maxWidth: "680px",
            border: "1px solid var(--border)",
            background: "var(--bg-card)",
            borderRadius: "20px",
            padding: "2.5rem",
            color: "var(--text-muted)",
            fontSize: "0.9rem",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}>
            <div style={{ fontSize: "2rem" }}>⚠</div>
            <div>{error}</div>
            <button
              onClick={() => { setError(null); setLoading(true); init(); }}
              style={{
                alignSelf: "flex-start",
                padding: "0.5rem 1.2rem",
                background: "transparent",
                border: "1px solid var(--accent)",
                borderRadius: "8px",
                color: "var(--accent)",
                cursor: "pointer",
                fontSize: "0.8rem",
                letterSpacing: "1px",
              }}
            >
              Coba Lagi
            </button>
          </div>
        )}
        {verse && reference && bookName && (
          <ScriptureCard verse={verse} reference={reference} bookName={bookName} />
        )}
      </main>
    </div>
  );
}
