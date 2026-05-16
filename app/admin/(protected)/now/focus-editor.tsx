'use client';

import { useState, useTransition } from 'react';
import { updateFocus, touchUpdatedAt } from './actions';

export function FocusEditor({ initialFocus }: { initialFocus: string }) {
  const [focus, setFocus] = useState(initialFocus);
  const [saved, setSaved] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const onSave = () => {
    setSaved('saving');
    setError(null);
    startTransition(async () => {
      const result = await updateFocus(focus);
      if (result.ok) {
        setSaved('saved');
        setTimeout(() => setSaved('idle'), 2000);
      } else {
        setError(result.error);
        setSaved('idle');
      }
    });
  };

  const onTouch = () => {
    startTransition(async () => {
      await touchUpdatedAt();
      setSaved('saved');
      setTimeout(() => setSaved('idle'), 2000);
    });
  };

  const dirty = focus !== initialFocus;

  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <h2 className="font-mono text-sm font-medium lowercase text-[var(--color-ink-3)]">
          // fokus hidup
        </h2>
        <button
          type="button"
          onClick={onTouch}
          className="font-mono text-[11px] text-[var(--color-ink-4)] transition-colors hover:text-[var(--color-accent)]"
        >
          touch updated_at →
        </button>
      </div>
      <textarea
        value={focus}
        onChange={(e) => setFocus(e.target.value)}
        maxLength={1000}
        rows={3}
        placeholder="Apa yang sedang menjadi fokus hidup kamu saat ini..."
        className="w-full resize-y rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2 text-[14.5px] leading-[1.65] text-[var(--color-ink-2)] transition-colors focus:border-[var(--color-accent)]"
      />
      <div className="mt-2 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onSave}
          disabled={!dirty || saved === 'saving'}
          className="rounded-lg bg-[var(--color-ink)] px-3.5 py-1.5 text-[12.5px] font-medium tracking-tight text-[var(--color-paper)] transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {saved === 'saving' ? 'Saving...' : 'Save focus'}
        </button>
        <div className="flex items-center gap-3 text-[12px]">
          {error && (
            <span className="text-red-600 dark:text-red-400">{error}</span>
          )}
          {saved === 'saved' && (
            <span className="text-emerald-600 dark:text-emerald-400">
              ✓ saved
            </span>
          )}
          <span className="font-mono text-[var(--color-ink-4)]">
            {focus.length}/1000
          </span>
        </div>
      </div>
    </div>
  );
}
