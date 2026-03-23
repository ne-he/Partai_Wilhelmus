'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates, arrayMove } from '@dnd-kit/sortable';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../Lib/supabaseClient';
import Sidebar from '../../components/Sidebar';
import DroppableColumn from '../../components/DroppableColumn';
import DraggableTask from '../../components/DraggableTask';
import TaskQueue from '../../components/TaskQueue';
import ConfirmModal from '../../components/ConfirmModal';
import Toast from '../../components/Toast';
import { useToast } from '../../Lib/hooks/useToast';

export const dynamic = 'force-dynamic';

interface PersonalTask {
  id: string;
  user_id: string;
  title: string;
  status: 'pending' | 'in_progress' | 'done';
  order: number;
  created_at: string;
  updated_at: string;
}

interface User {
  id: string;
  email: string;
  username: string;
  role: string;
}

interface QueuedTask {
  id: string;
  user_id: string;
  title: string;
  status: 'pending' | 'in_progress' | 'done';
  original_created_at: string;
  queued_at: string;
  order: number;
}

export default function PersonalTasks() {
  const [tasks, setTasks] = useState<PersonalTask[]>([]);
  const [queuedTasks, setQueuedTasks] = useState<QueuedTask[]>([]);
  const [title, setTitle] = useState('');
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [inputFocused, setInputFocused] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { toasts, showToast, dismissToast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => { init(); }, []);

  async function init() {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) { router.push('/login'); return; }
    setUser(authUser);
    const { data: prof } = await supabase.from('users').select('*').eq('id', authUser.id).single();
    setProfile(prof);
    await fetchTasks(authUser.id);
    setLoading(false);
  }

  async function fetchTasks(uid: string) {
    if (!uid) return;
    const { data } = await supabase
      .from('personal_tasks').select('*').eq('user_id', uid).order('order', { ascending: true });
    setTasks(data || []);
    const { data: queueData } = await supabase
      .from('task_queue').select('*').eq('user_id', uid).order('queued_at', { ascending: false });
    setQueuedTasks(queueData || []);
  }

  async function addTask(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !user) return;
    await supabase.from('personal_tasks').insert({
      user_id: user.id, title: title.trim(), status: 'pending', order: tasks.length,
    });
    setTitle('');
    fetchTasks(user.id);
  }

  function requestDelete(id: string) {
    setConfirmDelete(id);
  }

  async function confirmDeleteTask() {
    if (!confirmDelete || !user) return;
    await supabase.from('personal_tasks').delete().eq('id', confirmDelete);
    setConfirmDelete(null);
    showToast('Tugas dihapus', 'success');
    fetchTasks(user.id);
  }

  async function moveQueueToToday(queuedTaskId: string) {
    const queuedTask = queuedTasks.find(t => t.id === queuedTaskId);
    if (!queuedTask || !user) return;
    try {
      const { data: newTask, error: insertError } = await supabase
        .from('personal_tasks')
        .insert({ user_id: queuedTask.user_id, title: queuedTask.title, status: queuedTask.status, order: tasks.length })
        .select().single();
      if (insertError) throw insertError;
      const { error: deleteError } = await supabase.from('task_queue').delete().eq('id', queuedTask.id);
      if (deleteError) { await supabase.from('personal_tasks').delete().eq('id', newTask.id); throw deleteError; }
      fetchTasks(user.id);
    } catch (error) { console.error('Failed to move task from queue:', error); }
  }

  function handleDragStart(event: DragStartEvent) { setActiveId(event.active.id as string); }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) { setActiveId(null); return; }
    const activeTask = tasks.find(t => t.id === active.id);
    if (!activeTask) { setActiveId(null); return; }
    const overData = over.data.current;
    const newStatus = overData?.status || activeTask.status;
    const originalTasks = [...tasks];
    try {
      if (newStatus !== activeTask.status) {
        setTasks(tasks.map(t => t.id === activeTask.id ? { ...t, status: newStatus } : t));
        const { error } = await supabase.from('personal_tasks')
          .update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', activeTask.id);
        if (error) throw error;
      } else if (active.id !== over.id) {
        const tasksInColumn = tasks.filter(t => t.status === activeTask.status);
        const oldIndex = tasksInColumn.findIndex(t => t.id === active.id);
        const newIndex = tasksInColumn.findIndex(t => t.id === over.id);
        const reordered = arrayMove(tasksInColumn, oldIndex, newIndex);
        const updates = reordered.map((task, index) => ({ id: task.id, order: index }));
        setTasks(tasks.map(t => { const u = updates.find(x => x.id === t.id); return u ? { ...t, order: u.order } : t; }));
        for (const update of updates) {
          await supabase.from('personal_tasks').update({ order: update.order }).eq('id', update.id);
        }
      }
    } catch (error) { console.error('Drag update failed:', error); setTasks(originalTasks); }
    setActiveId(null);
  }

  if (loading) return <LoadingScreen />;

  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress');
  const doneTasks = tasks.filter(t => t.status === 'done');
  const activeTask = tasks.find(t => t.id === activeId);
  const completionPct = tasks.length > 0 ? Math.round((doneTasks.length / tasks.length) * 100) : 0;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-main)' }}>
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='400' height='400' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E")`,
      }} />

      <Sidebar user={profile} />

      <main style={{ marginLeft: '220px', flex: 1, padding: '2.5rem 3rem', position: 'relative', zIndex: 1 }}>

        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          style={{ marginBottom: '2rem' }}
        >
          <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '4px', marginBottom: '4px' }}>
            PERSONAL WORKSPACE
          </div>
          <h1 style={{
            fontSize: '2.2rem', color: 'var(--text-main)',
            fontFamily: "'Playfair Display', Georgia, serif",
            fontWeight: '700', letterSpacing: '0.5px',
          }}>
            My Tasks
          </h1>
          <div style={{ height: '2px', width: '60px', background: 'linear-gradient(to right, var(--accent), transparent)', marginTop: '0.5rem' }} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}
        >
          <StatCard label="Total Tugas" value={tasks.length} icon="&#9672;" />
          <StatCard label="Selesai" value={doneTasks.length} icon="&#10022;" accent />
          <StatCard label="Tersisa" value={tasks.length - doneTasks.length} icon="&#9678;" />
          <div style={{
            flex: 2, minWidth: '180px',
            background: 'var(--bg-card)', backdropFilter: 'blur(12px)',
            border: '1px solid var(--border)', borderRadius: '12px',
            padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '0.5rem',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '1.5px' }}>PROGRESS</span>
              <span style={{ fontSize: '1rem', color: 'var(--accent)', fontWeight: '700' }}>{completionPct}%</span>
            </div>
            <div style={{ height: '4px', background: 'var(--border)', borderRadius: '2px', overflow: 'hidden' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${completionPct}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                style={{ height: '100%', background: 'linear-gradient(to right, var(--accent), #e8c96a)', borderRadius: '2px' }}
              />
            </div>
          </div>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          onSubmit={addTask}
          style={{ marginBottom: '2rem', maxWidth: '640px' }}
        >
          <div style={{
            display: 'flex',
            background: 'var(--bg-card)', backdropFilter: 'blur(12px)',
            border: inputFocused ? '1px solid var(--accent)' : '1px solid var(--border)',
            borderRadius: '12px', overflow: 'hidden',
            transition: 'border-color 0.2s, box-shadow 0.2s',
            boxShadow: inputFocused ? '0 0 16px rgba(201,165,59,0.12)' : 'none',
          }}>
            <span style={{ padding: '0 1rem', display: 'flex', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              &#10022;
            </span>
            <input
              ref={inputRef}
              value={title}
              onChange={e => setTitle(e.target.value)}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              placeholder="Tambah tugas baru..."
              style={{
                flex: 1, padding: '0.9rem 0',
                background: 'transparent', border: 'none',
                color: 'var(--text-main)', fontSize: '0.9rem', outline: 'none',
              }}
            />
            <button
              type="submit"
              disabled={!title.trim()}
              style={{
                padding: '0.9rem 1.5rem',
                background: title.trim() ? 'var(--accent)' : 'var(--bg-card2)',
                border: 'none',
                color: title.trim() ? '#1a1612' : 'var(--text-muted)',
                fontWeight: '700', cursor: title.trim() ? 'pointer' : 'default',
                fontSize: '0.75rem', letterSpacing: '1.5px', transition: 'all 0.2s',
              }}
            >
              + ADD
            </button>
          </div>
        </motion.form>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start', flexWrap: 'wrap' }}
          >
            <DroppableColumn status="pending" title="Pending" tasks={pendingTasks} onDelete={requestDelete} />
            <DroppableColumn status="in_progress" title="In Progress" tasks={inProgressTasks} onDelete={requestDelete} />
            <DroppableColumn status="done" title="Done" tasks={doneTasks} onDelete={requestDelete} />
          </motion.div>

          <DragOverlay dropAnimation={{ duration: 180, easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' }}>
            {activeTask ? <DraggableTask task={activeTask} isOverlay /> : null}
          </DragOverlay>
        </DndContext>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <TaskQueue queuedTasks={queuedTasks} onMoveToToday={moveQueueToToday} />
        </motion.div>
      </main>

      <ConfirmModal
        isOpen={!!confirmDelete}
        message="Yakin ingin menghapus tugas ini? Tindakan ini tidak bisa dibatalkan."
        onConfirm={confirmDeleteTask}
        onCancel={() => setConfirmDelete(null)}
      />

      <Toast toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

function StatCard({ label, value, icon, accent }: { label: string; value: number; icon: string; accent?: boolean }) {
  return (
    <div style={{
      background: 'var(--bg-card)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
      border: accent ? '1px solid var(--accent)' : '1px solid var(--border)',
      borderRadius: '12px', padding: '1rem 1.25rem', minWidth: '110px',
      display: 'flex', flexDirection: 'column', gap: '0.25rem',
      boxShadow: accent ? '0 0 16px rgba(201,165,59,0.08)' : 'none',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{ fontSize: '0.8rem', color: accent ? 'var(--accent)' : 'var(--text-muted)' }}>{icon}</span>
        <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '1.5px' }}>{label.toUpperCase()}</span>
      </div>
      <div style={{
        fontSize: '1.8rem', color: accent ? 'var(--accent)' : 'var(--text-main)',
        fontFamily: "'Playfair Display', Georgia, serif",
        fontWeight: '700', lineHeight: 1,
      }}>
        {value}
      </div>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-main)' }}>
      <div style={{ color: 'var(--accent)', letterSpacing: '6px', fontSize: '1.8rem', fontFamily: "'Playfair Display', Georgia, serif" }}>
        Bentar...
      </div>
    </div>
  );
}
