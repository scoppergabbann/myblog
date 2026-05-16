'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { WritingItem } from '@/components/writing-item';
import type { Writing } from '@/types/content';

export function WritingFilter({
  paginated,
  allWritings,
  tags,
  page,
  totalPages,
  pageSize,
}: {
  paginated: Writing[];
  allWritings: Writing[];
  tags: string[];
  page: number;
  totalPages: number;
  pageSize: number;
}) {
  const [activeTag, setActiveTag] = useState('all');
  const [search, setSearch] = useState('');

  const isFiltering = search.trim() !== '' || activeTag !== 'all';

  const filtered = useMemo(() => {
    if (!isFiltering) return paginated;
    return allWritings.filter((w) => {
      const tagOk = activeTag === 'all' || w.tags.includes(activeTag);
      const q = search.toLowerCase().trim();
      const searchOk =
        !q ||
        w.title.toLowerCase().includes(q) ||
        w.summary.toLowerCase().includes(q) ||
        w.tags.some((t) => t.toLowerCase().includes(q));
      return tagOk && searchOk;
    });
  }, [paginated, allWritings, activeTag, search, isFiltering]);

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

      {isFiltering && (
        <p className="mb-2 font-mono text-[11.5px] text-[var(--color-ink-4)]">
          {filtered.length} hasil dari {allWritings.length}{' '}
          <span>
            ·{' '}
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setActiveTag('all');
              }}
              className="text-[var(--color-ink-3)] underline-offset-2 transition-colors hover:text-[var(--color-accent)] hover:underline"
            >
              reset filter
            </button>
          </span>
        </p>
      )}

      <div className="flex flex-col">
        {filtered.length === 0 ? (
          <p className="py-6 text-sm text-[var(--color-ink-3)]">
            Tidak ada tulisan yang cocok.
          </p>
        ) : (
          filtered.map((w) => <WritingItem key={w.slug} writing={w} showReadingTime />)
        )}
      </div>

      {!isFiltering && totalPages > 1 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={allWritings.length}
        />
      )}
    </>
  );
}

function Pagination({
  page,
  totalPages,
  pageSize,
  totalItems,
}: {
  page: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
}) {
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);

  const pageNumbers = getPageNumbers(page, totalPages);

  return (
    <nav
      aria-label="Pagination"
      className="mt-10 flex items-center justify-between gap-3 border-t border-[var(--color-line)] pt-5 max-sm:flex-col"
    >
      <p className="font-mono text-[11.5px] text-[var(--color-ink-4)]">
        {start}–{end} dari {totalItems}
      </p>

      <div className="flex items-center gap-1">
        <PageLink
          href={page > 1 ? hrefFor(page - 1) : null}
          ariaLabel="Previous page"
        >
          ← prev
        </PageLink>

        {pageNumbers.map((n, idx) =>
          n === 'ellipsis' ? (
            <span
              key={`e-${idx}`}
              className="px-2 font-mono text-[12px] text-[var(--color-ink-4)]"
            >
              …
            </span>
          ) : (
            <PageLink
              key={n}
              href={hrefFor(n)}
              ariaLabel={`Go to page ${n}`}
              ariaCurrent={n === page}
              active={n === page}
            >
              {n}
            </PageLink>
          )
        )}

        <PageLink
          href={page < totalPages ? hrefFor(page + 1) : null}
          ariaLabel="Next page"
        >
          next →
        </PageLink>
      </div>
    </nav>
  );
}

function hrefFor(page: number): string {
  return page === 1 ? '/writing' : `/writing?page=${page}`;
}

function PageLink({
  href,
  children,
  ariaLabel,
  ariaCurrent,
  active,
}: {
  href: string | null;
  children: React.ReactNode;
  ariaLabel: string;
  ariaCurrent?: boolean;
  active?: boolean;
}) {
  const className = `inline-flex h-7 min-w-[28px] items-center justify-center rounded-md border px-2 font-mono text-[12px] transition-all duration-200 ${
    active
      ? 'border-[color-mix(in_srgb,var(--color-accent)_40%,transparent)] bg-[var(--color-accent-soft)] text-[var(--color-accent)]'
      : href === null
        ? 'cursor-not-allowed border-transparent text-[var(--color-ink-4)] opacity-40'
        : 'border-[var(--color-line)] text-[var(--color-ink-3)] hover:border-[color-mix(in_srgb,var(--color-accent)_30%,transparent)] hover:text-[var(--color-accent)]'
  }`;

  if (href === null) {
    return (
      <span aria-label={ariaLabel} aria-disabled="true" className={className}>
        {children}
      </span>
    );
  }

  return (
    <Link
      href={href}
      aria-label={ariaLabel}
      aria-current={ariaCurrent ? 'page' : undefined}
      className={className}
    >
      {children}
    </Link>
  );
}

/**
 * Compute page numbers to show. Examples (current page = 5, total = 10):
 *   [1, 'ellipsis', 4, 5, 6, 'ellipsis', 10]
 * For small totals (<= 7), show all.
 */
function getPageNumbers(
  current: number,
  total: number
): (number | 'ellipsis')[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | 'ellipsis')[] = [1];
  const leftBound = Math.max(2, current - 1);
  const rightBound = Math.min(total - 1, current + 1);

  if (leftBound > 2) pages.push('ellipsis');
  for (let i = leftBound; i <= rightBound; i++) pages.push(i);
  if (rightBound < total - 1) pages.push('ellipsis');
  pages.push(total);

  return pages;
}
