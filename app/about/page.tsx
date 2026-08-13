import type { Metadata } from 'next';
import { getAboutData } from '@/lib/page-queries';
import { formatDate } from '@/lib/utils';
import { compileMdx } from '@/lib/mdx-compile';
import { mdxComponents } from '@/components/mdx-components';

export const metadata: Metadata = {
  title: 'Tentang',
  description: 'Cerita singkat, filosofi, dan perjalanan belajar.',
};

export const revalidate = 60;

export default async function AboutPage() {
  const about = await getAboutData();

  const mdxContent = about.content.trim()
    ? await compileMdx(about.content, mdxComponents)
    : null;

  return (
    <div className="page-fade mx-auto max-w-[680px] px-6">
      <div className="py-20 pb-10">
        <h1 className="mb-3 text-[36px] font-medium tracking-[-0.035em] text-[var(--color-ink)] max-sm:text-[28px]">
          {about.title}
        </h1>
        <p className="mb-10 text-base text-[var(--color-ink-3)]">
          {about.subtitle}
        </p>
        <div className="mb-8 flex items-center gap-2 font-mono text-xs text-[var(--color-ink-3)]">
          <span className="dot-live h-[5px] w-[5px] rounded-full" />
          terakhir diperbarui {formatDate(about.updated, true)}
        </div>

        {mdxContent && (
          <div className="article-body">{mdxContent}</div>
        )}

        {about.stack.length > 0 && (
          <>
            <h2 className="mt-9 mb-3.5 font-mono text-sm font-medium lowercase text-[var(--color-ink-3)]">
              // stack yang saya pakai
            </h2>
            <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-[10px] max-sm:grid-cols-1">
              {about.stack.map((s) => (
                <div
                  key={s.id}
                  className="flex justify-between border-b border-[var(--color-line)] py-2 text-sm text-[var(--color-ink-2)]"
                >
                  <span className="font-mono text-xs text-[var(--color-ink-3)]">
                    {s.label}
                  </span>
                  <span>{s.value}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {about.contactEmail && (
          <>
            <h2 className="mt-9 mb-3.5 font-mono text-sm font-medium lowercase text-[var(--color-ink-3)]">
              // hubungi
            </h2>
            <p className="mb-4 text-[15.5px] leading-[1.75] text-[var(--color-ink-2)]">
              {about.contactIntro}{' '}
              <a
                href={`mailto:${about.contactEmail}`}
                className="border-b border-[var(--color-line-2)] text-[var(--color-ink)] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
              >
                {about.contactEmail}
              </a>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
