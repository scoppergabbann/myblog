import Link from 'next/link';
import { createSupabaseAdmin } from '@/lib/supabase/admin';
import { ProjectsTable } from './projects-table';

export const dynamic = 'force-dynamic';

type Row = {
  id: number;
  title: string;
  description: string;
  stack: string[];
  status: 'live' | 'wip' | 'archived';
  url: string | null;
  github_url: string | null;
  display_order: number;
};

async function getProjects(): Promise<Row[]> {
  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from('projects')
    .select('id, title, description, stack, status, url, github_url, display_order')
    .order('display_order', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) {
    console.error('[admin.projects fetch]', error);
    return [];
  }
  return (data ?? []) as Row[];
}

export default async function AdminProjectsPage() {
  const projects = await getProjects();
  const live = projects.filter((p) => p.status === 'live').length;
  const wip = projects.filter((p) => p.status === 'wip').length;

  return (
    <div>
      <div className="mb-6 flex items-baseline justify-between gap-4">
        <div>
          <h1 className="mb-1 text-[28px] font-medium tracking-[-0.025em] text-[var(--color-ink)]">
            Projects
          </h1>
          <p className="text-sm text-[var(--color-ink-3)]">
            {projects.length} total ·{' '}
            <span className="text-emerald-600 dark:text-emerald-400">
              {live} live
            </span>{' '}
            ·{' '}
            <span className="text-[var(--color-accent)]">{wip} wip</span>
          </p>
        </div>
        <Link
          href="/admin/projects/new"
          className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--color-ink)] px-3.5 py-2 text-[13px] font-medium text-[var(--color-paper)] transition-opacity hover:opacity-85"
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New project
        </Link>
      </div>

      <ProjectsTable initialData={projects} />

      <p className="mt-4 font-mono text-[11px] text-[var(--color-ink-4)]">
        urutan ditentukan oleh display_order (descending). edit untuk ubah.
      </p>
    </div>
  );
}
