import type { Metadata } from 'next';
import { mdxComponents } from '@/components/mdx-components';
import { compileMdx } from '@/lib/mdx-compile';
import { getAboutData } from '@/lib/page-queries';
import { pageMetadata } from '@/lib/seo';
import { extractToc, formatDate } from '@/lib/utils';

export const metadata: Metadata = pageMetadata('/about', 'Tentang', 'Cerita singkat, filosofi, dan perjalanan belajar.');

export const revalidate = 60;

export default async function AboutPage() {
  const about = await getAboutData();
  const mdxContent = about.content.trim()
    ? await compileMdx(about.content, mdxComponents)
    : null;
  const chapters = extractToc(about.content).filter((heading) => heading.level === 2);

  return (
    <main className="page-fade mx-auto max-w-[1120px] px-6 pb-24 pt-16 max-sm:pt-10">
      <header className="overflow-hidden rounded-[30px] border border-[var(--color-line)] bg-[var(--color-ink)] text-[var(--color-paper)]">
        <div className="grid min-h-[520px] lg:grid-cols-[1.35fr_0.65fr] max-lg:min-h-0">
          <div className="flex flex-col justify-between p-10 sm:p-14">
            <div className="flex flex-wrap items-center justify-between gap-4 font-mono text-[11px] uppercase tracking-[0.2em] text-[color-mix(in_srgb,var(--color-paper)_58%,transparent)]">
              <span>BBS / personal profile</span>
              <span>Diperbarui {formatDate(about.updated, true)}</span>
            </div>
            <div className="mt-20 max-w-[720px] max-sm:mt-14">
              <h1 className="text-[clamp(4.5rem,10vw,8.5rem)] font-medium leading-[0.82] tracking-[-0.075em]">
                {about.title}<span className="text-[var(--color-accent)]">.</span>
              </h1>
              <p className="mt-8 max-w-[660px] text-[clamp(1.2rem,2.4vw,1.75rem)] leading-[1.35] tracking-[-0.02em] text-[color-mix(in_srgb,var(--color-paper)_72%,transparent)]">
                {about.subtitle}
              </p>
            </div>
          </div>

          <div className="relative min-h-[320px] overflow-hidden border-l border-[color-mix(in_srgb,var(--color-paper)_16%,transparent)] max-lg:border-l-0 max-lg:border-t">
            <div className="absolute -right-[170px] -top-[170px] h-[560px] w-[560px] rounded-full border border-[color-mix(in_srgb,var(--color-accent)_72%,transparent)]" />
            <div className="absolute -right-7 top-8 h-[360px] w-[360px] rounded-full border border-[color-mix(in_srgb,var(--color-accent)_55%,transparent)]" />
            <div className="absolute right-[104px] top-[150px] h-28 w-28 rounded-full bg-[var(--color-accent)] max-sm:right-[72px]" />
            <p className="absolute bottom-10 left-10 max-w-[180px] font-mono text-[11px] uppercase leading-5 tracking-[0.18em] text-[color-mix(in_srgb,var(--color-paper)_55%,transparent)]">
              Belajar, menulis, dan merawat rasa penasaran.
            </p>
          </div>
        </div>
      </header>

      {mdxContent && (
        <section className="mt-16 grid gap-12 lg:grid-cols-[250px_minmax(0,1fr)]" aria-label="Cerita tentang saya">
          <aside className="lg:sticky lg:top-28 lg:self-start">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--color-accent)]">Daftar cerita</p>
            {chapters.length > 0 && (
              <nav aria-label="Bab halaman tentang" className="mt-5 border-t border-[var(--color-line)]">
                {chapters.map((chapter) => (
                  <a
                    key={chapter.id}
                    href={`#${chapter.id}`}
                    className="block border-b border-[var(--color-line)] py-3.5 text-[14px] text-[var(--color-ink-3)] transition-colors hover:text-[var(--color-accent)]"
                  >
                    {chapter.text.replace(/^\/\/\s*/, '')}
                  </a>
                ))}
              </nav>
            )}
            <p className="mt-7 text-[13px] leading-6 text-[var(--color-ink-4)]">
              Sebuah catatan tentang proses yang tidak selalu lurus, tetapi selalu punya sesuatu untuk dipelajari.
            </p>
          </aside>

          <div className="article-body max-w-[760px] [&_h2]:border-t [&_h2]:border-[var(--color-line)] [&_h2]:pt-8 [&_h2]:text-[28px] [&_h2]:tracking-[-0.035em]">
            {mdxContent}
          </div>
        </section>
      )}

      {about.stack.length > 0 && (
        <section className="mt-20" aria-labelledby="about-stack-title">
          <div className="mb-8 grid gap-6 border-y border-[var(--color-line)] py-7 md:grid-cols-[1fr_1fr] md:items-end">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--color-accent)]">Peralatan sehari-hari</p>
              <h2 id="about-stack-title" className="mt-2 text-[36px] font-medium tracking-[-0.04em] text-[var(--color-ink)]">Stack yang saya pakai.</h2>
            </div>
            <p className="max-w-[480px] text-[15px] leading-7 text-[var(--color-ink-3)] md:justify-self-end">
              Bukan daftar untuk terlihat canggih—hanya alat-alat yang membantu ide berubah menjadi sesuatu yang bisa dipakai.
            </p>
          </div>

          <div className="grid border-l border-t border-[var(--color-line)] sm:grid-cols-2 lg:grid-cols-3">
            {about.stack.map((item) => (
              <div key={item.id} className="min-h-[170px] border-b border-r border-[var(--color-line)] p-7 transition-colors hover:bg-[var(--color-paper-2)]">
                <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--color-ink-4)]">{item.label}</p>
                <p className="mt-12 text-[22px] font-medium tracking-[-0.025em] text-[var(--color-ink)]">{item.value}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {about.contactEmail && (
        <section className="mt-20 overflow-hidden rounded-[28px] border border-[var(--color-line)] bg-[var(--color-accent)] text-white" aria-labelledby="about-contact-title">
          <div className="grid md:grid-cols-[1fr_auto] md:items-end">
            <div className="p-8 sm:p-12">
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/70">Kirim kabar</p>
              <h2 id="about-contact-title" className="mt-3 max-w-[700px] text-[clamp(2.4rem,6vw,5.5rem)] font-medium leading-[0.95] tracking-[-0.055em]">
                Mari bertukar cerita.
              </h2>
              <p className="mt-6 max-w-[620px] text-[16px] leading-7 text-white/80">{about.contactIntro}</p>
            </div>
            <div className="border-l border-white/20 p-8 max-md:border-l-0 max-md:border-t sm:p-12">
              <a
                href={`mailto:${about.contactEmail}`}
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/45 px-6 text-[14px] font-medium transition-colors hover:bg-white hover:text-[var(--color-accent)]"
              >
                {about.contactEmail}
              </a>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
