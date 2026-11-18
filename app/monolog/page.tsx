import type { Metadata } from 'next';
import { JsonLd } from '@/components/json-ld';
import { MonologList } from '@/components/monolog-list';
import { getPublishedMonologEpisodes } from '@/lib/monolog';
import { pageMetadata } from '@/lib/seo';
import { siteConfig } from '@/lib/site-config';

const description = 'Jurnal suara personal tentang proses berpikir, belajar, berefleksi, dan melatih cara berbicara.';

export const metadata: Metadata = pageMetadata('/monolog', 'Monolog', description);
export const dynamic = 'force-dynamic';

export default async function MonologPage() {
  const episodes = await getPublishedMonologEpisodes();
  const totalDuration = episodes.reduce((total, episode) => total + episode.durationSeconds, 0);
  const categoryCount = new Set(episodes.map((episode) => episode.category)).size;

  return (
    <div className="page-fade mx-auto max-w-[1040px] px-6 pb-24 pt-12 max-sm:pt-7">
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

      <header className="monolog-library-hero relative mb-12 overflow-hidden rounded-[28px] px-7 py-8 sm:px-10 sm:py-10">
        <div className="monolog-library-orbit" aria-hidden="true" />
        <div className="relative z-10 max-w-[650px]">
          <p className="mb-5 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--monolog-hero-muted)]">
            <span className="h-px w-7 bg-current" /> bbs/ audio library
          </p>
          <h1 className="max-w-[560px] text-[42px] font-medium leading-[1.06] tracking-[-0.045em] text-[var(--monolog-hero-text)] max-sm:text-[34px]">
            Koleksi suara untuk pikiran yang perlu didengar.
          </h1>
          <p className="mt-5 max-w-[580px] text-[15.5px] leading-[1.8] text-[var(--monolog-hero-muted)]">
            Catatan suara personal tentang proses berpikir, belajar, berefleksi, dan melatih cara berbicara—direkam apa adanya.
          </p>
          <dl className="mt-8 flex flex-wrap gap-x-8 gap-y-4 border-t border-white/10 pt-5">
            <LibraryStat label="rekaman" value={String(episodes.length).padStart(2, '0')} />
            <LibraryStat label="durasi koleksi" value={formatLibraryDuration(totalDuration)} />
            <LibraryStat label="rak kategori" value={String(categoryCount).padStart(2, '0')} />
          </dl>
        </div>
      </header>

      <MonologList episodes={episodes} />
    </div>
  );
}

function LibraryStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-mono text-[9px] uppercase tracking-[0.16em] text-[var(--monolog-hero-muted)]">{label}</dt>
      <dd className="mt-1 text-[15px] font-medium text-[var(--monolog-hero-text)]">{value}</dd>
    </div>
  );
}

function formatLibraryDuration(seconds: number): string {
  const minutes = Math.ceil(seconds / 60);
  if (minutes < 60) return `${minutes} menit`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder ? `${hours}j ${remainder}m` : `${hours} jam`;
}
