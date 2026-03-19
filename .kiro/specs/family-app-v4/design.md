# Design Document: Family App V4

## Overview

Family App V4 adalah enhancement dari aplikasi family task management yang sudah ada, dengan penambahan fitur-fitur modern untuk meningkatkan user experience dan produktivitas. Aplikasi ini dibangun menggunakan Next.js 14 App Router, TypeScript, Tailwind CSS, dan Supabase sebagai backend.

### Key Features

1. **Page Transitions dengan Framer Motion** - Animasi transisi halaman yang smooth untuk navigasi yang lebih natural
2. **Drag-and-Drop Task Management** - Interface intuitif untuk mengelola personal tasks dengan @dnd-kit
3. **Drag-and-Drop Assignment** - Visual assignment family tasks dengan drag nama anggota keluarga
4. **Pomodoro Timer** - Timer fokus 25 menit dengan tracking dan statistik
5. **Daily Task Reset & Queue** - Sistem otomatis untuk reset tugas harian dan queue management
6. **Audio Notifications** - Notifikasi suara untuk timer completion
7. **Visual Feedback** - Feedback visual yang jelas untuk semua drag-and-drop operations

### Technology Stack

- **Frontend**: Next.js 14 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS 4, Custom CSS Variables
- **Animation**: Framer Motion, @dnd-kit
- **Backend**: Supabase (PostgreSQL, Auth, Realtime)
- **Deployment**: Vercel (dengan Cron Jobs)

### Design Principles

- **Consistency**: Mengikuti tema earthtone/mafia vintage yang sudah ada
- **Intuitiveness**: Drag-and-drop untuk operasi yang lebih natural
- **Productivity**: Pomodoro timer untuk meningkatkan fokus
- **Automation**: Daily reset untuk mengurangi manual task management


## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Page Router  │  │  Components  │  │  State Mgmt  │      │
│  │  (App Dir)   │  │  (React 19)  │  │   (Hooks)    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         │                  │                  │              │
│         └──────────────────┴──────────────────┘              │
│                           │                                  │
└───────────────────────────┼──────────────────────────────────┘
                            │
                    ┌───────▼────────┐
                    │  Supabase SDK  │
                    └───────┬────────┘
                            │
┌───────────────────────────┼──────────────────────────────────┐
│                    Backend Layer                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  PostgreSQL  │  │   Auth RLS   │  │   Realtime   │      │
│  │   Database   │  │   Policies   │  │  Subscript.  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└───────────────────────────────────────────────────────────────┘
                            │
                    ┌───────▼────────┐
                    │  Vercel Cron   │
                    │  (Daily Reset) │
                    └────────────────┘
```

### Component Architecture

```
app/
├── layout.tsx (Root Layout dengan CSS Variables)
├── personal/
│   └── page.tsx (Personal Tasks dengan DnD + Pomodoro)
├── family/
│   └── page.tsx (Family Tasks dengan DnD Assignment)
└── api/
    └── cron/
        └── daily-reset/
            └── route.ts (Cron handler)

components/
├── Sidebar.tsx (Navigation)
├── PomodoroTimer.tsx (Timer UI + Logic)
├── DraggableTask.tsx (Task card dengan drag)
├── DroppableColumn.tsx (Status column)
├── DraggableMember.tsx (Family member chip)
├── TaskQueue.tsx (Queue display)
└── PageTransition.tsx (Framer Motion wrapper)

lib/
├── supabase/
│   ├── client.ts (Browser client)
│   └── server.ts (Server client)
├── hooks/
│   ├── usePomodoro.ts (Timer logic)
│   ├── useDragAndDrop.ts (DnD state)
│   └── useTaskQueue.ts (Queue operations)
└── utils/
    ├── audio.ts (Notification sounds)
    └── daily-reset.ts (Reset logic)
```


## Components and Interfaces

### 1. PageTransition Component

Wrapper component untuk animasi transisi halaman menggunakan Framer Motion.

```typescript
interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

// Usage in layout
<PageTransition>
  {children}
</PageTransition>
```

**Animation Variants:**
- `initial`: { opacity: 0, y: 20 }
- `animate`: { opacity: 1, y: 0 }
- `exit`: { opacity: 0, y: -20 }
- Duration: 0.3s, easing: [0.4, 0, 0.2, 1]

### 2. PomodoroTimer Component

Timer component dengan state management untuk work/break sessions.

```typescript
interface PomodoroTimerProps {
  taskId?: string;
  onSessionComplete?: (session: FocusSession) => void;
}

interface PomodoroState {
  timeLeft: number; // seconds
  isRunning: boolean;
  sessionType: 'work' | 'break';
  currentTaskId: string | null;
}

// Methods
- startTimer(taskId?: string): void
- pauseTimer(): void
- resetTimer(): void
- skipToBreak(): void
```

**Timer Logic:**
- Work session: 25 minutes (1500 seconds)
- Break session: 5 minutes (300 seconds)
- Auto-transition from work to break
- Persist state to localStorage for page navigation
- Save completed sessions to database

### 3. DraggableTask Component

Task card yang dapat di-drag untuk reordering dan status change.

```typescript
interface DraggableTaskProps {
  task: PersonalTask;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onDelete: (taskId: string) => void;
}

interface PersonalTask {
  id: string;
  user_id: string;
  title: string;
  status: 'pending' | 'in_progress' | 'done';
  order: number;
  created_at: string;
  updated_at: string;
}
```

**Drag Behavior:**
- Draggable within same column (reorder)
- Draggable to different columns (status change)
- Visual feedback: opacity 0.5 while dragging
- Cursor: grab/grabbing

### 4. DroppableColumn Component

Container untuk tasks dengan specific status, menerima dropped tasks.

```typescript
interface DroppableColumnProps {
  status: TaskStatus;
  tasks: PersonalTask[];
  onDrop: (taskId: string, newStatus: TaskStatus, newOrder: number) => void;
}

// Columns
- Pending (status: 'pending')
- In Progress (status: 'in_progress')
- Done (status: 'done')
```

**Drop Behavior:**
- Highlight border saat drag over
- Calculate new order based on drop position
- Update database on drop

### 5. DraggableMember Component

Chip untuk family member yang dapat di-drag ke family task.

```typescript
interface DraggableMemberProps {
  user: User;
  disabled?: boolean;
}

interface User {
  id: string;
  username: string;
  role: string;
}
```

**Drag Behavior:**
- Only enabled for parent users (papa/mama)
- Visual feedback on drag
- Can be dropped on family task cards

### 6. TaskQueue Component

Display untuk queued tasks dengan option to move to today.

```typescript
interface TaskQueueProps {
  queuedTasks: QueuedTask[];
  onMoveToToday: (taskId: string) => void;
}

