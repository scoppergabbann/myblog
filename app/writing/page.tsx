import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { WritingIndex } from '@/components/writing-index';
import { getAllWritings } from '@/lib/posts';
import { pageMetadata } from '@/lib/seo';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 8;

function pageNumber(value?: string) {
  const requested = Number(value ?? 1);
  return Number.isFinite(requested) && requested >= 1 ? Math.floor(requested) : 1;
}

export async function generateMetadata({ searchParams }: {
  searchParams: Promise<{ page?: string }>;
}): Promise<Metadata> {
  const page = pageNumber((await searchParams).page);
  return pageMetadata(
    page === 1 ? '/writing' : `/writing?page=${page}`,
    page === 1 ? 'Tulisan' : `Tulisan - Halaman ${page}`,
    'Catatan personal tentang hidup sehari-hari, hal yang dipelajari, dan cerita yang layak tinggal sedikit lebih lama.'
  );
}

export default async function WritingPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: rawPage } = await searchParams;
  const allWritings = await getAllWritings();
  const archiveWritings = allWritings.filter((writing) =>
    !writing.tags.some((tag) => tag.trim().toLowerCase() === 'saham')
  );
  const totalPages = Math.max(1, Math.ceil(archiveWritings.length / PAGE_SIZE));
  const page = pageNumber(rawPage);
  if (page > totalPages) notFound();

  const start = (page - 1) * PAGE_SIZE;
  const paginated = archiveWritings.slice(start, start + PAGE_SIZE);

  return (
    <WritingIndex
      allWritings={allWritings}
      paginated={paginated}
      page={page}
      totalPages={totalPages}
      totalItems={archiveWritings.length}
      pageSize={PAGE_SIZE}
    />
  );
}
