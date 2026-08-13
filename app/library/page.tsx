import type { Metadata } from 'next';
import { getLibraryData } from '@/lib/library';
import { LibraryShelf } from './library-shelf';
import { formatDate } from '@/lib/utils';
import { siteConfig } from '@/lib/site-config';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Library',
  description: 'Koleksi hal-hal yang pernah saya baca, coba, dan kagumi.',
  openGraph: {
    title: `Library — ${siteConfig.shortName}`,
    description: 'Koleksi hal-hal yang pernah saya baca, coba, dan kagumi.',
    type: 'website',
    url: `${siteConfig.url}/library`,
  },
};

export default async function LibraryPage() {
  const data = await getLibraryData();
  return (
    <div className="page-fade mx-auto max-w-[1080px] px-6 py-14">
      <div className="mb-10 max-w-[560px]">
        <p className="mb-2 font-mono text-[11.5px] text-[var(--color-ink-3)]">~/library</p>
        <h1 className="mb-3 text-[36px] font-medium tracking-[-0.035em] text-[var(--color-ink)] max-sm:text-[28px]">
          Library
        </h1>
        <p className="text-[15.5px] leading-[1.65] text-[var(--color-ink-3)]">
          Kumpulan hal-hal yang pernah saya baca, teguk, dan kagumi.
        </p>
        <div className="mt-6 flex items-center gap-2 font-mono text-xs text-[var(--color-ink-3)]">
          <span className="dot-live h-[5px] w-[5px] rounded-full" />
          terakhir diperbarui {formatDate(data.updated, true)}
        </div>
      </div>
      <LibraryShelf data={data} />
    </div>
  );
}
