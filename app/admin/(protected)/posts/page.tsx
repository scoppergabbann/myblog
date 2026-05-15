import Link from 'next/link';
import { createSupabaseAdmin } from '@/lib/supabase/admin';
import { PostsTable } from './posts-table';

export const dynamic = 'force-dynamic';

type Row = {
  id: number;
  slug: string;
  title: string;
  summary: string;
  tags: string[];
  status: 'draft' | 'published' | 'archived';
  published_at: string | null;
  updated_at: string;
};

async function getPosts(): Promise<Row[]> {
  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from('posts')
    .select('id, slug, title, summary, tags, status, published_at, updated_at')
    .order('updated_at', { ascending: false });
  if (error) {
    console.error('[admin.posts fetch]', error);
    return [];
  }
  return (data ?? []) as Row[];
}

export default async function AdminPostsPage() {
  const posts = await getPosts();
  const drafts = posts.filter((p) => p.status === 'draft').length;
  const published = posts.filter((p) => p.status === 'published').length;

  return (
    <div>
      <div className="mb-6 flex items-baseline justify-between gap-4">
        <div>
          <h1 className="mb-1 text-[28px] font-medium tracking-[-0.025em] text-[var(--color-ink)]">
            Posts
          </h1>
          <p className="text-sm text-[var(--color-ink-3)]">
            {posts.length} total ·{' '}
            <span className="text-emerald-600 dark:text-emerald-400">
              {published} published
            </span>{' '}
            ·{' '}
            <span className="text-[var(--color-accent)]">{drafts} draft</span>
          </p>
        </div>
        <Link
          href="/admin/posts/new"
          className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--color-ink)] px-3.5 py-2 text-[13px] font-medium text-[var(--color-paper)] transition-opacity hover:opacity-85"
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New post
        </Link>
      </div>

      <PostsTable initialData={posts} />
    </div>
  );
}
