'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { supabase } from '../../Lib/supabaseClient';
import Sidebar from '../../components/Sidebar';
import PageTransition from '../../components/PageTransition';
import useBreakpoint from '../../Lib/hooks/useBreakpoint';

export const dynamic = 'force-dynamic';

interface User {
  id: string;
  username: string;
  role: string;
  email?: string;
}

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0))).buffer as ArrayBuffer;
}

type PermissionStatus = 'default' | 'granted' | 'denied' | 'unsupported';

export default function SettingsPage() {
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();
  const { isMobile } = useBreakpoint();

  useEffect(() => {
    init();
  }, []);

  async function init() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }

    const { data: prof } = await supabase.from('users').select('*').eq('id', user.id).single();
    setProfile(prof);

    // Check browser support and current permission
    if (typeof window !== 'undefined') {
      if (!('Notification' in window) || !('serviceWorker' in navigator)) {
        setPermissionStatus('unsupported');
      } else {
        setPermissionStatus(Notification.permission as PermissionStatus);

        // Check if already subscribed
        try {
          const reg = await navigator.serviceWorker.getRegistration('/sw.js');
          if (reg) {
            const sub = await reg.pushManager.getSubscription();
            setIsSubscribed(!!sub);
          }
        } catch {
          // ignore
        }
      }
    }

    setLoading(false);
  }

  async function handleEnable() {
    if (typeof window === 'undefined') return;
    setActionLoading(true);
    setMessage(null);

    try {
      const permission = await Notification.requestPermission();
      setPermissionStatus(permission as PermissionStatus);

      if (permission === 'granted') {
        const reg = await navigator.serviceWorker.register('/sw.js');
        const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
        const subscription = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey),
        });

        const subJson = subscription.toJSON();
        const { error } = await supabase.from('push_subscriptions').upsert({
          user_id: profile!.id,
          endpoint: subJson.endpoint,
          keys: subJson.keys,
        });

        if (error) throw error;
        setIsSubscribed(true);
        setMessage(null);
      } else if (permission === 'denied') {
        setMessage('Izin ditolak. Aktifkan melalui pengaturan browser.');
      }
    } catch (err) {
      console.error('Subscribe error:', err);
      setMessage('Gagal mengaktifkan notifikasi. Coba lagi.');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDisable() {
    if (typeof window === 'undefined') return;
    setActionLoading(true);
    setMessage(null);

    try {
      const reg = await navigator.serviceWorker.getRegistration('/sw.js');
      if (reg) {
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          const endpoint = sub.endpoint;
          await sub.unsubscribe();
          await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint);
        }
      }
      setIsSubscribed(false);
    } catch (err) {
      console.error('Unsubscribe error:', err);
      setMessage('Gagal menonaktifkan notifikasi. Coba lagi.');
    } finally {
      setActionLoading(false);
    }
  }

  function getStatusLabel(): string {
    if (permissionStatus === 'unsupported') return 'Tidak Didukung';
    if (permissionStatus === 'denied') return 'Ditolak';
    if (permissionStatus === 'granted' && isSubscribed) return 'Aktif ✦';
    return 'Nonaktif';
  }

  function getStatusColor(): string {
    if (permissionStatus === 'granted' && isSubscribed) return 'var(--accent)';
    if (permissionStatus === 'denied') return '#b44040';
    return 'var(--text-muted)';
  }

  const isUnsupported = permissionStatus === 'unsupported';
  const isDenied = permissionStatus === 'denied';
  const toggleDisabled = isUnsupported || isDenied || actionLoading;

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-main)' }}>
        <div style={{ color: 'var(--accent)', letterSpacing: '6px', fontSize: '1.8rem', fontFamily: "'Playfair Display', Georgia, serif" }}>
          Bentar...
        </div>
      </div>
    );
  }

  return (
    <PageTransition>
      <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-main)', color: 'var(--text-main)' }}>
        {/* Paper texture */}
        <div style={{
          position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='400' height='400' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E")`,
        }} />

        <Sidebar user={profile} />

        <main style={{
          marginLeft: isMobile ? '0' : '220px',
          flex: 1,
          padding: isMobile ? '1.25rem 1rem' : '2.5rem 3rem',
          position: 'relative',
          zIndex: 1,
          paddingBottom: isMobile ? '5rem' : undefined,
        }}>
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            style={{ marginBottom: '2.5rem' }}
          >
            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '4px', marginBottom: '4px' }}>
              PREFERENSI
            </div>
            <h1 style={{
              fontSize: isMobile ? '1.6rem' : '2.2rem',
              color: 'var(--text-main)',
              fontFamily: "'Playfair Display', Georgia, serif",
              fontWeight: '700',
            }}>
              SETTINGS
            </h1>
            <div style={{ height: '2px', width: '60px', background: 'linear-gradient(to right, var(--accent), transparent)', marginTop: '0.5rem' }} />
          </motion.div>

          {/* Notification Section */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '14px',
              padding: '1.75rem',
              maxWidth: '560px',
            }}
          >
            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '3px', marginBottom: '1.25rem' }}>
              NOTIFIKASI BROWSER
            </div>

            {/* Status row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-main)', marginBottom: '4px' }}>
                  Status Izin
                </div>
                <div style={{ fontSize: '0.8rem', color: getStatusColor(), fontWeight: '600' }}>
                  {getStatusLabel()}
                </div>
              </div>

              {/* Toggle button */}
              <button
                onClick={isSubscribed ? handleDisable : handleEnable}
                disabled={toggleDisabled}
                style={{
                  padding: '0.6rem 1.25rem',
                  borderRadius: '8px',
                  border: `1px solid ${toggleDisabled ? 'var(--border)' : isSubscribed ? 'rgba(180,60,60,0.5)' : 'var(--accent)'}`,
                  background: toggleDisabled
                    ? 'var(--bg-card2)'
                    : isSubscribed
                    ? 'rgba(180,60,60,0.1)'
                    : 'rgba(200,169,110,0.1)',
                  color: toggleDisabled
                    ? 'var(--text-muted)'
                    : isSubscribed
                    ? '#b44040'
                    : 'var(--accent)',
                  cursor: toggleDisabled ? 'not-allowed' : 'pointer',
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  letterSpacing: '0.5px',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  minWidth: '160px',
                  justifyContent: 'center',
                }}
              >
                {actionLoading ? (
                  <>
                    <span style={{
                      display: 'inline-block',
                      width: '12px',
                      height: '12px',
                      border: '2px solid currentColor',
                      borderTopColor: 'transparent',
                      borderRadius: '50%',
                      animation: 'spin 0.7s linear infinite',
                    }} />
                    Memproses...
                  </>
                ) : isSubscribed ? (
                  '⊘ Nonaktifkan Notifikasi'
                ) : (
                  '⚡ Aktifkan Notifikasi'
                )}
              </button>
            </div>

            {/* Info messages */}
            {isUnsupported && (
              <div style={{
                padding: '0.75rem 1rem',
                background: 'rgba(180,60,60,0.08)',
                border: '1px solid rgba(180,60,60,0.2)',
                borderRadius: '8px',
                fontSize: '0.8rem',
                color: 'var(--text-muted)',
              }}>
                ⚠ Browser Anda tidak mendukung notifikasi push.
              </div>
            )}

            {isDenied && (
              <div style={{
                padding: '0.75rem 1rem',
                background: 'rgba(180,60,60,0.08)',
                border: '1px solid rgba(180,60,60,0.2)',
                borderRadius: '8px',
                fontSize: '0.8rem',
                color: '#b44040',
              }}>
                ✕ Izin ditolak. Aktifkan melalui pengaturan browser.
              </div>
            )}

            {message && !isDenied && (
              <div style={{
                padding: '0.75rem 1rem',
                background: 'rgba(180,60,60,0.08)',
                border: '1px solid rgba(180,60,60,0.2)',
                borderRadius: '8px',
                fontSize: '0.8rem',
                color: '#b44040',
              }}>
                {message}
              </div>
            )}

            {permissionStatus === 'granted' && isSubscribed && (
              <div style={{
                padding: '0.75rem 1rem',
                background: 'rgba(200,169,110,0.08)',
                border: '1px solid rgba(200,169,110,0.2)',
                borderRadius: '8px',
                fontSize: '0.8rem',
                color: 'var(--text-muted)',
              }}>
                ✦ Notifikasi push aktif. Anda akan menerima pemberitahuan untuk tugas baru, komentar, dan deadline.
              </div>
            )}
          </motion.div>
        </main>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </PageTransition>
  );
}
