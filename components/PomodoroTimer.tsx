'use client';

import { usePomodoro } from '../lib/hooks/usePomodoro';

interface PersonalTask {
  id: string;
  title: string;
  status: string;
}

interface PomodoroTimerProps {
  tasks: PersonalTask[];
  userId: string | null;
}

export default function PomodoroTimer({ tasks, userId }: PomodoroTimerProps) {
  const {
    timeLeft,
    isRunning,
    sessionType,
    currentTaskId,
    startTimer,
    pauseTimer,
    resetTimer,
    skipToBreak,
  } = usePomodoro(userId);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const currentTask = tasks.find(t => t.id === currentTaskId);
  const availableTasks = tasks.filter(t => t.status !== 'done');

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '2px solid var(--accent)',
        borderRadius: '16px',
        padding: '1.5rem',
        marginBottom: '2rem',
        maxWidth: '500px',
      }}
    >
      {/* Session Type */}
      <div
        style={{
          textAlign: 'center',
          fontSize: '0.75rem',
          color: 'var(--accent)',
          letterSpacing: '2px',
          marginBottom: '1rem',
          fontWeight: 'bold',
        }}
      >
        {sessionType === 'work' ? '🍅 FOCUS TIME' : '☕ BREAK TIME'}
      </div>

      {/* Timer Display */}
      <div
        style={{
          textAlign: 'center',
          fontSize: '3.5rem',
          color: 'var(--text-main)',
          fontFamily: 'monospace',
          fontWeight: 'bold',
          marginBottom: '1rem',
          letterSpacing: '4px',
        }}
      >
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </div>

      {/* Current Task */}
      {currentTask && sessionType === 'work' && (
        <div
          style={{
            textAlign: 'center',
            fontSize: '0.85rem',
            color: 'var(--text-muted)',
            marginBottom: '1.5rem',
            fontStyle: 'italic',
          }}
        >
          Working on: {currentTask.title}
        </div>
      )}

      {/* Controls */}
      <div
        style={{
          display: 'flex',
          gap: '0.8rem',
          justifyContent: 'center',
          marginBottom: '1rem',
        }}
      >
        {!isRunning ? (
          <button
            onClick={() => startTimer(currentTaskId || undefined)}
            style={{
              padding: '0.8rem 2rem',
              background: 'var(--accent)',
              border: 'none',
              borderRadius: '10px',
              color: '#1a1612',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: '0.9rem',
            }}
          >
            {timeLeft === (sessionType === 'work' ? 1500 : 300) ? 'START' : 'RESUME'}
          </button>
        ) : (
          <button
            onClick={pauseTimer}
            style={{
              padding: '0.8rem 2rem',
              background: 'var(--accent)',
              border: 'none',
              borderRadius: '10px',
              color: '#1a1612',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: '0.9rem',
            }}
          >
            PAUSE
          </button>
        )}

        <button
          onClick={resetTimer}
          style={{
            padding: '0.8rem 1.5rem',
            background: 'transparent',
            border: '1px solid var(--border)',
            borderRadius: '10px',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            fontSize: '0.9rem',
          }}
        >
          RESET
        </button>

        {sessionType === 'work' && (
          <button
            onClick={skipToBreak}
            style={{
              padding: '0.8rem 1.5rem',
              background: 'transparent',
              border: '1px solid var(--border)',
              borderRadius: '10px',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: '0.9rem',
            }}
          >
            SKIP
          </button>
        )}
      </div>

      {/* Task Selector */}
      {sessionType === 'work' && (
        <div>
          <label
            style={{
              display: 'block',
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              marginBottom: '0.5rem',
              letterSpacing: '1px',
            }}
          >
            LINK TO TASK (OPTIONAL)
          </label>
          <select
            value={currentTaskId || ''}
            onChange={e => startTimer(e.target.value || undefined)}
            disabled={isRunning}
            style={{
              width: '100%',
              padding: '0.6rem 1rem',
              background: 'var(--bg-main)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              color: 'var(--text-main)',
              fontSize: '0.85rem',
              cursor: isRunning ? 'not-allowed' : 'pointer',
              outline: 'none',
            }}
          >
            <option value="">No task selected</option>
            {availableTasks.map(task => (
              <option key={task.id} value={task.id}>
                {task.title}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
