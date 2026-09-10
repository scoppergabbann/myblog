import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';
import { notFound } from 'next/navigation';
import { getAllWritings } from '@/lib/posts';
import { WritingFilter } from './writing-filter';

function pageNumber(value?: string) {
  const requested = Number(value ?? 1);
  return Number.isFinite(requested) && requested >= 1 ? Math.floor(requested) : 1;
}

export async function generateMetadata({ searchParams }: {
  searchParams: Promise<{ page?: string }>;
}): Promise<Metadata> {
  const page = pageNumber((await searchParams).page);
  return pageMetadata(page === 1 ? '/writing' : `/writing?page=${page}`,
    page === 1 ? 'Tulisan' : `Tulisan - Halaman ${page}`,
    'Catatan tentang engineering, menulis, investasi pelan-pelan, dan internet personal.');
}

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 6;

export default async function WritingPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const sp = await searchParams;
  const allWritings = await getAllWritings();
  const tags = ['all', ...new Set(allWritings.flatMap((post) => post.tags))].sort((a, b) =>
    a === 'all' ? -1 : b === 'all' ? 1 : a.localeCompare(b)
  );

const visibleWritingsCount = allWritings.filter((post) => {
  const postTags = post.tags ?? [];
  return !postTags.some((tag) => ['investasi', 'saham'].includes(tag));
}).length;

  const totalPages = Math.max(1, Math.ceil(allWritings.length / PAGE_SIZE));
  const page = pageNumber(sp.page);

  // Out-of-range page → 404
  if (page > totalPages) notFound();

  const start = (page - 1) * PAGE_SIZE;
  const paginated = allWritings.slice(start, start + PAGE_SIZE);

  return (
    <div className="page-fade mx-auto max-w-[680px] px-6">
      <div className="py-20 pb-10">
        <div className="mb-10">
          <h1 className="mb-2 text-[36px] font-medium tracking-[-0.035em] text-[var(--color-ink)] max-sm:text-[28px]">
            Tulisan
          </h1>
          <p className="text-[15.5px] text-[var(--color-ink-3)]">
            Kebun kecil berisi catatan, cerita, pengalaman, dan hal-hal yang saya temui pelan-pelan. {visibleWritingsCount} artikel, ditulis ketika
            senggang.
          </p>
        </div>

        <WritingFilter
          paginated={paginated}
          allWritings={allWritings}
          tags={tags}
          page={page}
          totalPages={totalPages}
          pageSize={PAGE_SIZE}
        />
      </div>
    </div>
  );
}
