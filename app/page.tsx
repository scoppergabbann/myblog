import Link from 'next/link';
import { getAllWritings } from '@/lib/posts';
import { getAllProjects } from '@/lib/content-queries';
import { getHomeData } from '@/lib/page-queries';
import { WritingItem } from '@/components/writing-item';
import { ProjectCard } from '@/components/project-card';

export const revalidate = 60;

export default async function HomePage() {
  const [allWritings, allProjects, home] = await Promise.all([
    getAllWritings(),
    getAllProjects(),
    getHomeData(),
  ]);
  const writings = allWritings.slice(0, 3);
  const featuredProjects = allProjects.slice(0, 4);

  return (
    <div className="page-fade mx-auto max-w-[680px] px-6">
      <section className="py-24 pb-16">
        <div className="mb-7 flex items-center gap-2.5 font-mono text-xs tracking-wide text-[var(--color-ink-3)]">
          {home.monoLabel}
          <span className="h-px w-[60px] flex-1 max-w-[60px] bg-[var(--color-line)]" />
        </div>
        <h1 className="mb-5 text-[44px] font-medium leading-[1.1] tracking-[-0.04em] text-[var(--color-ink)] max-sm:text-[32px]">
          {home.heroIntro}{' '}
          <span className="text-[var(--color-accent)]">{home.heroAccent1}</span>,{' '}
          <span className="text-[var(--color-accent)]">{home.heroAccent2}</span>, dan{' '}
          <span className="text-[var(--color-accent)]">{home.heroAccent3}</span>
          {home.heroOutro}
        </h1>
        <p className="mb-6 max-w-[540px] text-[17.5px] leading-[1.65] text-[var(--color-ink-2)]">
          {home.lead}
        </p>
        <div className="flex flex-wrap items-center gap-4 text-[13px] text-[var(--color-ink-3)]">
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

      <Section
        title="// sedang fokus"
        link={{ href: '/now', label: 'selengkapnya →' }}
      >
        <div className="rounded-[14px] border border-[var(--color-line)] bg-[var(--color-paper)] px-6 py-[22px] transition-colors duration-200 hover:border-[var(--color-line-2)]">
          <h3 className="mb-2 text-base font-medium text-[var(--color-ink)]">
            {home.focusTitle}
          </h3>
          <p className="text-[14.5px] leading-[1.65] text-[var(--color-ink-3)]">
            {home.focusBody}
          </p>
        </div>
      </Section>

      <Section
        title="// tulisan terpilih"
        link={{ href: '/writing', label: 'semua tulisan →' }}
      >
        <div className="flex flex-col">
          {writings.map((w) => (
            <WritingItem key={w.slug} writing={w} />
          ))}
        </div>
      </Section>

      <Section
        title="// proyek terpilih"
        link={{ href: '/projects', label: 'semua proyek →' }}
      >
        <div className="grid grid-cols-2 gap-3.5 max-sm:grid-cols-1">
          {featuredProjects.map((p) => (
            <ProjectCard key={p.title} project={p} />
          ))}
        </div>
      </Section>

      <Section title="// quick links">
        <div className="flex flex-wrap gap-2">
          {home.quickLinks.map((q) => (
            <QuickLinkPill key={q.id} href={q.href}>
              {q.label}
            </QuickLinkPill>
          ))}
        </div>
      </Section>
    </div>
  );
}

function Section({
  title,
  link,
  children,
}: {
  title: string;
  link?: { href: string; label: string };
  children: React.ReactNode;
}) {
  return (
    <section className="py-7">
      <div className="mb-6 flex items-baseline justify-between gap-4">
        <h2 className="font-mono text-sm font-medium lowercase tracking-normal text-[var(--color-ink-3)]">
          {title}
        </h2>
        {link && (
          <Link
            href={link.href}
            className="text-[13px] text-[var(--color-ink-3)] transition-colors duration-200 hover:text-[var(--color-accent)]"
          >
            {link.label}
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

function QuickLinkPill({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const isExternal = href.startsWith('http') || href.endsWith('.xml');
  if (isExternal) {
    return (
      <a
        href={href}
        target={href.startsWith('http') ? '_blank' : undefined}
        rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
        className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-line)] px-3 py-1.5 font-mono text-[13px] text-[var(--color-ink-3)] transition-all duration-200 hover:border-[color-mix(in_srgb,var(--color-accent)_30%,transparent)] hover:text-[var(--color-accent)]"
      >
        {children}
      </a>
    );
  }
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-line)] px-3 py-1.5 font-mono text-[13px] text-[var(--color-ink-3)] transition-all duration-200 hover:border-[color-mix(in_srgb,var(--color-accent)_30%,transparent)] hover:text-[var(--color-accent)]"
    >
      {children}
    </Link>
  );
}