interface QueuedTask {
  id: string;
  user_id: string;
  title: string;
  status: TaskStatus;
  original_created_at: string;
  queued_at: string;
  order: number;
}
```

**Features:**
- Display tasks from task_queue table
- Drag to "Today's Tasks" column
- "Move to Today" button for each task
- Show queued date


## Data Models

### Database Schema

#### 1. focus_sessions Table

Menyimpan data Pomodoro sessions untuk tracking dan statistik.

```sql
CREATE TABLE focus_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  task_id UUID REFERENCES personal_tasks(id) ON DELETE SET NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  duration INTEGER NOT NULL, -- in minutes
  session_type VARCHAR(10) NOT NULL CHECK (session_type IN ('work', 'break')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_focus_sessions_user_id ON focus_sessions(user_id);
CREATE INDEX idx_focus_sessions_created_at ON focus_sessions(created_at);
CREATE INDEX idx_focus_sessions_task_id ON focus_sessions(task_id);
```

**Fields:**
- `id`: Primary key
- `user_id`: Foreign key ke users table
- `task_id`: Optional foreign key ke personal_tasks (nullable)
- `start_time`: Timestamp saat session dimulai
- `end_time`: Timestamp saat session selesai
- `duration`: Durasi dalam menit (25 untuk work, 5 untuk break)
- `session_type`: Enum 'work' atau 'break'
- `created_at`: Timestamp pembuatan record

**RLS Policies:**
```sql
-- Users can only read their own sessions
CREATE POLICY "Users can view own focus sessions"
  ON focus_sessions FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own sessions
CREATE POLICY "Users can insert own focus sessions"
  ON focus_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

#### 2. task_queue Table

Menyimpan tasks yang di-queue dari daily reset.

```sql
CREATE TABLE task_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'in_progress', 'done')),
  original_created_at TIMESTAMPTZ NOT NULL,
  queued_at TIMESTAMPTZ DEFAULT NOW(),
  order INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_task_queue_user_id ON task_queue(user_id);
CREATE INDEX idx_task_queue_queued_at ON task_queue(queued_at);
```

**Fields:**
- `id`: Primary key
- `user_id`: Foreign key ke users table
- `title`: Judul task
- `status`: Status terakhir sebelum di-queue
- `original_created_at`: Timestamp pembuatan task asli
- `queued_at`: Timestamp saat task dipindahkan ke queue
- `order`: Urutan dalam queue

**RLS Policies:**
```sql
-- Users can only access their own queue
CREATE POLICY "Users can view own queue"
  ON task_queue FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own queue"
  ON task_queue FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own queue"
  ON task_queue FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own queue"
  ON task_queue FOR DELETE
  USING (auth.uid() = user_id);
```

#### 3. personal_tasks Table (Updated)

Menambahkan field `order` untuk drag-and-drop ordering.

```sql
ALTER TABLE personal_tasks ADD COLUMN IF NOT EXISTS order INTEGER DEFAULT 0;

CREATE INDEX idx_personal_tasks_user_status ON personal_tasks(user_id, status);
CREATE INDEX idx_personal_tasks_order ON personal_tasks(order);
```

**Updated Fields:**
- `order`: Integer untuk menentukan urutan task dalam kolom yang sama

#### 4. TypeScript Interfaces

```typescript
// Focus Session
interface FocusSession {
  id: string;
  user_id: string;
  task_id: string | null;
  start_time: string;
  end_time: string;
  duration: number;
  session_type: 'work' | 'break';
  created_at: string;
}

// Queued Task
interface QueuedTask {
  id: string;
  user_id: string;
  title: string;
  status: 'pending' | 'in_progress' | 'done';
  original_created_at: string;
  queued_at: string;
  order: number;
}

// Personal Task (updated)
interface PersonalTask {
  id: string;
  user_id: string;
  title: string;
  status: 'pending' | 'in_progress' | 'done';
  order: number;
  created_at: string;
  updated_at: string;
}

// Timer State (localStorage)
interface TimerState {
  timeLeft: number;
  isRunning: boolean;
  sessionType: 'work' | 'break';
  currentTaskId: string | null;
  startedAt: number | null;
}
```


## API Endpoints and Server Actions

### 1. Supabase Queries

#### Personal Tasks

```typescript
// Fetch tasks by user and status
async function fetchPersonalTasks(userId: string) {
  const { data, error } = await supabase
    .from('personal_tasks')
    .select('*')
    .eq('user_id', userId)
    .order('order', { ascending: true });
  
  return { data, error };
}

// Update task status and order
async function updateTaskStatus(
  taskId: string, 
  status: TaskStatus, 
  order: number
) {
  const { data, error } = await supabase
    .from('personal_tasks')
    .update({ 
      status, 
      order,
      updated_at: new Date().toISOString() 
    })
    .eq('id', taskId);
  
  return { data, error };
}

// Reorder tasks within same column
async function reorderTasks(taskId: string, newOrder: number) {
  const { data, error } = await supabase
    .from('personal_tasks')
    .update({ order: newOrder })
    .eq('id', taskId);
  
  return { data, error };
}
```

#### Task Queue

```typescript
// Fetch queued tasks
async function fetchQueuedTasks(userId: string) {
  const { data, error } = await supabase
    .from('task_queue')
    .select('*')
    .eq('user_id', userId)
    .order('queued_at', { ascending: false });
  
  return { data, error };
}

// Move task from queue to today
async function moveQueueToToday(queuedTask: QueuedTask) {
  // Insert to personal_tasks
  const { data: newTask, error: insertError } = await supabase
    .from('personal_tasks')
    .insert({
      user_id: queuedTask.user_id,
      title: queuedTask.title,
      status: queuedTask.status,
      order: 0
    })
    .select()
    .single();
  
  if (insertError) return { error: insertError };
  
  // Delete from queue
  const { error: deleteError } = await supabase
    .from('task_queue')
    .delete()
    .eq('id', queuedTask.id);
  
  return { data: newTask, error: deleteError };
}
```

#### Focus Sessions

```typescript
// Save completed session
async function saveFocusSession(session: Omit<FocusSession, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('focus_sessions')
    .insert(session)
    .select()
    .single();
  
  return { data, error };
}

// Get user statistics
async function getUserFocusStats(userId: string, startDate: Date, endDate: Date) {
  const { data, error } = await supabase
    .from('focus_sessions')
    .select('duration, session_type, created_at')
    .eq('user_id', userId)
    .eq('session_type', 'work')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString());
  
  const totalMinutes = data?.reduce((sum, s) => sum + s.duration, 0) || 0;
  const totalSessions = data?.length || 0;
  
  return { totalMinutes, totalSessions, error };
}
```

#### Family Tasks

```typescript
// Update assignment via drag-and-drop
async function updateFamilyTaskAssignment(
  taskId: string, 
  assignedTo: string | null
) {
  const updates: any = { assigned_to: assignedTo };
  
  // Auto-update status to in_progress when assigned
  if (assignedTo) {
    updates.status = 'in_progress';
  }
  
  const { data, error } = await supabase
    .from('family_tasks')
    .update(updates)
    .eq('id', taskId);
  
  return { data, error };
}
```

### 2. Vercel Cron API Route

#### Daily Reset Endpoint

```typescript
// app/api/cron/daily-reset/route.ts

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  
  try {
    // Get all users
    const { data: users } = await supabase
      .from('users')
      .select('id');
    
    const results = [];
    
    for (const user of users || []) {
      const result = await performDailyReset(supabase, user.id);
      results.push({ userId: user.id, ...result });
    }
    
    return NextResponse.json({ 
      success: true, 
      processed: results.length,
      results 
    });
  } catch (error) {
    console.error('Daily reset error:', error);
    return NextResponse.json({ 
      error: 'Reset failed', 
      details: error 
    }, { status: 500 });
  }
}

async function performDailyReset(supabase: any, userId: string) {
  // 1. Delete done tasks
  const { error: deleteError } = await supabase
    .from('personal_tasks')
    .delete()
    .eq('user_id', userId)
    .eq('status', 'done');
  
  if (deleteError) return { success: false, error: deleteError };
  
  // 2. Get pending/in_progress tasks
  const { data: tasksToQueue } = await supabase
    .from('personal_tasks')
    .select('*')
    .eq('user_id', userId)
    .in('status', ['pending', 'in_progress']);
  
  if (!tasksToQueue || tasksToQueue.length === 0) {
    return { success: true, queued: 0 };
  }
  
  // 3. Move to queue
  const queueData = tasksToQueue.map((task, index) => ({
    user_id: task.user_id,
    title: task.title,
    status: task.status,
    original_created_at: task.created_at,
    order: index
  }));
  
  const { error: insertError } = await supabase
    .from('task_queue')
    .insert(queueData);
  
  if (insertError) return { success: false, error: insertError };
  
  // 4. Delete from personal_tasks
  const { error: deleteTasksError } = await supabase
    .from('personal_tasks')
    .delete()
    .eq('user_id', userId)
    .in('status', ['pending', 'in_progress']);
  
  return { 
    success: !deleteTasksError, 
    queued: tasksToQueue.length,
    error: deleteTasksError 
  };
}
```

#### Vercel Configuration

```json
// vercel.json
{
  "crons": [{
    "path": "/api/cron/daily-reset",
    "schedule": "0 0 * * *"
  }]
}
```


## State Management Strategy

### 1. Local State (React Hooks)

Menggunakan React hooks untuk component-level state management.

```typescript
// Personal Tasks Page
const [tasks, setTasks] = useState<PersonalTask[]>([]);
const [queuedTasks, setQueuedTasks] = useState<QueuedTask[]>([]);
const [loading, setLoading] = useState(true);

// Pomodoro Timer
const [timerState, setTimerState] = useState<TimerState>({
  timeLeft: 1500,
  isRunning: false,
  sessionType: 'work',
  currentTaskId: null,
  startedAt: null
});

// Drag and Drop
const [activeId, setActiveId] = useState<string | null>(null);
const [overId, setOverId] = useState<string | null>(null);
```

### 2. Custom Hooks

#### usePomodoro Hook

```typescript
interface UsePomodoroReturn {
  timeLeft: number;
  isRunning: boolean;
  sessionType: 'work' | 'break';
  currentTaskId: string | null;
  startTimer: (taskId?: string) => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  skipToBreak: () => void;
}

function usePomodoro(): UsePomodoroReturn {
  const [state, setState] = useState<TimerState>(loadFromLocalStorage);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Load state from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('pomodoroState');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Recalculate timeLeft if timer was running
      if (parsed.isRunning && parsed.startedAt) {
        const elapsed = Math.floor((Date.now() - parsed.startedAt) / 1000);
        parsed.timeLeft = Math.max(0, parsed.timeLeft - elapsed);
      }
      setState(parsed);
    }
  }, []);
  
  // Save state to localStorage on change
  useEffect(() => {
    localStorage.setItem('pomodoroState', JSON.stringify(state));
  }, [state]);
  
  // Timer countdown logic
  useEffect(() => {
    if (state.isRunning && state.timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setState(prev => {
          const newTimeLeft = prev.timeLeft - 1;
          
          if (newTimeLeft <= 0) {
            handleSessionComplete(prev);
            return getNextSessionState(prev);
          }
          
          return { ...prev, timeLeft: newTimeLeft };
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [state.isRunning, state.timeLeft]);
  
  const startTimer = (taskId?: string) => {
    setState(prev => ({
      ...prev,
      isRunning: true,
      currentTaskId: taskId || prev.currentTaskId,
      startedAt: Date.now()
    }));
  };
  
  const pauseTimer = () => {
    setState(prev => ({ ...prev, isRunning: false, startedAt: null }));
  };
  
  const resetTimer = () => {
    setState({
      timeLeft: 1500,
      isRunning: false,
      sessionType: 'work',
      currentTaskId: null,
      startedAt: null
    });
  };
  
  const skipToBreak = () => {
    setState({
      timeLeft: 300,
      isRunning: false,
      sessionType: 'break',
      currentTaskId: null,
      startedAt: null
    });
  };
  
  return {
    timeLeft: state.timeLeft,
    isRunning: state.isRunning,
    sessionType: state.sessionType,
    currentTaskId: state.currentTaskId,
    startTimer,
    pauseTimer,
    resetTimer,
    skipToBreak
  };
}

function handleSessionComplete(state: TimerState) {
  // Play audio notification
  playNotificationSound();
  
  // Save to database
  if (state.sessionType === 'work') {
    saveFocusSession({
      user_id: getCurrentUserId(),
      task_id: state.currentTaskId,
      start_time: new Date(state.startedAt!).toISOString(),
      end_time: new Date().toISOString(),
      duration: 25,
      session_type: 'work'
    });
  }
}

function getNextSessionState(prev: TimerState): TimerState {
  if (prev.sessionType === 'work') {
    return {
      timeLeft: 300,
      isRunning: true,
      sessionType: 'break',
      currentTaskId: null,
      startedAt: Date.now()
    };
  } else {
    return {
      timeLeft: 1500,
      isRunning: false,
      sessionType: 'work',
      currentTaskId: null,
      startedAt: null
    };
  }
}
```

#### useDragAndDrop Hook

```typescript
interface UseDragAndDropReturn {
  sensors: SensorDescriptor<any>[];
  handleDragStart: (event: DragStartEvent) => void;
  handleDragOver: (event: DragOverEvent) => void;
  handleDragEnd: (event: DragEndEvent) => void;
  activeId: string | null;
}

function useDragAndDrop(
  tasks: PersonalTask[],
  onTaskMove: (taskId: string, newStatus: TaskStatus, newOrder: number) => void
): UseDragAndDropReturn {
  const [activeId, setActiveId] = useState<string | null>(null);
  
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
  
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };
  
  const handleDragOver = (event: DragOverEvent) => {
    // Visual feedback handled by @dnd-kit
  };
  
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) {
      setActiveId(null);
      return;
    }
    
    const activeTask = tasks.find(t => t.id === active.id);
    if (!activeTask) return;
    
    // Determine new status from drop zone
    const newStatus = over.data.current?.status || activeTask.status;
    
    // Calculate new order
    const tasksInColumn = tasks.filter(t => t.status === newStatus);
    const overIndex = tasksInColumn.findIndex(t => t.id === over.id);
    const newOrder = overIndex >= 0 ? overIndex : tasksInColumn.length;
    
    onTaskMove(activeTask.id, newStatus, newOrder);
    setActiveId(null);
  };
  
  return {
    sensors,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    activeId
  };
}
```

#### useTaskQueue Hook

```typescript
interface UseTaskQueueReturn {
  queuedTasks: QueuedTask[];
  loading: boolean;
  moveToToday: (taskId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

function useTaskQueue(userId: string): UseTaskQueueReturn {
  const [queuedTasks, setQueuedTasks] = useState<QueuedTask[]>([]);
  const [loading, setLoading] = useState(true);
  
  const fetchQueue = async () => {
    const { data, error } = await fetchQueuedTasks(userId);
    if (!error && data) {
      setQueuedTasks(data);
    }
    setLoading(false);
  };
  
  useEffect(() => {
    fetchQueue();
  }, [userId]);
  
  const moveToToday = async (taskId: string) => {
    const task = queuedTasks.find(t => t.id === taskId);
    if (!task) return;
    
    const { error } = await moveQueueToToday(task);
    if (!error) {
      setQueuedTasks(prev => prev.filter(t => t.id !== taskId));
    }
  };
  
  return {
    queuedTasks,
    loading,
    moveToToday,
    refresh: fetchQueue
  };
}
```

### 3. Realtime Subscriptions

```typescript
// Subscribe to personal_tasks changes
useEffect(() => {
  const channel = supabase
    .channel('personal_tasks_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'personal_tasks',
        filter: `user_id=eq.${userId}`
      },
      (payload) => {
        // Refresh tasks on any change
        fetchTasks();
      }
    )
    .subscribe();
  
  return () => {
    supabase.removeChannel(channel);
  };
}, [userId]);
```


## Integration dengan Supabase

### 1. Client Setup

```typescript
// lib/supabase/client.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

```typescript
// lib/supabase/server.ts (for API routes)
import { createClient } from '@supabase/supabase-js';

export function createServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
```

### 2. Database Queries

#### Complex Queries

```typescript
// Get tasks grouped by status
async function getTasksByStatus(userId: string) {
  const { data, error } = await supabase
    .from('personal_tasks')
    .select('*')
    .eq('user_id', userId)
    .order('order', { ascending: true });
  
  if (error) return { error };
  
  const grouped = {
    pending: data.filter(t => t.status === 'pending'),
    in_progress: data.filter(t => t.status === 'in_progress'),
    done: data.filter(t => t.status === 'done')
  };
  
  return { data: grouped };
}

// Get focus statistics for date range
async function getFocusStatsByDateRange(
  userId: string,
  startDate: Date,
  endDate: Date
) {
  const { data, error } = await supabase
    .from('focus_sessions')
    .select('duration, session_type, created_at')
    .eq('user_id', userId)
    .eq('session_type', 'work')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())
    .order('created_at', { ascending: false });
  
  if (error) return { error };
  
  // Group by date
  const byDate = data.reduce((acc, session) => {
    const date = new Date(session.created_at).toLocaleDateString();
    if (!acc[date]) acc[date] = { sessions: 0, minutes: 0 };
    acc[date].sessions++;
    acc[date].minutes += session.duration;
    return acc;
  }, {} as Record<string, { sessions: number; minutes: number }>);
  
  return { data: byDate };
}
```

#### Batch Operations

```typescript
// Reorder multiple tasks after drag
async function batchReorderTasks(updates: Array<{ id: string; order: number }>) {
  const promises = updates.map(({ id, order }) =>
    supabase
      .from('personal_tasks')
      .update({ order })
      .eq('id', id)
  );
  
  const results = await Promise.all(promises);
  const errors = results.filter(r => r.error);
  
  return { success: errors.length === 0, errors };
}
```

### 3. Realtime Subscriptions

```typescript
// Subscribe to task changes
function subscribeToTaskChanges(
  userId: string,
  onInsert: (task: PersonalTask) => void,
  onUpdate: (task: PersonalTask) => void,
  onDelete: (taskId: string) => void
) {
  const channel = supabase
    .channel(`tasks:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'personal_tasks',
        filter: `user_id=eq.${userId}`
      },
      (payload) => onInsert(payload.new as PersonalTask)
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'personal_tasks',
        filter: `user_id=eq.${userId}`
      },
      (payload) => onUpdate(payload.new as PersonalTask)
    )
    .on(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'public',
        table: 'personal_tasks',
        filter: `user_id=eq.${userId}`
      },
      (payload) => onDelete(payload.old.id)
    )
    .subscribe();
  
  return () => supabase.removeChannel(channel);
}
```

### 4. Mutations

```typescript
// Transaction-like operation for moving task from queue
async function moveTaskFromQueue(queuedTask: QueuedTask) {
  // Start with insert
  const { data: newTask, error: insertError } = await supabase
    .from('personal_tasks')
    .insert({
      user_id: queuedTask.user_id,
      title: queuedTask.title,
      status: queuedTask.status,
      order: 0
    })
    .select()
    .single();
  
  if (insertError) {
    console.error('Failed to insert task:', insertError);
    return { error: insertError };
  }
  
  // Then delete from queue
  const { error: deleteError } = await supabase
    .from('task_queue')
    .delete()
    .eq('id', queuedTask.id);
  
  if (deleteError) {
    // Rollback: delete the inserted task
    await supabase
      .from('personal_tasks')
      .delete()
      .eq('id', newTask.id);
    
    return { error: deleteError };
  }
  
  return { data: newTask };
}
```

### 5. RLS Policies

```sql
-- Enable RLS on new tables
ALTER TABLE focus_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_queue ENABLE ROW LEVEL SECURITY;

-- Focus sessions policies
CREATE POLICY "Users can view own focus sessions"
  ON focus_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own focus sessions"
  ON focus_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Task queue policies
CREATE POLICY "Users can view own queue"
  ON task_queue FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own queue"
  ON task_queue FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own queue"
  ON task_queue FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own queue"
  ON task_queue FOR DELETE
  USING (auth.uid() = user_id);
```


## Framer Motion Animation Patterns

### 1. Page Transitions

```typescript
// components/PageTransition.tsx
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';

const pageVariants = {
  initial: {
    opacity: 0,
    y: 20
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: [0.4, 0, 0.2, 1]
    }
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.2,
      ease: [0.4, 0, 0.2, 1]
    }
  }
};

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
```

### 2. Task Card Animations

```typescript
// Stagger animation for task list
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.2,
      ease: 'easeOut'
    }
  }
};

// Usage
<motion.div
  variants={containerVariants}
  initial="hidden"
  animate="visible"
>
  {tasks.map(task => (
    <motion.div key={task.id} variants={itemVariants}>
      <TaskCard task={task} />
    </motion.div>
  ))}
</motion.div>
```

### 3. Drag Overlay Animation

```typescript
// Smooth drag overlay
const dragOverlayVariants = {
  initial: { scale: 1, opacity: 1 },
  dragging: {
    scale: 1.05,
    opacity: 0.8,
    transition: {
      duration: 0.2
    }
  }
};

<DragOverlay>
  {activeId ? (
    <motion.div
      variants={dragOverlayVariants}
      initial="initial"
      animate="dragging"
    >
      <TaskCard task={activeTask} />
    </motion.div>
  ) : null}
</DragOverlay>
```

### 4. Timer Animations

```typescript
// Pulse animation for running timer
const timerVariants = {
  idle: {
    scale: 1,
    opacity: 1
  },
  running: {
    scale: [1, 1.02, 1],
    opacity: [1, 0.9, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut'
    }
  }
};

// Progress ring animation
const progressVariants = {
  initial: { pathLength: 0 },
  animate: (timeLeft: number) => ({
    pathLength: timeLeft / 1500,
    transition: {
      duration: 1,
      ease: 'linear'
    }
  })
};
```

### 5. Modal/Notification Animations

```typescript
// Slide up notification
const notificationVariants = {
  hidden: {
    y: 100,
    opacity: 0
  },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30
    }
  },
  exit: {
    y: 100,
    opacity: 0,
    transition: {
      duration: 0.2
    }
  }
};

<AnimatePresence>
  {showNotification && (
    <motion.div
      variants={notificationVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      Session completed!
    </motion.div>
  )}
</AnimatePresence>
```

### 6. Layout Animations

```typescript
// Smooth layout shift when tasks move
<motion.div
  layout
  layoutId={task.id}
  transition={{
    layout: {
      duration: 0.3,
      ease: [0.4, 0, 0.2, 1]
    }
  }}
>
  <TaskCard task={task} />
</motion.div>
```


## @dnd-kit Implementation Strategy

### 1. Setup and Configuration

```typescript
// Install dependencies
// npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
```

### 2. Personal Tasks Drag-and-Drop

```typescript
// app/personal/page.tsx
export default function PersonalTasksPage() {
  const [tasks, setTasks] = useState<PersonalTask[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Prevent accidental drags
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };
  
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) {
      setActiveId(null);
      return;
    }
    
    const activeTask = tasks.find(t => t.id === active.id);
    const overTask = tasks.find(t => t.id === over.id);
    
    if (!activeTask) return;
    
    // Determine if status changed (dropped on different column)
    const newStatus = over.data.current?.status || activeTask.status;
    
    if (newStatus !== activeTask.status) {
      // Status change
      await updateTaskStatus(activeTask.id, newStatus, 0);
    } else if (activeTask.id !== over.id) {
      // Reorder within same column
      const oldIndex = tasks.findIndex(t => t.id === active.id);
      const newIndex = tasks.findIndex(t => t.id === over.id);
      
      const reordered = arrayMove(tasks, oldIndex, newIndex);
      setTasks(reordered);
      
      // Update orders in database
      await batchUpdateOrders(reordered);
    }
    
    setActiveId(null);
  };
  
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="task-columns">
        <TaskColumn status="pending" tasks={tasks.filter(t => t.status === 'pending')} />
        <TaskColumn status="in_progress" tasks={tasks.filter(t => t.status === 'in_progress')} />
        <TaskColumn status="done" tasks={tasks.filter(t => t.status === 'done')} />
      </div>
      
      <DragOverlay>
        {activeId ? (
          <TaskCard task={tasks.find(t => t.id === activeId)!} isDragging />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
```

### 3. Sortable Task Column

```typescript
// components/TaskColumn.tsx
interface TaskColumnProps {
  status: TaskStatus;
  tasks: PersonalTask[];
}

export function TaskColumn({ status, tasks }: TaskColumnProps) {
  const { setNodeRef } = useDroppable({
    id: `column-${status}`,
    data: { status }
  });
  
  return (
    <div ref={setNodeRef} className="task-column">
      <h3>{statusLabels[status]}</h3>
      <SortableContext
        items={tasks.map(t => t.id)}
        strategy={verticalListSortingStrategy}
      >
        {tasks.map(task => (
          <SortableTaskCard key={task.id} task={task} />
        ))}
      </SortableContext>
    </div>
  );
}
```

### 4. Sortable Task Card

```typescript
// components/SortableTaskCard.tsx
interface SortableTaskCardProps {
  task: PersonalTask;
}

export function SortableTaskCard({ task }: SortableTaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: task.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: 'grab'
  };
  
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
    >
      <TaskCard task={task} />
    </div>
  );
}
```

### 5. Family Task Assignment Drag-and-Drop

```typescript
// app/family/page.tsx
export default function FamilyTasksPage() {
  const [tasks, setTasks] = useState<FamilyTask[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) return;
    
    // Check if dragging a user chip
    const userId = active.id as string;
    const taskId = over.id as string;
    
    // Update assignment
    await updateFamilyTaskAssignment(taskId, userId);
    
    setActiveId(null);
  };
  
  return (
    <DndContext
      sensors={sensors}
      onDragStart={(e) => setActiveId(e.active.id as string)}
      onDragEnd={handleDragEnd}
    >
      {/* Draggable user chips */}
      <div className="user-chips">
        {users.map(user => (
          <DraggableUserChip key={user.id} user={user} />
        ))}
      </div>
      
      {/* Droppable task cards */}
      <div className="task-list">
        {tasks.map(task => (
          <DroppableFamilyTask key={task.id} task={task} />
        ))}
      </div>
      
      <DragOverlay>
        {activeId ? (
          <UserChip user={users.find(u => u.id === activeId)!} />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
```

### 6. Draggable User Chip

```typescript
// components/DraggableUserChip.tsx
export function DraggableUserChip({ user }: { user: User }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: user.id,
    data: { type: 'user', user }
  });
  
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{
        opacity: isDragging ? 0.5 : 1,
        cursor: 'grab'
      }}
    >
      <UserChip user={user} />
    </div>
  );
}
```

### 7. Droppable Family Task

```typescript
// components/DroppableFamilyTask.tsx
export function DroppableFamilyTask({ task }: { task: FamilyTask }) {
  const { setNodeRef, isOver } = useDroppable({
    id: task.id,
    data: { type: 'task', task }
  });
  
  return (
    <div
      ref={setNodeRef}
      style={{
        border: isOver ? '2px solid var(--accent)' : '1px solid var(--border)',
        transition: 'border 0.2s'
      }}
    >
      <FamilyTaskCard task={task} />
    </div>
  );
}
```

### 8. Accessibility

```typescript
// Keyboard navigation support
const announcements = {
  onDragStart(id) {
    return `Picked up task ${id}`;
  },
  onDragOver(id, overId) {
    return `Task ${id} was moved over ${overId}`;
  },
  onDragEnd(id, overId) {
    return `Task ${id} was dropped over ${overId}`;
  },
  onDragCancel(id) {
    return `Dragging was cancelled. Task ${id} was dropped.`;
  }
};

<DndContext
  accessibility={{ announcements }}
  // ... other props
>
```


## Pomodoro Timer Logic dan Persistence

### 1. Timer State Machine

```
┌─────────┐
│  IDLE   │
└────┬────┘
     │ start()
     ▼
┌─────────┐
│ RUNNING │◄──┐
└────┬────┘   │
     │        │ resume()
     │ pause()│
     ▼        │
┌─────────┐  │
│ PAUSED  │──┘
└────┬────┘
     │ complete()
     ▼
┌─────────┐
│  BREAK  │
└────┬────┘
     │ complete()
     ▼
┌─────────┐
│  IDLE   │
└─────────┘
```

### 2. Timer Implementation

```typescript
// lib/hooks/usePomodoro.ts
const WORK_DURATION = 25 * 60; // 1500 seconds
const BREAK_DURATION = 5 * 60; // 300 seconds

interface TimerState {
  timeLeft: number;
  isRunning: boolean;
  sessionType: 'work' | 'break';
  currentTaskId: string | null;
  startedAt: number | null;
}

export function usePomodoro() {
  const [state, setState] = useState<TimerState>(() => loadTimerState());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { user } = useAuth();
  
  // Persist to localStorage on every state change
  useEffect(() => {
    saveTimerState(state);
  }, [state]);
  
  // Restore timer on mount if it was running
  useEffect(() => {
    const saved = loadTimerState();
    if (saved.isRunning && saved.startedAt) {
      const elapsed = Math.floor((Date.now() - saved.startedAt) / 1000);
      const newTimeLeft = Math.max(0, saved.timeLeft - elapsed);
      
      if (newTimeLeft > 0) {
        setState({ ...saved, timeLeft: newTimeLeft });
      } else {
        // Timer completed while away
        handleSessionComplete(saved);
        setState(getNextSessionState(saved));
      }
    }
  }, []);
  
  // Countdown logic
  useEffect(() => {
    if (!state.isRunning || state.timeLeft <= 0) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }
    
    intervalRef.current = setInterval(() => {
      setState(prev => {
        const newTimeLeft = prev.timeLeft - 1;
        
        if (newTimeLeft <= 0) {
          handleSessionComplete(prev);
          return getNextSessionState(prev);
        }
        
        return { ...prev, timeLeft: newTimeLeft };
      });
    }, 1000);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [state.isRunning, state.timeLeft]);
  
  const startTimer = (taskId?: string) => {
    setState(prev => ({
      ...prev,
      isRunning: true,
      currentTaskId: taskId || prev.currentTaskId,
      startedAt: Date.now()
    }));
  };
  
  const pauseTimer = () => {
    setState(prev => ({
      ...prev,
      isRunning: false,
      startedAt: null
    }));
  };
  
  const resetTimer = () => {
    setState({
      timeLeft: WORK_DURATION,
      isRunning: false,
      sessionType: 'work',
      currentTaskId: null,
      startedAt: null
    });
  };
  
  const skipToBreak = () => {
    if (state.sessionType === 'work') {
      setState({
        timeLeft: BREAK_DURATION,
        isRunning: false,
        sessionType: 'break',
        currentTaskId: null,
        startedAt: null
      });
    }
  };
  
  async function handleSessionComplete(completedState: TimerState) {
    // Play notification sound
    playNotificationSound();
    
    // Save work session to database
    if (completedState.sessionType === 'work' && user) {
      const session: Omit<FocusSession, 'id' | 'created_at'> = {
        user_id: user.id,
        task_id: completedState.currentTaskId,
        start_time: new Date(completedState.startedAt!).toISOString(),
        end_time: new Date().toISOString(),
        duration: 25,
        session_type: 'work'
      };
      
      await saveFocusSession(session);
    }
    
    // Show notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Pomodoro Complete!', {
        body: completedState.sessionType === 'work' 
          ? 'Time for a break!' 
          : 'Ready to focus again?',
        icon: '/pomodoro-icon.png'
      });
    }
  }
  
  function getNextSessionState(prev: TimerState): TimerState {
    if (prev.sessionType === 'work') {
      // Auto-start break
      return {
        timeLeft: BREAK_DURATION,
        isRunning: true,
        sessionType: 'break',
        currentTaskId: null,
        startedAt: Date.now()
      };
    } else {
      // Don't auto-start work, let user decide
      return {
        timeLeft: WORK_DURATION,
        isRunning: false,
        sessionType: 'work',
        currentTaskId: null,
        startedAt: null
      };
    }
  }
  
  return {
    timeLeft: state.timeLeft,
    isRunning: state.isRunning,
    sessionType: state.sessionType,
    currentTaskId: state.currentTaskId,
    startTimer,
    pauseTimer,
    resetTimer,
    skipToBreak
  };
}
```

### 3. LocalStorage Persistence

```typescript
// lib/utils/timer-storage.ts
const STORAGE_KEY = 'pomodoro_timer_state';

export function saveTimerState(state: TimerState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Failed to save timer state:', error);
  }
}

export function loadTimerState(): TimerState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.error('Failed to load timer state:', error);
  }
  
  // Default state
  return {
    timeLeft: 1500,
    isRunning: false,
    sessionType: 'work',
    currentTaskId: null,
    startedAt: null
  };
}

export function clearTimerState(): void {
  localStorage.removeItem(STORAGE_KEY);
}
```

### 4. Timer Display Component

```typescript
// components/PomodoroTimer.tsx
export function PomodoroTimer({ tasks }: { tasks: PersonalTask[] }) {
  const {
    timeLeft,
    isRunning,
    sessionType,
    currentTaskId,
    startTimer,
    pauseTimer,
    resetTimer,
    skipToBreak
  } = usePomodoro();
  
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  
  const currentTask = tasks.find(t => t.id === currentTaskId);
  
  return (
    <div className="pomodoro-timer">
      <div className="timer-display">
        <div className="session-type">
          {sessionType === 'work' ? '🍅 Focus Time' : '☕ Break Time'}
        </div>
        
        <div className="time">
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </div>
        
        {currentTask && (
          <div className="current-task">
            Working on: {currentTask.title}
          </div>
        )}
      </div>
      
      <div className="timer-controls">
        {!isRunning ? (
          <button onClick={() => startTimer()}>
            {timeLeft === (sessionType === 'work' ? 1500 : 300) ? 'Start' : 'Resume'}
          </button>
        ) : (
          <button onClick={pauseTimer}>Pause</button>
        )}
        
        <button onClick={resetTimer}>Reset</button>
        
        {sessionType === 'work' && (
          <button onClick={skipToBreak}>Skip to Break</button>
        )}
      </div>
      
      {/* Task selector */}
      <select
        value={currentTaskId || ''}
        onChange={(e) => startTimer(e.target.value || undefined)}
        disabled={isRunning}
      >
        <option value="">No task selected</option>
        {tasks.filter(t => t.status !== 'done').map(task => (
          <option key={task.id} value={task.id}>
            {task.title}
          </option>
        ))}
      </select>
    </div>
  );
}
```

### 5. Progress Ring Visualization

```typescript
// components/TimerProgressRing.tsx
export function TimerProgressRing({ 
  timeLeft, 
  totalTime, 
  isRunning 
}: { 
  timeLeft: number; 
  totalTime: number; 
  isRunning: boolean;
}) {
  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const progress = timeLeft / totalTime;
  const strokeDashoffset = circumference * (1 - progress);
  
  return (
    <svg width="280" height="280" viewBox="0 0 280 280">
      {/* Background circle */}
      <circle
        cx="140"
        cy="140"
        r={radius}
        fill="none"
        stroke="var(--border)"
        strokeWidth="8"
      />
      
      {/* Progress circle */}
      <motion.circle
        cx="140"
        cy="140"
        r={radius}
        fill="none"
        stroke="var(--accent)"
        strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        transform="rotate(-90 140 140)"
        animate={{
          strokeDashoffset,
          opacity: isRunning ? [1, 0.8, 1] : 1
        }}
        transition={{
          strokeDashoffset: { duration: 1, ease: 'linear' },
          opacity: { duration: 2, repeat: Infinity }
        }}
      />
    </svg>
  );
}
```


## Cron Job Architecture untuk Daily Reset

### 1. Vercel Cron Configuration

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/daily-reset",
      "schedule": "0 0 * * *"
    }
  ]
}
```

**Schedule Format:** `0 0 * * *` = Every day at 00:00 (midnight) UTC

### 2. API Route Handler

```typescript
// app/api/cron/daily-reset/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // Verify cron secret for security
  const authHeader = request.headers.get('authorization');
  const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;
  
  if (authHeader !== expectedAuth) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  // Use service role key for admin operations
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
  
  try {
    const startTime = Date.now();
    
    // Get all users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, username');
    
    if (usersError) throw usersError;
    
    const results = [];
    let successCount = 0;
    let errorCount = 0;
    
    // Process each user
    for (const user of users || []) {
      try {
        const result = await performUserReset(supabase, user.id);
        results.push({
          userId: user.id,
          username: user.username,
          ...result
        });
        
        if (result.success) {
          successCount++;
        } else {
          errorCount++;
        }
      } catch (error) {
        console.error(`Reset failed for user ${user.id}:`, error);
        results.push({
          userId: user.id,
          username: user.username,
          success: false,
          error: String(error)
        });
        errorCount++;
      }
    }
    
    const duration = Date.now() - startTime;
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      duration: `${duration}ms`,
      totalUsers: users?.length || 0,
      successCount,
      errorCount,
      results
    });
  } catch (error) {
    console.error('Daily reset error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Reset failed',
        details: String(error)
      },
      { status: 500 }
    );
  }
}

