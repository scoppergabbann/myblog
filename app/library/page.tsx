import type { Metadata } from 'next';
import { getLibraryData } from '@/lib/library';
import { LibraryShelf } from './library-shelf';
import { siteConfig } from '@/lib/site-config';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Library',
  description:
    'Koleksi buku yang pernah saya baca, minuman favorit, mobil klasik, dan motor kesukaan.',
  openGraph: {
    title: `Library — ${siteConfig.shortName}`,
    description:
      'Koleksi buku yang pernah saya baca, minuman favorit, mobil klasik, dan motor kesukaan.',
    type: 'website',
    url: `${siteConfig.url}/library`,
  },
};

export default async function LibraryPage() {
  const data = await getLibraryData();

  const tabs = [
    { id: 'books', label: 'Buku', emoji: '📚', count: data.books.length },
    { id: 'drinks', label: 'Minuman', emoji: '☕', count: data.drinks.length },
    { id: 'cars', label: 'Mobil Klasik', emoji: '🚗', count: data.cars.length },
    { id: 'motorcycles', label: 'Motor', emoji: '🏍️', count: data.motorcycles.length },
  ];

  return (
    <div className="page-fade mx-auto max-w-[1080px] px-6 py-14">
      {/* Header */}
      <div className="mb-10 max-w-[560px]">
        <p className="mb-2 font-mono text-[11.5px] text-[var(--color-ink-3)]">
          ~/library
        </p>
        <h1 className="mb-3 text-[36px] font-medium tracking-[-0.035em] text-[var(--color-ink)] max-sm:text-[28px]">
          Library
        </h1>
        <p className="text-[15.5px] leading-[1.65] text-[var(--color-ink-3)]">
          Kumpulan hal-hal yang pernah saya baca, teguk, dan kagumi — buku,
          minuman, mobil klasik, sampai motor kesukaan.
        </p>
      </div>

      <LibraryShelf data={data} tabs={tabs} />
    </div>
  );
}
