import Image from 'next/image';
import Link from 'next/link';
import { HomeHero } from '@/components/home-hero';
import { JsonLd } from '@/components/json-ld';
import { MonologAudioPlayer } from '@/components/monolog-audio-player';
import { getCoverUrl, getLibraryData, type LibraryItem } from '@/lib/library';
import { getPublishedMonologEpisodes } from '@/lib/monolog';
import { formatAudioDuration } from '@/lib/monolog-shared';
import { getHomeData } from '@/lib/page-queries';
import { getTopWritings } from '@/lib/posts';
import { siteConfig } from '@/lib/site-config';
import { formatDate } from '@/lib/utils';
import type { Writing } from '@/types/content';
import type { PublishedMonologEpisode } from '@/types/monolog';

// Query highlights at request time so the homepage always follows live content.
export const dynamic = 'force-dynamic';
export const metadata = { alternates: { canonical: '/' } };

export default async function HomePage() {
  const [home, topWritings, monologEpisodes, library] = await Promise.all([
    getHomeData(),
    getTopWritings(3).catch(() => []),
    getPublishedMonologEpisodes().catch(() => []),
    getLibraryData().catch(() => ({ categories: [], itemsByCategory: {}, updated: new Date().toISOString() })),
  ]);
  const featuredMonolog = monologEpisodes.find((episode) => episode.isPinned) ?? monologEpisodes[0] ?? null;
  const readingBook = Object.values(library.itemsByCategory)
    .flat()
    .find((item) => item.item_type === 'book' && item.badge?.trim().toLocaleLowerCase('id-ID') === 'sedang dibaca') ?? null;

  return (
    <div className="page-fade mx-auto max-w-[960px] px-6 pb-24">
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: siteConfig.name,
        alternateName: siteConfig.shortName,
        url: siteConfig.url,
        inLanguage: 'id',
        description: siteConfig.description,
      }} />

      <section className="max-w-[680px] pb-16 pt-24 max-sm:pt-16">
        <HomeHero
          monoLabel={home.monoLabel}
          heroIntro={home.heroIntro}
          heroAccent1={home.heroAccent1}
          heroAccent2={home.heroAccent2}
          heroAccent3={home.heroAccent3}
          heroOutro={home.heroOutro}
          lead={home.lead}
        />
        <div className="home-meta-stagger flex flex-wrap items-center gap-4 text-[14px] text-[var(--color-ink-3)]">
          <span className="inline-flex items-center gap-2">
            <span className="dot-live h-[5px] w-[5px] rounded-full" />
            {home.location}
          </span>
          <span className="h-[5px] w-[5px] rounded-full bg-[var(--color-ink-4)]" />
          <span>{home.timezone}</span>
          <span className="h-[5px] w-[5px] rounded-full bg-[var(--color-ink-4)]" />
          <span>{home.estYear}</span>
        </div>
      </section>

      <Section title="// monolog pilihan" link={{ href: '/monolog', label: 'Semua Monolog' }}>
        {featuredMonolog ? <FeaturedMonolog episode={featuredMonolog} /> : <EmptyHighlight label="Belum ada Monolog yang diterbitkan." />}
      </Section>

      <Section title="// topik yang paling banyak dibaca" link={{ href: '/writing', label: 'Semua tulisan' }}>
        {topWritings.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-3">
            {topWritings.map((writing, index) => (
              <TopWritingCard key={writing.slug} writing={writing} delay={index * 70} />
            ))}
          </div>
        ) : <EmptyHighlight label="Tulisan pilihan sedang disiapkan." />}
      </Section>

      <Section title="// sedang dibaca" link={{ href: '/library', label: 'Buka Library' }}>
        {readingBook ? <CurrentlyReading book={readingBook} /> : <EmptyHighlight label="Belum ada buku dengan status sedang dibaca." />}
      </Section>

      <GuestbookCallout />
    </div>
  );
}

