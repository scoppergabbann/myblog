'use client';

import { useOptimistic, useTransition, useState, useEffect } from 'react';
import { toggleReaction } from '@/app/writing/[slug]/reaction-actions';
import type { ReactionCounts } from '@/lib/queries';

type EmojiInfo = {
  key: keyof ReactionCounts;
  label: string;
  emoji: string;
};

const EMOJIS: EmojiInfo[] = [
  { key: 'heart', label: 'suka', emoji: '♥' },
  { key: 'fire', label: 'bagus', emoji: '✦' },
  { key: 'thinking', label: 'mikir', emoji: '◇' },
  { key: 'star', label: 'bintang', emoji: '★' },
];

const LOCAL_KEY = (slug: string) => `bbs-reacted:${slug}`;

export function Reactions({
  slug,
  initialCounts,
}: {
  slug: string;
  initialCounts: ReactionCounts;
}) {
  const [counts, addOptimistic] = useOptimistic(
    initialCounts,
    (state, action: { emoji: keyof ReactionCounts; delta: number }) => ({
      ...state,
      [action.emoji]: Math.max(0, state[action.emoji] + action.delta),
    })
  );
  const [isPending, startTransition] = useTransition();
  const [myReactions, setMyReactions] = useState<Set<string>>(new Set());

  // Read local memory of "what user has already reacted" to highlight buttons
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LOCAL_KEY(slug));
      if (raw) setMyReactions(new Set(JSON.parse(raw)));
    } catch {
      // ignore
    }
  }, [slug]);

  const handle = (key: keyof ReactionCounts) => {
    if (isPending) return;
    const isActive = myReactions.has(key);
    const delta = isActive ? -1 : 1;

    startTransition(async () => {
      addOptimistic({ emoji: key, delta });

      const next = new Set(myReactions);
      if (isActive) next.delete(key);
      else next.add(key);
      setMyReactions(next);
      try {
        localStorage.setItem(LOCAL_KEY(slug), JSON.stringify([...next]));
      } catch {
        // ignore
      }

      const result = await toggleReaction(slug, key);
      if (!result.ok) {
        // Rollback on failure
        const revert = new Set(myReactions);
        setMyReactions(revert);
        try {
          localStorage.setItem(LOCAL_KEY(slug), JSON.stringify([...revert]));
        } catch {
          // ignore
        }
      }
    });
  };

  return (
    <div className="mt-12 flex flex-wrap items-center gap-2 border-t border-[var(--color-line)] pt-6">
      <span className="mr-1 font-mono text-[11.5px] text-[var(--color-ink-3)]">
        // reaksi
      </span>
      {EMOJIS.map((e) => {
        const active = myReactions.has(e.key);
        return (
          <button
            key={e.key}
            type="button"
            onClick={() => handle(e.key)}
            disabled={isPending}
            aria-label={`React with ${e.label}`}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12.5px] font-mono transition-all duration-200 disabled:cursor-wait ${
              active
                ? 'border-[color-mix(in_srgb,var(--color-accent)_40%,transparent)] bg-[var(--color-accent-soft)] text-[var(--color-accent)]'
                : 'border-[var(--color-line)] text-[var(--color-ink-3)] hover:border-[var(--color-line-2)] hover:text-[var(--color-ink)]'
            }`}
          >
            <span className="text-[14px] leading-none">{e.emoji}</span>
            <span>{counts[e.key]}</span>
          </button>
        );
      })}
    </div>
  );
}
