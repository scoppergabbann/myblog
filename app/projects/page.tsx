import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';
import { getAllProjects } from '@/lib/content-queries';
import { formatDate } from '@/lib/utils';
import { projectGroup } from '@/lib/project-status';
import { ProjectCard } from '@/components/project-card';

export const metadata: Metadata = pageMetadata('/projects', 'Projects', 'Proyek aktif dan arsip hal-hal yang pernah saya bangun.');
export const revalidate = 60;
export default async function ProjectsPage() {
  const projects = await getAllProjects();
  const active = projects.filter(project => projectGroup(project.status) === 'active');
  const archived = projects.filter(project => projectGroup(project.status) === 'archived');
  const updated = projects.map(project => project.updated).filter(Boolean)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];
  return <div className="page-fade mx-auto max-w-[860px] px-6 pb-20 pt-16 max-sm:pt-10">
    <header className="mb-12 max-w-[600px]">
      <p className="mb-3 text-xs text-[var(--color-ink-3)]">BUILDING & EXPLORING</p>
      <h1 className="mb-4 text-[36px] font-medium tracking-[-0.04em] max-sm:text-[30px]">Projects</h1>
      <p className="text-[15.5px] leading-[1.85] text-[var(--color-ink-3)]">Tempat untuk hal-hal yang saya bangun. Sebagian masih berkembang, sebagian menjadi arsip perjalanan.</p>
      <nav aria-label="Bagian projects" className="mt-6 flex flex-wrap gap-2">
        <a href="#active-projects" className="rounded-full border border-[var(--color-line-2)] px-3.5 py-1.5 text-xs text-[var(--color-ink-2)] hover:bg-[var(--color-paper-2)]">Active <span className="ml-1 text-[var(--color-ink-3)]">{active.length}</span></a>
        <a href="#archived-projects" className="rounded-full border border-[var(--color-line)] px-3.5 py-1.5 text-xs text-[var(--color-ink-3)] hover:bg-[var(--color-paper-2)]">Archived <span className="ml-1">{archived.length}</span></a>
      </nav>
    </header>
    <section id="active-projects" aria-labelledby="active-title" className="scroll-mt-24">
      <div className="mb-6 border-b border-[var(--color-line)] pb-5">
        <h2 id="active-title" className="mb-2 flex items-center gap-2.5 text-xl font-medium tracking-tight"><span aria-hidden="true" className="h-2 w-2 rounded-full bg-emerald-500" />Active Projects<span className="ml-1 text-xs font-normal text-[var(--color-ink-3)]">{active.length}</span></h2>
        <p className="text-sm text-[var(--color-ink-3)]">Proyek yang sedang saya bangun, gunakan, atau rawat.</p>
      </div>
      {active.length ? <div className="grid gap-4 sm:grid-cols-2">{active.map((project, index) => <ProjectCard key={`${project.title}-${index}`} project={project} />)}</div>
        : <p className="rounded-xl border border-dashed border-[var(--color-line)] p-6 text-sm text-[var(--color-ink-3)]">Belum ada proyek aktif saat ini.</p>}
    </section>
    <section id="archived-projects" aria-labelledby="archived-title" className="mt-14 scroll-mt-24">
      <div className="mb-6 border-b border-[var(--color-line)] pb-5">
        <h2 id="archived-title" className="mb-2 flex items-center gap-2.5 text-xl font-medium tracking-tight"><svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M3 3h18v5H3zM5 8v13h14V8M9 12h6" /></svg>Archived Projects<span className="ml-1 text-xs font-normal text-[var(--color-ink-3)]">{archived.length}</span></h2>
        <p className="text-sm text-[var(--color-ink-3)]">Proyek terdahulu yang tetap disimpan sebagai bagian dari perjalanan.</p>
      </div>
      {archived.length ? <div>{archived.map((project, index) => <ProjectCard key={`${project.title}-${index}`} project={project} compact />)}</div>
        : <p className="text-sm text-[var(--color-ink-3)]">Belum ada proyek yang diarsipkan.</p>}
    </section>
    {updated && <p className="mt-12 text-xs text-[var(--color-ink-3)]">Terakhir diperbarui {formatDate(updated, true)}</p>}
  </div>;
}
