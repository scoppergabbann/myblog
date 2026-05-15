import type { Project } from '@/types/content';

export function ProjectCard({ project }: { project: Project }) {
  const href = project.url || project.github || '#';
  const isExternal = href.startsWith('http');

  return (
    <a
      href={href}
      target={isExternal ? '_blank' : undefined}
      rel={isExternal ? 'noopener noreferrer' : undefined}
      className="block rounded-[14px] border border-[var(--color-line)] bg-[var(--color-paper)] p-5 transition-colors duration-200 hover:border-[var(--color-line-2)]"
    >
      <div className="mb-3.5 flex items-start justify-between">
        <h3 className="text-[15px] font-medium tracking-tight text-[var(--color-ink)]">
          {project.title}
        </h3>
        <span
          className={`flex-shrink-0 rounded-full border px-2 py-[2px] font-mono text-[10.5px] tracking-wide ${
            project.status === 'live'
              ? 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
              : project.status === 'wip'
              ? 'border-[color-mix(in_srgb,var(--color-accent)_35%,transparent)] text-[var(--color-accent)]'
              : 'border-[var(--color-line-2)] text-[var(--color-ink-3)]'
          }`}
        >
          {project.status === 'live'
            ? 'live'
            : project.status === 'wip'
            ? 'wip'
            : 'archived'}
        </span>
      </div>
      <p className="mb-3.5 text-[13.5px] leading-[1.55] text-[var(--color-ink-3)]">
        {project.description}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {project.stack.map((s) => (
          <span
            key={s}
            className="rounded font-mono text-[11px] tracking-tight text-[var(--color-ink-3)]"
            style={{
              background: 'var(--color-paper-2)',
              padding: '2px 8px',
            }}
          >
            {s}
          </span>
        ))}
      </div>
    </a>
  );
}
