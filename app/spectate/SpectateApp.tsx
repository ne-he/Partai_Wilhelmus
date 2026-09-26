'use client';

import { useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import Toast from '../../components/Toast';
import { useToast } from '../../Lib/hooks/useToast';
import useBreakpoint from '../../Lib/hooks/useBreakpoint';
import type { Comment, FamilyTask } from '../../Lib/types';
import SpectatePersonal from './SpectatePersonal';
import SpectateFamily from './SpectateFamily';
import SpectateTaskModal from './SpectateTaskModal';
import {
  VIEWER,
  SAMPLE_USERS,
  DEFAULT_OWNER_ID,
  SAMPLE_PERSONAL_TASKS,
  SAMPLE_QUEUE,
  SAMPLE_FAMILY_TASKS,
  SAMPLE_COMMENTS,
  type PersonalTask,
  type QueuedTask,
} from './sampleData';

/**
 * Mode spectate: papan asli dengan data contoh, bisa dibuka tanpa login.
 * Sengaja TIDAK meng-import Lib/supabaseClient (langsung maupun lewat komponen),
 * jadi tidak ada query, realtime, atau auth call. Semua perubahan hanya di state lokal.
 */

type Tab = 'personal' | 'family';

const TABS: { id: Tab; label: string; icon: string; mobileIcon: string }[] = [
  { id: 'personal', label: 'Personal', icon: '◆', mobileIcon: '👤' },
  { id: 'family', label: 'Family', icon: '⌂', mobileIcon: '👨‍👩‍👧' },
];

// Papan (dnd-kit, waktu relatif) baru dirender setelah hydration, sama seperti halaman asli
// yang render papan setelah loading. Server dan render pertama client dapat false.
const noopSubscribe = () => () => {};

export default function SpectateApp() {
  const hydrated = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const { isMobile } = useBreakpoint();
  const { toasts, showToast, dismissToast } = useToast();

  const [tab, setTab] = useState<Tab>('family');
  const [ownerId, setOwnerId] = useState(DEFAULT_OWNER_ID);
  const [personalTasks, setPersonalTasks] = useState<PersonalTask[]>(SAMPLE_PERSONAL_TASKS);
  const [queue, setQueue] = useState<QueuedTask[]>(SAMPLE_QUEUE);
  const [familyTasks, setFamilyTasks] = useState<FamilyTask[]>(SAMPLE_FAMILY_TASKS);
  const [comments, setComments] = useState<Record<string, Comment[]>>(SAMPLE_COMMENTS);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const owner = SAMPLE_USERS.find(u => u.id === ownerId) ?? SAMPLE_USERS[0];
  const selectedTask = familyTasks.find(t => t.id === selectedTaskId) ?? null;

  async function addComment(taskId: string, content: string) {
    const now = new Date().toISOString();
    const newComment: Comment = {
      id: `c-${Date.now()}`,
      task_id: taskId,
      user_id: VIEWER.id,
      content,
      created_at: now,
      updated_at: now,
      username: VIEWER.username,
      role: VIEWER.role,
    };
    setComments(prev => ({ ...prev, [taskId]: [...(prev[taskId] ?? []), newComment] }));
  }

  async function editComment(taskId: string, id: string, content: string) {
    setComments(prev => ({
      ...prev,
      [taskId]: (prev[taskId] ?? []).map(c => c.id === id ? { ...c, content, updated_at: new Date().toISOString() } : c),
    }));
  }

  async function deleteComment(taskId: string, id: string) {
    setComments(prev => ({ ...prev, [taskId]: (prev[taskId] ?? []).filter(c => c.id !== id) }));
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-main)' }}>
      {/* Paper texture */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='400' height='400' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E")`,
      }} />

      {!isMobile && <SpectateSidebar tab={tab} onTab={setTab} />}

      <main style={{
        marginLeft: isMobile ? '0' : '220px',
        flex: 1,
        minWidth: 0,
        padding: isMobile ? '1rem 1rem 6rem' : '2rem 3rem 2.5rem',
        position: 'relative',
        zIndex: 1,
      }}>
        <SpectateBanner />

        {!hydrated ? (
          <div style={{ minHeight: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ color: 'var(--accent)', letterSpacing: '6px', fontSize: '1.8rem', fontFamily: "'Playfair Display', Georgia, serif" }}>
              Bentar...
            </div>
          </div>
        ) : tab === 'personal' ? (
          <SpectatePersonal
            key={owner.id}
            owner={owner}
            users={SAMPLE_USERS}
            onSelectOwner={setOwnerId}
            tasks={personalTasks}
            setTasks={setPersonalTasks}
            queue={queue}
            setQueue={setQueue}
            showToast={showToast}
          />
        ) : (
          <SpectateFamily
            viewer={VIEWER}
            users={SAMPLE_USERS}
            tasks={familyTasks}
            setTasks={setFamilyTasks}
            onOpenTask={setSelectedTaskId}
            showToast={showToast}
          />
        )}
      </main>

      {isMobile && <SpectateBottomNav tab={tab} onTab={setTab} />}

      <SpectateTaskModal
        task={selectedTask}
        users={SAMPLE_USERS}
        viewer={VIEWER}
        comments={selectedTask ? comments[selectedTask.id] ?? [] : []}
        onAddComment={addComment}
        onEditComment={editComment}
        onDeleteComment={deleteComment}
        showToast={showToast}
        onClose={() => setSelectedTaskId(null)}
      />

      <Toast toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

function SpectateBanner() {
  return (
    <div
      role="note"
      data-testid="spectate-banner"
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem',
        background: 'rgba(200,169,110,0.08)',
        border: '1px solid rgba(200,169,110,0.35)',
        borderRadius: '12px',
        padding: '0.8rem 1.1rem',
        marginBottom: '2rem',
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: '0.85rem', color: 'var(--accent)', fontWeight: 600 }}>
          Mode spectate: ini data contoh, tidak ada yang tersimpan.
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
          Silakan coba drag, tambah tugas, atau komentar. Semua kembali ke awal saat halaman di-refresh.
        </div>
      </div>
      <Link
        href="/login"
        prefetch={false}
        style={{
          flexShrink: 0,
          padding: '0.45rem 1rem',
          border: '1px solid var(--accent)',
          borderRadius: '8px',
          color: 'var(--accent)',
          textDecoration: 'none',
          fontSize: '0.75rem',
          letterSpacing: '1px',
        }}
      >
        ← Kembali ke login
      </Link>
    </div>
  );
}

