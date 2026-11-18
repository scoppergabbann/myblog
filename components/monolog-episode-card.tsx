import Link from 'next/link';
import { MonologAudioPlayer } from '@/components/monolog-audio-player';
import { formatAudioDuration, monologCategoryLabel } from '@/lib/monolog-shared';
import { formatDate } from '@/lib/utils';
import type { PublishedMonologEpisode } from '@/types/monolog';

export function MonologEpisodeCard({ episode, index }: { episode: PublishedMonologEpisode; index: number }) {
  return (
    <article className="group py-7 first:pt-5">
      <div className="grid grid-cols-[76px_minmax(0,1fr)] gap-4 sm:grid-cols-[108px_minmax(0,1fr)] sm:gap-6">
        <Link href={`/monolog/${episode.slug}`} aria-label={`Buka ${episode.title}`} className="monolog-cover relative aspect-square overflow-hidden rounded-2xl">
          <span className="absolute left-3 top-2.5 z-10 font-mono text-[9px] tracking-[0.12em] text-white/55">
            {String(index + 1).padStart(2, '0')}
          </span>
          <span className="monolog-cover-disc" aria-hidden="true" />
          <span className="absolute bottom-2.5 left-3 z-10 font-mono text-[9px] uppercase tracking-[0.15em] text-white/75">
            {categoryCode(episode.category)}
          </span>
        </Link>

        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[10.5px] text-[var(--color-ink-4)]">
            <span className="uppercase tracking-[0.08em] text-[var(--color-accent)]">{monologCategoryLabel(episode.category)}</span>
            <span aria-hidden="true">·</span>
            <time dateTime={episode.publishedAt}>{formatDate(episode.publishedAt)}</time>
            <span aria-hidden="true">·</span>
            <span>{formatAudioDuration(episode.durationSeconds)}</span>
          </div>
          <div className="flex items-start justify-between gap-4">
            <h3 className="text-[20px] font-medium leading-snug tracking-[-0.03em] text-[var(--color-ink)] sm:text-[22px]">
              <Link href={`/monolog/${episode.slug}`} className="transition-colors group-hover:text-[var(--color-accent)]">
                {episode.title}
              </Link>
            </h3>
            <Link href={`/monolog/${episode.slug}`} aria-label={`Buka catatan ${episode.title}`} className="mt-0.5 hidden h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--color-line)] text-[var(--color-ink-4)] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] sm:inline-flex">
              <span aria-hidden="true">↗</span>
            </Link>
          </div>
          <p className="mt-2 line-clamp-2 text-[13.5px] leading-[1.7] text-[var(--color-ink-3)]">
            {episode.description}
          </p>
        </div>
      </div>

      <div className="mt-5 sm:ml-[132px]">
        <MonologAudioPlayer
          src={episode.audioUrl}
          title={episode.title}
          durationSeconds={episode.durationSeconds}
          variant="compact"
        />
      </div>
    </article>
  );
}

function categoryCode(category: PublishedMonologEpisode['category']): string {
  return ({
    'menuju-nikah': 'MN',
    karier: 'KR',
    olahraga: 'OL',
    hobi: 'HB',
    random: 'RD',
  })[category];
}
