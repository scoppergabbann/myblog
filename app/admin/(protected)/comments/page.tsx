import Link from 'next/link';
import { createSupabaseAdmin } from '@/lib/supabase/admin';
import { CommentsTable } from './comments-table';

export const dynamic = 'force-dynamic';

type Row = {
  id: number;
  slug: string;
  name: string;
  message: string;
  approved: boolean;
  created_at: string;
};

async function getComments(): Promise<Row[]> {
  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from('comments')
    .select('id, slug, name, message, approved, created_at')
    .order('created_at', { ascending: false })
    .limit(500);
  if (error) {
    console.error('[admin.comments fetch]', error);
    return [];
  }
  return (data ?? []) as Row[];
}

export default async function AdminCommentsPage() {
  const comments = await getComments();
  const pending = comments.filter((c) => !c.approved).length;

  return (
    <div>
      <div className="mb-6 flex items-baseline justify-between gap-4">
        <div>
          <h1 className="mb-1 text-[28px] font-medium tracking-[-0.025em] text-[var(--color-ink)]">
            Comments
          </h1>
          <p className="text-sm text-[var(--color-ink-3)]">
            {comments.length} total komentar
            {pending > 0 && (
              <>
                {' · '}
                <span className="text-[var(--color-accent)]">
                  {pending} menunggu moderasi
                </span>
              </>
            )}
          </p>
        </div>
        <Link
          href="/admin/guestbook"
          className="font-mono text-[12px] text-[var(--color-ink-3)] transition-colors hover:text-[var(--color-accent)]"
        >
          → guestbook
        </Link>
      </div>

      <CommentsTable initialData={comments} />
    </div>
  );
}
