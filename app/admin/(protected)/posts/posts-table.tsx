'use client';

import Link from 'next/link';
import { useOptimistic, useTransition } from 'react';
import { DataTable, type Column, type BulkAction } from '@/components/admin/data-table';
import { formatDate } from '@/lib/utils';
import { deletePost, setPostStatus } from './actions';

type Row = {
  id: number;
  slug: string;
  title: string;
  summary: string;
  tags: string[];
  status: 'draft' | 'published' | 'archived';
  published_at: string | null;
  updated_at: string;
};

type Action =
  | { type: 'status'; ids: number[]; status: Row['status'] }
  | { type: 'delete'; ids: number[] };

const STATUS_STYLES: Record<Row['status'], string> = {
  published: 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400',
  draft: 'border-[color-mix(in_srgb,var(--color-accent)_35%,transparent)] text-[var(--color-accent)]',
  archived: 'border-[var(--color-line-2)] text-[var(--color-ink-3)]',
};

export function PostsTable({ initialData }: { initialData: Row[] }) {
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
      width: '90px',
      render: (r) => (
        <span
          className={`inline-flex rounded-full border px-2 py-[2px] font-mono text-[10.5px] tracking-wide ${STATUS_STYLES[r.status]}`}
        >
          {r.status}
        </span>
      ),
    },
    {
      key: 'title',
      header: 'judul',
      render: (r) => (
        <Link
          href={`/admin/posts/${r.id}`}
          className="block font-medium text-[var(--color-ink)] transition-colors hover:text-[var(--color-accent)]"
        >
          {r.title}
        </Link>
      ),
    },
    {
      key: 'slug',
      header: 'slug',
      width: '180px',
      render: (r) => (
        <span className="font-mono text-[11.5px] text-[var(--color-ink-3)]">
          {r.slug}
        </span>
      ),
    },
    {
      key: 'tags',
      header: 'tags',
      width: '140px',
      render: (r) =>
        r.tags.length > 0 ? (
          <span className="font-mono text-[11px] text-[var(--color-ink-3)]">
            {r.tags.join(', ')}
          </span>
        ) : (
          <span className="text-[var(--color-ink-4)]">—</span>
        ),
    },
    {
      key: 'updated',
      header: 'updated',
      width: '100px',
      render: (r) => (
        <span className="font-mono text-[11.5px] text-[var(--color-ink-4)]">
          {formatDate(r.updated_at)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      width: '180px',
      render: (r) => (
        <div className="flex flex-wrap gap-1">
          <Link
            href={`/admin/posts/${r.id}`}
            className="rounded-md border border-[var(--color-line)] px-2 py-0.5 font-mono text-[10.5px] text-[var(--color-ink-3)] transition-colors hover:border-[color-mix(in_srgb,var(--color-accent)_30%,transparent)] hover:text-[var(--color-accent)]"
          >
            edit
          </Link>
          {r.status === 'published' ? (
            <button
              type="button"
              onClick={() => {
                startTransition(async () => {
                  applyOptimistic({
                    type: 'status',
                    ids: [r.id],
                    status: 'draft',
                  });
                  await setPostStatus(r.id, 'draft');
                });
              }}
              className="rounded-md border border-[var(--color-line)] px-2 py-0.5 font-mono text-[10.5px] text-[var(--color-ink-3)] transition-colors hover:border-[color-mix(in_srgb,var(--color-accent)_30%,transparent)] hover:text-[var(--color-accent)]"
            >
              unpublish
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                startTransition(async () => {
                  applyOptimistic({
                    type: 'status',
                    ids: [r.id],
                    status: 'published',
                  });
                  await setPostStatus(r.id, 'published');
                });
              }}
              className="rounded-md border border-emerald-500/30 px-2 py-0.5 font-mono text-[10.5px] text-emerald-600 transition-colors hover:border-emerald-500/60 hover:bg-emerald-500/5 dark:text-emerald-400"
            >
              publish
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              if (!confirm(`Hapus post "${r.title}"? Tidak bisa undo.`)) return;
              startTransition(async () => {
                applyOptimistic({ type: 'delete', ids: [r.id] });
                await deletePost(r.id);
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
      label: 'publish',
      onAction: async (rows) => {
        const ids = rows.map((r) => r.id);
        startTransition(async () => {
          applyOptimistic({ type: 'status', ids, status: 'published' });
          for (const id of ids) await setPostStatus(id, 'published');
        });
      },
    },
    {
      label: 'draft',
      onAction: async (rows) => {
        const ids = rows.map((r) => r.id);
        startTransition(async () => {
          applyOptimistic({ type: 'status', ids, status: 'draft' });
          for (const id of ids) await setPostStatus(id, 'draft');
        });
      },
    },
    {
      label: 'archive',
      onAction: async (rows) => {
        const ids = rows.map((r) => r.id);
        startTransition(async () => {
          applyOptimistic({ type: 'status', ids, status: 'archived' });
          for (const id of ids) await setPostStatus(id, 'archived');
        });
      },
    },
    {
      label: 'delete',
      variant: 'danger',
      confirm: 'Hapus semua post terpilih? Tidak bisa undo.',
      onAction: async (rows) => {
        const ids = rows.map((r) => r.id);
        startTransition(async () => {
          applyOptimistic({ type: 'delete', ids });
          for (const id of ids) await deletePost(id);
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
      emptyMessage="Belum ada post. Klik 'New post' untuk mulai."
      filterPlaceholder="Filter judul, slug, atau tag..."
      filterFn={(r, q) =>
        r.title.toLowerCase().includes(q) ||
        r.slug.toLowerCase().includes(q) ||
        r.tags.some((t) => t.toLowerCase().includes(q))
      }
    />
  );
}
