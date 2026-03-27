/**
 * Unit Tests — CommentForm
 * Feature: family-comments-notifications
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock emoji-picker-react
vi.mock('emoji-picker-react', () => ({
  default: ({ onEmojiClick }: { onEmojiClick: (data: { emoji: string }) => void }) => (
    <div data-testid="emoji-picker">
      <button onClick={() => onEmojiClick({ emoji: '😀' })}>😀</button>
    </div>
  ),
  Theme: { DARK: 'dark' },
}));

// Mock supabaseClient
vi.mock('../../Lib/supabaseClient', () => ({
  supabase: {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }) },
    from: vi.fn(),
    channel: vi.fn(),
  },
}));

import CommentForm from '../../components/CommentForm';

describe('CommentForm', () => {
  const defaultProps = {
    taskId: 'task-1',
    userId: 'user-1',
    onSubmit: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders textarea and submit button', () => {
    render(<CommentForm {...defaultProps} />);
    expect(screen.getByPlaceholderText(/tulis komentar/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /kirim/i })).toBeInTheDocument();
  });

  it('submit button is disabled when textarea is empty', () => {
    render(<CommentForm {...defaultProps} />);
    const submitBtn = screen.getByRole('button', { name: /kirim/i });
    expect(submitBtn).toBeDisabled();
  });

  it('submit button is enabled when textarea has content', async () => {
    const user = userEvent.setup();
    render(<CommentForm {...defaultProps} />);
    const textarea = screen.getByPlaceholderText(/tulis komentar/i);
    await user.type(textarea, 'Hello world');
    const submitBtn = screen.getByRole('button', { name: /kirim/i });
    expect(submitBtn).not.toBeDisabled();
  });

  it('calls onSubmit with trimmed content when submit button clicked', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<CommentForm {...defaultProps} onSubmit={onSubmit} />);
    const textarea = screen.getByPlaceholderText(/tulis komentar/i);
    await user.type(textarea, '  Hello  ');
    const submitBtn = screen.getByRole('button', { name: /kirim/i });
    await user.click(submitBtn);
    expect(onSubmit).toHaveBeenCalledWith('Hello');
  });

  it('clears textarea after successful submit', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<CommentForm {...defaultProps} onSubmit={onSubmit} />);
    const textarea = screen.getByPlaceholderText(/tulis komentar/i) as HTMLTextAreaElement;
    await user.type(textarea, 'Hello');
    await user.click(screen.getByRole('button', { name: /kirim/i }));
    await waitFor(() => expect(textarea.value).toBe(''));
  });

  it('Ctrl+Enter triggers onSubmit', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<CommentForm {...defaultProps} onSubmit={onSubmit} />);
    const textarea = screen.getByPlaceholderText(/tulis komentar/i);
    await user.type(textarea, 'Hello');
    await user.keyboard('{Control>}{Enter}{/Control}');
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith('Hello'));
  });

  it('preserves textarea content when onSubmit throws', async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error('Network error'));
    const user = userEvent.setup();
    render(<CommentForm {...defaultProps} onSubmit={onSubmit} />);
    const textarea = screen.getByPlaceholderText(/tulis komentar/i) as HTMLTextAreaElement;
    await user.type(textarea, 'My draft');
    await user.click(screen.getByRole('button', { name: /kirim/i }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(textarea.value).toBe('My draft');
  });
});
