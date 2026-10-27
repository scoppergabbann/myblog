import type { Project } from '@/types/content';
import { projectGroup, projectStatusLabel } from '@/lib/project-status';

function projectLink(value?: string): string | undefined {
  if (!value) return undefined;
  try { return ['https:', 'http:'].includes(new URL(value).protocol) ? value : undefined; }
  catch { return undefined; }
}
export function ProjectCard({ project, compact = false }: { project: Project; compact?: boolean }) {
  const archived = projectGroup(project.status) === 'archived';
  const url = projectLink(project.url);
  const github = projectLink(project.github);
  return <article className={compact
    ? 'group border-b border-[var(--color-line)] py-6 first:pt-0 last:border-b-0'
    : 'group flex h-full min-w-0 flex-col rounded-2xl border border-[var(--color-line)] bg-[var(--color-paper)] p-6 transition-colors hover:border-[var(--color-line-2)]'}>
    <div className="mb-3 flex items-start justify-between gap-4">
      <h3 className={`${compact ? 'text-[17px]' : 'text-[19px]'} min-w-0 break-words font-medium leading-snug tracking-[-0.025em] text-[var(--color-ink)]`}>{project.title}</h3>
      <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-medium ${archived ? 'border-[var(--color-line-2)] text-[var(--color-ink-3)]' : 'border-emerald-500/20 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400'}`}>
        {!archived && <span aria-hidden="true" className="h-1 w-1 rounded-full bg-current" />}{projectStatusLabel(project.status)}
      </span>
    </div>
    <p className="mb-4 break-words text-[14px] leading-[1.8] text-[var(--color-ink-3)]">{project.description}</p>
    {project.stack.length > 0 && <ul aria-label="Teknologi" className="mb-5 flex list-none flex-wrap gap-1.5">
      {project.stack.map((stack, index) => <li key={`${stack}-${index}`} className="rounded-md bg-[var(--color-paper-2)] px-2 py-1 text-[10.5px] text-[var(--color-ink-3)]">{stack}</li>)}
    </ul>}
    {(url || github) && <div className="mt-auto flex flex-wrap items-center gap-x-5 gap-y-2 text-xs">
      {url && <a href={url} target="_blank" rel="noopener noreferrer" aria-label={`Buka ${project.title}`} className="inline-flex items-center gap-1.5 text-[var(--color-ink)] underline decoration-[var(--color-line-2)] underline-offset-4 hover:text-[var(--color-accent)]">Buka proyek <span aria-hidden="true">↗</span></a>}
      {github && <a href={github} target="_blank" rel="noopener noreferrer" aria-label={`Source code ${project.title}`} className="text-[var(--color-ink-3)] underline decoration-[var(--color-line-2)] underline-offset-4 hover:text-[var(--color-accent)]">Source code</a>}
    </div>}
  </article>;
}
