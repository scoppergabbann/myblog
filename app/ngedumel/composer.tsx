'use client';

import { useState, useTransition, useRef, useEffect } from 'react';
import { Avatar } from './avatar';
import { createDumel } from './actions';

const MAX = 2000;

export function DumelComposer({
  avatarUrl,
  displayName,
  login,
}: {
  avatarUrl?: string;
  displayName: string;
  login: string;
}) {
  const [content, setContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea as user types
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 320)}px`;
  }, [content]);

  const trimmed = content.trim();
  const canPost = trimmed.length > 0 && trimmed.length <= MAX && !isPending;

  const onSubmit = () => {
    if (!canPost) return;
    setError(null);
    startTransition(async () => {
      const result = await createDumel(content);
      if (result.ok) {
        setContent('');
      } else {
        setError(result.error);
      }
    });
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Cmd/Ctrl + Enter to submit
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <div className="mb-6 rounded-[14px] border border-[var(--color-line)] bg-[var(--color-paper)] p-3 sm:mb-7 sm:p-4">
      <div className="flex gap-2.5 sm:gap-3">
        <Avatar src={avatarUrl} login={login} name={displayName} size={36} />
        <div className="min-w-0 flex-1">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Lagi mikir apa?"
            rows={2}
            maxLength={MAX}
            className="w-full resize-none overflow-hidden border-none bg-transparent text-[15px] leading-[1.55] text-[var(--color-ink)] placeholder:text-[var(--color-ink-4)] focus:outline-none"
          />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-t border-[var(--color-line)] pt-3">
        <div className="min-w-0 flex-1 text-[11.5px]">
          {error ? (
            <span className="text-red-600 dark:text-red-400">{error}</span>
          ) : (
            <span className="font-mono text-[var(--color-ink-4)]">
              {trimmed.length > 0 && `${trimmed.length}/${MAX} · `}
              <span className="hidden sm:inline">⌘+Enter untuk post</span>
              <span className="sm:hidden">tap untuk post</span>
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onSubmit}
          disabled={!canPost}
          className="flex-shrink-0 rounded-full bg-[var(--color-ink)] px-4 py-1.5 text-[12.5px] font-medium tracking-tight text-[var(--color-paper)] transition-all hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-30"
        >
          {isPending ? 'Posting...' : 'Ngedumel'}
        </button>
      </div>
    </div>
  );
}
