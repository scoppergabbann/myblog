import { notFound } from 'next/navigation';
import { createSupabaseAdmin } from '@/lib/supabase/admin';
import { PostEditor } from '../post-editor';

export const dynamic = 'force-dynamic';

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: idStr } = await params;
  const id = Number(idStr);
  if (!Number.isFinite(id)) notFound();

  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from('posts')
    .select('id, slug, title, summary, content, tags, status, published_at')
    .eq('id', id)
    .maybeSingle();

  if (error || !data) notFound();

  return <PostEditor post={data} />;
}
