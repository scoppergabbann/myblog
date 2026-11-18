'use client';

import { startTransition, useEffect, useRef, useState } from 'react';
import { setMonologReaction } from '@/app/monolog/[slug]/reaction-actions';
import { StreamReactionIcon } from '@/components/stream-reaction-icon';
import {
  monologReactionOptions,
  type MonologReactionKind,
  type MonologReactionStates,
} from '@/lib/monolog-reactions';

export function MonologReactions({
  slug,
  title,
  initial,
}: {
  slug: string;
  title: string;
  initial: MonologReactionStates;
}) {
  const [states, setStates] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [burst, setBurst] = useState<{ kind: MonologReactionKind; id: number } | null>(null);
  const pending = useRef(false);

  useEffect(() => setStates(initial), [initial]);

  function react(kind: MonologReactionKind) {
    if (pending.current || !states[kind].available) return;
    pending.current = true;
    const previous = states[kind];
    const active = !previous.active;
    setStates((current) => ({
      ...current,
      [kind]: { ...previous, active, count: Math.max(0, previous.count + (active ? 1 : -1)) },
    }));
    setBusy(true);
    setError('');
    setNotice('');
    setBurst((value) => ({ kind, id: (value?.id ?? 0) + 1 }));

    startTransition(() => {
      void (async () => {
        try {
          const result = await setMonologReaction(slug, kind, active);
          if (!result.ok) {
            setStates((current) => ({ ...current, [kind]: previous }));
            setError(result.error);
            return;
          }
          setStates((current) => ({
            ...current,
            [kind]: { ...current[kind], active: result.active, count: result.count ?? current[kind].count },
          }));
          setNotice(result.active ? 'Reaksi tersimpan. Terima kasih!' : 'Reaksi dibatalkan.');
        } catch {
          setStates((current) => ({ ...current, [kind]: previous }));
          setError('Reaksi belum tersimpan. Coba lagi, ya.');
        } finally {
          pending.current = false;
          setBusy(false);
        }
      })();
    });
  }

  return (
    <section aria-labelledby="monolog-reactions-title" className="mt-12 border-t border-[var(--color-line)] pt-7">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="monolog-reactions-title" className="font-mono text-[11.5px] font-normal text-[var(--color-ink-3)]">
          // reaksimu setelah mendengar?
        </h2>
        <span className="font-mono text-[10.5px] text-[var(--color-ink-4)]">anonymous · klik untuk react</span>
      </div>
      <div role="group" aria-label={`Reaksi untuk Monolog ${title}`} className="flex flex-wrap gap-2">
        {monologReactionOptions.map(({ kind, label, emoji }) => {
          const state = states[kind];
          const animated = burst?.kind === kind;
          return (
            <button
              key={kind}
              type="button"
              onClick={() => react(kind)}
              disabled={busy || !state.available}
              aria-pressed={state.active}
              aria-label={`${state.active ? 'Batalkan' : 'Beri'} reaksi ${label} untuk ${title}. ${state.count} reaksi.`}
              title={state.available ? `${label}${state.active ? ' · klik untuk membatalkan' : ''}` : 'Reaksi sementara tidak tersedia'}
              className={`stream-reaction-button group relative inline-flex min-h-11 min-w-[64px] items-center justify-center gap-2 rounded-full border px-3 py-2 text-sm transition-colors disabled:cursor-wait disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-accent)] ${state.active ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-accent)]' : 'border-[var(--color-line)] text-[var(--color-ink-3)] hover:border-[var(--color-accent)] hover:bg-[var(--color-paper-2)]'}`}
            >
              <span key={animated ? burst.id : 'idle'} className={`stream-reaction-icon inline-flex ${animated ? 'reaction-wiggle' : ''}`} aria-hidden="true">
                <StreamReactionIcon kind={kind} />
              </span>
              <span className="min-w-3 text-xs tabular-nums">{state.count}</span>
              {animated && state.active && (
                <span key={`burst-${burst.id}`} aria-hidden="true" className="stream-reaction-burst pointer-events-none absolute inset-0">
                  <span>{emoji}</span><span>{emoji}</span><span>{emoji}</span>
                </span>
              )}
            </button>
          );
        })}
      </div>
      <span role="status" className="sr-only">{notice}</span>
      {error && <p role="alert" className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>}
      {monologReactionOptions.every(({ kind }) => !states[kind].available) && (
        <p className="mt-2 text-xs text-[var(--color-ink-3)]">Reaksi sementara belum tersedia.</p>
      )}
    </section>
  );
}
