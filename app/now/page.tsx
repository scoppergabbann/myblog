import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';
import { getStreamEntries } from '@/lib/stream-queries';
import { formatDate } from '@/lib/utils';
import { streamCategories, safeStreamUrl } from '@/lib/now-stream';
import { StreamIcon } from '@/components/stream-icon';
import { StreamBody } from '@/components/stream-body';
import { getNowData } from '@/lib/content-queries';
import { SpotifyEmbed } from '@/components/spotify-embed';

export const metadata: Metadata = {
  ...pageMetadata('/now', 'Stream', 'Catatan tentang proyek, pembaruan, eksperimen, dan keseharian.'),
  alternates: { canonical: '/now', types: { 'application/rss+xml': '/now/rss.xml' } },
};
export const revalidate = 60;
export default async function NowPage() {
  const [entries, now] = await Promise.all([getStreamEntries(), getNowData()]);
  return (
    <div className="page-fade mx-auto max-w-[760px] px-6 pb-20 pt-16 max-sm:pt-10">
      <header className="mb-9 pl-10 max-sm:pl-8">
        <h1 className="mb-5 text-[32px] font-semibold tracking-[-0.035em] text-[var(--color-ink)]">Stream</h1>
        <p className="text-[15.5px] leading-[1.85] text-[var(--color-ink-3)]">
          Catatan mengalir tentang proyek, pembaruan, eksperimen, dan keseharian. Ikuti melalui{' '}
          <a href="/now/rss.xml" className="inline-flex items-center gap-1.5 font-medium text-[var(--color-ink)] underline decoration-[var(--color-line-2)] underline-offset-4 hover:text-[var(--color-accent)]">
            <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="5" cy="19" r="1" /><path d="M4 11a9 9 0 0 1 9 9M4 4a16 16 0 0 1 16 16" /></svg>
            Stream RSS Feed
          </a>.
        </p>
      </header>
      <ol className="list-none">
        {entries.map(entry => (
          <li key={entry.id} id={`update-${entry.id}`} className="stream-entry relative scroll-mt-24 pb-16 pl-10 max-sm:pl-8">
            <span title={streamCategories[entry.category]} className="absolute left-0 top-1 text-[var(--color-ink-3)]"><StreamIcon category={entry.category} /></span>
            <article>
              <h2 className="mb-2 text-[18px] font-semibold leading-[1.5] tracking-[-0.025em] text-[var(--color-ink)]">
                <a href={`#update-${entry.id}`} className="hover:text-[var(--color-accent)]">{entry.title}<span aria-hidden="true" className="ml-2 inline-block align-middle text-[var(--color-ink-3)]"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-2 2M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l2-2" /></svg></span></a>
              </h2>
              <div className="mb-6 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13.5px] text-[var(--color-ink-3)]">
                <time dateTime={entry.published_on}>{formatDate(`${entry.published_on}T12:00:00`)}</time>
                {entry.project && <><span aria-hidden="true">·</span>{entry.project_url && safeStreamUrl(entry.project_url) ? <a href={entry.project_url} className="underline underline-offset-4 hover:text-[var(--color-ink)]">{entry.project}</a> : <span>{entry.project}</span>}</>}
                <span className="sr-only">{streamCategories[entry.category]}</span>
              </div>
              <StreamBody content={entry.content} />
            </article>
          </li>
        ))}
      </ol>
      {!entries.length && <p className="pl-10 text-sm text-[var(--color-ink-3)]">Belum ada pembaruan. Sampai jumpa di catatan berikutnya.</p>}
      {now.spotifyEmbedUrl && <section aria-label="Sedang didengarkan" className="mt-4 pl-10 max-sm:pl-8"><h2 className="mb-4 text-sm text-[var(--color-ink-3)]">Sedang didengarkan</h2><SpotifyEmbed embedUrl={now.spotifyEmbedUrl} /></section>}
    </div>
  );
}
