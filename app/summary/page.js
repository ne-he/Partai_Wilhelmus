"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../Lib/supabaseClient";
import { useRouter } from "next/navigation";
import Sidebar from "../../components/Sidebar";
import { getDailyVerse } from "../../Lib/utils/bibleApi";

export const dynamic = "force-dynamic";

export default function BiblePage() {
  const [verse, setVerse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [visible, setVisible] = useState(false);
  const [profile, setProfile] = useState(null);
  const router = useRouter();

  useEffect(() => { init(); }, []);

  async function init() {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }

    const { data: prof } = await supabase.from('users').select('*').eq('id', user.id).single();
    setProfile(prof);

    try {
      const v = await getDailyVerse();
      setVerse(v);
      setError('');
      if (prefersReduced) {
        setVisible(true);
      } else {
        setTimeout(() => setVisible(true), 50);
      }
    } catch (err) {
      setError(err.message || 'Gagal memuat ayat. Silakan coba lagi.');
    }

    setLoading(false);
  }

  async function handleRetry() {
    setLoading(true);
    setError('');
    setVisible(false);
    await init();
  }

  if (loading) return <LoadingScreen />;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-main)' }}>
      <Sidebar user={profile} />
      <main style={{ marginLeft: '220px', flex: 1, padding: '2.5rem 3rem' }}>
        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', letterSpacing: '3px', marginBottom: '6px' }}>SCRIPTURE</div>
          <h1 style={{ fontSize: '2rem', color: 'var(--text-main)', fontWeight: 'normal' }}>Daily Verse</h1>
        </div>

        {error ? (
          <ErrorState message={error} onRetry={handleRetry} />
        ) : (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            {verse && <VerseCard verse={verse} visible={visible} />}
          </div>
        )}
      </main>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-main)' }}>
      <div style={{ color: 'var(--accent)', letterSpacing: '4px', fontSize: '0.8rem' }}>MEMUAT AYAT...</div>
    </div>
  );
}

function ErrorState({ message, onRetry }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', paddingTop: '3rem' }}>
      <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', maxWidth: '400px' }}>
        {message || 'Terjadi kesalahan saat memuat ayat harian.'}
      </div>
      <button
        onClick={onRetry}
        style={{
          border: '1px solid var(--accent)',
          color: 'var(--accent)',
          background: 'transparent',
          borderRadius: '8px',
          padding: '0.6rem 1.5rem',
          cursor: 'pointer',
          fontSize: '0.85rem',
        }}
      >
        Coba Lagi
      </button>
    </div>
  );
}

function VerseCard({ verse, visible }) {
  const Ornament = () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
      <span style={{ color: 'var(--accent)', fontSize: '0.8rem' }}>✦</span>
      <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
      <span style={{ color: 'var(--accent)', fontSize: '0.8rem' }}>✦</span>
    </div>
  );

  const dateLabel = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).toUpperCase();

  return (
    <div style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(12px)',
      transition: 'opacity 0.6s ease, transform 0.6s ease',
      maxWidth: '680px',
      width: '100%',
    }}>
      <div style={{
        background: 'rgba(36, 32, 24, 0.7)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(200, 169, 110, 0.2)',
        borderRadius: '16px',
        padding: '3rem',
      }}>
        {/* Ornamen atas */}
        <div style={{ marginBottom: '2rem' }}>
          <Ornament />
        </div>

        {/* Label tanggal */}
        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '3px', marginBottom: '1.5rem' }}>
          {dateLabel}
        </div>

        {/* Label ayat */}
        <div style={{ fontSize: '0.7rem', color: 'var(--accent)', letterSpacing: '2px', marginBottom: '2rem' }}>
          📖 AYAT RENUNGAN HARIAN
        </div>

        {/* Teks ayat */}
        <div style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontStyle: 'italic',
          fontSize: 'clamp(1.2rem, 2.5vw, 1.6rem)',
          lineHeight: 1.8,
          color: 'var(--text-main)',
          marginBottom: '2rem',
        }}>
          &ldquo;{verse.text}&rdquo;
        </div>

        {/* Ornamen pemisah */}
        <div style={{ textAlign: 'center', color: 'var(--accent)', fontSize: '1.2rem', marginBottom: '1.5rem' }}>◆</div>

        {/* Referensi */}
        <div style={{
          textAlign: 'right',
          color: 'var(--accent)',
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: '1rem',
          fontStyle: 'italic',
          marginBottom: '1rem',
        }}>
          — {verse.reference}
        </div>

        {/* Badge terjemahan */}
        <div style={{
          display: 'inline-block',
          background: 'var(--bg-card2)',
          border: '1px solid var(--border)',
          borderRadius: '20px',
          padding: '3px 12px',
          fontSize: '0.65rem',
          color: 'var(--text-muted)',
          letterSpacing: '2px',
        }}>
          {verse.translation}
        </div>

        {/* Ornamen bawah */}
        <div style={{ marginTop: '2rem', marginBottom: 0 }}>
          <Ornament />
        </div>
      </div>
    </div>
  );
}
