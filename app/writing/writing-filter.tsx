'use client';

import { useState, useMemo } from 'react';
import { WritingItem } from '@/components/writing-item';
import type { Writing } from '@/types/content';

export function WritingFilter({
  writings,
  tags,
}: {
  writings: Writing[];
  tags: string[];
}) {
  const [activeTag, setActiveTag] = useState('all');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    return writings.filter((w) => {
      const tagOk = activeTag === 'all' || w.tags.includes(activeTag);
      const q = search.toLowerCase().trim();
      const searchOk =
        !q ||
        w.title.toLowerCase().includes(q) ||
        w.summary.toLowerCase().includes(q);
      return tagOk && searchOk;
    });
  }, [writings, activeTag, search]);

  return (
    <>
      <div className="mb-7 flex flex-wrap items-center gap-5 border-b border-[var(--color-line)] pb-4">
        <div className="relative min-w-[200px] flex-1">
          <svg
            className="pointer-events-none absolute left-2.5 top-1/2 h-[13px] w-[13px] -translate-y-1/2 text-[var(--color-ink-4)]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="text"
            placeholder="Cari tulisan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] py-2 pl-[30px] pr-3 text-[13.5px] text-[var(--color-ink)] transition-colors focus:border-[var(--color-accent)]"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {tags.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setActiveTag(t)}
              className={`rounded-full border px-2.5 py-1 font-mono text-xs transition-all duration-200 ${
                t === activeTag
                  ? 'border-[color-mix(in_srgb,var(--color-accent)_40%,transparent)] bg-[var(--color-accent-soft)] text-[var(--color-accent)]'
                  : 'border-[var(--color-line)] text-[var(--color-ink-3)] hover:border-[var(--color-line-2)] hover:text-[var(--color-ink)]'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col">
        {filtered.length === 0 ? (
          <p className="py-6 text-sm text-[var(--color-ink-3)]">
            Tidak ada tulisan yang cocok.
          </p>
        ) : (
          filtered.map((w) => <WritingItem key={w.slug} writing={w} showReadingTime />)
        )}
      </div>
    </>
  );
}
