'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  rectIntersection,
} from '@dnd-kit/core';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../Lib/supabaseClient';
import Sidebar from '../../components/Sidebar';
import DraggableMember from '../../components/DraggableMember';
import DroppableFamilyTask from '../../components/DroppableFamilyTask';
import PageTransition from '../../components/PageTransition';
import Skeleton from '../../components/Skeleton';
import Toast from '../../components/Toast';
import Tooltip from '../../components/Tooltip';
import { useToast } from '../../Lib/hooks/useToast';
import useBreakpoint from '../../Lib/hooks/useBreakpoint';

export const dynamic = 'force-dynamic';

interface FamilyTask {
  id: string;
  title: string;
  status: 'pending' | 'in_progress' | 'done';
  created_by: string;
  assigned_to: string | null;
  created_at: string;
}

interface User {
  id: string;
  username: string;
  role: string;
  email?: string;
}

const TEMPLATES = [
  'Cuci baju', 'Setrika', 'Pel lantai', 'Masak nasi',
  'Cuci piring', 'Bersih kamar mandi', 'Sapu halaman', 'Belanja bulanan',
];

const statusConfig = {
  pending: { color: '#c8a96e', label: 'Pending', icon: '○' },
  in_progress: { color: '#a07850', label: 'In Progress', icon: '◑' },
  done: { color: '#7a9e6e', label: 'Done', icon: '●' },
};

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

const DISPLAY_NAME_MAP: Record<string, string> = {
  papa: 'Abi',
  mama: 'Umi',
  nemi: 'Baginda',
  venly: 'Mbah',
};

function getDisplayName(username: string): string {
  return DISPLAY_NAME_MAP[username.toLowerCase()] ?? username;
}

