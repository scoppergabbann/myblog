import Link from 'next/link';
import { MonologAudioPlayer } from '@/components/monolog-audio-player';
import { formatAudioDuration, monologCategoryLabel } from '@/lib/monolog-shared';
import { formatDate } from '@/lib/utils';
import type { PublishedMonologEpisode } from '@/types/monolog';

export function MonologEpisodeCard({ episode }: { episode: PublishedMonologEpisode }) {
  return (
    <article className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-paper)] p-5 transition-colors hover:border-[var(--color-line-2)] sm:p-6">
      <div className="mb-3 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[11.5px] text-[var(--color-ink-4)]">
        <span className="rounded-full bg-[var(--color-accent-soft)] px-2.5 py-1 text-[var(--color-accent)]">
          {monologCategoryLabel(episode.category)}
        </span>
        <span aria-hidden="true">·</span>
        <time dateTime={episode.publishedAt}>{formatDate(episode.publishedAt)}</time>
        <span aria-hidden="true">·</span>
        <span>{formatAudioDuration(episode.durationSeconds)}</span>
      </div>

      <h2 className="text-[20px] font-medium leading-snug tracking-[-0.025em] text-[var(--color-ink)]">
        <Link href={`/monolog/${episode.slug}`} className="transition-colors hover:text-[var(--color-accent)]">
          {episode.title}
        </Link>
      </h2>
      <p className="mb-5 mt-2 text-[14px] leading-[1.75] text-[var(--color-ink-3)]">
        {episode.description}
      </p>

      <MonologAudioPlayer
        src={episode.audioUrl}
        title={episode.title}
        durationSeconds={episode.durationSeconds}
      />

      <Link
        href={`/monolog/${episode.slug}`}
        className="mt-4 inline-flex min-h-11 items-center text-[13px] text-[var(--color-ink-3)] transition-colors hover:text-[var(--color-accent)]"
      >
        Buka catatan episode <span aria-hidden="true" className="ml-1">→</span>
      </Link>
    </article>
  );
}
