'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  pointerWithin,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../Lib/supabaseClient';
import Sidebar from '../../components/Sidebar';
import DraggableMember from '../../components/DraggableMember';
import DroppableFamilyTask from '../../components/DroppableFamilyTask';

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

export default function FamilyTasks() {
  const [tasks, setTasks] = useState<FamilyTask[]>([]);
  const [title, setTitle] = useState('');
  const [profile, setProfile] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [inputFocused, setInputFocused] = useState(false);
  const router = useRouter();

  // Use only PointerSensor - keyboard sensor can interfere with drag detection
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
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

    // active.id is the user id being dragged
    // over.id is the task id being dropped onto
    const draggedUserId = active.id as string;
    const targetTaskId = over.id as string;

    // Verify the dragged item is a member (not a task)
    const draggedUser = users.find(u => u.id === draggedUserId);
    if (!draggedUser) return;

    // Verify the drop target is a task
    const targetTask = tasks.find(t => t.id === targetTaskId);
    if (!targetTask) return;

    try {
      const { error } = await supabase
        .from('family_tasks')
        .update({ assigned_to: draggedUserId, status: 'in_progress' })
        .eq('id', targetTaskId);
      if (error) throw error;
      await fetchTasks();
    } catch (error) {
      console.error('Assignment update failed:', error);
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-main)' }}>
        <div style={{ color: 'var(--accent)', letterSpacing: '4px', fontSize: '0.8rem' }}>LOADING...</div>
      </div>
    );
  }

  const isEditor = profile?.role === 'papa' || profile?.role === 'mama';
  const activeUser = users.find(u => u.id === activeId);

  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress');
  const doneTasks = tasks.filter(t => t.status === 'done');

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-main)' }}>
      {/* Paper texture */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='400' height='400' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E")`,
      }} />

      <Sidebar user={profile} />

      <main style={{ marginLeft: '220px', flex: 1, padding: '2.5rem 3rem', position: 'relative', zIndex: 1 }}>

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
            fontSize: '2.2rem',
            color: 'var(--text-main)',
            fontFamily: "'Playfair Display', Georgia, serif",
            fontWeight: '700',
          }}>
            Family Tasks
          </h1>
          <div style={{ height: '2px', width: '60px', background: 'linear-gradient(to right, var(--accent), transparent)', marginTop: '0.5rem' }} />
          {!isEditor && (
            <p style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
              Hanya Papa dan Mama yang bisa mengelola tugas keluarga.
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
              background: 'rgba(62,44,27,0.7)',
              backdropFilter: 'blur(12px)',
              border: s.accent ? '1px solid rgba(201,165,59,0.35)' : '1px solid rgba(201,165,59,0.15)',
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

        {isEditor && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            style={{
              background: 'rgba(62,44,27,0.6)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(201,165,59,0.15)',
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
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: '0.75rem' }}>
                Drag anggota ke task untuk assign
              </p>
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
                      background: 'rgba(44,26,14,0.6)',
                      border: '1px solid rgba(201,165,59,0.2)',
                      borderRadius: '20px',
                      color: 'var(--text-muted)',
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = 'rgba(201,165,59,0.5)';
                      e.currentTarget.style.color = 'var(--text-main)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = 'rgba(201,165,59,0.2)';
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
                  background: 'rgba(44,26,14,0.6)',
                  border: inputFocused ? '1px solid rgba(201,165,59,0.6)' : '1px solid rgba(201,165,59,0.2)',
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
                      background: title.trim() ? 'var(--accent)' : 'rgba(201,165,59,0.15)',
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

        {/* Task List with Drag and Drop */}
        <DndContext
          sensors={sensors}
          collisionDetection={pointerWithin}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
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
              ) : (
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

          <DragOverlay>
            {activeUser ? (
              <div style={{ opacity: 0.9, transform: 'rotate(3deg) scale(1.05)' }}>
                <DraggableMember user={activeUser} />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </main>
    </div>
  );
}
