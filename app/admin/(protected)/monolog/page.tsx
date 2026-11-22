import Link from 'next/link';
import { createSupabaseAdmin } from '@/lib/supabase/admin';
import { mapMonologCategory } from '@/lib/monolog-category-queries';
import { defaultMonologCategories } from '@/lib/monolog-shared';
import type { MonologCategory } from '@/types/monolog';
import { CategoryManager } from './category-manager';
import { MonologTable, type MonologAdminRow } from './monolog-table';

export const dynamic = 'force-dynamic';

export default async function AdminMonologPage() {
  const db = createSupabaseAdmin();
  const [{ data, error }, categoryResult] = await Promise.all([
    db.from('monolog_episodes')
      .select('id, slug, title, description, category, duration_seconds, status, published_at, is_pinned, archived_at, updated_at')
      .order('updated_at', { ascending: false }),
    db.from('monolog_categories')
      .select('id, slug, label, sort_order')
      .order('sort_order', { ascending: true })
      .order('id', { ascending: true }),
  ]);

  const migrationMissing = error?.code === 'PGRST205' || error?.code === '42P01' || error?.code === 'PGRST204';
  if (error && !migrationMissing) throw new Error(`Data Monolog tidak tersedia: ${error.message}`);
  const episodes = (data ?? []) as MonologAdminRow[];
  const categoryMigrationMissing = categoryResult.error?.code === 'PGRST205' || categoryResult.error?.code === '42P01';
  if (categoryResult.error && !categoryMigrationMissing) {
    throw new Error(`Kategori Monolog tidak tersedia: ${categoryResult.error.message}`);
  }
  const categories: MonologCategory[] = categoryMigrationMissing
    ? defaultMonologCategories
    : (categoryResult.data ?? []).map(mapMonologCategory);
  const categoryUsage = Object.fromEntries(categories.map((category) => [
    category.slug,
    episodes.filter((episode) => episode.category === category.slug).length,
  ]));
  const archived = episodes.filter((episode) => episode.archived_at).length;
  const published = episodes.filter((episode) => episode.status === 'published' && !episode.archived_at).length;
  const drafts = episodes.filter((episode) => episode.status === 'draft' && !episode.archived_at).length;

  return <div>
    <div className="mb-6 flex flex-wrap items-baseline justify-between gap-4">
      <div>
        <h1 className="mb-1 text-[28px] font-medium tracking-[-0.025em] text-[var(--color-ink)]">Monolog</h1>
        <p className="text-sm text-[var(--color-ink-3)]">{episodes.length} total · <span className="text-emerald-600 dark:text-emerald-400">{published} published</span> · <span className="text-[var(--color-accent)]">{drafts} draft</span> · <span>{archived} archived</span></p>
      </div>
      {!migrationMissing && <Link href="/admin/monolog/new" className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-[var(--color-ink)] px-3.5 py-2 text-[13px] font-medium text-[var(--color-paper)] hover:opacity-85"><span aria-hidden="true">＋</span> Tambah episode</Link>}
    </div>

    {migrationMissing ? (
      <div className="rounded-xl border border-[color-mix(in_srgb,var(--color-accent)_35%,transparent)] bg-[var(--color-accent-soft)] p-5">
        <h2 className="font-medium text-[var(--color-ink)]">Aktifkan database Monolog</h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--color-ink-3)]">Jalankan file <code className="font-mono text-[var(--color-accent)]">{error?.code === 'PGRST204' ? 'supabase/migrations/020_monolog_library_controls.sql' : 'supabase/migrations/019_monolog.sql'}</code> melalui SQL Editor Supabase.</p>
      </div>
    ) : <MonologTable initialData={episodes} categories={categories} />}

    {!migrationMissing && (
      <CategoryManager
        categories={categories}
        usage={categoryUsage}
        migrationReady={!categoryMigrationMissing}
      />
    )}
  </div>;
}
