'use server';

import { revalidatePath } from 'next/cache';
import { auth, isAdmin } from '@/auth';
import { createSupabaseAdmin } from '@/lib/supabase/admin';

async function requireAdmin() {
  const session = await auth();
  if (!isAdmin(session)) {
    throw new Error('Unauthorized');
  }
}

export async function setCommentApproval(id: number, approved: boolean) {
  await requireAdmin();
  const supabase = createSupabaseAdmin();

  // Get slug first so we can revalidate the right article page
  const { data: row } = await supabase
    .from('comments')
    .select('slug')
    .eq('id', id)
    .maybeSingle();

  const { error } = await supabase
    .from('comments')
    .update({ approved })
    .eq('id', id);
  if (error) {
    console.error('[admin.comments approve]', error);
    return { ok: false as const, error: error.message };
  }
  revalidatePath('/admin/comments');
  if (row?.slug) revalidatePath(`/writing/${row.slug}`);
  return { ok: true as const };
}

export async function deleteComment(id: number) {
  await requireAdmin();
  const supabase = createSupabaseAdmin();

  const { data: row } = await supabase
    .from('comments')
    .select('slug')
    .eq('id', id)
    .maybeSingle();

  const { error } = await supabase.from('comments').delete().eq('id', id);
  if (error) {
    console.error('[admin.comments delete]', error);
    return { ok: false as const, error: error.message };
  }
  revalidatePath('/admin/comments');
  if (row?.slug) revalidatePath(`/writing/${row.slug}`);
  return { ok: true as const };
}

export async function bulkActionComments(
  ids: number[],
  action: 'approve' | 'reject' | 'delete'
) {
  await requireAdmin();
  if (ids.length === 0) return { ok: true as const, affected: 0 };

  const supabase = createSupabaseAdmin();

  // Get distinct slugs for revalidation
  const { data: rows } = await supabase
    .from('comments')
    .select('slug')
    .in('id', ids);
  const slugs = Array.from(new Set((rows ?? []).map((r) => r.slug)));

  if (action === 'delete') {
    const { error } = await supabase.from('comments').delete().in('id', ids);
    if (error) return { ok: false as const, error: error.message };
  } else {
    const { error } = await supabase
      .from('comments')
      .update({ approved: action === 'approve' })
      .in('id', ids);
    if (error) return { ok: false as const, error: error.message };
  }
  revalidatePath('/admin/comments');
  for (const slug of slugs) revalidatePath(`/writing/${slug}`);
  return { ok: true as const, affected: ids.length };
}