function Section({
  title,
  link,
  children,
}: {
  title: string;
  link: { href: string; label: string };
  children: React.ReactNode;
}) {
  return (
    <section className="home-section border-t border-[var(--color-line)] py-10">
      <div className="mb-6 flex items-baseline justify-between gap-4">
        <h2 className="home-section-title font-mono text-sm font-medium lowercase text-[var(--color-ink-3)]">{title}</h2>
        <Link href={link.href} className="text-[14px] text-[var(--color-ink-3)] transition-colors hover:text-[var(--color-accent)]">
          {link.label}
        </Link>
      </div>
      {children}
    </section>
  );
}

function FeaturedMonolog({ episode }: { episode: PublishedMonologEpisode }) {
  return (
    <article className="home-reveal overflow-hidden rounded-[24px] bg-[#1b1815] text-[#fbf6ed]">
      <div className="grid md:grid-cols-[230px_minmax(0,1fr)]">
        <div className="relative min-h-[220px] overflow-hidden bg-[linear-gradient(145deg,#203327,#9a3f20)] max-md:min-h-[170px]">
          <span className="monolog-cover-disc" aria-hidden="true" />
          <span className="absolute left-6 top-5 font-mono text-[12px] uppercase tracking-[0.16em] text-white/55">pilihan saat ini</span>
          <span className="absolute bottom-5 left-6 font-mono text-[12px] uppercase tracking-[0.14em] text-white/70">
            {episode.categoryLabel}
          </span>
        </div>
        <div className="flex min-w-0 flex-col justify-center p-7 sm:p-8">
          <div className="mb-3 flex flex-wrap gap-2 font-mono text-[12px] text-white/50">
            <time dateTime={episode.publishedAt}>{formatDate(episode.publishedAt)}</time>
            <span aria-hidden="true">·</span>
            <span>{formatAudioDuration(episode.durationSeconds)}</span>
          </div>
          <h3 className="text-[27px] font-medium leading-tight tracking-[-0.035em]">{episode.title}</h3>
          <p className="mt-3 text-[16px] leading-relaxed text-white/65">{episode.description}</p>
          <div className="mt-6 rounded-2xl bg-[#f4efe6] p-3 text-[#14130f]">
            <MonologAudioPlayer
              src={episode.audioUrl}
              title={episode.title}
              durationSeconds={episode.durationSeconds}
              variant="compact"
            />
          </div>
          <Link href={`/monolog/${episode.slug}`} className="mt-5 self-start text-[14px] text-white/65 transition-colors hover:text-white">
            Baca catatan episode
          </Link>
        </div>
      </div>
    </article>
  );
}

function TopWritingCard({ writing, delay }: { writing: Writing; delay: number }) {
  return (
    <Link
      href={`/writing/${writing.slug}`}
      className="home-reveal group flex min-h-[230px] flex-col rounded-[18px] border border-[var(--color-line)] bg-[var(--color-paper)] p-5 transition-colors hover:border-[var(--color-line-2)]"
      style={{ '--enter-delay': `${delay}ms` } as React.CSSProperties}
    >
      <div className="flex flex-wrap gap-1.5">
        {writing.tags.slice(0, 2).map((tag) => (
          <span key={tag} className="rounded-full bg-[var(--color-accent-soft)] px-2 py-1 font-mono text-[11px] text-[var(--color-accent)]">#{tag}</span>
        ))}
      </div>
      <h3 className="mt-5 text-[19px] font-medium leading-snug tracking-[-0.025em] text-[var(--color-ink)] transition-colors group-hover:text-[var(--color-accent)]">
        {writing.title}
      </h3>
      <p className="mt-3 line-clamp-3 text-[15px] leading-relaxed text-[var(--color-ink-3)]">{writing.summary}</p>
      <div className="mt-auto flex items-center justify-between gap-3 pt-5 font-mono text-[12px] text-[var(--color-ink-4)]">
        <time dateTime={writing.date}>{formatDate(writing.date)}</time>
        <span>{writing.readingTime}</span>
      </div>
    </Link>
  );
}