async function performUserReset(supabase: any, userId: string) {
  // Step 1: Delete done tasks
  const { error: deleteError } = await supabase
    .from('personal_tasks')
    .delete()
    .eq('user_id', userId)
    .eq('status', 'done');
  
  if (deleteError) {
    return { success: false, error: deleteError.message };
  }
  
  // Step 2: Get pending/in_progress tasks
  const { data: tasksToQueue, error: fetchError } = await supabase
    .from('personal_tasks')
    .select('*')
    .eq('user_id', userId)
    .in('status', ['pending', 'in_progress'])
    .order('order', { ascending: true });
  
  if (fetchError) {
    return { success: false, error: fetchError.message };
  }
  
  // If no tasks to queue, we're done
  if (!tasksToQueue || tasksToQueue.length === 0) {
    return {
      success: true,
      deletedDone: true,
      queued: 0
    };
  }
  
  // Step 3: Insert into task_queue
  const queueData = tasksToQueue.map((task, index) => ({
    user_id: task.user_id,
    title: task.title,
    status: task.status,
    original_created_at: task.created_at,
    order: index
  }));
  
  const { error: insertError } = await supabase
    .from('task_queue')
    .insert(queueData);
  
  if (insertError) {
    return { success: false, error: insertError.message };
  }
  
  // Step 4: Delete from personal_tasks
  const { error: deleteTasksError } = await supabase
    .from('personal_tasks')
    .delete()
    .eq('user_id', userId)
    .in('status', ['pending', 'in_progress']);
  
  if (deleteTasksError) {
    // Rollback: delete from queue
    await supabase
      .from('task_queue')
      .delete()
      .eq('user_id', userId)
      .in('title', tasksToQueue.map(t => t.title));
    
    return { success: false, error: deleteTasksError.message };
  }
  
  return {
    success: true,
    deletedDone: true,
    queued: tasksToQueue.length
  };
}
```

### 3. Environment Variables

```bash
# .env.local
CRON_SECRET=your-random-secret-string-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 4. Testing Cron Locally

