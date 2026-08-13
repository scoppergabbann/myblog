import type { Metadata } from 'next';
import { getAllProjects } from '@/lib/content-queries';
import { formatDate } from '@/lib/utils';
import { ProjectCard } from '@/components/project-card';

export const metadata: Metadata = {
  title: 'Proyek',
  description: 'Hal-hal kecil yang saya bangun.',
};

export const revalidate = 60;

export default async function ProjectsPage() {
  const projects = await getAllProjects();
  const updated =
    projects
      .map((project) => project.updated)
      .filter(Boolean)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0] ??
    new Date().toISOString();

  return (
    <div className="page-fade mx-auto max-w-[680px] px-6">
      <div className="py-20 pb-10">
        <div className="mb-10">
          <h1 className="mb-2 text-[36px] font-medium tracking-[-0.035em] text-[var(--color-ink)] max-sm:text-[28px]">
            Proyek
          </h1>
          <p className="text-[15.5px] text-[var(--color-ink-3)]">
            Hal-hal kecil yang saya bangun, kadang sampai selesai, kadang
            ditinggalkan. Semua project di sini saya jadi pengguna utamanya.
          </p>
          <div className="mt-6 flex items-center gap-2 font-mono text-xs text-[var(--color-ink-3)]">
            <span className="dot-live h-[5px] w-[5px] rounded-full" />
            terakhir diperbarui {formatDate(updated, true)}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3.5 max-sm:grid-cols-1">
          {projects.map((p) => (
            <ProjectCard key={p.title} project={p} />
          ))}
        </div>
      </div>
    </div>
  );
}
