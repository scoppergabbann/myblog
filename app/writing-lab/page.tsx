import type { Metadata } from 'next';
import { getAllWritings } from '@/lib/posts';
import { WritingIndex } from '@/components/writing-index';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Writing Lab',
  description: 'Eksperimen tampilan halaman tulisan.',
  robots: { index: false, follow: false },
};

export default async function WritingLabPage() {
  const allWritings = await getAllWritings();
  const archiveWritings = allWritings.filter((writing) =>
    !writing.tags.some((tag) => tag.trim().toLowerCase() === 'saham')
  );
  const pageSize = 8;
  return (
    <WritingIndex
      allWritings={allWritings}
      paginated={archiveWritings.slice(0, pageSize)}
      page={1}
      totalPages={Math.max(1, Math.ceil(archiveWritings.length / pageSize))}
      totalItems={archiveWritings.length}
      pageSize={pageSize}
    />
  );
}
