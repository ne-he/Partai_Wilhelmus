'use client';

import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import CommentItem from './CommentItem';
import Skeleton from './Skeleton';
import type { Comment, User } from '../Lib/types';

interface CommentListProps {
  comments: Comment[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  onLoadMore: () => void;
  loadingMore: boolean;
  profile: User;
  onEdit: (id: string, content: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export default function CommentList({
  comments,
  loading,
  error,
  hasMore,
  onLoadMore,
  loadingMore,
  profile,
  onEdit,
  onDelete,
}: CommentListProps) {
  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <Skeleton variant="task-list" count={3} />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        padding: '1rem',
        textAlign: 'center',
        color: 'var(--text-muted)',
      }}>
        <p style={{ marginBottom: '0.75rem', fontSize: '0.85rem' }}>{error}</p>
        <button
          onClick={onLoadMore}
          style={{
            background: 'transparent',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            color: 'var(--accent)',
            cursor: 'pointer',
            fontSize: '0.8rem',
            padding: '0.4rem 0.9rem',
          }}
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  if (comments.length === 0) {
    return (
      <p style={{
        textAlign: 'center',
        color: 'var(--text-muted)',
        fontStyle: 'italic',
        fontSize: '0.85rem',
        padding: '1rem 0',
      }}>
        Belum ada komentar. Jadilah yang pertama! ✦
      </p>
    );
  }

  return (
    <div>
      <AnimatePresence initial={false}>
        {comments.map(comment => (
          <motion.div
            key={comment.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
            transition={{ duration: 0.2 }}
          >
            <CommentItem
              comment={comment}
              profile={profile}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          </motion.div>
        ))}
      </AnimatePresence>

      {hasMore && (
        <div style={{ textAlign: 'center', paddingTop: '0.75rem' }}>
          <button
            onClick={onLoadMore}
            disabled={loadingMore}
            style={{
              background: 'transparent',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              color: loadingMore ? 'var(--text-muted)' : 'var(--accent)',
              cursor: loadingMore ? 'not-allowed' : 'pointer',
              fontSize: '0.8rem',
              padding: '0.4rem 0.9rem',
              transition: 'all 0.15s ease',
              opacity: loadingMore ? 0.6 : 1,
            }}
          >
            {loadingMore ? 'Memuat...' : 'Muat lebih banyak'}
          </button>
        </div>
      )}
    </div>
  );
}
