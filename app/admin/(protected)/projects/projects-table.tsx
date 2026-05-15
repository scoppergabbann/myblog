'use client';

import Link from 'next/link';
import { useOptimistic, useTransition } from 'react';
import { DataTable, type Column, type BulkAction } from '@/components/admin/data-table';
import { deleteProject, setProjectStatus } from './actions';

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

type Action =
  | { type: 'status'; ids: number[]; status: Row['status'] }
  | { type: 'delete'; ids: number[] };

const STATUS_STYLES: Record<Row['status'], string> = {
  live: 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400',
  wip: 'border-[color-mix(in_srgb,var(--color-accent)_35%,transparent)] text-[var(--color-accent)]',
  archived: 'border-[var(--color-line-2)] text-[var(--color-ink-3)]',
};

export function ProjectsTable({ initialData }: { initialData: Row[] }) {
  const [optimistic, applyOptimistic] = useOptimistic<Row[], Action>(
    initialData,
    (state, action) => {
      if (action.type === 'delete') {
        return state.filter((r) => !action.ids.includes(r.id));
      }
      return state.map((r) =>
        action.ids.includes(r.id) ? { ...r, status: action.status } : r
      );
    }
  );
  const [, startTransition] = useTransition();

  const columns: Column<Row>[] = [
    {
      key: 'status',
      header: 'status',
      width: '80px',
      render: (r) => (
        <span
          className={`inline-flex rounded-full border px-2 py-[2px] font-mono text-[10.5px] tracking-wide ${STATUS_STYLES[r.status]}`}
        >
          {r.status}
        </span>
      ),
    },
    {
      key: 'order',
      header: 'order',
      width: '60px',
      render: (r) => (
        <span className="font-mono text-[11.5px] text-[var(--color-ink-4)]">
          {r.display_order}
        </span>
      ),
    },
    {
      key: 'title',
      header: 'judul',
      width: '180px',
      render: (r) => (
        <Link
          href={`/admin/projects/${r.id}`}
          className="block font-medium text-[var(--color-ink)] transition-colors hover:text-[var(--color-accent)]"
        >
          {r.title}
        </Link>
      ),
    },
    {
      key: 'description',
      header: 'deskripsi',
      render: (r) => (
        <p className="line-clamp-2 text-[var(--color-ink-2)]">{r.description}</p>
      ),
    },
    {
      key: 'stack',
      header: 'stack',
      width: '160px',
      render: (r) => (
        <span className="font-mono text-[11px] text-[var(--color-ink-3)]">
          {r.stack.join(', ') || '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      width: '120px',
      render: (r) => (
        <div className="flex flex-wrap gap-1">
          <Link
            href={`/admin/projects/${r.id}`}
            className="rounded-md border border-[var(--color-line)] px-2 py-0.5 font-mono text-[10.5px] text-[var(--color-ink-3)] transition-colors hover:border-[color-mix(in_srgb,var(--color-accent)_30%,transparent)] hover:text-[var(--color-accent)]"
          >
            edit
          </Link>
          <button
            type="button"
            onClick={() => {
              if (!confirm(`Hapus project "${r.title}"?`)) return;
              startTransition(async () => {
                applyOptimistic({ type: 'delete', ids: [r.id] });
                await deleteProject(r.id);
              });
            }}
            className="rounded-md border border-red-500/30 px-2 py-0.5 font-mono text-[10.5px] text-red-600 transition-colors hover:border-red-500/60 hover:bg-red-500/5 dark:text-red-400"
          >
            delete
          </button>
        </div>
      ),
    },
  ];

  const bulkActions: BulkAction<Row>[] = [
    {
      label: 'live',
      onAction: async (rows) => {
        const ids = rows.map((r) => r.id);
        startTransition(async () => {
          applyOptimistic({ type: 'status', ids, status: 'live' });
          for (const id of ids) await setProjectStatus(id, 'live');
        });
      },
    },
    {
      label: 'wip',
      onAction: async (rows) => {
        const ids = rows.map((r) => r.id);
        startTransition(async () => {
          applyOptimistic({ type: 'status', ids, status: 'wip' });
          for (const id of ids) await setProjectStatus(id, 'wip');
        });
      },
    },
    {
      label: 'archive',
      onAction: async (rows) => {
        const ids = rows.map((r) => r.id);
        startTransition(async () => {
          applyOptimistic({ type: 'status', ids, status: 'archived' });
          for (const id of ids) await setProjectStatus(id, 'archived');
        });
      },
    },
    {
      label: 'delete',
      variant: 'danger',
      confirm: 'Hapus semua project terpilih?',
      onAction: async (rows) => {
        const ids = rows.map((r) => r.id);
        startTransition(async () => {
          applyOptimistic({ type: 'delete', ids });
          for (const id of ids) await deleteProject(id);
        });
      },
    },
  ];

  return (
    <DataTable<Row>
      data={optimistic}
      columns={columns}
      rowId={(r) => r.id}
      bulkActions={bulkActions}
      emptyMessage="Belum ada project. Klik 'New project' untuk mulai."
      filterPlaceholder="Filter judul, deskripsi, atau stack..."
      filterFn={(r, q) =>
        r.title.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.stack.some((s) => s.toLowerCase().includes(q))
      }
    />
  );
}
