import type { Metadata } from 'next';
import { JsonLd } from '@/components/json-ld';
import { MonologList } from '@/components/monolog-list';
import { getPublishedMonologEpisodes } from '@/lib/monolog';
import { pageMetadata } from '@/lib/seo';
import { siteConfig } from '@/lib/site-config';

const description = 'Jurnal suara personal tentang proses berpikir, belajar, berefleksi, dan melatih cara berbicara.';

export const metadata: Metadata = pageMetadata('/monolog', 'Monolog', description);

export default function MonologPage() {
  const episodes = getPublishedMonologEpisodes();

  return (
    <div className="page-fade mx-auto max-w-[720px] px-6 pb-20 pt-16 max-sm:pt-10">
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: 'Monolog',
        description,
        url: `${siteConfig.url}/monolog`,
        inLanguage: 'id-ID',
        hasPart: episodes.map((episode) => ({
          '@type': 'AudioObject',
          name: episode.title,
          url: `${siteConfig.url}/monolog/${encodeURIComponent(episode.slug)}`,
        })),
      }} />

      <header className="mb-12 max-w-[650px]">
        <p className="mb-3 font-mono text-xs uppercase tracking-wide text-[var(--color-ink-4)]">
          jurnal suara personal
        </p>
        <h1 className="mb-5 text-[38px] font-medium tracking-[-0.04em] text-[var(--color-ink)] max-sm:text-[31px]">
          Monolog.
        </h1>
        <p className="max-w-[620px] text-[18px] leading-[1.7] tracking-[-0.01em] text-[var(--color-ink-2)] max-sm:text-[16.5px]">
          Tidak semua pikiran harus menjadi tulisan. Sebagian lebih mudah dipahami setelah diucapkan.
        </p>
        <p className="mt-5 max-w-[620px] text-[14.5px] leading-[1.8] text-[var(--color-ink-3)]">
          Ruang untuk menyimpan pikiran, pengetahuan, refleksi, dan perkembangan cara saya berbicara—direkam sederhana lewat Voice Memos, tanpa format podcast yang kaku.
        </p>
      </header>

      <MonologList episodes={episodes} />
    </div>
  );
}