```typescript
// scripts/test-daily-reset.ts
async function testDailyReset() {
  const response = await fetch('http://localhost:3000/api/cron/daily-reset', {
    headers: {
      'Authorization': `Bearer ${process.env.CRON_SECRET}`
    }
  });
  
  const result = await response.json();
  console.log('Reset result:', JSON.stringify(result, null, 2));
}

testDailyReset();
```

### 5. Monitoring and Logging

```typescript
// lib/utils/cron-logger.ts
export async function logCronExecution(
  jobName: string,
  status: 'success' | 'failure',
  details: any
) {
  // Log to Supabase
  await supabase.from('cron_logs').insert({
    job_name: jobName,
    status,
    details,
    executed_at: new Date().toISOString()
  });
  
  // Also log to console for Vercel logs
  console.log(`[CRON] ${jobName}:`, {
    status,
    timestamp: new Date().toISOString(),
    ...details
  });
}
```

### 6. Error Handling Strategy

```typescript
// Retry logic for failed user resets
async function performUserResetWithRetry(
  supabase: any,
  userId: string,
  maxRetries = 3
) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await performUserReset(supabase, userId);
      if (result.success) {
        return result;
      }
      lastError = result.error;
    } catch (error) {
      lastError = error;
      console.error(`Attempt ${attempt} failed for user ${userId}:`, error);
      
      // Wait before retry (exponential backoff)
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }
  
  return {
    success: false,
    error: `Failed after ${maxRetries} attempts: ${lastError}`
  };
}
```

