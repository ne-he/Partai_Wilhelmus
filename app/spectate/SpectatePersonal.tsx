'use client';

import { useState } from 'react';
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
import { motion } from 'framer-motion';
import DroppableColumn from '../../components/DroppableColumn';
import DraggableTask from '../../components/DraggableTask';
import TaskQueue from '../../components/TaskQueue';
import ConfirmModal from '../../components/ConfirmModal';
import type { User } from '../../Lib/types';
import type { ToastItem } from '../../Lib/hooks/useToast';
import type { PersonalTask, QueuedTask } from './sampleData';

/**
 * Papan personal versi spectate: tampilan sama dengan /personal,
 * tapi semua perubahan cuma mengubah state lokal.
 */

type Status = PersonalTask['status'];

interface SpectatePersonalProps {
  owner: User;
  users: User[];
  onSelectOwner: (id: string) => void;
  tasks: PersonalTask[];
  setTasks: React.Dispatch<React.SetStateAction<PersonalTask[]>>;
  queue: QueuedTask[];
  setQueue: React.Dispatch<React.SetStateAction<QueuedTask[]>>;
  showToast: (msg: string, type: ToastItem['type']) => void;
}

function newId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function nextOrder(list: PersonalTask[]) {
  return list.reduce((max, t) => Math.max(max, t.order), -1) + 1;
}

