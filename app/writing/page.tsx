import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getAllWritings, getAllTags } from '@/lib/posts';
import { WritingFilter } from './writing-filter';

export const metadata: Metadata = {
  title: 'Tulisan',
  description:
    'Catatan tentang engineering, menulis, investasi pelan-pelan, dan internet personal.',
};

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 6;

export default async function WritingPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const sp = await searchParams;
  const allWritings = await getAllWritings();
  const tags = ['all', ...(await getAllTags())];

const visibleWritingsCount = allWritings.filter((post) => {
  const postTags = post.tags ?? [];
  return !postTags.some((tag) => ['investasi', 'saham'].includes(tag));
}).length;

  const totalPages = Math.max(1, Math.ceil(allWritings.length / PAGE_SIZE));
  const requested = Number(sp.page ?? 1);
  const page = Number.isFinite(requested) && requested >= 1 ? Math.floor(requested) : 1;

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
            Kebun kecil berisi catatan, cerita, pengalaman, dan hal-hal yang saya temui pelan-pelan. {allWritings.length} artikel, ditulis ketika
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
