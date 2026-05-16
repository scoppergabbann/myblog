'use client';

import { useOptimistic, useTransition } from 'react';
import { DataTable, type Column, type BulkAction } from '@/components/admin/data-table';
import { formatDate } from '@/lib/utils';
import {
  setSubscriberConfirmed,
  deleteSubscriber,
  bulkActionSubscribers,
} from './actions';

type Row = {
  id: number;
  email: string;
  confirmed: boolean;
  created_at: string;
  confirmed_at: string | null;
};

type Action =
  | { type: 'confirm'; ids: number[]; confirmed: boolean }
  | { type: 'delete'; ids: number[] };

export function SubscribersTable({ initialData }: { initialData: Row[] }) {
  const [optimistic, applyOptimistic] = useOptimistic<Row[], Action>(
    initialData,
    (state, action) => {
      if (action.type === 'delete') {
        return state.filter((r) => !action.ids.includes(r.id));
      }
      return state.map((r) =>
        action.ids.includes(r.id)
          ? {
              ...r,
              confirmed: action.confirmed,
              confirmed_at: action.confirmed
                ? new Date().toISOString()
                : r.confirmed_at,
            }
          : r
      );
    }
  );
  const [, startTransition] = useTransition();

  const columns: Column<Row>[] = [
    {
      key: 'status',
      header: 'status',
      width: '100px',
      render: (r) => (
        <span
          className={`inline-flex rounded-full border px-2 py-[2px] font-mono text-[10.5px] tracking-wide ${
            r.confirmed
              ? 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
              : 'border-[color-mix(in_srgb,var(--color-accent)_35%,transparent)] text-[var(--color-accent)]'
          }`}
        >
          {r.confirmed ? 'confirmed' : 'pending'}
        </span>
      ),
    },
    {
      key: 'email',
      header: 'email',
      render: (r) => (
        <span className="break-all font-mono text-[12.5px] text-[var(--color-ink)]">
          {r.email}
        </span>
      ),
    },
    {
      key: 'created',
      header: 'subscribed',
      width: '110px',
      render: (r) => (
        <span className="font-mono text-[11.5px] text-[var(--color-ink-4)]">
          {formatDate(r.created_at)}
        </span>
      ),
    },
    {
      key: 'confirmed_at',
      header: 'confirmed',
      width: '110px',
      render: (r) =>
        r.confirmed_at ? (
          <span className="font-mono text-[11.5px] text-[var(--color-ink-4)]">
            {formatDate(r.confirmed_at)}
          </span>
        ) : (
          <span className="text-[var(--color-ink-4)]">—</span>
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
                  type: 'confirm',
                  ids: [r.id],
                  confirmed: !r.confirmed,
                });
                await setSubscriberConfirmed(r.id, !r.confirmed);
              });
            }}
            className="rounded-md border border-[var(--color-line)] px-2 py-0.5 font-mono text-[10.5px] text-[var(--color-ink-3)] transition-colors hover:border-[color-mix(in_srgb,var(--color-accent)_30%,transparent)] hover:text-[var(--color-accent)]"
          >
            {r.confirmed ? 'unconfirm' : 'confirm'}
          </button>
          <button
            type="button"
            onClick={() => {
              if (!confirm(`Hapus ${r.email} dari subscriber list?`)) return;
              startTransition(async () => {
                applyOptimistic({ type: 'delete', ids: [r.id] });
                await deleteSubscriber(r.id);
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
      label: 'confirm',
      onAction: async (rows) => {
        const ids = rows.map((r) => r.id);
        startTransition(async () => {
          applyOptimistic({ type: 'confirm', ids, confirmed: true });
          await bulkActionSubscribers(ids, 'confirm');
        });
      },
    },
    {
      label: 'unconfirm',
      onAction: async (rows) => {
        const ids = rows.map((r) => r.id);
        startTransition(async () => {
          applyOptimistic({ type: 'confirm', ids, confirmed: false });
          await bulkActionSubscribers(ids, 'unconfirm');
        });
      },
    },
    {
      label: 'delete',
      variant: 'danger',
      confirm: 'Hapus semua subscriber terpilih? Tidak bisa undo.',
      onAction: async (rows) => {
        const ids = rows.map((r) => r.id);
        startTransition(async () => {
          applyOptimistic({ type: 'delete', ids });
          await bulkActionSubscribers(ids, 'delete');
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
      emptyMessage="Belum ada subscriber. Tunggu pengunjung subscribe via footer artikel."
      filterPlaceholder="Filter email..."
      filterFn={(r, q) => r.email.toLowerCase().includes(q)}
    />
  );
}
