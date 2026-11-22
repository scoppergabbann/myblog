'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { formatDate } from '@/lib/utils';
import type { Writing } from '@/types/content';

export function WritingLab({ writings }: { writings: Writing[] }) {
  const [activeTag, setActiveTag] = useState('all');
  const [search, setSearch] = useState('');
  const tags = useMemo(() => [
    'all',
    ...new Set(writings.flatMap((writing) => writing.tags)),
  ].sort((left, right) => left === 'all' ? -1 : right === 'all' ? 1 : left.localeCompare(right)), [writings]);

  const query = search.trim().toLowerCase();
  const isFiltering = activeTag !== 'all' || query.length > 0;
  const filtered = useMemo(() => writings.filter((writing) => {
    const matchesTag = activeTag === 'all' || writing.tags.includes(activeTag);
    const matchesQuery = !query
      || writing.title.toLowerCase().includes(query)
      || writing.summary.toLowerCase().includes(query)
      || writing.tags.some((tag) => tag.toLowerCase().includes(query));
    return matchesTag && matchesQuery;
  }), [activeTag, query, writings]);

  const featured = !isFiltering ? filtered[0] : null;
  const collection = featured ? filtered.slice(1) : filtered;

  function resetFilters() {
    setActiveTag('all');
    setSearch('');
  }

  return (
    <main className="page-fade mx-auto max-w-[1120px] px-6 pb-24 pt-16 max-sm:pt-10">
      <header className="grid gap-10 border-y border-[var(--color-line)] py-12 lg:grid-cols-[minmax(0,1fr)_250px] lg:items-end max-sm:py-9">
        <div>
          <p className="mb-5 font-mono text-[12px] uppercase tracking-[0.22em] text-[var(--color-accent)]">
            BBS / catatan &amp; cerita
          </p>
          <h1 className="max-w-[780px] text-[clamp(3rem,7vw,6.4rem)] font-medium leading-[0.9] tracking-[-0.065em] text-[var(--color-ink)]">
            Tulisan untuk dibaca <span className="text-[var(--color-accent)]">pelan-pelan.</span>
          </h1>
        </div>
        <div className="border-l border-[var(--color-line)] pl-6 max-lg:border-l-0 max-lg:border-t max-lg:pl-0 max-lg:pt-6">
          <p className="text-[16px] leading-7 text-[var(--color-ink-3)]">
            Catatan personal tentang hidup sehari-hari, hal yang dipelajari, dan cerita yang layak tinggal sedikit lebih lama.
          </p>
          <p className="mt-6 font-mono text-[12px] uppercase tracking-[0.16em] text-[var(--color-ink-4)]">
            {String(writings.length).padStart(2, '0')} artikel · terus bertumbuh
          </p>
        </div>
      </header>

      {featured && <FeaturedWriting writing={featured} />}

      <section className="mt-14" aria-labelledby="writing-collection-title">
        <div className="mb-7 flex items-end justify-between gap-6 max-md:items-start max-md:flex-col">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--color-accent)]">
              Jelajahi arsip
            </p>
            <h2 id="writing-collection-title" className="mt-2 text-[32px] font-medium tracking-[-0.035em] text-[var(--color-ink)]">
              {isFiltering ? `${filtered.length} hasil ditemukan` : 'Tulisan lainnya'}
            </h2>
          </div>
          {isFiltering && (
            <button type="button" onClick={resetFilters} className="text-[13px] text-[var(--color-accent)] hover:text-[var(--color-ink)]">
              Bersihkan pencarian
            </button>
          )}
        </div>

        <div className="mb-8 grid gap-4 border-y border-[var(--color-line)] py-5 lg:grid-cols-[minmax(260px,0.7fr)_1.3fr] lg:items-start">
          <label className="relative block">
            <span className="sr-only">Cari tulisan</span>
            <svg aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-ink-4)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-4-4" />
            </svg>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.currentTarget.value)}
              placeholder="Cari judul, cerita, atau topik..."
              className="min-h-12 w-full rounded-full border border-[var(--color-line)] bg-[var(--color-paper)] pl-11 pr-5 text-[14px] text-[var(--color-ink)] outline-none transition-colors focus:border-[var(--color-accent)]"
            />
          </label>
          <div className="flex flex-wrap gap-2" aria-label="Filter topik">
            {tags.map((tag) => (
              <button
                key={tag}
                type="button"
                aria-pressed={tag === activeTag}
                onClick={() => setActiveTag(tag)}
                className={`min-h-10 rounded-full border px-4 font-mono text-[12px] transition-colors ${tag === activeTag
                  ? 'border-[var(--color-accent)] bg-[var(--color-accent)] text-white'
                  : 'border-[var(--color-line)] text-[var(--color-ink-3)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]'
                }`}
              >
                {tag === 'all' ? 'semua' : tag}
              </button>
            ))}
          </div>
        </div>

        {collection.length > 0 ? (
          <div className="grid grid-cols-2 border-l border-t border-[var(--color-line)] max-md:grid-cols-1">
            {collection.map((writing, index) => (
              <WritingCard key={writing.slug} writing={writing} index={featured ? index + 2 : index + 1} />
            ))}
          </div>
        ) : (
          <div className="border-y border-[var(--color-line)] py-16 text-center">
            <p className="text-[18px] text-[var(--color-ink)]">Belum ada tulisan yang cocok.</p>
            <button type="button" onClick={resetFilters} className="mt-3 text-[13px] text-[var(--color-accent)] hover:text-[var(--color-ink)]">
              Lihat semua tulisan
            </button>
          </div>
        )}
      </section>
    </main>
  );
}

