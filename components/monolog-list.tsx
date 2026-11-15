'use client';

import { useMemo, useState } from 'react';
import { MonologEpisodeCard } from '@/components/monolog-episode-card';
import { monologCategories } from '@/lib/monolog';
import type { MonologCategorySlug, PublishedMonologEpisode } from '@/types/monolog';

type CategoryFilter = 'all' | MonologCategorySlug;

export function MonologList({ episodes }: { episodes: PublishedMonologEpisode[] }) {
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('all');
  const filtered = useMemo(
    () => activeCategory === 'all'
      ? episodes
      : episodes.filter((episode) => episode.category === activeCategory),
    [activeCategory, episodes],
  );

  return (
    <section aria-labelledby="episode-list-title">
      <div className="mb-7 border-b border-[var(--color-line)] pb-5">
        <h2 id="episode-list-title" className="mb-4 text-lg font-medium tracking-tight text-[var(--color-ink)]">
          Episode
        </h2>
        <div aria-label="Filter kategori Monolog" className="flex flex-wrap gap-2" role="group">
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
              count={episodes.filter((episode) => episode.category === category.slug).length}
              label={category.label}
              onClick={() => setActiveCategory(category.slug)}
            />
          ))}
        </div>
      </div>

      {filtered.length > 0 ? (
        <div className="grid gap-5">
          {filtered.map((episode) => <MonologEpisodeCard key={episode.id} episode={episode} />)}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-[var(--color-line-2)] px-6 py-12 text-center">
          <p className="text-[15px] text-[var(--color-ink-2)]">
            {episodes.length === 0
              ? 'Belum ada Monolog yang diterbitkan.'
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
      className={`min-h-11 rounded-full border px-3.5 py-2 text-[12.5px] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)] ${active
        ? 'border-[color-mix(in_srgb,var(--color-accent)_40%,transparent)] bg-[var(--color-accent-soft)] text-[var(--color-accent)]'
        : 'border-[var(--color-line)] text-[var(--color-ink-3)] hover:border-[var(--color-line-2)] hover:text-[var(--color-ink)]'}`}
    >
      {label} <span className="ml-1 font-mono text-[10.5px] opacity-70">{count}</span>
    </button>
  );
}
