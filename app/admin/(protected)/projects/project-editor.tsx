'use client';

import { useActionState, useTransition } from 'react';
import { useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  createProject,
  updateProject,
  deleteProject,
  type ProjectFormState,
} from './actions';

type Project = {
  id?: number;
  title: string;
  description: string;
  stack: string[];
  status: 'live' | 'wip' | 'archived';
  url: string | null;
  github_url: string | null;
  display_order: number;
};

const DEFAULT: Project = {
  title: '',
  description: '',
  stack: [],
  status: 'wip',
  url: null,
  github_url: null,
  display_order: 0,
};

export function ProjectEditor({ project = DEFAULT }: { project?: Project }) {
  const isNew = !project.id;
  const action = isNew
    ? createProject
    : (updateProject.bind(null, project.id!) as typeof createProject);

  const [state, formAction] = useActionState<ProjectFormState, FormData>(
    action as unknown as (state: ProjectFormState, fd: FormData) => Promise<ProjectFormState>,
    null
  );
  const [, startTransition] = useTransition();
  const router = useRouter();

  const onDelete = () => {
    if (!project.id) return;
    if (!confirm(`Hapus project "${project.title}"?`)) return;
    startTransition(async () => {
      const result = await deleteProject(project.id!);
      if (result.ok) router.push('/admin/projects');
    });
  };

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin/projects"
          className="mb-2 inline-flex items-center gap-1 text-[12px] text-[var(--color-ink-3)] transition-colors hover:text-[var(--color-accent)]"
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          projects
        </Link>
        <h1 className="text-[28px] font-medium tracking-[-0.025em] text-[var(--color-ink)]">
          {isNew ? 'New project' : 'Edit project'}
        </h1>
      </div>

      <form action={formAction} className="space-y-5">
        <div>
          <Label>title</Label>
          <input
            type="text"
            name="title"
            defaultValue={project.title}
            required
            maxLength={100}
            autoFocus={isNew}
            className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2 text-[15px] text-[var(--color-ink)] transition-colors focus:border-[var(--color-accent)]"
          />
        </div>

        <div>
          <Label>description</Label>
          <textarea
            name="description"
            defaultValue={project.description}
            required
            maxLength={500}
            rows={3}
            className="w-full resize-y rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2 text-[14px] text-[var(--color-ink)] transition-colors focus:border-[var(--color-accent)]"
          />
        </div>

        <div className="grid grid-cols-3 gap-4 max-md:grid-cols-1">
          <div>
            <Label>stack (comma-separated)</Label>
            <input
              type="text"
              name="stack"
              defaultValue={project.stack.join(', ')}
              placeholder="Next.js, Postgres"
              className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2 font-mono text-[13px] text-[var(--color-ink)] transition-colors focus:border-[var(--color-accent)]"
            />
          </div>
          <div>
            <Label>status</Label>
            <select
              name="status"
              defaultValue={project.status}
              className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2 text-[13.5px] text-[var(--color-ink)] transition-colors focus:border-[var(--color-accent)]"
            >
              <option value="live">live</option>
              <option value="wip">wip</option>
              <option value="archived">archived</option>
            </select>
          </div>
          <div>
            <Label>display order</Label>
            <input
              type="number"
              name="display_order"
              defaultValue={project.display_order}
              step={10}
              className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2 font-mono text-[13px] text-[var(--color-ink)] transition-colors focus:border-[var(--color-accent)]"
            />
            <p className="mt-1 font-mono text-[11px] text-[var(--color-ink-4)]">
              higher = appears first. 0 = bottom.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
          <div>
            <Label>live URL (optional)</Label>
            <input
              type="text"
              name="url"
              defaultValue={project.url ?? ''}
              placeholder="https://..."
              className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2 font-mono text-[13px] text-[var(--color-ink)] transition-colors focus:border-[var(--color-accent)]"
            />
          </div>
          <div>
            <Label>github URL (optional)</Label>
            <input
              type="text"
              name="github_url"
              defaultValue={project.github_url ?? ''}
              placeholder="https://github.com/..."
              className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2 font-mono text-[13px] text-[var(--color-ink)] transition-colors focus:border-[var(--color-accent)]"
            />
          </div>
        </div>

        {state && !state.ok && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/5 px-3 py-2 text-[13px] text-red-600 dark:text-red-400">
            {state.error}
          </div>
        )}
        {state?.ok && (
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 text-[13px] text-emerald-600 dark:text-emerald-400">
            Saved.
          </div>
        )}

        <div className="flex items-center justify-between gap-3 border-t border-[var(--color-line)] pt-5">
          <SubmitButton isNew={isNew} />
          {!isNew && (
            <button
              type="button"
              onClick={onDelete}
              className="rounded-md border border-red-500/30 px-3 py-1.5 font-mono text-[12px] text-red-600 transition-colors hover:border-red-500/60 hover:bg-red-500/5 dark:text-red-400"
            >
              delete project
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-1.5 block font-mono text-[11.5px] uppercase tracking-wide text-[var(--color-ink-3)]">
      {children}
    </label>
  );
}

function SubmitButton({ isNew }: { isNew: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-[var(--color-ink)] px-4 py-2 text-[13.5px] font-medium tracking-tight text-[var(--color-paper)] transition-opacity hover:opacity-85 disabled:cursor-wait disabled:opacity-60"
    >
      {pending ? 'Saving...' : isNew ? 'Create project' : 'Save changes'}
    </button>
  );
}
