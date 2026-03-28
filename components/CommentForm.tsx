'use client';

import React, { useState, useRef, useCallback } from 'react';
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';

interface CommentFormProps {
  taskId: string;
  userId: string;
  onSubmit: (content: string) => Promise<void>;
}

export default function CommentForm({ taskId: _taskId, userId: _userId, onSubmit }: CommentFormProps) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  const handleEmojiClick = useCallback((emojiData: EmojiClickData) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart ?? content.length;
    const end = textarea.selectionEnd ?? content.length;
    const newContent = content.slice(0, start) + emojiData.emoji + content.slice(end);
    setContent(newContent);

    // Restore cursor position after emoji insert
    requestAnimationFrame(() => {
      textarea.focus();
      const newPos = start + emojiData.emoji.length;
      textarea.setSelectionRange(newPos, newPos);
    });
  }, [content]);

  const handleSubmit = useCallback(async () => {
    const trimmed = content.trim();
    if (!trimmed || loading) return;

    setLoading(true);
    try {
      await onSubmit(trimmed);
      setContent('');
      setShowEmojiPicker(false);
    } catch {
      // Pertahankan teks saat gagal — jangan kosongkan textarea
    } finally {
      setLoading(false);
    }
  }, [content, loading, onSubmit]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  const isDisabled = !content.trim() || loading;

  return (
    <div style={{ position: 'relative', marginBottom: '1rem' }}>
      {/* Emoji Picker Popup */}
      {showEmojiPicker && (
        <div
          ref={emojiPickerRef}
          style={{
            position: 'absolute',
            bottom: '100%',
            left: 0,
            zIndex: 100,
            marginBottom: '0.5rem',
          }}
        >
          <EmojiPicker
            onEmojiClick={handleEmojiClick}
            theme={Theme.DARK}
            lazyLoadEmojis
            height={350}
            width={300}
          />
        </div>
      )}

      {/* Textarea */}
      <textarea
        ref={textareaRef}
        value={content}
        onChange={e => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={loading}
        placeholder="Tulis komentar... (Ctrl+Enter / ⌘+Enter untuk kirim)"
        rows={3}
        style={{
          width: '100%',
          resize: 'vertical',
          padding: '0.6rem 0.75rem',
          background: 'var(--bg-card2)',
          border: '1px solid var(--border)',
          borderRadius: '6px',
          color: 'var(--text)',
          fontFamily: 'inherit',
          fontSize: '0.85rem',
          outline: 'none',
          transition: 'border-color 0.2s',
          boxSizing: 'border-box',
          opacity: loading ? 0.6 : 1,
        }}
        onFocus={e => { e.currentTarget.style.borderColor = 'var(--accent)'; }}
        onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; }}
      />

      {/* Bottom bar: emoji button + submit button */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: '0.4rem',
      }}>
        {/* Emoji toggle button */}
        <button
          type="button"
          onClick={() => setShowEmojiPicker(prev => !prev)}
          title="Pilih emoji"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '1.2rem',
            padding: '0.2rem 0.4rem',
            borderRadius: '4px',
            lineHeight: 1,
            opacity: showEmojiPicker ? 1 : 0.7,
            transition: 'opacity 0.15s',
          }}
        >
          🙂
        </button>

        {/* Submit button */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isDisabled}
          style={{
            background: isDisabled ? 'var(--border)' : 'var(--accent)',
            color: isDisabled ? 'var(--text-muted)' : '#fff',
            border: 'none',
            borderRadius: '6px',
            padding: '0.35rem 1rem',
            fontSize: '0.8rem',
            fontFamily: "'Playfair Display', Georgia, serif",
            fontWeight: '600',
            letterSpacing: '1px',
            cursor: isDisabled ? 'not-allowed' : 'pointer',
            transition: 'background 0.2s, color 0.2s',
          }}
        >
          {loading ? '...' : 'Kirim'}
        </button>
      </div>
    </div>
  );
}
