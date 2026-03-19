'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../Lib/supabaseClient';
import { playNotificationSound } from '../utils/audio';

const WORK_DURATION = 25 * 60; // 1500 seconds
const BREAK_DURATION = 5 * 60; // 300 seconds
const STORAGE_KEY = 'pomodoro_timer_state';

interface TimerState {
  timeLeft: number;
  isRunning: boolean;
  sessionType: 'work' | 'break';
  currentTaskId: string | null;
  startedAt: number | null;
}

interface FocusSession {
  user_id: string;
  task_id: string | null;
  start_time: string;
  end_time: string;
  duration: number;
  session_type: 'work' | 'break';
}

export function usePomodoro(userId: string | null) {
  const [state, setState] = useState<TimerState>(() => loadTimerState());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Persist state to localStorage on every change
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
      startedAt: Date.now(),
    }));
  };

  const pauseTimer = () => {
    setState(prev => ({
      ...prev,
      isRunning: false,
      startedAt: null,
    }));
  };

  const resetTimer = () => {
    setState({
      timeLeft: WORK_DURATION,
      isRunning: false,
      sessionType: 'work',
      currentTaskId: null,
      startedAt: null,
    });
  };

  const skipToBreak = () => {
    if (state.sessionType === 'work') {
      setState({
        timeLeft: BREAK_DURATION,
        isRunning: false,
        sessionType: 'break',
        currentTaskId: null,
        startedAt: null,
      });
    }
  };

  async function handleSessionComplete(completedState: TimerState) {
    // Play audio notification
    try {
      await playNotificationSound();
    } catch (error) {
      console.error('Audio notification failed:', error);
    }

    // Save work session to database
    if (completedState.sessionType === 'work' && userId) {
      try {
        const session: FocusSession = {
          user_id: userId,
          task_id: completedState.currentTaskId,
          start_time: new Date(completedState.startedAt!).toISOString(),
          end_time: new Date().toISOString(),
          duration: 25,
          session_type: 'work',
        };

        const { error } = await supabase.from('focus_sessions').insert(session);

        if (error) {
          console.error('Failed to save focus session:', error);
          // Store in localStorage as backup
          const failedSessions = JSON.parse(
            localStorage.getItem('failed_sessions') || '[]'
          );
          failedSessions.push({ ...session, error: error.message });
          localStorage.setItem('failed_sessions', JSON.stringify(failedSessions));
        }
      } catch (error) {
        console.error('Error saving focus session:', error);
      }
    }

    // Show browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Pomodoro Complete!', {
        body:
          completedState.sessionType === 'work'
            ? 'Time for a break!'
            : 'Ready to focus again?',
        icon: '/favicon.ico',
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
        startedAt: Date.now(),
      };
    } else {
      // Don't auto-start work, let user decide
      return {
        timeLeft: WORK_DURATION,
        isRunning: false,
        sessionType: 'work',
        currentTaskId: null,
        startedAt: null,
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
    skipToBreak,
  };
}

function saveTimerState(state: TimerState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Failed to save timer state:', error);
  }
}

function loadTimerState(): TimerState {
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
    timeLeft: WORK_DURATION,
    isRunning: false,
    sessionType: 'work',
    currentTaskId: null,
    startedAt: null,
  };
}
