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

export async function setGuestbookApproval(id: number, approved: boolean) {
  await requireAdmin();
  const supabase = createSupabaseAdmin();
  const { error } = await supabase
    .from('guestbook')
    .update({ approved })
    .eq('id', id);
  if (error) {
    console.error('[admin.guestbook approve]', error);
    return { ok: false as const, error: error.message };
  }
  revalidatePath('/admin/guestbook');
  revalidatePath('/guestbook');
  return { ok: true as const };
}

export async function deleteGuestbookEntry(id: number) {
  await requireAdmin();
  const supabase = createSupabaseAdmin();
  const { error } = await supabase.from('guestbook').delete().eq('id', id);
  if (error) {
    console.error('[admin.guestbook delete]', error);
    return { ok: false as const, error: error.message };
  }
  revalidatePath('/admin/guestbook');
  revalidatePath('/guestbook');
  return { ok: true as const };
}

export async function bulkActionGuestbook(
  ids: number[],
  action: 'approve' | 'reject' | 'delete'
) {
  await requireAdmin();
  if (ids.length === 0) return { ok: true as const, affected: 0 };

  const supabase = createSupabaseAdmin();
  if (action === 'delete') {
    const { error } = await supabase.from('guestbook').delete().in('id', ids);
    if (error) return { ok: false as const, error: error.message };
  } else {
    const { error } = await supabase
      .from('guestbook')
      .update({ approved: action === 'approve' })
      .in('id', ids);
    if (error) return { ok: false as const, error: error.message };
  }
  revalidatePath('/admin/guestbook');
  revalidatePath('/guestbook');
  return { ok: true as const, affected: ids.length };
}
