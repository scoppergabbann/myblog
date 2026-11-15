import Link from 'next/link';
import { createSupabaseAdmin } from '@/lib/supabase/admin';
import { MonologTable, type MonologAdminRow } from './monolog-table';

export const dynamic = 'force-dynamic';

export default async function AdminMonologPage() {
  const { data, error } = await createSupabaseAdmin()
    .from('monolog_episodes')
    .select('id, slug, title, description, category, duration_seconds, status, published_at, updated_at')
    .order('updated_at', { ascending: false });

  const migrationMissing = error?.code === 'PGRST205' || error?.code === '42P01';
  if (error && !migrationMissing) throw new Error(`Data Monolog tidak tersedia: ${error.message}`);
  const episodes = (data ?? []) as MonologAdminRow[];
  const published = episodes.filter((episode) => episode.status === 'published').length;
  const drafts = episodes.length - published;

  return <div>
    <div className="mb-6 flex flex-wrap items-baseline justify-between gap-4">
      <div>
        <h1 className="mb-1 text-[28px] font-medium tracking-[-0.025em] text-[var(--color-ink)]">Monolog</h1>
        <p className="text-sm text-[var(--color-ink-3)]">{episodes.length} total · <span className="text-emerald-600 dark:text-emerald-400">{published} published</span> · <span className="text-[var(--color-accent)]">{drafts} draft</span></p>
      </div>
      {!migrationMissing && <Link href="/admin/monolog/new" className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-[var(--color-ink)] px-3.5 py-2 text-[13px] font-medium text-[var(--color-paper)] hover:opacity-85"><span aria-hidden="true">＋</span> Tambah episode</Link>}
    </div>

    {migrationMissing ? (
      <div className="rounded-xl border border-[color-mix(in_srgb,var(--color-accent)_35%,transparent)] bg-[var(--color-accent-soft)] p-5">
        <h2 className="font-medium text-[var(--color-ink)]">Aktifkan database Monolog</h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--color-ink-3)]">Jalankan file <code className="font-mono text-[var(--color-accent)]">supabase/migrations/019_monolog.sql</code> melalui SQL Editor Supabase. Migrasi ini membuat tabel episode dan bucket audio.</p>
      </div>
    ) : <MonologTable initialData={episodes} />}
  </div>;
}