### 7. Alternative: Supabase Edge Function

Jika tidak menggunakan Vercel Cron, bisa menggunakan Supabase Edge Function dengan pg_cron.

```sql
-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule daily reset
SELECT cron.schedule(
  'daily-task-reset',
  '0 0 * * *',
  $$
  -- Delete done tasks
  DELETE FROM personal_tasks WHERE status = 'done';
  
  -- Move pending/in_progress to queue
  INSERT INTO task_queue (user_id, title, status, original_created_at, order)
  SELECT 
    user_id, 
    title, 
    status, 
    created_at,
    ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at) - 1
  FROM personal_tasks
  WHERE status IN ('pending', 'in_progress');
  
  -- Delete moved tasks
  DELETE FROM personal_tasks WHERE status IN ('pending', 'in_progress');
  $$
);
```


## Low-Level Design dengan Pseudocode

### 1. Personal Tasks Page dengan Drag-and-Drop

```typescript
// app/personal/page.tsx - Pseudocode

FUNCTION PersonalTasksPage():
  // State initialization
  tasks = useState([])
  queuedTasks = useState([])
  user = useAuth()
  activeId = useState(null)
  
  // Drag-and-drop setup
  sensors = configureSensors(PointerSensor, KeyboardSensor)
  
  ON_MOUNT:
    user = authenticateUser()
    IF user is null:
      redirect to /login
    
    tasks = fetchPersonalTasks(user.id)
    queuedTasks = fetchQueuedTasks(user.id)
    
    subscribeToRealtimeChanges(user.id, onTaskChange)
  
  FUNCTION handleDragStart(event):
    activeId = event.active.id
  
  FUNCTION handleDragEnd(event):
    active = event.active
    over = event.over
    
    IF over is null:
      activeId = null
      RETURN
    
    activeTask = findTask(tasks, active.id)
    
    // Determine if dropped on different column
    newStatus = over.data.status OR activeTask.status
    
    IF newStatus != activeTask.status:
      // Status change
      CALL updateTaskStatus(activeTask.id, newStatus, 0)
      
      // Optimistic update
      tasks = updateTaskInList(tasks, activeTask.id, { status: newStatus })
    
    ELSE IF active.id != over.id:
      // Reorder within same column
      oldIndex = findIndex(tasks, active.id)
      newIndex = findIndex(tasks, over.id)
      
      reordered = arrayMove(tasks, oldIndex, newIndex)
      tasks = reordered
      
      // Batch update orders
      updates = reordered.map((task, index) => ({
        id: task.id,
        order: index
      }))
      CALL batchUpdateOrders(updates)
    
    activeId = null
  
  FUNCTION handleMoveFromQueue(queuedTaskId):
    queuedTask = findTask(queuedTasks, queuedTaskId)
    
    // Move to personal_tasks
    newTask = CALL moveQueueToToday(queuedTask)
    
    IF newTask is not null:
      tasks = [...tasks, newTask]
      queuedTasks = removeFromList(queuedTasks, queuedTaskId)
  
  RENDER:
    <PageTransition>
      <Layout>
        <Sidebar user={user} />
        
        <MainContent>
          <Header title="My Tasks" />
          
          <PomodoroTimer tasks={tasks} />
          
          <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <TaskColumns>
              <TaskColumn 
                status="pending" 
                tasks={filterByStatus(tasks, "pending")} 
              />
              <TaskColumn 
                status="in_progress" 
                tasks={filterByStatus(tasks, "in_progress")} 
              />
              <TaskColumn 
                status="done" 
                tasks={filterByStatus(tasks, "done")} 
              />
            </TaskColumns>
            
            <DragOverlay>
              IF activeId is not null:
                <TaskCard task={findTask(tasks, activeId)} isDragging />
            </DragOverlay>
          </DndContext>
          
          <TaskQueue 
            tasks={queuedTasks}
            onMoveToToday={handleMoveFromQueue}
          />
        </MainContent>
      </Layout>
    </PageTransition>
```

### 2. Pomodoro Timer Hook

