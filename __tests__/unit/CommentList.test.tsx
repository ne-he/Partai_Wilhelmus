/**
 * Unit Tests — CommentList
 * Feature: family-comments-notifications
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import type { Comment, User } from '../../Lib/types';

// Mock framer-motion to avoid animation issues
vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode }) => (
      <div {...props}>{children}</div>
    ),
  },
}));

// Mock CommentItem
vi.mock('../../components/CommentItem', () => ({
  default: ({ comment }: { comment: Comment }) => (
    <div data-testid={`comment-item-${comment.id}`}>{comment.content}</div>
  ),
}));

// Mock Skeleton
vi.mock('../../components/Skeleton', () => ({
  default: ({ count }: { count?: number }) => (
    <div data-testid="skeleton" data-count={count ?? 1} />
  ),
}));

import CommentList from '../../components/CommentList';

const profile: User = { id: 'user-1', username: 'nemi', role: 'nemi' };

const defaultProps = {
  comments: [],
  loading: false,
  error: null,
  hasMore: false,
  onLoadMore: vi.fn(),
  onRetry: vi.fn(),
  loadingMore: false,
  profile,
  onEdit: vi.fn(),
  onDelete: vi.fn(),
  showToast: vi.fn(),
};

const sampleComments: Comment[] = [
  {
    id: 'c1',
    task_id: 'task-1',
    user_id: 'user-1',
    content: 'First comment',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

describe('CommentList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows skeleton when loading=true', () => {
    render(<CommentList {...defaultProps} loading={true} />);
    expect(screen.getByTestId('skeleton')).toBeInTheDocument();
  });

  it('shows empty state when comments=[] and loading=false', () => {
    render(<CommentList {...defaultProps} comments={[]} loading={false} />);
    expect(screen.getByText(/belum ada komentar/i)).toBeInTheDocument();
  });

  it('shows error state with "Coba Lagi" button when error is set', () => {
    render(<CommentList {...defaultProps} error="Gagal memuat komentar" />);
    expect(screen.getByText(/gagal memuat komentar/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /coba lagi/i })).toBeInTheDocument();
  });

  it('"Coba Lagi" button calls onRetry', async () => {
    const onRetry = vi.fn();
    const user = userEvent.setup();
    render(<CommentList {...defaultProps} error="Error" onRetry={onRetry} />);
    await user.click(screen.getByRole('button', { name: /coba lagi/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('renders comment items when comments are provided', () => {
    render(<CommentList {...defaultProps} comments={sampleComments} />);
    expect(screen.getByTestId('comment-item-c1')).toBeInTheDocument();
    expect(screen.getByText('First comment')).toBeInTheDocument();
  });
});
