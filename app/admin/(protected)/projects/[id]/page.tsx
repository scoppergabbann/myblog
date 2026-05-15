import { notFound } from 'next/navigation';
import { createSupabaseAdmin } from '@/lib/supabase/admin';
import { ProjectEditor } from '../project-editor';

export const dynamic = 'force-dynamic';

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: idStr } = await params;
  const id = Number(idStr);
  if (!Number.isFinite(id)) notFound();

  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from('projects')
    .select('id, title, description, stack, status, url, github_url, display_order')
    .eq('id', id)
    .maybeSingle();

  if (error || !data) notFound();

  return <ProjectEditor project={data} />;
}
