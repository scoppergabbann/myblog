import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  getAllWritingSlugs,
  getWritingBySlug,
} from '@/lib/mdx';
import { formatDate, extractToc } from '@/lib/utils';
import { mdxComponents } from '@/components/mdx-components';
import { ReadingProgress } from '@/components/reading-progress';
import { Reactions } from '@/components/reactions';
import { ViewCounter } from '@/components/view-counter';
import { CommentsSection } from '@/components/comments-section';
import { NewsletterSignup } from '@/components/newsletter-signup';
import { getReactionsForSlug, getViewCount } from '@/lib/queries';
import { siteConfig } from '@/lib/site-config';

export async function generateStaticParams() {
  return getAllWritingSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const w = getWritingBySlug(slug);
  if (!w) return {};
  return {
    title: w.title,
    description: w.summary,
    openGraph: {
      title: w.title,
      description: w.summary,
      type: 'article',
      publishedTime: w.date,
      url: `${siteConfig.url}/writing/${w.slug}`,
      tags: w.tags,
    },
    twitter: {
      card: 'summary_large_image',
      title: w.title,
      description: w.summary,
    },
  };
}

export default async function WritingDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const w = getWritingBySlug(slug);
  if (!w) notFound();

  const toc = extractToc(w.content);

  // Fetch dynamic data in parallel
  const [reactions, viewCount] = await Promise.all([
    getReactionsForSlug(slug),
    getViewCount(slug),
  ]);

  // Dynamic import of the MDX file as a React component
  let MDXContent;
  try {
    const mod = await import(`@/content/writings/${slug}.mdx`);
    MDXContent = mod.default;
  } catch {
    notFound();
  }

  return (
    <>
      <ReadingProgress />
      <div className="page-fade mx-auto max-w-[920px] px-6">
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
                  <span>·</span>
                  <ViewCounter slug={slug} initialCount={viewCount} />
                  <span>·</span>
                  <span>{w.tags.join(', ')}</span>
                </div>
                <h1 className="mb-3.5 text-[34px] font-medium leading-[1.2] tracking-[-0.03em] text-[var(--color-ink)] max-sm:text-[26px]">
                  {w.title}
                </h1>
                <p className="text-[17px] leading-[1.6] text-[var(--color-ink-3)]">
                  {w.summary}
                </p>
              </header>

              <div className="article-body">
                <MDXContent components={mdxComponents} />
              </div>

              <Reactions slug={slug} initialCounts={reactions} />

              <NewsletterSignup />

              <CommentsSection slug={slug} />
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
