'use client';
import Link from 'next/link';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable, type Column, type BulkAction } from '@/components/admin/data-table';
import { useToast } from '@/components/admin/toast';
import { projectGroup, projectStatusLabel, type ProjectGroup } from '@/lib/project-status';
import { deleteProject, setProjectStatus } from './actions';

type Row = { id: number; title: string; description: string; stack: string[]; status: 'live' | 'wip' | 'archived'; url: string | null; github_url: string | null; display_order: number };
type Result = { ok: boolean; error?: string };
const button = 'rounded-md border border-[var(--color-line)] px-2 py-1 text-xs text-[var(--color-ink-3)] hover:border-[var(--color-line-2)] hover:text-[var(--color-ink)] disabled:opacity-40';
export function ProjectsTable({ initialData }: { initialData: Row[] }) {
  const [filter, setFilter] = useState<ProjectGroup | 'all'>('active');
  const [busy, setBusy] = useState(false);
  const [, startTransition] = useTransition();
  const router = useRouter();
  const toast = useToast();
  const activeCount = initialData.filter(row => projectGroup(row.status) === 'active').length;
  const archivedCount = initialData.length - activeCount;
  const data = filter === 'all' ? initialData : initialData.filter(row => projectGroup(row.status) === filter);
  async function run(rows: Row[], operation: (row: Row) => Promise<Result>, message: string) {
    if (busy) return;
    setBusy(true);
    let succeeded = 0;
    const failures: string[] = [];
    try {
      for (const row of rows) {
        const result = await operation(row);
        if (result.ok) succeeded++; else failures.push(result.error || 'Perubahan gagal disimpan.');
      }
      if (failures.length) toast.error(`${succeeded} berhasil, ${failures.length} gagal. ${failures[0]}`);
      else toast.success(message);
    } catch { toast.error('Perubahan belum selesai. Muat ulang untuk melihat status terbaru.'); }
    finally { router.refresh(); setBusy(false); }
  }
  const columns: Column<Row>[] = [
    { key: 'title', header: 'Project', render: row => <div><Link href={`/admin/projects/${row.id}`} className="font-medium text-[var(--color-ink)] hover:text-[var(--color-accent)]">{row.title}</Link><p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[var(--color-ink-3)]">{row.description}</p></div> },
    { key: 'status', header: 'Status', width: '100px', render: row => <span className={`inline-flex rounded-full border px-2 py-1 text-[10.5px] ${projectGroup(row.status) === 'active' ? 'border-emerald-500/25 text-emerald-700 dark:text-emerald-400' : 'border-[var(--color-line-2)] text-[var(--color-ink-3)]'}`}>{projectStatusLabel(row.status)}</span> },
    { key: 'stack', header: 'Stack', width: '150px', render: row => <span className="text-xs text-[var(--color-ink-3)]">{row.stack.join(', ') || '—'}</span> },
    { key: 'order', header: 'Urutan', width: '65px', render: row => <span className="text-xs text-[var(--color-ink-3)]">{row.display_order}</span> },
    { key: 'actions', header: 'Kelola', width: '170px', render: row => <div className="flex flex-wrap gap-1.5">
      <Link href={`/admin/projects/${row.id}`} className={button}>Edit</Link>
      <button type="button" className={button} disabled={busy} onClick={() => startTransition(async () => {
        const archived = projectGroup(row.status) === 'archived';
        await run([row], item => setProjectStatus(item.id, archived ? 'live' : 'archived'), archived ? 'Project dikembalikan ke Active.' : 'Project diarsipkan.');
      })}>{projectGroup(row.status) === 'archived' ? 'Restore' : 'Archive'}</button>
      <button type="button" className={`${button} text-red-600`} disabled={busy} onClick={() => {
        if (!confirm(`Hapus project "${row.title}"?`)) return;
        startTransition(async () => { await run([row], item => deleteProject(item.id), 'Project dihapus.'); });
      }}>Hapus</button>
    </div> },
  ];
  const bulkActions: BulkAction<Row>[] = [
    { label: 'Set Active', onAction: async rows => { await run(rows, row => setProjectStatus(row.id, 'live'), 'Project terpilih dipindahkan ke Active.'); } },
    { label: 'Archive', onAction: async rows => { await run(rows, row => setProjectStatus(row.id, 'archived'), 'Project terpilih diarsipkan.'); } },
    { label: 'Hapus', variant: 'danger', confirm: 'Hapus semua project terpilih?', onAction: async rows => { await run(rows, row => deleteProject(row.id), 'Project terpilih dihapus.'); } },
  ];
  return <div>
    <div aria-label="Filter status project" className="mb-5 flex flex-wrap gap-2">
      {([['active', 'Active Projects', activeCount], ['archived', 'Archived Projects', archivedCount], ['all', 'Semua', initialData.length]] as const).map(([key, label, count]) => <button key={key} type="button" aria-pressed={filter === key} disabled={busy} onClick={() => setFilter(key)} className={`rounded-lg border px-3 py-2 text-xs transition-colors ${filter === key ? 'border-[var(--color-ink)] bg-[var(--color-ink)] text-[var(--color-paper)]' : 'border-[var(--color-line)] text-[var(--color-ink-3)] hover:bg-[var(--color-paper-2)]'}`}>{label}<span className="ml-2 opacity-65">{count}</span></button>)}
    </div>
    <fieldset disabled={busy} className="min-w-0">
      <DataTable<Row> key={filter} data={data} columns={columns} rowId={row => row.id} bulkActions={bulkActions}
        emptyMessage={filter === 'archived' ? 'Belum ada project yang diarsipkan.' : filter === 'active' ? 'Belum ada project aktif.' : 'Belum ada project. Tambahkan project pertama kamu.'}
        filterPlaceholder="Cari judul, deskripsi, atau stack..."
        filterFn={(row, query) => row.title.toLowerCase().includes(query) || row.description.toLowerCase().includes(query) || row.stack.some(stack => stack.toLowerCase().includes(query))} />
    </fieldset>
    {busy && <p role="status" className="mt-3 text-xs text-[var(--color-ink-3)]">Menyimpan perubahan...</p>}
  </div>;
}
