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
  DragEndEvent
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
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
  'Cuci baju',
  'Setrika',
  'Pel lantai',
  'Masak nasi',
  'Cuci piring',
  'Bersih kamar mandi',
  'Sapu halaman',
  'Belanja bulanan',
];

export default function FamilyTasks() {
  const [tasks, setTasks] = useState<FamilyTask[]>([]);
  const [title, setTitle] = useState('');
  const [profile, setProfile] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const router = useRouter();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    init();
  }, []);

  async function init() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }

    const { data: prof } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();
    setProfile(prof);

    const { data: allUsers } = await supabase
      .from('users')
      .select('id, username, role');
    setUsers(allUsers || []);

    await fetchTasks();
    setLoading(false);
  }

  async function fetchTasks() {
    const { data } = await supabase
      .from('family_tasks')
      .select('*')
      .order('created_at', { ascending: false });
    setTasks(data || []);
  }

  async function addTask(e?: React.FormEvent, templateTitle?: string) {
    if (e) e.preventDefault();
    const t = templateTitle || title.trim();
    if (!t || !profile) return;

    await supabase.from('family_tasks').insert({
      title: t,
      created_by: profile.id,
    });

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

    if (!over) {
      setActiveId(null);
      return;
    }

    // Check if dragging a user chip onto a task
    const userId = active.id as string;
    const taskId = over.id as string;

    try {
      // Update assignment and auto-change status to in_progress
      const { error } = await supabase
        .from('family_tasks')
        .update({
          assigned_to: userId,
          status: 'in_progress',
        })
        .eq('id', taskId);

      if (error) throw error;

      // Refresh tasks
      await fetchTasks();
    } catch (error) {
      console.error('Assignment update failed:', error);
    }

    setActiveId(null);
  }

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg-main)',
        }}
      >
        <div style={{ color: 'var(--accent)', letterSpacing: '4px', fontSize: '0.8rem' }}>
          LOADING...
        </div>
      </div>
    );
  }

  const isEditor = profile?.role === 'papa' || profile?.role === 'mama';
  const activeUser = users.find(u => u.id === activeId);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-main)' }}>
      <Sidebar user={profile} />
      <main style={{ marginLeft: '220px', flex: 1, padding: '2.5rem 3rem' }}>
        <div style={{ marginBottom: '2.5rem' }}>
          <div
            style={{
              fontSize: '0.7rem',
              color: 'var(--text-muted)',
              letterSpacing: '3px',
              marginBottom: '6px',
            }}
          >
            FAMILY
          </div>
          <h1 style={{ fontSize: '2rem', color: 'var(--text-main)', fontWeight: 'normal' }}>
            Family Tasks
          </h1>
          {!isEditor && (
            <div
              style={{
                marginTop: '0.8rem',
                fontSize: '0.8rem',
                color: 'var(--text-muted)',
                fontStyle: 'italic',
              }}
            >
              Hanya Papa dan Mama yang bisa mengelola tugas keluarga.
            </div>
          )}
        </div>

        {isEditor && (
          <div style={{ marginBottom: '2rem' }}>
            {/* Family Members - Draggable */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div
                style={{
                  fontSize: '0.65rem',
                  color: 'var(--text-muted)',
                  letterSpacing: '2px',
                  marginBottom: '0.8rem',
                }}
              >
                ANGGOTA KELUARGA (Drag ke task untuk assign)
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.8rem' }}>
                {users.map(user => (
                  <DraggableMember key={user.id} user={user} disabled={!isEditor} />
                ))}
              </div>
            </div>

            {/* Template Tasks */}
            <div
              style={{
                fontSize: '0.65rem',
                color: 'var(--text-muted)',
                letterSpacing: '2px',
                marginBottom: '0.8rem',
              }}
            >
              TEMPLATE TUGAS
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.5rem' }}>
              {TEMPLATES.map(t => (
                <button
                  key={t}
                  onClick={() => addTask(undefined, t)}
                  style={{
                    padding: '6px 14px',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: '20px',
                    color: 'var(--text-muted)',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                  }}
                >
                  + {t}
                </button>
              ))}
            </div>

            {/* Add Custom Task */}
            <form onSubmit={addTask} style={{ display: 'flex', gap: '0.8rem', maxWidth: '600px' }}>
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Tambah tugas lainnya..."
                style={{
                  flex: 1,
                  padding: '0.8rem 1.2rem',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: '10px',
                  color: 'var(--text-main)',
                  fontSize: '0.9rem',
                  outline: 'none',
                }}
              />
              <button
                type="submit"
                style={{
                  padding: '0.8rem 1.5rem',
                  background: 'var(--accent)',
                  border: 'none',
                  borderRadius: '10px',
                  color: '#1a1612',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                }}
              >
                + ADD
              </button>
            </form>
          </div>
        )}

        {/* Task List with Drag and Drop */}
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem', maxWidth: '800px' }}>
            {tasks.length === 0 && (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', padding: '2rem 0' }}>
                Belum ada tugas keluarga ✦
              </div>
            )}
            {tasks.map(task => {
              const assignedUser = users.find(u => u.id === task.assigned_to);
              return (
                <DroppableFamilyTask
                  key={task.id}
                  task={task}
                  assignedUser={assignedUser}
                  onStatusChange={isEditor ? updateStatus : undefined}
                  onDelete={isEditor ? deleteTask : undefined}
                />
              );
            })}
          </div>

          <DragOverlay>
            {activeUser ? (
              <div style={{ opacity: 0.8 }}>
                <DraggableMember user={activeUser} />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </main>
    </div>
  );
}
