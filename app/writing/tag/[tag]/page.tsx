import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { WritingCard, WritingPagination } from '@/components/writing-index';
import { getAllWritings } from '@/lib/posts';
import { pageMetadata } from '@/lib/seo';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 6;

function pageNumber(value?: string) {
  const requested = Number(value ?? 1);
  return Number.isFinite(requested) && requested >= 1 ? Math.floor(requested) : 1;
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ tag: string }>;
  searchParams: Promise<{ page?: string }>;
}): Promise<Metadata> {
  const { tag } = await params;
  const page = pageNumber((await searchParams).page);
  const decoded = decodeURIComponent(tag).toLowerCase();
  return pageMetadata(
    page === 1
      ? `/writing/tag/${encodeURIComponent(decoded)}`
      : `/writing/tag/${encodeURIComponent(decoded)}?page=${page}`,
    page === 1 ? `#${decoded}` : `#${decoded} - Halaman ${page}`,
    `Tulisan dengan tag #${decoded}.`
  );
}

export default async function TagPage({
  params,
  searchParams,
}: {
  params: Promise<{ tag: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { tag: rawTag } = await params;
  const { page: rawPage } = await searchParams;
  const tag = decodeURIComponent(rawTag).toLowerCase();
  const all = await getAllWritings();
  const filtered = all.filter((writing) =>
    writing.tags.some((item) => item.toLowerCase() === tag)
  );
  if (filtered.length === 0) notFound();

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const page = pageNumber(rawPage);
  if (page > totalPages) notFound();
  const start = (page - 1) * PAGE_SIZE;
  const paginated = filtered.slice(start, start + PAGE_SIZE);
  const basePath = `/writing/tag/${encodeURIComponent(tag)}`;

  return (
    <main className="page-fade mx-auto max-w-[1120px] px-6 pb-24 pt-16 max-sm:pt-10">
      <Link href="/writing" className="text-[13px] text-[var(--color-ink-3)] transition-colors hover:text-[var(--color-accent)]">
        Semua tulisan
      </Link>
      <header className="mt-8 grid gap-8 border-y border-[var(--color-line)] py-10 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--color-accent)]">Rak topik</p>
          <h1 className="mt-3 text-[clamp(3rem,7vw,6rem)] font-medium leading-none tracking-[-0.06em] text-[var(--color-ink)]">
            #{tag}
          </h1>
        </div>
        <p className="font-mono text-[12px] uppercase tracking-[0.15em] text-[var(--color-ink-4)]">
          {filtered.length} tulisan · halaman {page}/{totalPages}
        </p>
      </header>

      <div className="mt-10 grid grid-cols-2 border-l border-t border-[var(--color-line)] max-md:grid-cols-1">
        {paginated.map((writing, index) => (
          <WritingCard key={writing.slug} writing={writing} index={start + index + 1} />
        ))}
      </div>

      {totalPages > 1 && (
        <WritingPagination
          page={page}
          totalPages={totalPages}
          totalItems={filtered.length}
          pageSize={PAGE_SIZE}
          basePath={basePath}
        />
      )}
    </main>
  );
}
