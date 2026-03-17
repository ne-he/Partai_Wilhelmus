"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../Lib/supabaseClient";
import { computeDateSeed, pickWithSeed, formatReference } from "../../lib/verse-utils";
import Sidebar from "../../components/Sidebar";

export const dynamic = "force-dynamic";

// 3.8 ScriptureCard inline component
function ScriptureCard({ verse, reference }) {
  return (
    <div
      style={{
        border: "1px solid var(--border)",
        background: "var(--bg-card)",
        borderRadius: "16px",
        padding: "2.5rem",
        maxWidth: "600px",
        width: "100%",
        position: "relative",
      }}
    >
      {/* Ornament */}
      <div
        style={{
          fontSize: "1.2rem",
          color: "var(--accent)",
          marginBottom: "1.5rem",
          opacity: 0.6,
        }}
      >
        ✦
      </div>

      {/* Verse text — italic serif */}
      <p
        style={{
          fontFamily: "Georgia, serif",
          fontStyle: "italic",
          fontSize: "1.3rem",
          color: "var(--text-main)",
          lineHeight: 1.8,
          margin: 0,
        }}
      >
        {verse.text}
      </p>

      {/* VerseReference */}
      <div
        style={{
          color: "var(--accent)",
          fontSize: "0.9rem",
          marginTop: "1.5rem",
        }}
      >
        — {reference}
      </div>

      {/* TB label */}
      <div
        style={{
          fontSize: "0.65rem",
          color: "var(--text-muted)",
          letterSpacing: "2px",
          marginTop: "0.5rem",
        }}
      >
        TB
      </div>
    </div>
  );
}

export default function VersePage() {
  const [profile, setProfile] = useState(null);
  const [verse, setVerse] = useState(null);
  const [reference, setReference] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    init();
  }, []);

  async function init() {
    // 3.2 Auth guard
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      router.push("/login");
      return;
    }

    // Fetch user profile
    const { data: prof } = await supabase
      .from("users")
      .select("*")
      .eq("id", authUser.id)
      .single();
    setProfile(prof);

    // 3.3 Fetch book list
    let bookList;
    try {
      const res = await fetch("https://beeble.vercel.app/api/v1/passage/list");
      if (!res.ok) {
        setError(`API error: ${res.status}`);
        setLoading(false);
        return;
      }
      bookList = await res.json();
    } catch {
      setError("Gagal memuat daftar kitab. Periksa koneksi internet.");
      setLoading(false);
      return;
    }

    // 3.6 Empty book list guard
    if (!bookList || bookList.length === 0) {
      setError("Daftar kitab kosong.");
      setLoading(false);
      return;
    }

    // 3.4 Pick book, chapter, verse using different seeds
    const dateSeed = computeDateSeed(new Date());
    const selectedBook = pickWithSeed(bookList, dateSeed * 1);

    // Build chapters array [1, 2, ..., book.chapters]
    const chaptersArr = Array.from({ length: selectedBook.chapters }, (_, i) => i + 1);
    const selectedChapter = pickWithSeed(chaptersArr, dateSeed * 2);

    // 3.5 Fetch passage
    let verseList;
    try {
      const res = await fetch(
        `https://beeble.vercel.app/api/v1/passage/${selectedBook.abbr}/${selectedChapter}?ver=tb`
      );
      if (!res.ok) {
        setError(`API error: ${res.status}`);
        setLoading(false);
        return;
      }
      const data = await res.json();
      verseList = data.verses;
    } catch {
      setError("Gagal memuat isi pasal.");
      setLoading(false);
      return;
    }

    // 3.6 Empty verses guard
    if (!verseList || verseList.length === 0) {
      setError("Tidak ada ayat ditemukan untuk pasal ini.");
      setLoading(false);
      return;
    }

    const selectedVerse = pickWithSeed(verseList, dateSeed * 3);
    const ref = formatReference(selectedBook.name, selectedChapter, selectedVerse.verse);

    setVerse(selectedVerse);
    setReference(ref);
    setLoading(false);
  }

  // 3.7 Loading state
  if (loading) {
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

  // 3.9 Layout: Sidebar + main content
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-main)", color: "var(--text-main)" }}>
      {/* Sidebar */}
      <Sidebar user={profile} />

      {/* Main content */}
      <main
        style={{
          marginLeft: "220px",
          flex: 1,
          padding: "2.5rem 3rem",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
        }}
      >
        {/* Label */}
        <div
          style={{
            fontSize: "0.6rem",
            color: "var(--text-muted)",
            letterSpacing: "4px",
            textTransform: "uppercase",
            marginBottom: "2rem",
          }}
        >
          VERSE OF THE DAY
        </div>

        {/* Error state */}
        {error && (
          <div
            style={{
              color: "var(--text-muted)",
              fontSize: "0.9rem",
              maxWidth: "600px",
            }}
          >
            {error}
          </div>
        )}

        {/* Scripture card */}
        {verse && reference && (
          <ScriptureCard verse={verse} reference={reference} />
        )}
      </main>
    </div>
  );
}
