import Link from 'next/link';
import { createSupabaseAdmin } from '@/lib/supabase/admin';
import { formatDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';

type ViewRow = { slug: string; count: number; updated_at: string };
type PostRow = { slug: string; title: string };

async function getData() {
  const supabase = createSupabaseAdmin();
  const [viewsRes, postsRes] = await Promise.all([
    supabase.from('views').select('slug, count, updated_at'),
    supabase.from('posts').select('slug, title'),
  ]);

  const views = ((viewsRes.data ?? []) as ViewRow[])
    .map((v) => ({ ...v, count: Number(v.count) || 0 }))
    .sort((a, b) => b.count - a.count);

  const postMap = new Map(
    ((postsRes.data ?? []) as PostRow[]).map((p) => [p.slug, p.title])
  );

  const total = views.reduce((sum, v) => sum + v.count, 0);
  const top = views.slice(0, 10);
  const maxCount = top[0]?.count ?? 0;

  return { views, total, top, maxCount, postMap };
}

export default async function AdminViewsPage() {
  const { views, total, top, maxCount, postMap } = await getData();

  const orphans = views.filter((v) => !postMap.has(v.slug));

  return (
    <div>
      <div className="mb-6">
        <h1 className="mb-1 text-[28px] font-medium tracking-[-0.025em] text-[var(--color-ink)]">
          Views
        </h1>
        <p className="text-sm text-[var(--color-ink-3)]">
          {views.length} artikel telah dilihat ·{' '}
          <span className="font-mono">
            {total.toLocaleString('id-ID')} total views
          </span>
        </p>
      </div>

      {top.length === 0 ? (
        <div className="rounded-[12px] border border-dashed border-[var(--color-line-2)] bg-[var(--color-paper-2)] px-6 py-10 text-center">
          <div className="mb-2 font-mono text-[11.5px] uppercase tracking-wide text-[var(--color-ink-3)]">
            // belum ada data
          </div>
          <p className="text-sm text-[var(--color-ink-3)]">
            Pengunjung belum membuka artikel apapun. Coba buka /writing/[slug]
            di tab lain untuk memicu counter pertama.
          </p>
        </div>
      ) : (
        <section className="mb-10">
          <h2 className="mb-4 font-mono text-sm font-medium lowercase text-[var(--color-ink-3)]">
            // top 10 articles
          </h2>
          <div className="rounded-[10px] border border-[var(--color-line)] bg-[var(--color-paper)]">
            {top.map((v, idx) => {
              const title = postMap.get(v.slug) ?? v.slug;
              const pct = maxCount > 0 ? (v.count / maxCount) * 100 : 0;
              const hasPost = postMap.has(v.slug);

              return (
                <div
                  key={v.slug}
                  className="border-b border-[var(--color-line)] px-4 py-3.5 last:border-b-0"
                >
                  <div className="mb-1.5 flex items-baseline justify-between gap-4">
                    <div className="flex min-w-0 items-baseline gap-3">
                      <span className="font-mono text-[11px] tabular-nums text-[var(--color-ink-4)]">
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      {hasPost ? (
                        <Link
                          href={`/writing/${v.slug}`}
                          target="_blank"
                          className="truncate text-[14px] text-[var(--color-ink)] transition-colors hover:text-[var(--color-accent)]"
                        >
                          {title}
                        </Link>
                      ) : (
                        <span className="truncate text-[14px] text-[var(--color-ink-3)] italic">
                          {v.slug} (orphan)
                        </span>
                      )}
                    </div>
                    <span className="flex-shrink-0 font-mono text-[12px] tabular-nums text-[var(--color-ink)]">
                      {v.count.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="ml-[40px] h-1 overflow-hidden rounded-full bg-[var(--color-paper-2)]">
                    <div
                      className="h-full rounded-full bg-[var(--color-accent)] transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {orphans.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-3 font-mono text-sm font-medium lowercase text-[var(--color-ink-3)]">
            // orphan view records ({orphans.length})
          </h2>
          <p className="mb-2 text-[12.5px] text-[var(--color-ink-4)]">
            View records yang slug-nya sudah tidak ada di posts (post dihapus
            atau slug berubah).
          </p>
          <div className="rounded-[10px] border border-dashed border-[var(--color-line)] px-4 py-3">
            {orphans.slice(0, 20).map((o) => (
              <div
                key={o.slug}
                className="flex items-baseline justify-between py-1 font-mono text-[12px]"
              >
                <span className="text-[var(--color-ink-3)]">{o.slug}</span>
                <span className="text-[var(--color-ink-4)] tabular-nums">
                  {o.count.toLocaleString('id-ID')}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {views.length > 10 && (
        <section>
          <h2 className="mb-3 font-mono text-sm font-medium lowercase text-[var(--color-ink-3)]">
            // all articles
          </h2>
          <div className="rounded-[10px] border border-[var(--color-line)] bg-[var(--color-paper)]">
            {views.slice(10).map((v) => {
              const title = postMap.get(v.slug) ?? v.slug;
              const hasPost = postMap.has(v.slug);
              return (
                <div
                  key={v.slug}
                  className="flex items-baseline justify-between border-b border-[var(--color-line)] px-4 py-2.5 last:border-b-0"
                >
                  {hasPost ? (
                    <Link
                      href={`/writing/${v.slug}`}
                      target="_blank"
                      className="truncate text-[13px] text-[var(--color-ink-2)] transition-colors hover:text-[var(--color-accent)]"
                    >
                      {title}
                    </Link>
                  ) : (
                    <span className="truncate text-[13px] italic text-[var(--color-ink-3)]">
                      {v.slug}
                    </span>
                  )}
                  <span className="ml-4 flex-shrink-0 font-mono text-[12px] tabular-nums text-[var(--color-ink-3)]">
                    {v.count.toLocaleString('id-ID')}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <div className="mt-10 border-t border-[var(--color-line)] pt-5 font-mono text-[11.5px] text-[var(--color-ink-4)]">
        last refresh: {formatDate(new Date().toISOString())} · auto-refresh on
        page reload
      </div>
    </div>
  );
}
