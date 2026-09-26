'use client';

import { useRef, useState } from 'react';
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
import DraggableMember from '../../components/DraggableMember';
import DroppableFamilyTask from '../../components/DroppableFamilyTask';
import Tooltip from '../../components/Tooltip';
import useBreakpoint from '../../Lib/hooks/useBreakpoint';
import type { FamilyTask, User } from '../../Lib/types';
import type { ToastItem } from '../../Lib/hooks/useToast';

/**
 * Papan keluarga versi spectate: tampilan sama dengan /family,
 * pengunjung diperlakukan sebagai editor, tapi semua perubahan cuma di state lokal.
 */

type Status = FamilyTask['status'];

interface SpectateFamilyProps {
  viewer: User;
  users: User[];
  tasks: FamilyTask[];
  setTasks: React.Dispatch<React.SetStateAction<FamilyTask[]>>;
  onOpenTask: (id: string) => void;
  showToast: (msg: string, type: ToastItem['type']) => void;
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

function newId() {
  return `f-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export default function SpectateFamily({ viewer, users, tasks, setTasks, onOpenTask, showToast }: SpectateFamilyProps) {
  const [title, setTitle] = useState('');
  const [inputFocused, setInputFocused] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  // Klik di select/tombol dalam kartu jangan ikut membuka modal detail.
  const skipOpenRef = useRef(false);
  const { isMobile } = useBreakpoint();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } })
  );

  function addTask(e?: React.FormEvent, templateTitle?: string) {
    if (e) e.preventDefault();
    const t = templateTitle || title.trim();
    if (!t) return;
    setTasks(prev => [{
      id: newId(), title: t, status: 'pending', created_by: viewer.id, assigned_to: null, created_at: new Date().toISOString(),
    }, ...prev]);
    setTitle('');
    showToast(`"${t}" ditambahkan (cuma di mode spectate)`, 'success');
  }

  function updateStatus(id: string, status: string) {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: status as Status } : t));
  }

  function deleteTask(id: string) {
    setTasks(prev => prev.filter(t => t.id !== id));
    showToast('Tugas dihapus', 'success');
  }

  function markClickSource(e: React.MouseEvent) {
    skipOpenRef.current = !!(e.target as HTMLElement).closest('select, button');
  }

  function openTask(id: string) {
    if (skipOpenRef.current) { skipOpenRef.current = false; return; }
    onOpenTask(id);
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;
    const draggedUser = users.find(u => u.id === active.id);
    const targetTask = tasks.find(t => t.id === over.id);
    if (!draggedUser || !targetTask) return;
    setTasks(prev => prev.map(t => t.id === targetTask.id
      ? { ...t, assigned_to: draggedUser.id, status: 'in_progress' }
      : t));
    showToast(`${draggedUser.username} ditugaskan ke "${targetTask.title}"`, 'success');
  }

  const activeUser = users.find(u => u.id === activeId);
  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress');
  const doneTasks = tasks.filter(t => t.status === 'done');

  return (
    <>
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
        <p style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
          Di aplikasi asli cuma Ayah dan Ibu yang bisa mengelola tugas keluarga. Di sini kamu boleh coba semuanya.
        </p>
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

      <DndContext
        id="spectate-family"
        sensors={sensors}
        collisionDetection={rectIntersection}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '14px',
            padding: isMobile ? '1.25rem' : '1.5rem',
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
                <span style={{ fontSize: '0.75rem', color: 'var(--accent)', cursor: 'default', userSelect: 'none' }}>
                  ⇄
                </span>
              </Tooltip>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic', margin: 0 }}>
                {isMobile ? 'Drag anggota ke task bisa dicoba di layar desktop' : 'Drag anggota ke task untuk assign'}
              </p>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
              {users.map(user => (
                <DraggableMember key={user.id} user={user} disabled={isMobile} />
              ))}
            </div>
          </div>

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
                  }}
                >
                  + {t}
                </button>
              ))}
            </div>

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
                  aria-label="Tambah tugas keluarga"
                  style={{
                    flex: 1, minWidth: 0, padding: '0.8rem 0', background: 'transparent',
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

        {/* Task list: mobile card stack, desktop daftar droppable */}
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
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4rem 0', gap: '0.75rem' }}
              >
                <div style={{ fontSize: '2rem', opacity: 0.2 }}>◻</div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic' }}>
                  Belum ada tugas keluarga ✦
                </p>
              </motion.div>
            ) : isMobile ? (
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
                    onClickCapture={markClickSource}
                    onClick={() => openTask(task.id)}
                    style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border)',
                      borderRadius: '10px',
                      padding: '1rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.6rem',
                      cursor: 'pointer',
                    }}
                  >
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

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ fontSize: '0.7rem', color: s.color }}>{s.icon}</span>
                      <span style={{ fontSize: '0.72rem', color: s.color, letterSpacing: '0.5px' }}>{s.label}</span>
                    </div>

                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {assignedUser ? (
                        <span style={{ color: 'var(--accent)' }}>
                          {getInitials(assignedUser.username)} · {assignedUser.username}
                        </span>
                      ) : (
                        <span style={{ fontStyle: 'italic' }}>Belum diassign</span>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                      <select
                        value={task.status}
                        onChange={e => updateStatus(task.id, e.target.value)}
                        aria-label={`Status ${task.title}`}
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
                        }}
                      >
                        Hapus
                      </button>
                    </div>
                  </motion.div>
                );
              })
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
                    onClickCapture={markClickSource}
                  >
                    <DroppableFamilyTask
                      task={task}
                      assignedUser={assignedUser}
                      onStatusChange={updateStatus}
                      onDelete={deleteTask}
                      onClick={t => openTask(t.id)}
                    />
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </motion.div>

        <DragOverlay dropAnimation={{ duration: 220, easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' }}>
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
    </>
  );
}