```typescript
// lib/hooks/usePomodoro.ts - Pseudocode

CONSTANTS:
  WORK_DURATION = 1500 seconds (25 minutes)
  BREAK_DURATION = 300 seconds (5 minutes)

FUNCTION usePomodoro():
  // Load initial state from localStorage
  state = useState(loadTimerState())
  intervalRef = useRef(null)
  user = useAuth()
  
  // Persist state on every change
  ON state CHANGE:
    saveTimerState(state)
  
  // Restore timer on mount
  ON_MOUNT:
    savedState = loadTimerState()
    
    IF savedState.isRunning AND savedState.startedAt is not null:
      elapsed = (currentTime - savedState.startedAt) / 1000
      newTimeLeft = max(0, savedState.timeLeft - elapsed)
      
      IF newTimeLeft > 0:
        state = { ...savedState, timeLeft: newTimeLeft }
      ELSE:
        // Timer completed while away
        CALL handleSessionComplete(savedState)
        state = getNextSessionState(savedState)
  
  // Countdown logic
  ON state.isRunning OR state.timeLeft CHANGE:
    IF state.isRunning AND state.timeLeft > 0:
      intervalRef = setInterval(EVERY 1 second:
        state.timeLeft = state.timeLeft - 1
        
        IF state.timeLeft <= 0:
          CALL handleSessionComplete(state)
          state = getNextSessionState(state)
      )
    ELSE:
      clearInterval(intervalRef)
  
  FUNCTION startTimer(taskId):
    state = {
      ...state,
      isRunning: true,
      currentTaskId: taskId OR state.currentTaskId,
      startedAt: currentTime
    }
  
  FUNCTION pauseTimer():
    state = {
      ...state,
      isRunning: false,
      startedAt: null
    }
  
  FUNCTION resetTimer():
    state = {
      timeLeft: WORK_DURATION,
      isRunning: false,
      sessionType: 'work',
      currentTaskId: null,
      startedAt: null
    }
  
  FUNCTION skipToBreak():
    IF state.sessionType == 'work':
      state = {
        timeLeft: BREAK_DURATION,
        isRunning: false,
        sessionType: 'break',
        currentTaskId: null,
        startedAt: null
      }
  
  FUNCTION handleSessionComplete(completedState):
    // Play notification
    CALL playNotificationSound()
    
    // Save work session to database
    IF completedState.sessionType == 'work' AND user is not null:
      session = {
        user_id: user.id,
        task_id: completedState.currentTaskId,
        start_time: new Date(completedState.startedAt),
        end_time: new Date(),
        duration: 25,
        session_type: 'work'
      }
      CALL saveFocusSession(session)
    
    // Show browser notification
    IF Notification.permission == 'granted':
      message = completedState.sessionType == 'work' 
        ? 'Time for a break!' 
        : 'Ready to focus again?'
      SHOW Notification('Pomodoro Complete!', message)
  
  FUNCTION getNextSessionState(prevState):
    IF prevState.sessionType == 'work':
      // Auto-start break
      RETURN {
        timeLeft: BREAK_DURATION,
        isRunning: true,
        sessionType: 'break',
        currentTaskId: null,
        startedAt: currentTime
      }
    ELSE:
      // Don't auto-start work
      RETURN {
        timeLeft: WORK_DURATION,
        isRunning: false,
        sessionType: 'work',
        currentTaskId: null,
        startedAt: null
      }
  
  RETURN {
    timeLeft: state.timeLeft,
    isRunning: state.isRunning,
    sessionType: state.sessionType,
    currentTaskId: state.currentTaskId,
    startTimer,
    pauseTimer,
    resetTimer,
    skipToBreak
  }
```

### 3. Daily Reset Cron Job

```typescript
// app/api/cron/daily-reset/route.ts - Pseudocode

FUNCTION GET(request):
  // Security check
  authHeader = request.headers.get('authorization')
  expectedAuth = 'Bearer ' + CRON_SECRET
  
  IF authHeader != expectedAuth:
    RETURN { error: 'Unauthorized' }, status: 401
  
  // Initialize admin Supabase client
  supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)
  
  TRY:
    startTime = currentTime
    
    // Get all users
    users = CALL supabase.from('users').select('id, username')
    
    results = []
    successCount = 0
    errorCount = 0
    
    // Process each user
    FOR EACH user IN users:
      TRY:
        result = CALL performUserReset(supabase, user.id)
        results.push({ userId: user.id, ...result })
        
        IF result.success:
          successCount++
        ELSE:
          errorCount++
      
      CATCH error:
        LOG error for user.id
        results.push({ userId: user.id, success: false, error })
        errorCount++
    
    duration = currentTime - startTime
    
    RETURN {
      success: true,
      timestamp: currentTime,
      duration,
      totalUsers: users.length,
      successCount,
      errorCount,
      results
    }
  
  CATCH error:
    LOG error
    RETURN { success: false, error }, status: 500

FUNCTION performUserReset(supabase, userId):
  // Step 1: Delete done tasks
  result = CALL supabase
    .from('personal_tasks')
    .delete()
    .where('user_id', userId)
    .where('status', 'done')
  
  IF result has error:
    RETURN { success: false, error: result.error }
  
  // Step 2: Get pending/in_progress tasks
  tasksToQueue = CALL supabase
    .from('personal_tasks')
    .select('*')
    .where('user_id', userId)
    .whereIn('status', ['pending', 'in_progress'])
    .orderBy('order', 'asc')
  
  IF tasksToQueue has error:
    RETURN { success: false, error: tasksToQueue.error }
  
  // If no tasks to queue, we're done
  IF tasksToQueue is empty:
    RETURN { success: true, deletedDone: true, queued: 0 }
  
  // Step 3: Insert into task_queue
  queueData = tasksToQueue.map((task, index) => ({
    user_id: task.user_id,
    title: task.title,
    status: task.status,
    original_created_at: task.created_at,
    order: index
  }))
  
  insertResult = CALL supabase
    .from('task_queue')
    .insert(queueData)
  
  IF insertResult has error:
    RETURN { success: false, error: insertResult.error }
  
  // Step 4: Delete from personal_tasks
  deleteResult = CALL supabase
    .from('personal_tasks')
    .delete()
    .where('user_id', userId)
    .whereIn('status', ['pending', 'in_progress'])
  
  IF deleteResult has error:
    // Rollback: delete from queue
    CALL supabase
      .from('task_queue')
      .delete()
      .where('user_id', userId)
      .whereIn('title', tasksToQueue.map(t => t.title))
    
    RETURN { success: false, error: deleteResult.error }
  
  RETURN {
    success: true,
    deletedDone: true,
    queued: tasksToQueue.length
  }
```

### 4. Family Task Assignment Drag-and-Drop

```typescript
// app/family/page.tsx - Pseudocode

FUNCTION FamilyTasksPage():
  tasks = useState([])
  users = useState([])
  profile = useAuth()
  activeId = useState(null)
  
  sensors = configureSensors(PointerSensor, KeyboardSensor)
  
  ON_MOUNT:
    profile = authenticateUser()
    IF profile is null:
      redirect to /login
    
    tasks = fetchFamilyTasks()
    users = fetchAllUsers()
  
  isParent = profile.role == 'papa' OR profile.role == 'mama'
  
  FUNCTION handleDragEnd(event):
    active = event.active
    over = event.over
    
    IF over is null:
      activeId = null
      RETURN
    
    // Check if dragging a user chip
    userId = active.id
    taskId = over.id
    
    // Update assignment
    CALL updateFamilyTaskAssignment(taskId, userId)
    
    // Optimistic update
    tasks = updateTaskInList(tasks, taskId, {
      assigned_to: userId,
      status: 'in_progress'
    })
    
    activeId = null
  
  RENDER:
    <PageTransition>
      <Layout>
        <Sidebar user={profile} />
        
        <MainContent>
          <Header title="Family Tasks" />
          
          IF isParent:
            <DndContext
              sensors={sensors}
              onDragStart={(e) => activeId = e.active.id}
              onDragEnd={handleDragEnd}
            >
              {/* Draggable user chips */}
              <UserChipsContainer>
                FOR EACH user IN users:
                  <DraggableUserChip user={user} />
              </UserChipsContainer>
              
              {/* Droppable task cards */}
              <TaskList>
                FOR EACH task IN tasks:
                  <DroppableFamilyTask task={task} />
              </TaskList>
              
              <DragOverlay>
                IF activeId is not null:
                  <UserChip user={findUser(users, activeId)} />
              </DragOverlay>
            </DndContext>
          ELSE:
            {/* Read-only view for children */}
            <TaskList>
              FOR EACH task IN tasks:
                <FamilyTaskCard task={task} readOnly />
            </TaskList>
        </MainContent>
      </Layout>
    </PageTransition>
```

### 5. Audio Notification System

