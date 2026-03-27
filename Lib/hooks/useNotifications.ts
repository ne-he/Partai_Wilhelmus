'use client';

import { useEffect } from 'react';
import { supabase } from '../supabaseClient';
import type { ToastItem } from './useToast';

const DISPLAY_NAME_MAP: Record<string, string> = {
  papa: 'Abi', mama: 'Umi', nemi: 'Baginda', venly: 'Mbah',
};

function getAlias(username?: string): string {
  if (!username) return 'seseorang';
  return DISPLAY_NAME_MAP[username.toLowerCase()] ?? username;
}

export function useNotifications(
  userId: string,
  showToast: (msg: string, type: ToastItem['type']) => void
): void {
  useEffect(() => {
    if (!userId) return;

    // Channel 1: family-events (broadcast untuk semua event keluarga)
    const familyChannel = supabase
      .channel('family-events')
      .on('broadcast', { event: 'new_task' }, (payload) => {
        // Jangan tampilkan ke pembuat sendiri
        if (payload.payload?.created_by === userId) return;
        showToast(`Tugas baru: ${payload.payload?.title ?? ''}`, 'info');
      })
      .on('broadcast', { event: 'new_comment' }, (payload) => {
        if (payload.payload?.user_id === userId) return;
        const alias = getAlias(payload.payload?.username);
        showToast(`Komentar baru dari ${alias} pada "${payload.payload?.task_title ?? ''}"`, 'info');
      })
      .on('broadcast', { event: 'deadline_warning' }, (payload) => {
        showToast(`Deadline besok: ${payload.payload?.title ?? ''}`, 'info');
      })
      .subscribe();

    // Channel 2: user-specific (untuk assignment)
    const userChannel = supabase
      .channel(`user-${userId}`)
      .on('broadcast', { event: 'assignment' }, (payload) => {
        showToast(`Kamu ditugaskan ke: ${payload.payload?.title ?? ''}`, 'info');
      })
      .subscribe();

    return () => {
      supabase.removeChannel(familyChannel);
      supabase.removeChannel(userChannel);
    };
  }, [userId, showToast]);
}
