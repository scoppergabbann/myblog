import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { JsonLd } from '@/components/json-ld';
import { MonologAudioPlayer } from '@/components/monolog-audio-player';
import {
  audioDurationIso,
  formatAudioDuration,
  getPublishedMonologEpisode,
  getPublishedMonologEpisodes,
  getRelatedMonologEpisodes,
  monologCategoryLabel,
} from '@/lib/monolog';
import { siteConfig } from '@/lib/site-config';
import { formatDate } from '@/lib/utils';

export function generateStaticParams() {
  return getPublishedMonologEpisodes().map((episode) => ({ slug: episode.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const episode = getPublishedMonologEpisode(slug);
  if (!episode) notFound();

  const path = `/monolog/${encodeURIComponent(episode.slug)}`;
  const image = `${siteConfig.url}/api/og?${new URLSearchParams({
    title: episode.title,
    subtitle: episode.description,
  })}`;

  return {
    title: episode.title,
    description: episode.description,
    alternates: { canonical: path },
    openGraph: {
      type: 'article',
      title: episode.title,
      description: episode.description,
      url: `${siteConfig.url}${path}`,
      siteName: siteConfig.name,
      locale: siteConfig.locale,
      publishedTime: episode.publishedAt,
      tags: episode.tags,
      images: [{ url: image, width: 1200, height: 630, alt: episode.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: episode.title,
      description: episode.description,
      images: [image],
    },
    other: { 'og:image:secure_url': image },
  };
}

export default async function MonologEpisodePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const episode = getPublishedMonologEpisode(slug);
  if (!episode) notFound();

  const related = getRelatedMonologEpisodes(episode);
  const audioUrl = episode.audioUrl.startsWith('https://')
    ? episode.audioUrl
    : `${siteConfig.url}${episode.audioUrl}`;
  const episodeUrl = `${siteConfig.url}/monolog/${encodeURIComponent(episode.slug)}`;

  return (
    <div className="page-fade mx-auto max-w-[720px] px-6 pb-20 pt-12 max-sm:pt-8">
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'AudioObject',
        name: episode.title,
        description: episode.description,
        contentUrl: audioUrl,
        duration: audioDurationIso(episode.durationSeconds),
        datePublished: episode.publishedAt,
        uploadDate: episode.publishedAt,
        inLanguage: 'id-ID',
        url: episodeUrl,
        author: { '@type': 'Person', name: siteConfig.author.name, url: siteConfig.url },
        keywords: episode.tags.join(', '),
        ...(episode.transcript ? { transcript: episode.transcript } : {}),
      }} />
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Beranda', item: siteConfig.url },
          { '@type': 'ListItem', position: 2, name: 'Monolog', item: `${siteConfig.url}/monolog` },
          { '@type': 'ListItem', position: 3, name: episode.title, item: episodeUrl },
        ],
      }} />

      <nav aria-label="Breadcrumb" className="mb-7 flex flex-wrap items-center gap-2 text-[12px] text-[var(--color-ink-4)]">
        <Link href="/">Beranda</Link><span aria-hidden="true">/</span>
        <Link href="/monolog">Monolog</Link><span aria-hidden="true">/</span>
        <span aria-current="page">{episode.title}</span>
      </nav>

      <article>
        <header className="mb-8">
          <div className="mb-4 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[11.5px] text-[var(--color-ink-4)]">
            <span className="rounded-full bg-[var(--color-accent-soft)] px-2.5 py-1 text-[var(--color-accent)]">
              {monologCategoryLabel(episode.category)}
            </span>
            <span aria-hidden="true">·</span>
            <time dateTime={episode.publishedAt}>{formatDate(episode.publishedAt)}</time>
            <span aria-hidden="true">·</span>
            <span>{formatAudioDuration(episode.durationSeconds)}</span>
          </div>
          <h1 className="text-[36px] font-medium leading-[1.18] tracking-[-0.04em] text-[var(--color-ink)] max-sm:text-[28px]">
            {episode.title}
          </h1>
          <p className="mt-4 text-[16.5px] leading-[1.75] text-[var(--color-ink-3)]">
            {episode.description}
          </p>
        </header>

        <MonologAudioPlayer
          src={episode.audioUrl}
          title={episode.title}
          durationSeconds={episode.durationSeconds}
        />

        {episode.transcript && (
          <TextSection title="Transkrip" content={episode.transcript} />
        )}

        {episode.reflection && (
          <TextSection title="Refleksi pribadi" content={episode.reflection} />
        )}

        {episode.tags.length > 0 && (
          <ul aria-label="Tag episode" className="mt-10 flex list-none flex-wrap gap-2">
            {episode.tags.map((tag) => (
              <li key={tag} className="rounded-full border border-[var(--color-line)] px-3 py-1 font-mono text-[11px] text-[var(--color-ink-4)]">
                #{tag}
              </li>
            ))}
          </ul>
        )}
      </article>

      {related.length > 0 && (
        <aside aria-labelledby="related-monolog" className="mt-14 border-t border-[var(--color-line)] pt-8">
          <h2 id="related-monolog" className="mb-4 text-lg font-medium tracking-tight">
            Monolog terkait
          </h2>
          <div className="divide-y divide-[var(--color-line)]">
            {related.map((item) => (
              <Link key={item.id} href={`/monolog/${item.slug}`} className="group flex items-center justify-between gap-5 py-4">
                <span>
                  <span className="block text-[14.5px] text-[var(--color-ink)] transition-colors group-hover:text-[var(--color-accent)]">{item.title}</span>
                  <span className="mt-1 block font-mono text-[11px] text-[var(--color-ink-4)]">{monologCategoryLabel(item.category)} · {formatAudioDuration(item.durationSeconds)}</span>
                </span>
                <span aria-hidden="true" className="text-[var(--color-ink-4)]">→</span>
              </Link>
            ))}
          </div>
        </aside>
      )}

      <Link href="/monolog" className="mt-12 inline-flex min-h-11 items-center text-[13px] text-[var(--color-ink-3)] transition-colors hover:text-[var(--color-accent)]">
        <span aria-hidden="true" className="mr-1">←</span> Semua Monolog
      </Link>
    </div>
  );
}

function TextSection({ title, content }: { title: string; content: string }) {
  return (
    <section className="mt-12 border-t border-[var(--color-line)] pt-8">
      <h2 className="mb-5 text-xl font-medium tracking-tight text-[var(--color-ink)]">{title}</h2>
      <div className="space-y-4 text-[15.5px] leading-[1.85] text-[var(--color-ink-2)]">
        {content.split(/\n{2,}/).map((paragraph, index) => <p key={index}>{paragraph}</p>)}
      </div>
    </section>
  );
}
