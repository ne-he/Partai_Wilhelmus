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
  closestCorners,
  DragStartEvent,
  DragEndEvent
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates, arrayMove } from '@dnd-kit/sortable';
import { supabase } from '../../Lib/supabaseClient';
import Sidebar from '../../components/Sidebar';
import DroppableColumn from '../../components/DroppableColumn';
import DraggableTask from '../../components/DraggableTask';
import TaskQueue from '../../components/TaskQueue';
import PomodoroTimer from '../../components/PomodoroTimer';

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
    setUser(user);
    
    const { data: prof } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();
    setProfile(prof);
    
    await fetchTasks(user.id);
    setLoading(false);
  }

  async function fetchTasks(uid: string) {
    if (!uid) return;
    const { data } = await supabase
      .from('personal_tasks')
      .select('*')
      .eq('user_id', uid)
      .order('order', { ascending: true });
    setTasks(data || []);

    // Also fetch queued tasks
    const { data: queueData } = await supabase
      .from('task_queue')
      .select('*')
      .eq('user_id', uid)
      .order('queued_at', { ascending: false });
    setQueuedTasks(queueData || []);
  }

  async function addTask(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !user) return;
    
    const { error } = await supabase
      .from('personal_tasks')
      .insert({
        user_id: user.id,
        title: title.trim(),
        status: 'pending',
        order: tasks.length
      });
    
    if (error) {
      console.error('Add task error:', error);
      return;
    }
    
    setTitle('');
    fetchTasks(user.id);
  }

  async function deleteTask(id: string) {
    await supabase.from('personal_tasks').delete().eq('id', id);
    fetchTasks(user.id);
  }

  async function moveQueueToToday(queuedTaskId: string) {
    const queuedTask = queuedTasks.find(t => t.id === queuedTaskId);
    if (!queuedTask || !user) return;

    try {
      // Insert to personal_tasks
      const { data: newTask, error: insertError } = await supabase
        .from('personal_tasks')
        .insert({
          user_id: queuedTask.user_id,
          title: queuedTask.title,
          status: queuedTask.status,
          order: tasks.length,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Delete from queue
      const { error: deleteError } = await supabase
        .from('task_queue')
        .delete()
        .eq('id', queuedTask.id);

      if (deleteError) {
        // Rollback: delete the inserted task
        await supabase.from('personal_tasks').delete().eq('id', newTask.id);
        throw deleteError;
      }

      // Refresh tasks
      fetchTasks(user.id);
    } catch (error) {
      console.error('Failed to move task from queue:', error);
    }
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

    const activeTask = tasks.find(t => t.id === active.id);
    if (!activeTask) return;

    // Determine new status from drop zone
    const overData = over.data.current;
    const newStatus = overData?.status || activeTask.status;

    // Store original tasks for rollback
    const originalTasks = [...tasks];

    try {
      if (newStatus !== activeTask.status) {
        // Status change - move to different column
        const updatedTasks = tasks.map(t =>
          t.id === activeTask.id ? { ...t, status: newStatus } : t
        );
        setTasks(updatedTasks);

        const { error } = await supabase
          .from('personal_tasks')
          .update({
            status: newStatus,
            updated_at: new Date().toISOString()
          })
          .eq('id', activeTask.id);

        if (error) throw error;
      } else if (active.id !== over.id) {
        // Reorder within same column
        const tasksInColumn = tasks.filter(t => t.status === activeTask.status);
        const oldIndex = tasksInColumn.findIndex(t => t.id === active.id);
        const newIndex = tasksInColumn.findIndex(t => t.id === over.id);

        const reordered = arrayMove(tasksInColumn, oldIndex, newIndex);
        
        // Update order for all tasks in column
        const updates = reordered.map((task, index) => ({
          id: task.id,
          order: index
        }));

        // Optimistic update
        const updatedTasks = tasks.map(t => {
          const update = updates.find(u => u.id === t.id);
          return update ? { ...t, order: update.order } : t;
        });
        setTasks(updatedTasks);

        // Batch update to database
        for (const update of updates) {
          await supabase
            .from('personal_tasks')
            .update({ order: update.order })
            .eq('id', update.id);
        }
      }
    } catch (error) {
      console.error('Drag update failed:', error);
      // Rollback on error
      setTasks(originalTasks);
    }

    setActiveId(null);
  }

  if (loading) return <LoadingScreen />;

  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress');
  const doneTasks = tasks.filter(t => t.status === 'done');
  const activeTask = tasks.find(t => t.id === activeId);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-main)' }}>
      <Sidebar user={profile} />
      <main style={{ marginLeft: '220px', flex: 1, padding: '2.5rem 3rem' }}>
        {/* Header */}
        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', letterSpacing: '3px', marginBottom: '6px' }}>
            PERSONAL
          </div>
          <h1 style={{ fontSize: '2rem', color: 'var(--text-main)', fontWeight: 'normal' }}>
            My Tasks
          </h1>
          <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1rem' }}>
            <Stat label="Total" value={tasks.length} />
            <Stat label="Done" value={doneTasks.length} accent />
            <Stat label="Remaining" value={tasks.length - doneTasks.length} />
          </div>
        </div>

        {/* Add form */}
        <form onSubmit={addTask} style={{ display: 'flex', gap: '0.8rem', marginBottom: '2rem', maxWidth: '100%' }}>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Tambah tugas baru..."
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
          <button type="submit" style={{
            padding: '0.8rem 1.5rem',
            background: 'var(--accent)',
            border: 'none',
            borderRadius: '10px',
            color: '#1a1612',
            fontWeight: 'bold',
            cursor: 'pointer',
            fontSize: '0.85rem',
            letterSpacing: '1px',
          }}>
            + ADD
          </button>
        </form>

        {/* Pomodoro Timer */}
        <PomodoroTimer tasks={tasks} userId={user?.id || null} />

        {/* Drag and Drop Columns */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
            <DroppableColumn
              status="pending"
              title="Pending"
              tasks={pendingTasks}
              onDelete={deleteTask}
            />
            <DroppableColumn
              status="in_progress"
              title="In Progress"
              tasks={inProgressTasks}
              onDelete={deleteTask}
            />
            <DroppableColumn
              status="done"
              title="Done"
              tasks={doneTasks}
              onDelete={deleteTask}
            />
          </div>

          <DragOverlay>
            {activeTask ? (
              <div style={{ opacity: 0.8 }}>
                <DraggableTask task={activeTask} />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>

        {/* Task Queue */}
        <TaskQueue queuedTasks={queuedTasks} onMoveToToday={moveQueueToToday} />
      </main>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: '10px',
      padding: '0.6rem 1.2rem',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: '1.4rem', color: accent ? 'var(--accent)' : 'var(--text-main)', fontWeight: 'bold' }}>
        {value}
      </div>
      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '1px' }}>{label}</div>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-main)' }}>
      <div style={{ color: 'var(--accent)', letterSpacing: '4px', fontSize: '0.8rem' }}>LOADING...</div>
    </div>
  );
}
