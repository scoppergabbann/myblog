import { notFound } from 'next/navigation';
import { createSupabaseAdmin } from '@/lib/supabase/admin';
import { makeDraftToken } from '@/lib/draft-token';
import { getAdminMonologCategories } from '@/lib/monolog-category-queries';
import { MonologEditor, type AdminMonologEpisode } from '../monolog-editor';

export const dynamic = 'force-dynamic';

export default async function EditMonologPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isSafeInteger(id) || id <= 0) notFound();
  const [{ data, error }, categories] = await Promise.all([
    createSupabaseAdmin()
      .from('monolog_episodes')
      .select('id, slug, title, description, category, audio_url, audio_path, duration_seconds, published_at, status, transcript, reflection, tags, is_pinned, archived_at')
      .eq('id', id)
      .maybeSingle(),
    getAdminMonologCategories(),
  ]);
  if (error || !data) notFound();
  const previewToken = makeDraftToken(`monolog:${data.slug}`);
  return <MonologEditor episode={data as AdminMonologEpisode} categories={categories} previewToken={previewToken} />;
}
