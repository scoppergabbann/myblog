import { createSupabaseAdmin } from '@/lib/supabase/admin';
import { formatDate } from '@/lib/utils';
import { FocusEditor } from './focus-editor';
import { NowSectionEditor } from './section-editor';
import { SpotifyEditor } from './spotify-editor';

export const dynamic = 'force-dynamic';

type Item = {
  id: number;
  section: 'learning' | 'working' | 'consuming';
  role: string;
  content: string;
  display_order: number;
};

async function getData() {
  const supabase = createSupabaseAdmin();
  const [itemsRes, metaRes] = await Promise.all([
    supabase
      .from('now_items')
      .select('id, section, role, content, display_order')
      .order('display_order', { ascending: false }),
    supabase
      .from('now_meta')
      .select('focus, updated_at, spotify_url')
      .eq('id', 1)
      .maybeSingle(),
  ]);

  const items = (itemsRes.data ?? []) as Item[];
  const grouped = {
    learning: items.filter((i) => i.section === 'learning'),
    working: items.filter((i) => i.section === 'working'),
    consuming: items.filter((i) => i.section === 'consuming'),
  };

  return {
    grouped,
    focus: metaRes.data?.focus ?? '',
    updated: metaRes.data?.updated_at ?? new Date().toISOString(),
    spotifyUrl: (metaRes.data?.spotify_url ?? null) as string | null,
  };
}

export default async function AdminNowPage() {
  const { grouped, focus, updated, spotifyUrl } = await getData();
  const totalItems =
    grouped.learning.length + grouped.working.length + grouped.consuming.length;

  return (
    <div>
      <div className="mb-6">
        <h1 className="mb-1 text-[28px] font-medium tracking-[-0.025em] text-[var(--color-ink)]">
          Now page
        </h1>
        <p className="text-sm text-[var(--color-ink-3)]">
          {totalItems} item · last updated{' '}
          <span className="font-mono">{formatDate(updated, true)}</span>
        </p>
      </div>

      <section className="mb-8">
        <FocusEditor initialFocus={focus} />
      </section>

      <NowSectionEditor
        title="sedang belajar"
        section="learning"
        items={grouped.learning}
      />
      <NowSectionEditor
        title="sedang dikerjakan"
        section="working"
        items={grouped.working}
      />
      <NowSectionEditor
        title="sedang dikonsumsi"
        section="consuming"
        items={grouped.consuming}
      />

      <section className="mb-8">
        <SpotifyEditor initialUrl={spotifyUrl} />
      </section>

      <p className="mt-8 font-mono text-[11px] text-[var(--color-ink-4)]">
        tip: update halaman ini minimal sebulan sekali biar terasa hidup. tombol
        &ldquo;touch updated&rdquo; di atas hanya update timestamp tanpa edit konten.
      </p>
    </div>
  );
}
