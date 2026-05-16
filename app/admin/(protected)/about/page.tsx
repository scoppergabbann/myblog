import Link from 'next/link';
import { createSupabaseAdmin } from '@/lib/supabase/admin';
import { AboutMetaForm } from './meta-form';
import { StackEditor } from './stack-editor';
import type { AboutMetaInput } from './actions';

export const dynamic = 'force-dynamic';

async function getData() {
  const supabase = createSupabaseAdmin();
  const [metaRes, stackRes] = await Promise.all([
    supabase
      .from('about_meta')
      .select('title, subtitle, content, contact_email, contact_intro')
      .eq('id', 1)
      .maybeSingle(),
    supabase
      .from('about_stack')
      .select('id, label, value')
      .order('display_order', { ascending: false })
      .order('id', { ascending: true }),
  ]);

  return {
    meta: (metaRes.data ?? null) as AboutMetaInput | null,
    stack: (stackRes.data ?? []) as { id: number; label: string; value: string }[],
  };
}

export default async function AdminAboutPage() {
  const { meta, stack } = await getData();

  if (!meta) {
    return (
      <div>
        <h1 className="mb-3 text-[28px] font-medium tracking-[-0.025em] text-[var(--color-ink)]">
          About page
        </h1>
        <div className="rounded-[12px] border border-red-500/30 bg-red-500/5 p-4 text-[13.5px] text-red-600 dark:text-red-400">
          Tabel <code>about_meta</code> belum ada. Run migration{' '}
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
            About page
          </h1>
          <p className="text-sm text-[var(--color-ink-3)]">
            Edit halaman /about: title, subtitle, MDX content, tech stack, dan kontak.
          </p>
        </div>
        <Link
          href="/about"
          target="_blank"
          className="font-mono text-[12px] text-[var(--color-ink-3)] transition-colors hover:text-[var(--color-accent)]"
        >
          view live →
        </Link>
      </div>

      <AboutMetaForm initial={meta} />

      <div className="my-8 border-t border-[var(--color-line)]" />

      <StackEditor initial={stack} />
    </div>
  );
}