function FeaturedWriting({ writing }: { writing: Writing }) {
  return (
    <section className="mt-8 overflow-hidden rounded-[28px] border border-[var(--color-line)] bg-[var(--color-ink)] text-[var(--color-paper)]">
      <Link href={`/writing/${writing.slug}`} className="group grid min-h-[410px] lg:grid-cols-[1.45fr_0.55fr]">
        <div className="flex flex-col justify-between p-10 max-sm:p-7">
          <div className="flex flex-wrap items-center gap-3 font-mono text-[11px] uppercase tracking-[0.16em] text-[color-mix(in_srgb,var(--color-paper)_65%,transparent)]">
            <span className="rounded-full border border-[color-mix(in_srgb,var(--color-paper)_25%,transparent)] px-3 py-1.5">Pilihan terbaru</span>
            <span>{formatDate(writing.date)}</span>
            <span>{writing.readingTime}</span>
          </div>
          <div className="mt-16 max-w-[720px]">
            <h2 className="text-[clamp(2.2rem,5vw,4.7rem)] font-medium leading-[0.98] tracking-[-0.055em] transition-colors group-hover:text-[var(--color-accent)]">
              {writing.title}
            </h2>
            <p className="mt-6 max-w-[650px] text-[16px] leading-7 text-[color-mix(in_srgb,var(--color-paper)_70%,transparent)]">
              {writing.summary}
            </p>
          </div>
        </div>
        <div className="relative min-h-[230px] overflow-hidden border-l border-[color-mix(in_srgb,var(--color-paper)_18%,transparent)] max-lg:border-l-0 max-lg:border-t">
          <div className="absolute -right-24 -top-24 h-[370px] w-[370px] rounded-full border border-[color-mix(in_srgb,var(--color-accent)_75%,transparent)]" />
          <div className="absolute -right-3 top-14 h-[230px] w-[230px] rounded-full border border-[color-mix(in_srgb,var(--color-accent)_60%,transparent)]" />
          <div className="absolute right-[74px] top-[133px] h-20 w-20 rounded-full bg-[var(--color-accent)] transition-transform duration-500 group-hover:scale-125" />
          <p className="absolute bottom-8 left-8 font-mono text-[11px] uppercase tracking-[0.2em] text-[color-mix(in_srgb,var(--color-paper)_55%,transparent)]">
            buka tulisan
          </p>
        </div>
      </Link>
    </section>
  );
}

function WritingCard({ writing, index }: { writing: Writing; index: number }) {
  return (
    <article className="border-b border-r border-[var(--color-line)]">
      <Link href={`/writing/${writing.slug}`} className="group flex h-full min-h-[290px] flex-col justify-between p-7 transition-colors hover:bg-[var(--color-paper-2)] sm:p-8">
        <div>
          <div className="flex items-center justify-between gap-4 font-mono text-[11px] uppercase tracking-[0.13em] text-[var(--color-ink-4)]">
            <span>{String(index).padStart(2, '0')}</span>
            <span>{formatDate(writing.date)}</span>
          </div>
          <h3 className="mt-9 max-w-[460px] text-[27px] font-medium leading-[1.08] tracking-[-0.035em] text-[var(--color-ink)] transition-colors group-hover:text-[var(--color-accent)]">
            {writing.title}
          </h3>
          <p className="mt-4 line-clamp-3 text-[14px] leading-6 text-[var(--color-ink-3)]">
            {writing.summary}
          </p>
        </div>
        <div className="mt-8 flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-wrap gap-1.5">
            {writing.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="rounded-full border border-[var(--color-line)] px-2.5 py-1 font-mono text-[10px] text-[var(--color-ink-4)]">
                {tag}
              </span>
            ))}
          </div>
          <span className="font-mono text-[11px] text-[var(--color-ink-4)]">{writing.readingTime}</span>
        </div>
      </Link>
    </article>
  );
}
