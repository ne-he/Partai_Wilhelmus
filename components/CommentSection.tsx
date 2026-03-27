'use client';

import React from 'react';
import CommentList from './CommentList';
import { useRealtimeComments } from '../Lib/hooks/useRealtimeComments';
import type { User } from '../Lib/types';

interface CommentSectionProps {
  taskId: string;
  profile: User;
}

// Dummy showToast untuk dipakai sebelum task 3.1 mengintegrasikan useNotifications
function dummyShowToast(_msg: string, _type: 'success' | 'error' | 'info') {}

export default function CommentSection({ taskId, profile }: CommentSectionProps) {
  const {
    comments,
    loading,
    error,
    hasMore,
    loadMore,
    loadingMore,
    editComment,
    deleteComment,
  } = useRealtimeComments(taskId, dummyShowToast);

  return (
    <div>
      {/* Header */}
      <h3 style={{
        fontFamily: "'Playfair Display', Georgia, serif",
        fontSize: '0.7rem',
        fontWeight: '700',
        color: 'var(--text-muted)',
        letterSpacing: '3px',
        textTransform: 'uppercase',
        marginBottom: '1rem',
      }}>
        KOMENTAR
      </h3>

      {/* CommentForm akan diisi di task 2.3 */}

      <CommentList
        comments={comments}
        loading={loading}
        error={error}
        hasMore={hasMore}
        onLoadMore={loadMore}
        loadingMore={loadingMore}
        profile={profile}
        onEdit={editComment}
        onDelete={deleteComment}
      />
    </div>
  );
}
