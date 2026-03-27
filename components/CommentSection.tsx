'use client';

import React from 'react';
import CommentList from './CommentList';
import CommentForm from './CommentForm';
import { useRealtimeComments } from '../Lib/hooks/useRealtimeComments';
import { useToast } from '../Lib/hooks/useToast';
import Toast from './Toast';
import type { User } from '../Lib/types';

interface CommentSectionProps {
  taskId: string;
  profile: User;
}

export default function CommentSection({ taskId, profile }: CommentSectionProps) {
  const { toasts, showToast, dismissToast } = useToast();

  const {
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
  } = useRealtimeComments(taskId, showToast);

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

      {/* CommentForm */}
      <CommentForm
        taskId={taskId}
        userId={profile.id}
        onSubmit={addComment}
      />

      <CommentList
        comments={comments}
        loading={loading}
        error={error}
        hasMore={hasMore}
        onLoadMore={loadMore}
        onRetry={retry}
        loadingMore={loadingMore}
        profile={profile}
        onEdit={editComment}
        onDelete={deleteComment}
        showToast={showToast}
      />

      {/* Toast notifications */}
      <Toast toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
