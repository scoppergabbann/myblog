'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable, type BulkAction, type Column } from '@/components/admin/data-table';
import { useToast } from '@/components/admin/toast';
import { formatAudioDuration, monologCategoryLabel } from '@/lib/monolog-shared';
import { formatDate } from '@/lib/utils';
import type { MonologCategory, MonologCategorySlug, MonologStatus } from '@/types/monolog';
import { deleteMonolog, setMonologArchived, setMonologPinned, setMonologStatus, type MonologActionResult } from './actions';

export type MonologAdminRow = {
  id: number;
  slug: string;
  title: string;
  description: string;
  category: MonologCategorySlug;
  duration_seconds: number;
  status: MonologStatus;
  published_at: string | null;
  is_pinned: boolean;
  archived_at: string | null;
  updated_at: string;
};

type MonologFilter = MonologStatus | 'all' | 'archived';

export function MonologTable({ initialData, categories }: { initialData: MonologAdminRow[]; categories: MonologCategory[] }) {
  const [filter, setFilter] = useState<MonologFilter>('all');
  const [busy, setBusy] = useState(false);
  const [, startTransition] = useTransition();
  const router = useRouter();
  const toast = useToast();
  const data = filter === 'all'
    ? initialData
    : filter === 'archived'
      ? initialData.filter((row) => Boolean(row.archived_at))
      : initialData.filter((row) => row.status === filter && !row.archived_at);

  async function run(rows: MonologAdminRow[], operation: (row: MonologAdminRow) => Promise<MonologActionResult>, success: string) {
    if (busy || rows.length === 0) return;
    setBusy(true);
    const failures: string[] = [];
    let completed = 0;
    try {
      for (const row of rows) {
        const result = await operation(row);
        if (result.ok) completed += 1;
        else failures.push(result.error);
      }
      if (failures.length) toast.error(`${completed} berhasil, ${failures.length} gagal. ${failures[0]}`);
      else toast.success(success);
    } catch {
      toast.error('Perubahan gagal disimpan. Coba muat ulang halaman.');
    } finally {
      setBusy(false);
      router.refresh();
    }
  }

  const button = 'rounded-md border border-[var(--color-line)] px-2 py-1 text-[11px] text-[var(--color-ink-3)] hover:border-[var(--color-line-2)] hover:text-[var(--color-ink)] disabled:opacity-40';
  const columns: Column<MonologAdminRow>[] = [
    { key: 'status', header: 'Status', width: '95px', render: (row) => <span className={`inline-flex rounded-full border px-2 py-1 font-mono text-[10px] ${row.archived_at ? 'border-slate-500/30 text-slate-500' : row.status === 'published' ? 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400' : 'border-[var(--color-line-2)] text-[var(--color-accent)]'}`}>{row.archived_at ? 'archived' : row.status}</span> },
    { key: 'title', header: 'Episode', render: (row) => <div><div className="flex items-center gap-2"><Link href={`/admin/monolog/${row.id}`} className="font-medium text-[var(--color-ink)] hover:text-[var(--color-accent)]">{row.title}</Link>{row.is_pinned && !row.archived_at && <span title="Disematkan" className="text-[var(--color-accent)]">◆</span>}</div><p className="mt-1 line-clamp-2 text-xs text-[var(--color-ink-3)]">{row.description}</p></div> },
    { key: 'category', header: 'Kategori', width: '110px', render: (row) => <span className="text-xs text-[var(--color-ink-3)]">{monologCategoryLabel(row.category, categories)}</span> },
    { key: 'duration', header: 'Durasi', width: '70px', render: (row) => <span className="font-mono text-xs text-[var(--color-ink-3)]">{row.duration_seconds > 0 ? formatAudioDuration(row.duration_seconds) : '—'}</span> },
    { key: 'date', header: 'Publikasi', width: '105px', render: (row) => <span className="text-xs text-[var(--color-ink-4)]">{row.published_at ? formatDate(row.published_at) : '—'}</span> },
    { key: 'actions', header: 'Kelola', width: '250px', render: (row) => <div className="flex flex-wrap gap-1.5">
      <Link href={`/admin/monolog/${row.id}`} className={button}>Edit</Link>
      {!row.archived_at && row.status === 'published' && <button type="button" disabled={busy} className={row.is_pinned ? `${button} border-[var(--color-accent)] text-[var(--color-accent)]` : button} onClick={() => startTransition(async () => {
        await run([row], (item) => setMonologPinned(item.id, !item.is_pinned), row.is_pinned ? 'Pin episode dilepas.' : 'Episode disematkan.');
      })}>{row.is_pinned ? 'Unpin' : 'Pin'}</button>}
      {!row.archived_at && <button type="button" disabled={busy} className={row.status === 'published' ? button : `${button} border-emerald-500/30 text-emerald-600 dark:text-emerald-400`} onClick={() => startTransition(async () => {
        await run([row], (item) => setMonologStatus(item.id, item.status === 'published' ? 'draft' : 'published'), row.status === 'published' ? 'Episode menjadi draft.' : 'Episode diterbitkan.');
      })}>{row.status === 'published' ? 'Unpublish' : 'Publish'}</button>}
      <button type="button" disabled={busy} className={button} onClick={() => startTransition(async () => {
        await run([row], (item) => setMonologArchived(item.id, !item.archived_at), row.archived_at ? 'Episode dipulihkan dari arsip.' : 'Episode diarsipkan.');
      })}>{row.archived_at ? 'Restore' : 'Archive'}</button>
      <button type="button" disabled={busy} className={`${button} text-red-600 dark:text-red-400`} onClick={() => {
        if (!confirm(`Hapus episode "${row.title}" beserta file audionya?`)) return;
        startTransition(async () => { await run([row], (item) => deleteMonolog(item.id), 'Episode dihapus.'); });
      }}>Hapus</button>
    </div> },
  ];

  const bulkActions: BulkAction<MonologAdminRow>[] = [
    { label: 'Publish', onAction: async (rows) => run(rows, (row) => setMonologStatus(row.id, 'published'), 'Episode terpilih diterbitkan.') },
    { label: 'Draft', onAction: async (rows) => run(rows, (row) => setMonologStatus(row.id, 'draft'), 'Episode terpilih menjadi draft.') },
    { label: 'Archive', onAction: async (rows) => run(rows, (row) => setMonologArchived(row.id, true), 'Episode terpilih diarsipkan.') },
    { label: 'Restore', onAction: async (rows) => run(rows, (row) => setMonologArchived(row.id, false), 'Episode terpilih dipulihkan.') },
    { label: 'Hapus', variant: 'danger', confirm: 'Hapus episode terpilih beserta file audionya?', onAction: async (rows) => run(rows, (row) => deleteMonolog(row.id), 'Episode terpilih dihapus.') },
  ];

  return <div>
    <div aria-label="Filter status Monolog" className="mb-5 flex flex-wrap gap-2">
      {(['all', 'published', 'draft', 'archived'] as const).map((status) => {
        const count = status === 'all'
          ? initialData.length
          : status === 'archived'
            ? initialData.filter((row) => Boolean(row.archived_at)).length
            : initialData.filter((row) => row.status === status && !row.archived_at).length;
        return <button key={status} type="button" aria-pressed={filter === status} disabled={busy} onClick={() => setFilter(status)} className={`rounded-lg border px-3 py-2 text-xs capitalize ${filter === status ? 'border-[var(--color-ink)] bg-[var(--color-ink)] text-[var(--color-paper)]' : 'border-[var(--color-line)] text-[var(--color-ink-3)] hover:bg-[var(--color-paper-2)]'}`}>{status}<span className="ml-2 opacity-65">{count}</span></button>;
      })}
    </div>
    <fieldset disabled={busy} className="min-w-0">
      <DataTable data={data} columns={columns} rowId={(row) => row.id} bulkActions={bulkActions} emptyMessage="Belum ada episode Monolog." filterPlaceholder="Cari judul, deskripsi, kategori…" filterFn={(row, query) => row.title.toLowerCase().includes(query) || row.description.toLowerCase().includes(query) || monologCategoryLabel(row.category, categories).toLowerCase().includes(query)} />
    </fieldset>
    {busy && <p role="status" className="mt-3 text-xs text-[var(--color-ink-3)]">Menyimpan perubahan…</p>}
  </div>;
}
