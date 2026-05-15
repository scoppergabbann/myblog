'use client';

import Link from 'next/link';
import { useOptimistic, useTransition } from 'react';
import { DataTable, type Column, type BulkAction } from '@/components/admin/data-table';
import { formatDate } from '@/lib/utils';
import {
  setCommentApproval,
  deleteComment,
  bulkActionComments,
} from './actions';

type Row = {
  id: number;
  slug: string;
  name: string;
  message: string;
  approved: boolean;
  created_at: string;
};

type Action =
  | { type: 'approve'; ids: number[]; approved: boolean }
  | { type: 'delete'; ids: number[] };

export function CommentsTable({ initialData }: { initialData: Row[] }) {
  const [optimistic, applyOptimistic] = useOptimistic<Row[], Action>(
    initialData,
    (state, action) => {
      if (action.type === 'delete') {
        return state.filter((r) => !action.ids.includes(r.id));
      }
      return state.map((r) =>
        action.ids.includes(r.id) ? { ...r, approved: action.approved } : r
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
          className={`inline-flex rounded-full border px-2 py-[2px] font-mono text-[10.5px] tracking-wide ${
            r.approved
              ? 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
              : 'border-[color-mix(in_srgb,var(--color-accent)_35%,transparent)] text-[var(--color-accent)]'
          }`}
        >
          {r.approved ? 'live' : 'pending'}
        </span>
      ),
    },
    {
      key: 'article',
      header: 'artikel',
      width: '180px',
      render: (r) => (
        <Link
          href={`/writing/${r.slug}#comments`}
          target="_blank"
          className="inline-block max-w-full truncate font-mono text-[11.5px] text-[var(--color-ink-3)] transition-colors hover:text-[var(--color-accent)]"
        >
          {r.slug}
        </Link>
      ),
    },
    {
      key: 'name',
      header: 'nama',
      width: '140px',
      render: (r) => (
        <span className="font-medium text-[var(--color-ink)]">{r.name}</span>
      ),
    },
    {
      key: 'message',
      header: 'komentar',
      render: (r) => (
        <p className="whitespace-pre-wrap text-[var(--color-ink-2)]">
          {r.message}
        </p>
      ),
    },
    {
      key: 'date',
      header: 'tanggal',
      width: '100px',
      render: (r) => (
        <span className="font-mono text-[11.5px] text-[var(--color-ink-4)]">
          {formatDate(r.created_at)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      width: '140px',
      render: (r) => (
        <div className="flex flex-wrap gap-1">
          <button
            type="button"
            onClick={() => {
              startTransition(async () => {
                applyOptimistic({
                  type: 'approve',
                  ids: [r.id],
                  approved: !r.approved,
                });
                await setCommentApproval(r.id, !r.approved);
              });
            }}
            className="rounded-md border border-[var(--color-line)] px-2 py-0.5 font-mono text-[10.5px] text-[var(--color-ink-3)] transition-colors hover:border-[color-mix(in_srgb,var(--color-accent)_30%,transparent)] hover:text-[var(--color-accent)]"
          >
            {r.approved ? 'reject' : 'approve'}
          </button>
          <button
            type="button"
            onClick={() => {
              if (!confirm(`Hapus komentar dari ${r.name}?`)) return;
              startTransition(async () => {
                applyOptimistic({ type: 'delete', ids: [r.id] });
                await deleteComment(r.id);
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
      label: 'approve',
      onAction: async (rows) => {
        const ids = rows.map((r) => r.id);
        startTransition(async () => {
          applyOptimistic({ type: 'approve', ids, approved: true });
          await bulkActionComments(ids, 'approve');
        });
      },
    },
    {
      label: 'reject',
      onAction: async (rows) => {
        const ids = rows.map((r) => r.id);
        startTransition(async () => {
          applyOptimistic({ type: 'approve', ids, approved: false });
          await bulkActionComments(ids, 'reject');
        });
      },
    },
    {
      label: 'delete',
      variant: 'danger',
      confirm: 'Hapus semua komentar terpilih?',
      onAction: async (rows) => {
        const ids = rows.map((r) => r.id);
        startTransition(async () => {
          applyOptimistic({ type: 'delete', ids });
          await bulkActionComments(ids, 'delete');
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
      emptyMessage="Belum ada komentar."
      filterPlaceholder="Filter nama, artikel, atau komentar..."
      filterFn={(r, q) =>
        r.name.toLowerCase().includes(q) ||
        r.message.toLowerCase().includes(q) ||
        r.slug.toLowerCase().includes(q)
      }
    />
  );
}