function CurrentlyReading({ book }: { book: LibraryItem }) {
  const cover = getCoverUrl(book);
  const author = book.details?.author || book.subtitle;
  return (
    <article className="library-theme home-reveal overflow-hidden rounded-[22px] border border-[color-mix(in_srgb,var(--color-accent)_22%,var(--color-line))] bg-[color-mix(in_srgb,var(--color-accent-soft)_62%,var(--color-paper))]">
      <div className="grid sm:grid-cols-[180px_minmax(0,1fr)]">
        <div className="relative min-h-[250px] overflow-hidden bg-[var(--color-paper-2)] max-sm:min-h-[320px]">
          {cover ? (
            <Image src={cover} alt={`Sampul ${book.name}`} fill sizes="(max-width: 639px) calc(100vw - 48px), 180px" className="object-cover" />
          ) : (
            <div className="grid h-full place-items-center text-5xl" aria-hidden="true">📚</div>
          )}
        </div>
        <div className="flex flex-col justify-center p-7 sm:p-8">
          <p className="font-mono text-[12px] uppercase tracking-[0.16em] text-[var(--color-accent)]">sedang dibaca</p>
          <h3 className="mt-3 text-[27px] font-medium leading-tight tracking-[-0.035em] text-[var(--color-ink)]">{book.name}</h3>
          {author && <p className="mt-2 text-[16px] text-[var(--color-ink-3)]">{author}</p>}
          {book.description && <p className="mt-5 line-clamp-3 text-[15px] leading-relaxed text-[var(--color-ink-3)]">{book.description}</p>}
          <div className="mt-6 flex flex-wrap gap-2 font-mono text-[12px] text-[var(--color-ink-4)]">
            {book.details?.genre && <span>{book.details.genre}</span>}
            {book.details?.pages && <><span aria-hidden="true">·</span><span>{book.details.pages} halaman</span></>}
            {book.details?.published_year && <><span aria-hidden="true">·</span><span>{book.details.published_year}</span></>}
          </div>
          <Link href={`/library#item-${book.id}`} className="mt-6 self-start text-[14px] font-medium text-[var(--color-accent)] transition-colors hover:text-[var(--color-ink)]">
            Lihat di Library
          </Link>
        </div>
      </div>
    </article>
  );
}

function GuestbookCallout() {
  return (
    <section className="home-section border-t border-[var(--color-line)] pt-10">
      <div className="home-reveal rounded-[24px] border border-[var(--color-line-2)] px-7 py-10 text-center sm:px-12">
        <p className="font-mono text-[12px] uppercase tracking-[0.16em] text-[var(--color-accent)]">guestbook</p>
        <h2 className="mx-auto mt-4 max-w-[580px] text-[30px] font-medium leading-tight tracking-[-0.04em] text-[var(--color-ink)] max-sm:text-[25px]">
          Jangan sungkan untuk menitipkan pesan.
        </h2>
        <p className="mx-auto mt-4 max-w-[560px] text-[16px] leading-relaxed text-[var(--color-ink-3)]">
          Cerita singkat, sapaan, rekomendasi buku, atau sekadar tanda pernah mampir—semuanya boleh ditinggalkan di sini.
        </p>
        <Link href="/guestbook" className="mt-7 inline-flex min-h-11 items-center rounded-full bg-[var(--color-ink)] px-5 text-[15px] font-medium text-[var(--color-paper)] transition-colors hover:bg-[var(--color-accent)]">
          Titipkan pesan
        </Link>
      </div>
    </section>
  );
}

function EmptyHighlight({ label }: { label: string }) {
  return <div className="rounded-[18px] border border-dashed border-[var(--color-line-2)] px-6 py-10 text-center text-[15px] text-[var(--color-ink-3)]">{label}</div>;
}