```typescript
// lib/utils/audio.ts - Pseudocode

GLOBAL audioContext = null
GLOBAL notificationBuffer = null

FUNCTION initializeAudio():
  IF audioContext is null:
    audioContext = new AudioContext()
  
  IF notificationBuffer is null:
    // Load audio file
    response = FETCH '/sounds/notification.mp3'
    arrayBuffer = AWAIT response.arrayBuffer()
    notificationBuffer = AWAIT audioContext.decodeAudioData(arrayBuffer)

FUNCTION playNotificationSound():
  TRY:
    // Request notification permission if needed
    IF Notification.permission == 'default':
      permission = AWAIT Notification.requestPermission()
    
    // Initialize audio if not ready
    IF audioContext is null OR notificationBuffer is null:
      AWAIT initializeAudio()
    
    // Resume audio context if suspended (browser autoplay policy)
    IF audioContext.state == 'suspended':
      AWAIT audioContext.resume()
    
    // Create and play sound
    source = audioContext.createBufferSource()
    source.buffer = notificationBuffer
    source.connect(audioContext.destination)
    source.start(0)
    
  CATCH error:
    LOG 'Failed to play notification sound:', error
    
    // Fallback: show visual notification
    CALL showVisualNotification('Pomodoro Complete!')

FUNCTION showVisualNotification(message):
  // Create toast notification element
  toast = createElement('div')
  toast.className = 'notification-toast'
  toast.textContent = message
  
  document.body.appendChild(toast)
  
  // Animate in
  ANIMATE toast FROM { opacity: 0, y: 100 } TO { opacity: 1, y: 0 }
  
  // Auto-remove after 3 seconds
  AFTER 3 seconds:
    ANIMATE toast FROM { opacity: 1 } TO { opacity: 0 }
    AFTER animation:
      document.body.removeChild(toast)
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Page Transition Animation Presence

*For any* navigation between routes accessible via sidebar, the new page content should display with a fade-in or slide-in animation.

**Validates: Requirements 1.2, 1.5**

### Property 2: Navigation Lock During Transition

*For any* page transition in progress, attempting additional navigation should be prevented until the current transition completes.

**Validates: Requirements 1.6**

### Property 3: Drag-and-Drop Status Change Persistence

*For any* personal task dragged to a different status column, the task's status in the database should be updated to match the target column's status.

**Validates: Requirements 2.2, 2.6**

### Property 4: Drag-and-Drop Reordering

*For any* personal task dragged within the same status column, the task's order should change to reflect its new position, and this order should be persisted to the database.

**Validates: Requirements 2.4, 2.6**

### Property 5: Drag Visual Feedback

*For any* task being dragged, the element should display visual feedback (reduced opacity, shadow, or highlight) while the drag operation is active.

**Validates: Requirements 2.5**

### Property 6: Drag Cancellation Rollback

*For any* drag operation that fails or is cancelled, the task should return to its original position and status.

**Validates: Requirements 2.8**

### Property 7: Family Task Assignment Update

*For any* parent user dragging a family member to a family task, the task's assigned_to field in the database should be updated to that member's ID.

**Validates: Requirements 3.2**

### Property 8: Auto Status Change on Assignment

*For any* family task that receives an assignment, the task's status should automatically change to "in_progress".

**Validates: Requirements 3.3**

### Property 9: Child User Assignment Restriction

*For any* user with a child role, the drag-and-drop assignment functionality should be disabled.

**Validates: Requirements 3.4**

### Property 10: Assignment Hover Feedback

*For any* family member chip hovered over a family task, visual feedback (highlight border or background) should be displayed.

**Validates: Requirements 3.5**

### Property 11: Assignment Reassignment

*For any* family member already assigned to a task, dragging that member to a different task should move the assignment to the new task.

**Validates: Requirements 3.6**

### Property 12: Universal Status Change Access

*For any* user (parent or child), changing task status through dropdown or drag should be permitted.

**Validates: Requirements 3.8**

### Property 13: Work Session Auto-Transition to Break

*For any* completed work session (timer reaching 00:00), the app should automatically start a 5-minute break timer.

**Validates: Requirements 4.3**

### Property 14: Timer Task Association

*For any* timer started with a task ID, the association between timer and task should be maintained and stored.

**Validates: Requirements 4.4**

### Property 15: Timer State Transition on Start

*For any* timer that is started, the timer state should change to "running".

**Validates: Requirements 4.5**

### Property 16: Timer Display Update

*For any* running timer, the displayed countdown should update every second.

**Validates: Requirements 4.6**

### Property 17: Timer Completion Audio Notification

*For any* timer reaching 00:00, an audio notification should be played.

**Validates: Requirements 4.7, 9.2**

### Property 18: Focus Session Persistence

*For any* completed work session, a record should be saved to the focus_sessions table with user_id, task_id (if linked), start_time, end_time, duration, and session_type.

**Validates: Requirements 4.9**

### Property 19: Timer Background Persistence

*For any* running timer, navigating to a different page should not stop the timer - it should continue running in the background.

**Validates: Requirements 4.12**

### Property 20: Daily Reset Done Task Deletion

*For any* user during daily reset, all personal tasks with status "done" should be deleted from the personal_tasks table.

**Validates: Requirements 5.2**

### Property 21: Daily Reset Incomplete Task Queueing

*For any* user during daily reset, all personal tasks with status "pending" or "in_progress" should be moved to the task_queue table and removed from personal_tasks.

**Validates: Requirements 5.3, 5.4**

### Property 22: Today's Tasks Display Source

*For any* personal tasks page view, the "Today's Tasks" section should display only tasks from the personal_tasks table.

**Validates: Requirements 5.6**

### Property 23: Queue Display Source

*For any* personal tasks page view, the "Queue" section should display only tasks from the task_queue table.

**Validates: Requirements 5.7**

### Property 24: Queue to Today Drag Transfer

*For any* task dragged from the Queue section to Today's Tasks, the task should be moved from task_queue table to personal_tasks table.

**Validates: Requirements 5.8**

### Property 25: Queue Move Button Presence

*For any* task displayed in the Queue section, a "Move to Today" button should be present.

**Validates: Requirements 5.9**

### Property 26: Queue Move Button Transfer

*For any* "Move to Today" button clicked, the associated task should be moved from task_queue to personal_tasks.

**Validates: Requirements 5.10**

### Property 27: Daily Reset Multi-User Processing

*For any* daily reset execution, all users should be processed regardless of individual user failures.

**Validates: Requirements 5.12, 5.13**

### Property 28: Focus Session Type Validation

*For any* focus session record, the session_type field should only accept values "work" or "break".

**Validates: Requirements 6.4**

### Property 29: Task Queue Status Preservation

*For any* task moved to the queue, the task's status at the time of queueing should be preserved in the task_queue record.

**Validates: Requirements 7.3**

### Property 30: Task Queue Original Timestamp Preservation

*For any* task moved to the queue, the original created_at timestamp should be preserved in the task_queue.original_created_at field.

**Validates: Requirements 7.4**

### Property 31: Task Queue Timestamp Recording

*For any* task moved to the queue, the queued_at field should be set to the current timestamp.

**Validates: Requirements 7.5**

### Property 32: Interactive Element Hover Transition

*For any* interactive element (button, card, link), hovering should trigger a subtle CSS transition effect.

**Validates: Requirements 8.9**

### Property 33: Audio Permission Request

*For any* first attempt to play audio notification, browser permission should be requested if not already granted.

**Validates: Requirements 9.5**

### Property 34: Audio Fallback Visual Notification

*For any* audio notification that fails to play due to browser blocking, a visual notification should be displayed as fallback.

**Validates: Requirements 9.6**

### Property 35: Drag Overlay Display

*For any* active drag operation, a ghost image or preview element should be displayed.

**Validates: Requirements 10.1**

### Property 36: Drag Opacity Lifecycle

*For any* draggable element, the opacity should change to 0.5 while dragging and return to 1.0 with transition when drag completes.

**Validates: Requirements 10.2, 10.6**

### Property 37: Valid Drop Target Highlight

*For any* drag source hovered over a valid drop target, the drop target should display highlight border or background color.

**Validates: Requirements 10.3**

### Property 38: Invalid Drop Target Indicator

*For any* drag source hovered over an invalid drop target, a visual indicator (such as cursor: not-allowed) should be displayed.

**Validates: Requirements 10.4**

### Property 39: Task Position Transition Animation

*For any* task changing position (due to drag or reorder), a smooth transition animation should be applied.

**Validates: Requirements 10.5**

### Property 40: Draggable Element Cursor States

*For any* draggable element, the cursor should be "grab" on hover and "grabbing" while dragging.

**Validates: Requirements 10.7, 10.8**


## Error Handling

### 1. Drag-and-Drop Errors

**Scenario**: Database update fails during drag operation

**Handling**:
```typescript
async function handleDragEnd(event: DragEndEvent) {
  const { active, over } = event;
  
  // Store original state for rollback
  const originalTasks = [...tasks];
  
  // Optimistic update
  const updatedTasks = applyDragChanges(tasks, active, over);
  setTasks(updatedTasks);
  
  try {
    // Persist to database
    await updateTaskStatus(active.id, newStatus, newOrder);
  } catch (error) {
    // Rollback on error
    setTasks(originalTasks);
    
    // Show error notification
    showToast('Failed to update task. Please try again.', 'error');
    
    // Log error
    console.error('Drag update failed:', error);
  }
}
```

**User Feedback**: Toast notification with error message and automatic rollback to previous state.

### 2. Pomodoro Timer Errors

**Scenario**: Failed to save focus session to database

**Handling**:
```typescript
async function handleSessionComplete(state: TimerState) {
  try {
    // Play notification (non-blocking)
    playNotificationSound().catch(err => 
      console.warn('Audio notification failed:', err)
    );
    
    // Save to database
    if (state.sessionType === 'work') {
      await saveFocusSession(sessionData);
    }
  } catch (error) {
    // Log error but don't block user
    console.error('Failed to save focus session:', error);
    
    // Store in localStorage as backup
    const failedSessions = JSON.parse(
      localStorage.getItem('failed_sessions') || '[]'
    );
    failedSessions.push({ ...sessionData, error: error.message });
    localStorage.setItem('failed_sessions', JSON.stringify(failedSessions));
    
    // Show non-intrusive notification
    showToast('Session completed but not saved. Will retry later.', 'warning');
  }
}

// Retry failed sessions on next app load
async function retryFailedSessions() {
  const failed = JSON.parse(localStorage.getItem('failed_sessions') || '[]');
  
  for (const session of failed) {
    try {
      await saveFocusSession(session);
      // Remove from failed list on success
      failed.splice(failed.indexOf(session), 1);
    } catch (error) {
      console.error('Retry failed for session:', error);
    }
  }
  
  localStorage.setItem('failed_sessions', JSON.stringify(failed));
}
```

**User Feedback**: Warning toast, session data preserved in localStorage for retry.

### 3. Daily Reset Errors

**Scenario**: Reset fails for individual user

**Handling**:
```typescript
async function performUserReset(supabase: any, userId: string) {
  try {
    // Step 1: Delete done tasks
    const { error: deleteError } = await supabase
      .from('personal_tasks')
      .delete()
      .eq('user_id', userId)
      .eq('status', 'done');
    
    if (deleteError) throw deleteError;
    
    // Step 2-4: Queue and delete incomplete tasks
    // ... (implementation)
    
    return { success: true, queued: count };
  } catch (error) {
    // Log detailed error
    console.error(`Reset failed for user ${userId}:`, {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    
    // Return error but don't throw (allow other users to continue)
    return {
      success: false,
      error: error.message,
      userId
    };
  }
}

// In main cron handler
const results = await Promise.allSettled(
  users.map(user => performUserReset(supabase, user.id))
);

// Log summary
const failed = results.filter(r => r.status === 'rejected' || !r.value.success);
if (failed.length > 0) {
  console.error('Daily reset completed with errors:', {
    total: users.length,
    failed: failed.length,
    errors: failed.map(f => f.value || f.reason)
  });
}
```

**User Feedback**: Errors logged to console and monitoring system. Failed users can be retried manually.

### 4. Audio Notification Errors

**Scenario**: Browser blocks autoplay or audio file fails to load

**Handling**:
```typescript
async function playNotificationSound() {
  try {
    // Check if audio is initialized
    if (!audioContext || !notificationBuffer) {
      await initializeAudio();
    }
    
    // Resume if suspended (browser autoplay policy)
    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }
    
    // Play sound
    const source = audioContext.createBufferSource();
    source.buffer = notificationBuffer;
    source.connect(audioContext.destination);
    source.start(0);
    
  } catch (error) {
    console.warn('Audio notification failed:', error);
    
    // Fallback to visual notification
    showVisualNotification('Pomodoro Complete!');
    
    // Try browser notification API
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Pomodoro Complete!', {
        body: 'Time for a break!',
        icon: '/pomodoro-icon.png'
      });
    }
  }
}
```

**User Feedback**: Automatic fallback to visual notification and browser notification API.

### 5. Network Errors

**Scenario**: Supabase connection fails

**Handling**:
```typescript
// Retry wrapper for Supabase operations
async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      // Don't retry on auth errors
      if (error.code === 'PGRST301') {
        throw error;
      }
      
      console.warn(`Attempt ${attempt} failed:`, error);
      
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }
  }
  
  throw lastError;
}