function SpectateSidebar({ tab, onTab }: { tab: Tab; onTab: (t: Tab) => void }) {
  return (
    <aside style={{
      width: '220px',
      minHeight: '100vh',
      background: 'var(--bg-card)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      padding: '2rem 1.2rem',
      gap: '0.5rem',
      position: 'fixed',
      top: 0,
      left: 0,
      zIndex: 2,
    }}>
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ fontSize: '1.4rem', color: 'var(--accent)', fontWeight: 'bold', letterSpacing: '2px' }}>PARTAI</div>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', letterSpacing: '3px', marginTop: '2px' }}>WILHELMUS</div>
      </div>

      <div style={{
        background: 'var(--bg-card2)',
        border: '1px solid var(--border)',
        borderRadius: '10px',
        padding: '0.8rem',
        marginBottom: '1.5rem',
      }}>
        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '2px', marginBottom: '4px' }}>
          MELIHAT SEBAGAI
        </div>
        <div style={{ color: 'var(--accent)', fontWeight: 'bold' }}>{VIEWER.username}</div>
        <div style={{
          display: 'inline-block',
          marginTop: '4px',
          fontSize: '0.65rem',
          background: 'var(--accent2)',
          color: '#1a1612',
          padding: '2px 8px',
          borderRadius: '20px',
          textTransform: 'uppercase',
          letterSpacing: '1px',
        }}>
          Spectate
        </div>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
        {TABS.map(item => {
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTab(item.id)}
              aria-pressed={active}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '0.7rem 1rem',
                borderRadius: '8px',
                border: 'none',
                borderLeft: active ? '2px solid var(--accent)' : '2px solid transparent',
                color: active ? 'var(--accent)' : 'var(--text-muted)',
                background: active ? 'rgba(200,169,110,0.1)' : 'transparent',
                fontSize: '0.9rem',
                fontFamily: 'inherit',
                textAlign: 'left',
                cursor: 'pointer',
              }}
            >
              <span>{item.icon}</span>
              {item.label}
            </button>
          );
        })}
      </nav>

      <Link
        href="/login"
        prefetch={false}
        style={{
          marginTop: 'auto',
          padding: '0.7rem',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          color: 'var(--text-muted)',
          fontSize: '0.85rem',
          textAlign: 'center',
          textDecoration: 'none',
        }}
      >
        ⎋ Ke halaman login
      </Link>
    </aside>
  );
}

function SpectateBottomNav({ tab, onTab }: { tab: Tab; onTab: (t: Tab) => void }) {
  const itemStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2px',
    textDecoration: 'none',
    padding: '4px 12px',
    background: 'transparent',
    border: 'none',
    fontFamily: 'inherit',
    cursor: 'pointer',
  };

  return (
    <nav
      aria-label="Navigasi mode spectate"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        width: '100%',
        zIndex: 1000,
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        backgroundColor: 'var(--bg-card)',
        borderTop: '1px solid var(--border)',
        padding: '8px 0 env(safe-area-inset-bottom, 8px)',
      }}
    >
      {TABS.map(item => {
        const active = tab === item.id;
        const color = active ? 'var(--accent)' : 'var(--text-muted)';
        return (
          <button key={item.id} onClick={() => onTab(item.id)} aria-pressed={active} style={itemStyle}>
            <span style={{ fontSize: '1.4rem', lineHeight: 1, color }}>{item.mobileIcon}</span>
            <span style={{ fontSize: '0.65rem', fontWeight: active ? 600 : 400, color, letterSpacing: '0.02em' }}>
              {item.label}
            </span>
          </button>
        );
      })}
      <Link href="/login" prefetch={false} style={itemStyle}>
        <span style={{ fontSize: '1.4rem', lineHeight: 1, color: 'var(--text-muted)' }}>🔑</span>
        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.02em' }}>Login</span>
      </Link>
    </nav>
  );
}
