/**
 * Unit Tests — CommentItem
 * Feature: family-comments-notifications
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import type { Comment, User } from '../../Lib/types';

// Mock ConfirmModal
vi.mock('../../components/ConfirmModal', () => ({
  default: ({ isOpen, message }: { isOpen: boolean; message: string }) =>
    isOpen ? <div data-testid="confirm-modal">{message}</div> : null,
}));

// Mock supabaseClient
vi.mock('../../Lib/supabaseClient', () => ({
  supabase: {
    auth: { getUser: vi.fn() },
    from: vi.fn(),
    channel: vi.fn(),
  },
}));

import CommentItem from '../../components/CommentItem';

const baseComment: Comment = {
  id: 'comment-1',
  task_id: 'task-1',
  user_id: 'user-owner',
  content: 'Test comment content',
  created_at: new Date(Date.now() - 60000).toISOString(),
  updated_at: new Date(Date.now() - 60000).toISOString(),
  username: 'nemi',
  role: 'nemi',
};

const defaultProps = {
  comment: baseComment,
  onEdit: vi.fn(),
  onDelete: vi.fn(),
  showToast: vi.fn(),
};

describe('CommentItem — three-dots menu visibility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does NOT show three-dots menu for other user with role nemi', () => {
    const profile: User = { id: 'user-other', username: 'venly', role: 'nemi' };
    render(<CommentItem {...defaultProps} profile={profile} />);
    expect(screen.queryByLabelText(/opsi komentar/i)).not.toBeInTheDocument();
  });

  it('shows three-dots menu for comment owner', () => {
    const profile: User = { id: 'user-owner', username: 'nemi', role: 'nemi' };
    render(<CommentItem {...defaultProps} profile={profile} />);
    expect(screen.getByLabelText(/opsi komentar/i)).toBeInTheDocument();
  });

  it('shows three-dots menu for papa role', () => {
    const profile: User = { id: 'user-papa', username: 'papa', role: 'papa' };
    render(<CommentItem {...defaultProps} profile={profile} />);
    expect(screen.getByLabelText(/opsi komentar/i)).toBeInTheDocument();
  });

  it('shows three-dots menu for mama role', () => {
    const profile: User = { id: 'user-mama', username: 'mama', role: 'mama' };
    render(<CommentItem {...defaultProps} profile={profile} />);
    expect(screen.getByLabelText(/opsi komentar/i)).toBeInTheDocument();
  });
});
