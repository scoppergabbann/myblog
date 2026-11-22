import type { Metadata } from 'next';
import { getAllWritings } from '@/lib/posts';
import { WritingLab } from './writing-lab';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Writing Lab',
  description: 'Eksperimen tampilan halaman tulisan.',
  robots: { index: false, follow: false },
};

export default async function WritingLabPage() {
  const allWritings = await getAllWritings();
  const writings = allWritings.filter((post) =>
    !post.tags.some((tag) => ['investasi', 'saham'].includes(tag.trim().toLowerCase()))
  );

  return <WritingLab writings={writings} />;
}