export default function FamilyTasks() {
  const [tasks, setTasks] = useState<FamilyTask[]>([]);
  const [title, setTitle] = useState('');
  const [profile, setProfile] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [inputFocused, setInputFocused] = useState(false);
  const router = useRouter();

  const { toasts, showToast, dismissToast } = useToast();
  const { isMobile } = useBreakpoint();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 8 },
    })
  );

  useEffect(() => { init(); }, []);

  async function init() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }
    const { data: prof } = await supabase.from('users').select('*').eq('id', user.id).single();
    setProfile(prof);
    const { data: allUsers } = await supabase.from('users').select('id, username, role');
    setUsers(allUsers || []);
    await fetchTasks();
    setLoading(false);
  }

  async function fetchTasks() {
    const { data } = await supabase
      .from('family_tasks').select('*').order('created_at', { ascending: false });
    setTasks(data || []);
  }

  async function addTask(e?: React.FormEvent, templateTitle?: string) {
    if (e) e.preventDefault();
    const t = templateTitle || title.trim();
    if (!t || !profile) return;
    await supabase.from('family_tasks').insert({ title: t, created_by: profile.id });
    setTitle('');
    fetchTasks();
  }

  async function updateStatus(id: string, status: string) {
    await supabase.from('family_tasks').update({ status }).eq('id', id);
    fetchTasks();
  }

  async function deleteTask(id: string) {
    await supabase.from('family_tasks').delete().eq('id', id);
    fetchTasks();
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const draggedUserId = active.id as string;
    const targetTaskId = over.id as string;

    const draggedUser = users.find(u => u.id === draggedUserId);
    if (!draggedUser) return;

    const targetTask = tasks.find(t => t.id === targetTaskId);
    if (!targetTask) return;

    try {
      const { error } = await supabase
        .from('family_tasks')
        .update({ assigned_to: draggedUserId, status: 'in_progress' })
        .eq('id', targetTaskId);
      if (error) throw error;
      await fetchTasks();
      showToast(`${getDisplayName(draggedUser.username)} ditugaskan ke "${targetTask.title}"`, 'success');
    } catch (error) {
      console.error('Assignment update failed:', error);
      showToast('Gagal mengassign tugas. Coba lagi.', 'error');
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-main)' }}>
        <Sidebar user={null} />
        <main style={{ marginLeft: isMobile ? '0' : '220px', flex: 1, padding: '2.5rem 3rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxWidth: '800px' }}>
            <Skeleton variant="task-list" count={4} />
          </div>
        </main>
      </div>
    );
  }
  const isEditor = profile?.role === 'papa' || profile?.role === 'mama';
  const activeUser = users.find(u => u.id === activeId);

  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress');
  const doneTasks = tasks.filter(t => t.status === 'done');

  return (
    <PageTransition>
      <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-main)' }}>
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
            style={{ marginBottom: '2rem' }}
          >
            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '4px', marginBottom: '4px' }}>
              FAMILY WORKSPACE
            </div>
            <h1 style={{
              fontSize: isMobile ? '1.6rem' : '2.2rem',
              color: 'var(--text-main)',
              fontFamily: "'Playfair Display', Georgia, serif",
              fontWeight: '700',
            }}>
              Family Tasks
            </h1>
            <div style={{ height: '2px', width: '60px', background: 'linear-gradient(to right, var(--accent), transparent)', marginTop: '0.5rem' }} />
            {!isEditor && (
              <p style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                Hanya Abi dan Umi yang bisa mengelola tugas keluarga.
              </p>
            )}
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}
          >
            {[
              { label: 'TOTAL', value: tasks.length, icon: '◈' },
              { label: 'PENDING', value: pendingTasks.length, icon: '○' },
              { label: 'BERJALAN', value: inProgressTasks.length, icon: '◑' },
              { label: 'SELESAI', value: doneTasks.length, icon: '●', accent: true },
            ].map(s => (
              <div key={s.label} style={{
                background: 'var(--bg-card)',
                border: s.accent ? '1px solid var(--accent)' : '1px solid var(--border)',
                borderRadius: '12px',
                padding: '0.85rem 1.25rem',
                minWidth: '100px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                  <span style={{ fontSize: '0.7rem', color: s.accent ? 'var(--accent)' : 'var(--text-muted)' }}>{s.icon}</span>
                  <span style={{ fontSize: '0.55rem', color: 'var(--text-muted)', letterSpacing: '1.5px' }}>{s.label}</span>
                </div>
                <div style={{
                  fontSize: '1.6rem',
                  color: s.accent ? 'var(--accent)' : 'var(--text-main)',
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontWeight: '700',
                  lineHeight: 1,
                }}>
                  {s.value}
                </div>
              </div>
            ))}
          </motion.div>

          {/* Task List with Drag and Drop */}
          <DndContext
            sensors={sensors}
            collisionDetection={rectIntersection}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            {isEditor && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15 }}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: '14px',
                padding: '1.5rem',
                marginBottom: '2rem',
              }}
            >
              {/* Family Members - Draggable */}
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '3px', marginBottom: '0.75rem' }}>
                  ANGGOTA KELUARGA
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <Tooltip text="Drag to assign">
                    <span style={{
                      fontSize: '0.75rem',
                      color: 'var(--accent)',
                      cursor: 'default',
                      userSelect: 'none',
                    }}>
                      ⇄
                    </span>
                  </Tooltip>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic', margin: 0 }}>
                    Drag anggota ke task untuk assign
                  </p>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                  {users.map(user => (
                    <DraggableMember key={user.id} user={user} disabled={!isEditor} />
                  ))}
                </div>
              </div>

              {/* Divider */}
              <div style={{ height: '1px', background: 'rgba(201,165,59,0.1)', margin: '1.25rem 0' }} />

              {/* Template Tasks */}
              <div>
                <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '3px', marginBottom: '0.75rem' }}>
                  TEMPLATE TUGAS
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.25rem' }}>
                  {TEMPLATES.map(t => (
                    <button
                      key={t}
                      onClick={() => addTask(undefined, t)}
                      style={{
                        padding: '5px 14px',
                        background: 'var(--bg-card2)',
                        border: '1px solid var(--border)',
                        borderRadius: '20px',
                        color: 'var(--text-muted)',
                        fontSize: '0.78rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.borderColor = 'var(--accent)';
                        e.currentTarget.style.color = 'var(--text-main)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.borderColor = 'var(--border)';
                        e.currentTarget.style.color = 'var(--text-muted)';
                      }}
                    >
                      + {t}
                    </button>
                  ))}
                </div>

                {/* Custom task input */}
                <form onSubmit={addTask} style={{ maxWidth: '560px' }}>
                  <div style={{
                    display: 'flex',
                    background: 'var(--bg-card2)',
                    border: inputFocused ? '1px solid var(--accent)' : '1px solid var(--border)',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    transition: 'border-color 0.2s',
                  }}>
                    <span style={{ padding: '0 1rem', display: 'flex', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>✦</span>
                    <input
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      onFocus={() => setInputFocused(true)}
                      onBlur={() => setInputFocused(false)}
                      placeholder="Tambah tugas lainnya..."
                      style={{
                        flex: 1, padding: '0.8rem 0', background: 'transparent',
                        border: 'none', color: 'var(--text-main)', fontSize: '0.875rem', outline: 'none',
                      }}
                    />
                    <button
                      type="submit"
                      disabled={!title.trim()}
                      style={{
                        padding: '0.8rem 1.25rem',
                        background: title.trim() ? 'var(--accent)' : 'var(--bg-card)',
                        border: 'none',
                        color: title.trim() ? '#1a1612' : 'var(--text-muted)',
                        fontWeight: '700', cursor: title.trim() ? 'pointer' : 'default',
                        fontSize: '0.72rem', letterSpacing: '1px', transition: 'all 0.2s',
                      }}
                    >
                      + ADD
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
            )}

            {/* Task list — mobile card stack or desktop list */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxWidth: '800px' }}
            >
              <AnimatePresence>
                {tasks.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center',
                      padding: '4rem 0', gap: '0.75rem',
                    }}
                  >
                    <div style={{ fontSize: '2rem', opacity: 0.2 }}>◻</div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic' }}>
                      Belum ada tugas keluarga ✦
                    </p>
                  </motion.div>
                ) : isMobile ? (
                  /* Mobile: card stack vertikal */
                  tasks.map((task, i) => {
                    const assignedUser = users.find(u => u.id === task.assigned_to);
                    const s = statusConfig[task.status] || statusConfig.pending;
                    return (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.97 }}
                        transition={{ delay: i * 0.03 }}
                        style={{
                          background: 'var(--bg-card)',
                          border: '1px solid var(--border)',
                          borderRadius: '10px',
                          padding: '1rem',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.6rem',
                        }}
                      >
                        {/* Judul */}
                        <p style={{
                          color: task.status === 'done' ? 'var(--text-muted)' : 'var(--text-main)',
                          textDecoration: task.status === 'done' ? 'line-through' : 'none',
                          fontSize: '0.95rem',
                          fontFamily: "'Playfair Display', Georgia, serif",
                          fontWeight: '600',
                          margin: 0,
                        }}>
                          {task.title}
                        </p>

                        {/* Status */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span style={{ fontSize: '0.7rem', color: s.color }}>{s.icon}</span>
                          <span style={{ fontSize: '0.72rem', color: s.color, letterSpacing: '0.5px' }}>{s.label}</span>
                        </div>

                        {/* Assignee */}
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {assignedUser ? (
                            <span style={{ color: 'var(--accent)' }}>
                              {getInitials(assignedUser.username)} · {assignedUser.username}
                            </span>
                          ) : (
                            <span style={{ fontStyle: 'italic' }}>Belum diassign</span>
                          )}
                        </div>

                        {/* Tombol aksi */}
                        {isEditor && (
                          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                            <select
                              value={task.status}
                              onChange={e => updateStatus(task.id, e.target.value)}
                              style={{
                                background: 'rgba(201,165,59,0.08)',
                                border: `1px solid ${s.color}40`,
                                borderRadius: '4px',
                                color: s.color,
                                padding: '4px 8px',
                                fontSize: '0.7rem',
                                cursor: 'pointer',
                                outline: 'none',
                                fontFamily: 'Georgia, serif',
                              }}
                            >
                              <option value="pending">Pending</option>
                              <option value="in_progress">In Progress</option>
                              <option value="done">Done</option>
                            </select>
                            <button
                              onClick={() => deleteTask(task.id)}
                              style={{
                                padding: '4px 10px',
                                borderRadius: '4px',
                                border: '1px solid rgba(180,60,60,0.3)',
                                background: 'rgba(180,60,60,0.08)',
                                color: '#b44040',
                                cursor: 'pointer',
                                fontSize: '0.68rem',
                                letterSpacing: '0.5px',
                                transition: 'all 0.15s ease',
                              }}
                            >
                              Hapus
                            </button>
                          </div>
                        )}
                      </motion.div>
                    );
                  })
                ) : (
                  /* Desktop: daftar normal dengan DroppableFamilyTask */
                  tasks.map((task, i) => {
                    const assignedUser = users.find(u => u.id === task.assigned_to);
                    return (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.97 }}
                        transition={{ delay: i * 0.03 }}
                      >
                        <DroppableFamilyTask
                          task={task}
                          assignedUser={assignedUser}
                          onStatusChange={isEditor ? updateStatus : undefined}
                          onDelete={isEditor ? deleteTask : undefined}
                        />
                      </motion.div>
                    );
                  })
                )}
              </AnimatePresence>
            </motion.div>

            <DragOverlay
              dropAnimation={{
                duration: 220,
                easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
              }}
            >
              {activeUser ? (
                <div style={{
                  opacity: 0.92,
                  transform: 'rotate(2deg) scale(1.06)',
                  filter: 'drop-shadow(0 8px 20px rgba(0,0,0,0.5)) drop-shadow(0 0 8px rgba(201,165,59,0.2))',
                }}>
                  <DraggableMember user={activeUser} />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </main>

        {/* Toast notifications */}
        <Toast toasts={toasts} onDismiss={dismissToast} />
      </div>
    </PageTransition>
  );
}