// Usage
const { data, error } = await withRetry(() =>
  supabase.from('personal_tasks').select('*').eq('user_id', userId)
);
```

**User Feedback**: Automatic retry with exponential backoff. Show loading state during retries.

### 6. Queue Transfer Errors

**Scenario**: Moving task from queue to today fails mid-operation

**Handling**:
```typescript
async function moveQueueToToday(queuedTask: QueuedTask) {
  // Use transaction-like pattern
  let insertedTask = null;
  
  try {
    // Step 1: Insert to personal_tasks
    const { data, error: insertError } = await supabase
      .from('personal_tasks')
      .insert({
        user_id: queuedTask.user_id,
        title: queuedTask.title,
        status: queuedTask.status,
        order: 0
      })
      .select()
      .single();
    
    if (insertError) throw insertError;
    insertedTask = data;
    
    // Step 2: Delete from queue
    const { error: deleteError } = await supabase
      .from('task_queue')
      .delete()
      .eq('id', queuedTask.id);
    
    if (deleteError) throw deleteError;
    
    return { data: insertedTask, error: null };
    
  } catch (error) {
    // Rollback: delete inserted task if it exists
    if (insertedTask) {
      await supabase
        .from('personal_tasks')
        .delete()
        .eq('id', insertedTask.id)
        .catch(err => console.error('Rollback failed:', err));
    }
    
    return { data: null, error };
  }
}
```

**User Feedback**: Error toast with option to retry. Original task remains in queue on failure.

### 7. Authentication Errors

**Scenario**: User session expires during operation

**Handling**:
```typescript
// Global error handler for auth errors
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_OUT') {
    // Clear local state
    localStorage.clear();
    
    // Redirect to login
    router.push('/login');
    
    // Show message
    showToast('Session expired. Please log in again.', 'info');
  }
});

// Wrap operations with auth check
async function authenticatedOperation<T>(
  operation: () => Promise<T>
): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    router.push('/login');
    throw new Error('Not authenticated');
  }
  
  return operation();
}
```

**User Feedback**: Automatic redirect to login page with informative message.


## Testing Strategy

### Dual Testing Approach

This project will use both unit tests and property-based tests for comprehensive coverage:

- **Unit tests**: Verify specific examples, edge cases, and error conditions
- **Property tests**: Verify universal properties across all inputs

Both testing approaches are complementary and necessary. Unit tests catch concrete bugs in specific scenarios, while property tests verify general correctness across a wide range of inputs.

### Property-Based Testing Configuration

**Library Selection**: 
- **JavaScript/TypeScript**: Use `fast-check` library for property-based testing
- Installation: `npm install --save-dev fast-check @types/fast-check`

**Test Configuration**:
- Each property test must run minimum 100 iterations
- Each test must reference its design document property using a comment tag
- Tag format: `// Feature: family-app-v4, Property {number}: {property_text}`

**Example Property Test**:

```typescript
import fc from 'fast-check';
import { describe, it, expect } from 'vitest';

describe('Personal Tasks Drag-and-Drop', () => {
  // Feature: family-app-v4, Property 3: Drag-and-Drop Status Change Persistence
  it('should persist status changes when task is dragged to different column', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          taskId: fc.uuid(),
          userId: fc.uuid(),
          title: fc.string({ minLength: 1, maxLength: 100 }),
          originalStatus: fc.constantFrom('pending', 'in_progress', 'done'),
          targetStatus: fc.constantFrom('pending', 'in_progress', 'done')
        }),
        async (testData) => {
          // Skip if same status
          fc.pre(testData.originalStatus !== testData.targetStatus);
          
          // Create task with original status
          const task = await createTestTask({
            id: testData.taskId,
            user_id: testData.userId,
            title: testData.title,
            status: testData.originalStatus
          });
          
          // Simulate drag to different column
          await handleDragEnd({
            active: { id: task.id },
            over: { id: 'column-' + testData.targetStatus, data: { status: testData.targetStatus } }
          });
          
          // Verify database was updated
          const updated = await fetchTask(task.id);
          expect(updated.status).toBe(testData.targetStatus);
          
          // Cleanup
          await deleteTestTask(task.id);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Unit Testing Strategy

**Test Organization**:
```
tests/
├── unit/
│   ├── components/
│   │   ├── PomodoroTimer.test.tsx
│   │   ├── DraggableTask.test.tsx
│   │   └── TaskQueue.test.tsx
│   ├── hooks/
│   │   ├── usePomodoro.test.ts
│   │   └── useDragAndDrop.test.ts
│   └── utils/
│       ├── audio.test.ts
│       └── daily-reset.test.ts
├── integration/
│   ├── personal-tasks-page.test.tsx
│   ├── family-tasks-page.test.tsx
│   └── cron-daily-reset.test.ts
└── property/
    ├── drag-and-drop.property.test.ts
    ├── pomodoro-timer.property.test.ts
    └── daily-reset.property.test.ts
```

**Unit Test Examples**:

```typescript
// tests/unit/hooks/usePomodoro.test.ts
describe('usePomodoro', () => {
  it('should initialize with 25 minutes for work session', () => {
    const { result } = renderHook(() => usePomodoro());
    expect(result.current.timeLeft).toBe(1500);
    expect(result.current.sessionType).toBe('work');
  });
  
  it('should transition to break after work session completes', async () => {
    const { result } = renderHook(() => usePomodoro());
    
    // Fast-forward to completion
    act(() => {
      result.current.startTimer();
    });
    
    await waitFor(() => {
      expect(result.current.sessionType).toBe('break');
      expect(result.current.timeLeft).toBe(300);
    }, { timeout: 1600 });
  });
  
  it('should persist state to localStorage', () => {
    const { result } = renderHook(() => usePomodoro());
    
    act(() => {
      result.current.startTimer('task-123');
    });
    
    const saved = JSON.parse(localStorage.getItem('pomodoroState')!);
    expect(saved.currentTaskId).toBe('task-123');
    expect(saved.isRunning).toBe(true);
  });
});
```

### Integration Testing

**Focus Areas**:
1. Page-level interactions (drag-and-drop workflows)
2. Database operations (CRUD with Supabase)
3. Realtime subscriptions
4. Cron job execution

**Example Integration Test**:

```typescript
// tests/integration/personal-tasks-page.test.tsx
describe('Personal Tasks Page', () => {
  it('should move task from queue to today when dragged', async () => {
    // Setup: Create queued task
    const queuedTask = await createQueuedTask({
      user_id: testUser.id,
      title: 'Test Task',
      status: 'pending'
    });
    
    // Render page
    render(<PersonalTasksPage />);
    
    // Wait for tasks to load
    await waitFor(() => {
      expect(screen.getByText('Test Task')).toBeInTheDocument();
    });
    
    // Simulate drag from queue to today
    const taskElement = screen.getByText('Test Task');
    const todayColumn = screen.getByTestId('today-column');
    
    await userEvent.drag(taskElement, todayColumn);
    
    // Verify task moved to personal_tasks
    const personalTask = await supabase
      .from('personal_tasks')
      .select('*')
      .eq('title', 'Test Task')
      .single();
    
    expect(personalTask.data).toBeTruthy();
    
    // Verify task removed from queue
    const queueTask = await supabase
      .from('task_queue')
      .select('*')
      .eq('id', queuedTask.id)
      .single();
    
    expect(queueTask.data).toBeNull();
  });
});
```

### Property Test Coverage

Each correctness property from the design document should have at least one property-based test:

1. **Property 3**: Drag-and-Drop Status Change Persistence
2. **Property 4**: Drag-and-Drop Reordering
3. **Property 7**: Family Task Assignment Update
4. **Property 13**: Work Session Auto-Transition to Break
5. **Property 18**: Focus Session Persistence
6. **Property 21**: Daily Reset Incomplete Task Queueing
7. **Property 24**: Queue to Today Drag Transfer
8. **Property 28**: Focus Session Type Validation
9. **Property 29**: Task Queue Status Preservation
10. **Property 30**: Task Queue Original Timestamp Preservation

### Test Data Generators

```typescript
// tests/generators/task-generators.ts
import fc from 'fast-check';

export const taskStatusArb = fc.constantFrom('pending', 'in_progress', 'done');

export const personalTaskArb = fc.record({
  id: fc.uuid(),
  user_id: fc.uuid(),
  title: fc.string({ minLength: 1, maxLength: 200 }),
  status: taskStatusArb,
  order: fc.integer({ min: 0, max: 1000 }),
  created_at: fc.date().map(d => d.toISOString()),
  updated_at: fc.date().map(d => d.toISOString())
});

export const queuedTaskArb = fc.record({
  id: fc.uuid(),
  user_id: fc.uuid(),
  title: fc.string({ minLength: 1, maxLength: 200 }),
  status: taskStatusArb,
  original_created_at: fc.date().map(d => d.toISOString()),
  queued_at: fc.date().map(d => d.toISOString()),
  order: fc.integer({ min: 0, max: 1000 })
});

export const focusSessionArb = fc.record({
  id: fc.uuid(),
  user_id: fc.uuid(),
  task_id: fc.option(fc.uuid(), { nil: null }),
  start_time: fc.date().map(d => d.toISOString()),
  end_time: fc.date().map(d => d.toISOString()),
  duration: fc.constantFrom(25, 5),
  session_type: fc.constantFrom('work', 'break'),
  created_at: fc.date().map(d => d.toISOString())
});
```

### Continuous Integration

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run unit tests
        run: npm run test:unit
      
      - name: Run property tests
        run: npm run test:property
      
      - name: Run integration tests
        run: npm run test:integration
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

