import Link from 'next/link';
import { getAllWritings } from '@/lib/posts';
import { getAllProjects } from '@/lib/content-queries';
import { WritingItem } from '@/components/writing-item';
import { ProjectCard } from '@/components/project-card';

export const revalidate = 60;

export default async function HomePage() {
  const [allWritings, allProjects] = await Promise.all([
    getAllWritings(),
    getAllProjects(),
  ]);
  const writings = allWritings.slice(0, 3);
  const featuredProjects = allProjects.slice(0, 4);

  return (
    <div className="page-fade mx-auto max-w-[680px] px-6">
      <section className="py-24 pb-16">
        <div className="mb-7 flex items-center gap-2.5 font-mono text-xs tracking-wide text-[var(--color-ink-3)]">
          ~/halo
          <span className="h-px w-[60px] flex-1 max-w-[60px] bg-[var(--color-line)]" />
        </div>
        <h1 className="mb-5 text-[44px] font-medium leading-[1.1] tracking-[-0.04em] text-[var(--color-ink)] max-sm:text-[32px]">
          Sudut sepi di internet untuk{' '}
          <span className="text-[var(--color-accent)]">menulis</span>,{' '}
          <span className="text-[var(--color-accent)]">membangun</span>, dan{' '}
          <span className="text-[var(--color-accent)]">memikirkan ulang</span>.
        </h1>
        <p className="mb-6 max-w-[540px] text-[17.5px] leading-[1.65] text-[var(--color-ink-2)]">
          Saya seorang software engineer yang juga menulis dan berinvestasi
          pelan-pelan. Tempat ini adalah catatan kepala saya—proyek yang
          sedang dibangun, tulisan yang sedang dimasak, dan refleksi yang
          belum selesai.
        </p>
        <div className="flex flex-wrap items-center gap-4 text-[13px] text-[var(--color-ink-3)]">
          <span className="inline-flex items-center gap-2">
            <span className="dot-live h-[5px] w-[5px] rounded-full" />
            Surabaya, Indonesia
          </span>
          <span className="h-[5px] w-[5px] rounded-full bg-[var(--color-ink-4)]" />
          <span>UTC+7</span>
          <span className="h-[5px] w-[5px] rounded-full bg-[var(--color-ink-4)]" />
          <span>est. 2026</span>
        </div>
      </section>

      <Section title="// sedang fokus" link={{ href: '/now', label: 'selengkapnya →' }}>
        <div className="rounded-[14px] border border-[var(--color-line)] bg-[var(--color-paper)] px-6 py-[22px] transition-colors duration-200 hover:border-[var(--color-line-2)]">
          <h3 className="mb-2 text-base font-medium text-[var(--color-ink)]">
            Membangun tatap, aplikasi journaling untuk iOS
          </h3>
          <p className="text-[14.5px] leading-[1.65] text-[var(--color-ink-3)]">
            Membaca ulang Designing Data-Intensive Applications. Belajar bahasa
            Jepang menuju N3. Mengurangi screen time di malam hari dan kembali
            ke buku fisik.
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
          <QuickLink href="/about">tentang saya</QuickLink>
          <QuickLink href="/uses">tools yang saya pakai</QuickLink>
          <QuickLink href="/now">apa yang sedang saya kerjakan</QuickLink>
          <QuickLink href="/guestbook">tinggalkan pesan</QuickLink>
          <QuickLink href="/rss.xml">rss feed</QuickLink>
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

function QuickLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-line)] px-3 py-1.5 font-mono text-[13px] text-[var(--color-ink-3)] transition-all duration-200 hover:border-[color-mix(in_srgb,var(--color-accent)_30%,transparent)] hover:text-[var(--color-accent)]"
    >
      {children}
    </Link>
  );
}