export default function SpectatePersonal({
  owner, users, onSelectOwner, tasks, setTasks, queue, setQueue, showToast,
}: SpectatePersonalProps) {
  const [title, setTitle] = useState('');
  const [inputFocused, setInputFocused] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const myTasks = tasks.filter(t => t.user_id === owner.id).sort((a, b) => a.order - b.order);
  const myQueue = queue.filter(q => q.user_id === owner.id);

  function addTask(e: React.FormEvent) {
    e.preventDefault();
    const t = title.trim();
    if (!t) return;
    const now = new Date().toISOString();
    setTasks(prev => [...prev, {
      id: newId('p'), user_id: owner.id, title: t, status: 'pending',
      order: nextOrder(myTasks), created_at: now, updated_at: now,
    }]);
    setTitle('');
    showToast('Tugas ditambahkan (cuma di mode spectate)', 'success');
  }

  function confirmDeleteTask() {
    if (!confirmDelete) return;
    setTasks(prev => prev.filter(t => t.id !== confirmDelete));
    setConfirmDelete(null);
    showToast('Tugas dihapus', 'success');
  }

  function moveQueueToToday(queuedTaskId: string) {
    const queuedTask = queue.find(t => t.id === queuedTaskId);
    if (!queuedTask) return;
    const now = new Date().toISOString();
    setQueue(prev => prev.filter(t => t.id !== queuedTaskId));
    setTasks(prev => [...prev, {
      id: newId('p'), user_id: queuedTask.user_id, title: queuedTask.title, status: queuedTask.status,
      order: nextOrder(myTasks), created_at: now, updated_at: now,
    }]);
    showToast(`"${queuedTask.title}" dipindah ke hari ini`, 'success');
  }

  function handleDragStart(event: DragStartEvent) { setActiveId(event.active.id as string); }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;
    const activeTask = myTasks.find(t => t.id === active.id);
    if (!activeTask) return;
    const newStatus: Status = (over.data.current?.status as Status | undefined) || activeTask.status;

    if (newStatus !== activeTask.status) {
      const order = nextOrder(myTasks.filter(t => t.status === newStatus));
      setTasks(prev => prev.map(t => t.id === activeTask.id
        ? { ...t, status: newStatus, order, updated_at: new Date().toISOString() }
        : t));
    } else if (active.id !== over.id) {
      const tasksInColumn = myTasks.filter(t => t.status === activeTask.status);
      const oldIndex = tasksInColumn.findIndex(t => t.id === active.id);
      const newIndex = tasksInColumn.findIndex(t => t.id === over.id);
      if (oldIndex < 0 || newIndex < 0) return;
      const newOrder = new Map(arrayMove(tasksInColumn, oldIndex, newIndex).map((t, i) => [t.id, i]));
      setTasks(prev => prev.map(t => newOrder.has(t.id) ? { ...t, order: newOrder.get(t.id) as number } : t));
    }
  }

  const pendingTasks = myTasks.filter(t => t.status === 'pending');
  const inProgressTasks = myTasks.filter(t => t.status === 'in_progress');
  const doneTasks = myTasks.filter(t => t.status === 'done');
  const activeTask = myTasks.find(t => t.id === activeId);
  const completionPct = myTasks.length > 0 ? Math.round((doneTasks.length / myTasks.length) * 100) : 0;

  return (
    <>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{ marginBottom: '1.5rem' }}
      >
        <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '4px', marginBottom: '4px' }}>
          PERSONAL WORKSPACE
        </div>
        <h1 style={{
          fontSize: '2.2rem',
          color: 'var(--text-main)',
          fontFamily: "'Playfair Display', Georgia, serif",
          fontWeight: '700',
          letterSpacing: '0.5px',
        }}>
          {owner.username}&apos;s Tasks
        </h1>
        <div style={{
          height: '2px', width: '60px',
          background: 'linear-gradient(to right, var(--accent), transparent)',
          marginTop: '0.5rem',
        }} />
      </motion.div>

      {/* Pilih papan anggota */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.75rem' }}>
        <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '2px', marginRight: '0.25rem' }}>
          PAPAN MILIK
        </span>
        {users.map(u => {
          const active = u.id === owner.id;
          return (
            <button
              key={u.id}
              onClick={() => onSelectOwner(u.id)}
              aria-pressed={active}
              style={{
                padding: '5px 14px',
                background: active ? 'rgba(200,169,110,0.12)' : 'var(--bg-card2)',
                border: active ? '1px solid var(--accent)' : '1px solid var(--border)',
                borderRadius: '20px',
                color: active ? 'var(--accent)' : 'var(--text-muted)',
                fontSize: '0.78rem',
                fontFamily: 'inherit',
                cursor: 'pointer',
              }}
            >
              {u.username}
            </button>
          );
        })}
      </div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}
      >
        <StatCard label="Total Tugas" value={myTasks.length} icon="◈" />
        <StatCard label="Selesai" value={doneTasks.length} icon="✦" accent />
        <StatCard label="Tersisa" value={myTasks.length - doneTasks.length} icon="◎" />
        <div style={{
          flex: 2, minWidth: '180px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '1rem 1.25rem',
          display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '0.5rem',
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

      {/* Add Task Input */}
      <form onSubmit={addTask} style={{ marginBottom: '2rem', maxWidth: '640px' }}>
        <div style={{
          display: 'flex',
          background: 'var(--bg-card)',
          border: inputFocused ? '1px solid var(--accent)' : '1px solid var(--border)',
          borderRadius: '12px',
          overflow: 'hidden',
          transition: 'border-color 0.2s, box-shadow 0.2s',
          boxShadow: inputFocused ? '0 0 16px rgba(201,165,59,0.12)' : 'none',
        }}>
          <span style={{ padding: '0 1rem', display: 'flex', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            ✦
          </span>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
            placeholder="Tambah tugas baru..."
            aria-label="Tambah tugas baru"
            style={{
              flex: 1, minWidth: 0, padding: '0.9rem 0',
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
              fontWeight: '700',
              cursor: title.trim() ? 'pointer' : 'default',
              fontSize: '0.75rem', letterSpacing: '1.5px', transition: 'all 0.2s',
            }}
          >
            + ADD
          </button>
        </div>
      </form>

      {/* Kanban Columns */}
      <DndContext
        id="spectate-personal"
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
          <DroppableColumn status="pending" title="Pending" tasks={pendingTasks} onDelete={setConfirmDelete} />
          <DroppableColumn status="in_progress" title="In Progress" tasks={inProgressTasks} onDelete={setConfirmDelete} />
          <DroppableColumn status="done" title="Done" tasks={doneTasks} onDelete={setConfirmDelete} />
        </motion.div>

        <DragOverlay dropAnimation={{ duration: 180, easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' }}>
          {activeTask ? <DraggableTask task={activeTask} isOverlay /> : null}
        </DragOverlay>
      </DndContext>

      {/* Queue Section */}
      <TaskQueue queuedTasks={myQueue} onMoveToToday={moveQueueToToday} />

      <ConfirmModal
        isOpen={!!confirmDelete}
        title="Hapus Tugas"
        message="Yakin ingin menghapus tugas ini? Di mode spectate, tugas balik lagi kalau halaman di-refresh."
        confirmLabel="Hapus"
        onConfirm={confirmDeleteTask}
        onCancel={() => setConfirmDelete(null)}
      />
    </>
  );
}

function StatCard({ label, value, icon, accent }: { label: string; value: number; icon: string; accent?: boolean }) {
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: accent ? '1px solid var(--accent)' : '1px solid var(--border)',
      borderRadius: '12px',
      padding: '1rem 1.25rem',
      minWidth: '110px',
      display: 'flex', flexDirection: 'column', gap: '0.25rem',
      boxShadow: accent ? '0 0 16px rgba(201,165,59,0.08)' : 'none',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{ fontSize: '0.8rem', color: accent ? 'var(--accent)' : 'var(--text-muted)' }}>{icon}</span>
        <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '1.5px' }}>{label.toUpperCase()}</span>
      </div>
      <div style={{
        fontSize: '1.8rem',
        color: accent ? 'var(--accent)' : 'var(--text-main)',
        fontFamily: "'Playfair Display', Georgia, serif",
        fontWeight: '700', lineHeight: 1,
      }}>
        {value}
      </div>
    </div>
  );
}
