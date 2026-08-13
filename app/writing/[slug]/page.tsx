import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getWritingBySlug, getAdjacentWritings, getRelatedWritings } from '@/lib/posts';
import { formatDate, extractToc } from '@/lib/utils';
import { compileMdx } from '@/lib/mdx-compile';
import { mdxComponents } from '@/components/mdx-components';
import { ReadingProgress } from '@/components/reading-progress';
import { Reactions } from '@/components/reactions';
import { ViewCounter } from '@/components/view-counter';
import { CommentsSection } from '@/components/comments-section';
import { NewsletterSignup } from '@/components/newsletter-signup';
import { ArticleFooterNav } from '@/components/article-footer-nav';
import { getReactionsForSlug, getViewCount } from '@/lib/queries';
import { isPremiumUnlocked } from '@/lib/premium';
import { siteConfig } from '@/lib/site-config';
import { PremiumUnlockForm } from './premium-unlock-form';

// `searchParams` (for ?preview=) requires dynamic rendering. Trade off ISR
// for simpler preview handling — Supabase queries are fast enough.
export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ preview?: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const sp = await searchParams;

  let isPreview = false;
  if (sp.preview) {
    const { verifyDraftToken } = await import('@/lib/draft-token');
    isPreview = verifyDraftToken(slug, sp.preview);
  }

  const w = await getWritingBySlug(slug, { includeDraft: isPreview });
  if (!w) return {};

  const ogImage = `${siteConfig.url}/api/og?title=${encodeURIComponent(w.title)}&subtitle=${encodeURIComponent(w.summary)}`;

  return {
    title: w.title,
    description: w.summary,
    openGraph: {
      title: w.title,
      description: w.summary,
      type: 'article',
      publishedTime: w.date,
      url: `${siteConfig.url}/writing/${w.slug}`,
      siteName: siteConfig.name,
      locale: siteConfig.locale,
      tags: w.tags,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: w.title,
          type: 'image/png',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: w.title,
      description: w.summary,
      images: [ogImage],
    },
    other: {
      'og:image:secure_url': ogImage,
    },
    robots: isPreview ? { index: false, follow: false } : undefined,
  };
}

export default async function WritingDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ preview?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;

  // Draft preview: validate HMAC token before showing unpublished posts
  let isPreview = false;
  if (sp.preview) {
    const { verifyDraftToken } = await import('@/lib/draft-token');
    isPreview = verifyDraftToken(slug, sp.preview);
  }

  const w = await getWritingBySlug(slug, { includeDraft: isPreview });
  if (!w) notFound();

  const unlocked = !w.isPremium || isPreview || (await isPremiumUnlocked(slug));
  const toc = unlocked ? extractToc(w.content) : [];

  const [reactions, viewCount, mdxContent, adjacent, related] = unlocked
    ? await Promise.all([
        getReactionsForSlug(slug),
        getViewCount(slug),
        compileMdx(w.content, mdxComponents),
        getAdjacentWritings(slug),
        getRelatedWritings(slug, 3),
      ])
    : await Promise.all([
        Promise.resolve(null),
        Promise.resolve(0),
        Promise.resolve(null),
        getAdjacentWritings(slug),
        getRelatedWritings(slug, 3),
      ]);

  return (
    <>
      {!isPreview && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Article',
              headline: w.title,
              description: w.summary,
              datePublished: w.date,
              author: {
                '@type': 'Person',
                name: siteConfig.author.name,
                url: siteConfig.url,
              },
              publisher: {
                '@type': 'Person',
                name: siteConfig.author.name,
                url: siteConfig.url,
              },
              mainEntityOfPage: {
                '@type': 'WebPage',
                '@id': `${siteConfig.url}/writing/${w.slug}`,
              },
              keywords: w.tags.join(', '),
              image: `${siteConfig.url}/api/og?title=${encodeURIComponent(w.title)}`,
            }),
          }}
        />
      )}
      <ReadingProgress />
      <div className="page-fade mx-auto max-w-[920px] px-6">
        {isPreview && (
          <div className="mt-4 rounded-[10px] border border-[color-mix(in_srgb,var(--color-accent)_40%,transparent)] bg-[var(--color-accent-soft)] px-4 py-2.5 font-mono text-[12px] text-[var(--color-accent)]">
            // preview mode: ini adalah draft, hanya visible dengan link preview
          </div>
        )}
        <article className="py-14 pb-10">
          <Link
            href="/writing"
            className="mb-8 inline-flex items-center gap-1.5 text-[13px] text-[var(--color-ink-3)] transition-colors duration-200 hover:text-[var(--color-accent)]"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            semua tulisan
          </Link>

          <div className="grid grid-cols-[1fr_180px] items-start gap-12 max-md:grid-cols-1">
            <div>
              <header className="mb-10">
                <div className="mb-4 flex items-center gap-3 font-mono text-xs text-[var(--color-ink-4)]">
                  <span>{formatDate(w.date)}</span>
                  <span>·</span>
                  <span>{w.readingTime}</span>
                  {w.isPremium && (
                    <>
                      <span>·</span>
                      <span className="text-[var(--color-accent)]">premium</span>
                    </>
                  )}
                  <span>·</span>
                  {unlocked ? (
                    <ViewCounter slug={slug} initialCount={viewCount} />
                  ) : (
                    <span>terkunci</span>
                  )}
                  {w.tags.length > 0 && (
                    <>
                      <span>·</span>
                      <span className="flex flex-wrap gap-x-1">
                        {w.tags.map((t, i) => (
                          <span key={t}>
                            <Link
                              href={`/writing/tag/${encodeURIComponent(t.toLowerCase())}`}
                              className="transition-colors hover:text-[var(--color-accent)]"
                            >
                              #{t}
                            </Link>
                            {i < w.tags.length - 1 && ' '}
                          </span>
                        ))}
                      </span>
                    </>
                  )}
                </div>
                <h1 className="mb-3.5 text-[34px] font-medium leading-[1.2] tracking-[-0.03em] text-[var(--color-ink)] max-sm:text-[26px]">
                  {w.title}
                </h1>
                <p className="text-[17px] leading-[1.6] text-[var(--color-ink-3)]">
                  {w.summary}
                </p>
              </header>

              <div className="article-body">
                {unlocked ? mdxContent : <PremiumUnlockForm slug={slug} />}
              </div>

              {unlocked && reactions && (
                <Reactions slug={slug} initialCounts={reactions} />
              )}

              <ArticleFooterNav prev={adjacent.prev} next={adjacent.next} related={related} />

              {unlocked && <NewsletterSignup />}

              {unlocked && <CommentsSection slug={slug} />}
            </div>

            <aside className="max-md:hidden">
              {toc.length > 0 && (
                <div className="sticky top-20 border-l border-[var(--color-line)] pl-[18px] text-[12.5px]">
                  <h4 className="mb-2.5 font-mono text-[11.5px] font-medium lowercase tracking-wide text-[var(--color-ink-3)]">
                    daftar isi
                  </h4>
                  {toc.map((h) => (
                    <a
                      key={h.id}
                      href={`#${h.id}`}
                      className={`block py-1 leading-[1.4] text-[var(--color-ink-3)] transition-colors duration-200 hover:text-[var(--color-accent)] ${
                        h.level === 3 ? 'pl-3' : ''
                      }`}
                    >
                      {h.text}
                    </a>
                  ))}
                </div>
              )}
            </aside>
          </div>
        </article>
      </div>
    </>
  );
}
