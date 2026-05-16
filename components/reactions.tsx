'use client';

import { useOptimistic, useTransition, useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toggleReaction } from '@/app/writing/[slug]/reaction-actions';
import type { ReactionCounts } from '@/lib/queries';

type EmojiInfo = {
  key: keyof ReactionCounts;
  emoji: string;
  label: string;
  tooltip: string;
};

const EMOJIS: EmojiInfo[] = [
  { key: 'love',  emoji: '❤️',  label: 'love',  tooltip: 'menyentuh hati' },
  { key: 'fire',  emoji: '🔥', label: 'api',   tooltip: 'menggebu, gas terus!' },
  { key: 'wow',   emoji: '🤯', label: 'wow',   tooltip: 'pikiran meledak' },
  { key: 'lol',   emoji: '😂', label: 'lucu',  tooltip: 'bikin ketawa' },
  { key: 'brain', emoji: '🧠', label: 'mikir', tooltip: 'cerdas, butuh waktu mencerna' },
  { key: 'poop',  emoji: '💩', label: 'meh',   tooltip: 'honest dislike, gapapa' },
];

const LOCAL_KEY = (slug: string) => `bbs-reacted:${slug}`;

// Tiny ID for floating +1 elements
let floaterIdCounter = 0;

type Floater = {
  id: number;
  key: string;
};

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
  const [floaters, setFloaters] = useState<Floater[]>([]);
  const [wiggling, setWiggling] = useState<string | null>(null);
  const wiggleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();

  // Restore previous reactions from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LOCAL_KEY(slug));
      if (raw) setMyReactions(new Set(JSON.parse(raw)));
    } catch {
      // ignore
    }
  }, [slug]);

  const triggerFloater = (key: string) => {
    const id = ++floaterIdCounter;
    setFloaters((fs) => [...fs, { id, key }]);
    // Remove after animation completes
    setTimeout(() => {
      setFloaters((fs) => fs.filter((f) => f.id !== id));
    }, 900);
  };

  const triggerWiggle = (key: string) => {
    if (wiggleTimeoutRef.current) clearTimeout(wiggleTimeoutRef.current);
    setWiggling(key);
    wiggleTimeoutRef.current = setTimeout(() => setWiggling(null), 500);
  };

  const handle = (key: keyof ReactionCounts) => {
    if (isPending) return;
    const isActive = myReactions.has(key);
    const delta = isActive ? -1 : 1;

    // Visual feedback ASAP (don't wait for server)
    triggerWiggle(key);
    if (!isActive) triggerFloater(key);

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
      } else {
        // Refresh the route's RSC payload so `initialCounts` reflects the
        // server truth. Without this, useOptimistic would revert to the
        // (stale) initialCounts when the transition completes.
        router.refresh();
      }
    });
  };

  return (
    <div className="mt-12 border-t border-[var(--color-line)] pt-6">
      <div className="mb-3 flex items-baseline justify-between">
        <span className="font-mono text-[11.5px] text-[var(--color-ink-3)]">
          // bagaimana menurutmu?
        </span>
        <span className="font-mono text-[10.5px] text-[var(--color-ink-4)]">
          anonymous · klik untuk react
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {EMOJIS.map((e) => {
          const active = myReactions.has(e.key);
          const isWiggling = wiggling === e.key;
          const myFloaters = floaters.filter((f) => f.key === e.key);
          const count = counts[e.key];

          return (
            <button
              key={e.key}
              type="button"
              onClick={() => handle(e.key)}
              disabled={isPending}
              aria-label={`Reaksi ${e.label}: ${e.tooltip}`}
              aria-pressed={active}
              title={e.tooltip}
              className={`group relative inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[13px] transition-all duration-200 disabled:cursor-wait active:scale-95 ${
                active
                  ? 'border-[color-mix(in_srgb,var(--color-accent)_45%,transparent)] bg-[var(--color-accent-soft)]'
                  : 'border-[var(--color-line)] hover:border-[color-mix(in_srgb,var(--color-accent)_25%,transparent)] hover:bg-[var(--color-paper-2)]'
              }`}
            >
              <span
                className={`inline-block text-[16px] leading-none transition-transform duration-200 group-hover:scale-110 ${
                  isWiggling ? 'reaction-wiggle' : ''
                }`}
              >
                {e.emoji}
              </span>
              <span
                className={`min-w-[10px] font-mono text-[12px] tabular-nums transition-colors ${
                  active
                    ? 'font-medium text-[var(--color-accent)]'
                    : 'text-[var(--color-ink-3)]'
                }`}
              >
                {count}
              </span>

              {/* Floating +1 */}
              {myFloaters.map((f) => (
                <span
                  key={f.id}
                  aria-hidden="true"
                  className="reaction-floater pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 font-mono text-[11px] font-medium text-[var(--color-accent)]"
                >
                  +1
                </span>
              ))}
            </button>
          );
        })}
      </div>
    </div>
  );
}
