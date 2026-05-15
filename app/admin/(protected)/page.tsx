import { createSupabaseAdmin } from '@/lib/supabase/admin';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

async function getStats() {
  const supabase = createSupabaseAdmin();
  const [posts, projects, guestbook, comments, subs, views] = await Promise.all([
    supabase.from('posts').select('id, status', { count: 'exact', head: true }),
    supabase.from('projects').select('id', { count: 'exact', head: true }),
    supabase.from('guestbook').select('id, approved', { count: 'exact', head: true }),
    supabase.from('comments').select('id, approved', { count: 'exact', head: true }),
    supabase.from('subscribers').select('id, confirmed', { count: 'exact', head: true }),
    supabase.from('views').select('count'),
  ]);

  // Get pending counts separately
  const [pendingGb, pendingCom] = await Promise.all([
    supabase
      .from('guestbook')
      .select('id', { count: 'exact', head: true })
      .eq('approved', false),
    supabase
      .from('comments')
      .select('id', { count: 'exact', head: true })
      .eq('approved', false),
  ]);

  const totalViews = (views.data ?? []).reduce(
    (sum, v) => sum + (Number(v.count) || 0),
    0
  );

  return {
    posts: posts.count ?? 0,
    projects: projects.count ?? 0,
    guestbook: guestbook.count ?? 0,
    guestbookPending: pendingGb.count ?? 0,
    comments: comments.count ?? 0,
    commentsPending: pendingCom.count ?? 0,
    subscribers: subs.count ?? 0,
    totalViews,
  };
}

export default async function AdminOverview() {
  const stats = await getStats();

  const cards = [
    { label: 'posts', value: stats.posts, href: '/admin/posts' },
    { label: 'projects', value: stats.projects, href: '/admin/projects' },
    {
      label: 'guestbook',
      value: stats.guestbook,
      pending: stats.guestbookPending,
      href: '/admin/guestbook',
    },
    {
      label: 'comments',
      value: stats.comments,
      pending: stats.commentsPending,
      href: '/admin/comments',
    },
    {
      label: 'subscribers',
      value: stats.subscribers,
      href: '/admin/subscribers',
    },
    { label: 'total views', value: stats.totalViews, href: '/admin/views' },
  ];

  return (
    <div>
      <h1 className="mb-2 text-[28px] font-medium tracking-[-0.025em] text-[var(--color-ink)]">
        Overview
      </h1>
      <p className="mb-8 text-sm text-[var(--color-ink-3)]">
        Ringkasan singkat semua konten dan aktivitas.
      </p>

      <div className="grid grid-cols-3 gap-3 max-md:grid-cols-2 max-sm:grid-cols-1">
        {cards.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className="rounded-[12px] border border-[var(--color-line)] bg-[var(--color-paper)] p-5 transition-colors hover:border-[var(--color-line-2)]"
          >
            <div className="mb-1.5 font-mono text-[11px] uppercase tracking-wide text-[var(--color-ink-3)]">
              {c.label}
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-[32px] font-medium tracking-tight text-[var(--color-ink)]">
                {c.value.toLocaleString('id-ID')}
              </span>
              {c.pending !== undefined && c.pending > 0 && (
                <span className="rounded-full bg-[var(--color-accent-soft)] px-2 py-0.5 font-mono text-[10.5px] text-[var(--color-accent)]">
                  {c.pending} pending
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-10">
        <h2 className="mb-3 font-mono text-sm font-medium lowercase text-[var(--color-ink-3)]">
          // shortcuts
        </h2>
        <div className="flex flex-wrap gap-2">
          {[
            { label: 'new post', href: '/admin/posts' },
            { label: 'view site →', href: '/' },
          ].map((s) => (
            <Link
              key={s.label}
              href={s.href}
              className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-line)] px-3 py-1.5 font-mono text-[13px] text-[var(--color-ink-3)] transition-all hover:border-[color-mix(in_srgb,var(--color-accent)_30%,transparent)] hover:text-[var(--color-accent)]"
            >
              {s.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
