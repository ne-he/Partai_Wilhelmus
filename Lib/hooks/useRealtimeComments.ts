'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../Lib/supabaseClient';
import type { Comment } from '../types';
import type { ToastItem } from './useToast';

const PAGE_SIZE = 10;

const DISPLAY_NAME_MAP: Record<string, string> = {
  papa: 'Abi', mama: 'Umi', nemi: 'Baginda', venly: 'Mbah',
};

export interface UseRealtimeCommentsReturn {
  comments: Comment[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  loadingMore: boolean;
  addComment: (content: string) => Promise<void>;
  editComment: (id: string, content: string) => Promise<void>;
  deleteComment: (id: string) => Promise<void>;
  retry: () => void;
}

export function useRealtimeComments(
  taskId: string,
  showToast: (msg: string, type: ToastItem['type']) => void
): UseRealtimeCommentsReturn {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [retryCount, setRetryCount] = useState(0);

  const retry = useCallback(() => {
    setRetryCount(prev => prev + 1);
  }, []);

  const fetchComments = useCallback(async (isMounted: { current: boolean }) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('task_comments')
        .select('*, users!user_id(username, role)')
        .eq('task_id', taskId)
        .order('created_at', { ascending: true })
        .range(0, PAGE_SIZE - 1);

      if (!isMounted.current) return;
      if (fetchError) throw fetchError;

      const normalized = (data ?? []).map((row: Record<string, unknown>) => {
        const users = row.users as { username?: string; role?: string } | null;
        return {
          id: row.id,
          task_id: row.task_id,
          user_id: row.user_id,
          content: row.content,
          created_at: row.created_at,
          updated_at: row.updated_at,
          username: users?.username,
          role: users?.role,
        } as Comment;
      });

      if (!isMounted.current) return;
      setComments(normalized);
      setOffset(normalized.length);
      setHasMore(normalized.length === PAGE_SIZE);
    } catch (err) {
      if (!isMounted.current) return;
      const msg = err instanceof Error ? err.message : 'Gagal memuat komentar';
      setError(msg);
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    const isMounted = { current: true };
    fetchComments(isMounted);
    return () => { isMounted.current = false; };
  }, [fetchComments, retryCount]);

  useEffect(() => {
    const channel = supabase
      .channel(`comments:${taskId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'task_comments',
          filter: `task_id=eq.${taskId}`,
        },
        async (payload) => {
          // Fetch full comment dengan join users
          const { data } = await supabase
            .from('task_comments')
            .select('*, users!user_id(username, role)')
            .eq('id', payload.new.id)
            .single();

          if (!data) return;

          const users = (data as Record<string, unknown>).users as { username?: string; role?: string } | null;
          const newComment: Comment = {
            id: (data as Record<string, unknown>).id as string,
            task_id: (data as Record<string, unknown>).task_id as string,
            user_id: (data as Record<string, unknown>).user_id as string,
            content: (data as Record<string, unknown>).content as string,
            created_at: (data as Record<string, unknown>).created_at as string,
            updated_at: (data as Record<string, unknown>).updated_at as string,
            username: users?.username,
            role: users?.role,
          };

          // Hindari duplicate (optimistic update sudah ada)
          setComments(prev => {
            const exists = prev.some(c => c.id === newComment.id);
            if (exists) return prev;
            showToast(`Komentar baru dari ${users?.username ? (DISPLAY_NAME_MAP[users.username.toLowerCase()] ?? users.username) : 'seseorang'}`, 'info');
            return [...prev, newComment];
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'task_comments',
          filter: `task_id=eq.${taskId}`,
        },
        (payload) => {
          setComments(prev =>
            prev.map(c =>
              c.id === payload.new.id
                ? { ...c, content: payload.new.content as string, updated_at: payload.new.updated_at as string }
                : c
            )
          );
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'task_comments',
          filter: `task_id=eq.${taskId}`,
        },
        (payload) => {
          setComments(prev => prev.filter(c => c.id !== payload.old.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [taskId, showToast]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const isMounted = { current: true };
    try {
      const { data, error: fetchError } = await supabase
        .from('task_comments')
        .select('*, users!user_id(username, role)')
        .eq('task_id', taskId)
        .order('created_at', { ascending: true })
        .range(offset, offset + PAGE_SIZE - 1);

      if (!isMounted.current) return;
      if (fetchError) throw fetchError;

      const normalized = (data ?? []).map((row: Record<string, unknown>) => {
        const users = row.users as { username?: string; role?: string } | null;
        return {
          id: row.id,
          task_id: row.task_id,
          user_id: row.user_id,
          content: row.content,
          created_at: row.created_at,
          updated_at: row.updated_at,
          username: users?.username,
          role: users?.role,
        } as Comment;
      });

      if (!isMounted.current) return;
      setComments(prev => [...prev, ...normalized]);
      setOffset(prev => prev + normalized.length);
      setHasMore(normalized.length === PAGE_SIZE);
    } catch (err) {
      if (!isMounted.current) return;
      const msg = err instanceof Error ? err.message : 'Gagal memuat lebih banyak';
      showToast(msg, 'error');
    } finally {
      if (isMounted.current) setLoadingMore(false);
    }
  }, [taskId, offset, hasMore, loadingMore, showToast]);

  const addComment = useCallback(async (content: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Tidak terautentikasi');

    const optimisticId = `optimistic-${Date.now()}`;
    const optimistic: Comment = {
      id: optimisticId,
      task_id: taskId,
      user_id: user.id,
      content,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setComments(prev => [...prev, optimistic]);

    const { data, error: insertError } = await supabase
      .from('task_comments')
      .insert({ task_id: taskId, user_id: user.id, content })
      .select('*, users!user_id(username, role)')
      .single();

    if (insertError) {
      setComments(prev => prev.filter(c => c.id !== optimisticId));
      throw insertError;
    }

    const users = (data as Record<string, unknown>).users as { username?: string; role?: string } | null;
    const inserted: Comment = {
      id: (data as Record<string, unknown>).id as string,
      task_id: (data as Record<string, unknown>).task_id as string,
      user_id: (data as Record<string, unknown>).user_id as string,
      content: (data as Record<string, unknown>).content as string,
      created_at: (data as Record<string, unknown>).created_at as string,
      updated_at: (data as Record<string, unknown>).updated_at as string,
      username: users?.username,
      role: users?.role,
    };

    setComments(prev => prev.map(c => c.id === optimisticId ? inserted : c));
  }, [taskId]);

  const editComment = useCallback(async (id: string, content: string) => {
    const { error: updateError } = await supabase
      .from('task_comments')
      .update({ content, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (updateError) throw updateError;

    setComments(prev =>
      prev.map(c =>
        c.id === id
          ? { ...c, content, updated_at: new Date().toISOString() }
          : c
      )
    );
  }, []);

  const deleteComment = useCallback(async (id: string) => {
    const { error: deleteError } = await supabase
      .from('task_comments')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;

    setComments(prev => prev.filter(c => c.id !== id));
  }, []);

  return {
    comments,
    loading,
    error,
    hasMore,
    loadMore,
    loadingMore,
    addComment,
    editComment,
    deleteComment,
    retry,
  };
}
