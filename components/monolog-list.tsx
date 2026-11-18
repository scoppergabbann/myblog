'use client';

import { useMemo, useState } from 'react';
import { MonologEpisodeCard } from '@/components/monolog-episode-card';
import { monologCategories } from '@/lib/monolog-shared';
import type { MonologCategorySlug, PublishedMonologEpisode } from '@/types/monolog';
import type { MonologReactionStates } from '@/lib/monolog-reactions';

type CategoryFilter = 'all' | MonologCategorySlug;

export function MonologList({
  episodes,
  reactionStatesBySlug,
}: {
  episodes: PublishedMonologEpisode[];
  reactionStatesBySlug: Record<string, MonologReactionStates>;
}) {
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('all');
  const [query, setQuery] = useState('');
  const categoryCounts = useMemo(() => new Map(
    monologCategories.map((category) => [
      category.slug,
      episodes.filter((episode) => episode.category === category.slug).length,
    ]),
  ), [episodes]);
  const filtered = useMemo(
    () => {
      const normalizedQuery = query.trim().toLocaleLowerCase('id-ID');
      return episodes.filter((episode) => {
        const matchesCategory = activeCategory === 'all' || episode.category === activeCategory;
        const matchesQuery = !normalizedQuery || [episode.title, episode.description, ...episode.tags]
          .some((value) => value.toLocaleLowerCase('id-ID').includes(normalizedQuery));
        return matchesCategory && matchesQuery;
      });
    },
    [activeCategory, episodes, query],
  );

  return (
    <section aria-labelledby="episode-list-title">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-ink-4)]">browse collection</p>
          <h2 id="episode-list-title" className="text-[26px] font-medium tracking-[-0.035em] text-[var(--color-ink)]">
            Perpustakaan audio
          </h2>
        </div>
        <label className="relative block w-full max-w-[330px]">
          <span className="sr-only">Cari judul, deskripsi, atau tag Monolog</span>
          <SearchIcon />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.currentTarget.value)}
            placeholder="Cari dalam koleksi…"
            className="h-11 w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-paper)] pl-10 pr-4 text-[13px] text-[var(--color-ink)] transition-colors placeholder:text-[var(--color-ink-4)] focus:border-[var(--color-accent)]"
          />
        </label>
      </div>

      <div className="scrollbar-none mb-7 overflow-x-auto border-b border-[var(--color-line)]">
        <div aria-label="Filter kategori Monolog" className="flex min-w-max gap-7" role="group">
          <CategoryButton
            active={activeCategory === 'all'}
            count={episodes.length}
            label="Semua"
            onClick={() => setActiveCategory('all')}
          />
          {monologCategories.map((category) => (
            <CategoryButton
              key={category.slug}
              active={activeCategory === category.slug}
              count={categoryCounts.get(category.slug) ?? 0}
              label={category.label}
              onClick={() => setActiveCategory(category.slug)}
            />
          ))}
        </div>
      </div>

      <div className="mb-2 flex items-center justify-between gap-4 font-mono text-[10.5px] text-[var(--color-ink-4)]">
        <span>{filtered.length} {filtered.length === 1 ? 'rekaman' : 'rekaman ditemukan'}</span>
        <span>terbaru lebih dulu</span>
      </div>

      {filtered.length > 0 ? (
        <div className="divide-y divide-[var(--color-line)]">
          {filtered.map((episode, index) => (
            <MonologEpisodeCard
              key={episode.id}
              episode={episode}
              index={index}
              reactionStates={reactionStatesBySlug[episode.slug]}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-[var(--color-line-2)] px-6 py-12 text-center">
          <p className="text-[15px] text-[var(--color-ink-2)]">
            {episodes.length === 0
              ? 'Belum ada Monolog yang diterbitkan.'
              : query.trim()
                ? 'Tidak ada rekaman yang cocok dengan pencarian ini.'
                : 'Belum ada episode dalam kategori ini.'}
          </p>
          <p className="mt-2 text-[13.5px] leading-relaxed text-[var(--color-ink-4)]">
            Rekaman pertama akan muncul di sini setelah selesai disiapkan.
          </p>
        </div>
      )}
    </section>
  );
}

function CategoryButton({
  active,
  count,
  label,
  onClick,
}: {
  active: boolean;
  count: number;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`relative min-h-11 border-b-2 px-0.5 pb-3 pt-2 text-[12px] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)] ${active
        ? 'border-[var(--color-accent)] text-[var(--color-ink)]'
        : 'border-transparent text-[var(--color-ink-4)] hover:text-[var(--color-ink)]'}`}
    >
      {label} <span className="ml-1 font-mono text-[10.5px] opacity-70">{count}</span>
    </button>
  );
}

function SearchIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-ink-4)]">
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" strokeLinecap="round" />
    </svg>
  );
}
