import Link from 'next/link';
import { createSupabaseAdmin } from '@/lib/supabase/admin';
import { HomeMetaForm } from './meta-form';
import { QuickLinksEditor } from './quick-links-editor';
import type { HomeMetaInput } from './actions';

export const dynamic = 'force-dynamic';

async function getData() {
  const supabase = createSupabaseAdmin();
  const [metaRes, linksRes] = await Promise.all([
    supabase
      .from('home_meta')
      .select(
        'mono_label, hero_intro, hero_accent_1, hero_accent_2, hero_accent_3, hero_outro, lead, location, timezone, est_year, focus_title, focus_body'
      )
      .eq('id', 1)
      .maybeSingle(),
    supabase
      .from('home_quick_links')
      .select('id, label, href')
      .order('display_order', { ascending: false })
      .order('id', { ascending: true }),
  ]);

  return {
    meta: (metaRes.data ?? null) as HomeMetaInput | null,
    links: (linksRes.data ?? []) as { id: number; label: string; href: string }[],
  };
}

export default async function AdminHomePage() {
  const { meta, links } = await getData();

  if (!meta) {
    return (
      <div>
        <h1 className="mb-3 text-[28px] font-medium tracking-[-0.025em] text-[var(--color-ink)]">
          Home page
        </h1>
        <div className="rounded-[12px] border border-red-500/30 bg-red-500/5 p-4 text-[13.5px] text-red-600 dark:text-red-400">
          Tabel <code>home_meta</code> belum ada. Run migration{' '}
          <code>supabase/migrations/004_home_about.sql</code> di Supabase SQL Editor.
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-baseline justify-between gap-4">
        <div>
          <h1 className="mb-1 text-[28px] font-medium tracking-[-0.025em] text-[var(--color-ink)]">
            Home page
          </h1>
          <p className="text-sm text-[var(--color-ink-3)]">
            Edit hero, fokus, meta, dan quick links di halaman utama.
          </p>
        </div>
        <Link
          href="/"
          target="_blank"
          className="font-mono text-[12px] text-[var(--color-ink-3)] transition-colors hover:text-[var(--color-accent)]"
        >
          view live →
        </Link>
      </div>

      <HomeMetaForm initial={meta} />

      <div className="my-8 border-t border-[var(--color-line)]" />

      <QuickLinksEditor initial={links} />
    </div>
  );
}
