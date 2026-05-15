import type { Metadata } from 'next';
import { getAllWritings, getAllTags } from '@/lib/posts';
import { WritingFilter } from './writing-filter';

export const metadata: Metadata = {
  title: 'Tulisan',
  description:
    'Catatan tentang engineering, menulis, investasi pelan-pelan, dan internet personal.',
};

// Revalidate every 60 seconds (ISR). Edits in admin show up within 1 minute.
export const revalidate = 60;

export default async function WritingPage() {
  const writings = await getAllWritings();
  const tags = ['all', ...(await getAllTags())];

  return (
    <div className="page-fade mx-auto max-w-[680px] px-6">
      <div className="py-20 pb-10">
        <div className="mb-10">
          <h1 className="mb-2 text-[36px] font-medium tracking-[-0.035em] text-[var(--color-ink)] max-sm:text-[28px]">
            Tulisan
          </h1>
          <p className="text-[15.5px] text-[var(--color-ink-3)]">
            Catatan tentang engineering, menulis, investasi pelan-pelan, dan
            internet personal. {writings.length} artikel, ditulis ketika
            senggang.
          </p>
        </div>

        <WritingFilter writings={writings} tags={tags} />
      </div>
    </div>
  );
}
