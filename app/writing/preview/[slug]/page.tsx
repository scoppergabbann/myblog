import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getWritingBySlug } from '@/lib/posts';
import { formatDate, extractToc } from '@/lib/utils';
import { compileMdx } from '@/lib/mdx-compile';
import { mdxComponents } from '@/components/mdx-components';
import { ReadingProgress } from '@/components/reading-progress';
import { verifyDraftToken } from '@/lib/draft-token';

// Preview route is dynamic by design — needs ?token=... validation per request.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Preview · draft',
  robots: { index: false, follow: false },
};

export default async function WritingPreviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;

  if (!sp.token || !verifyDraftToken(slug, sp.token)) {
    notFound();
  }

  const w = await getWritingBySlug(slug, { includeDraft: true });
  if (!w) notFound();

  const toc = extractToc(w.content);
  const mdxContent = await compileMdx(w.content, mdxComponents);

  return (
    <>
      <ReadingProgress />
      <div className="page-fade mx-auto max-w-[920px] px-6">
        <div className="mt-4 rounded-[10px] border border-[color-mix(in_srgb,var(--color-accent)_40%,transparent)] bg-[var(--color-accent-soft)] px-4 py-2.5 font-mono text-[12px] text-[var(--color-accent)]">
          // preview mode: ini adalah draft, hanya visible dengan link preview
        </div>
        <article className="py-14 pb-10">
          <Link
            href="/writing"
            className="mb-8 inline-flex items-center gap-1.5 text-[13px] text-[var(--color-ink-3)] transition-colors duration-200 hover:text-[var(--color-accent)]"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            kembali ke tulisan
          </Link>

          <div className="grid grid-cols-[1fr_220px] gap-12 max-md:block">
            <div>
              <div className="mb-14 border-b border-[var(--color-line)] pb-7">
                <div className="mb-4 flex flex-wrap items-center gap-2 font-mono text-[11.5px] text-[var(--color-ink-4)]">
                  <span>{formatDate(w.date)}</span>
                  <span>·</span>
                  <span>{w.readingTime}</span>
                  {w.tags.length > 0 && (
                    <>
                      <span>·</span>
                      <span>{w.tags.map((t) => `#${t}`).join(' ')}</span>
                    </>
                  )}
                </div>
                <h1 className="mb-3.5 text-[34px] font-medium leading-[1.2] tracking-[-0.03em] text-[var(--color-ink)] max-sm:text-[26px]">
                  {w.title}
                </h1>
                <p className="text-[17px] leading-[1.6] text-[var(--color-ink-3)]">
                  {w.summary}
                </p>
              </div>

              <div className="article-body">{mdxContent}</div>
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
