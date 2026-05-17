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

export type DumelResult =
  | { ok: true; id?: number }
  | { ok: false; error: string };

export async function createDumel(content: string): Promise<DumelResult> {
  await requireAdmin();
  const trimmed = content.trim();
  if (!trimmed) return { ok: false, error: 'Tulis sesuatu dulu.' };
  if (trimmed.length > 2000) {
    return { ok: false, error: 'Terlalu panjang (max 2000 karakter).' };
  }

  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from('dumel')
    .insert({ content: trimmed })
    .select('id')
    .single();
  if (error) {
    console.error('[dumel.create]', error);
    return { ok: false, error: error.message };
  }
  revalidatePath('/ngedumel');
  return { ok: true, id: data.id };
}

export async function deleteDumel(id: number): Promise<DumelResult> {
  await requireAdmin();
  const supabase = createSupabaseAdmin();
  const { error } = await supabase.from('dumel').delete().eq('id', id);
  if (error) {
    console.error('[dumel.delete]', error);
    return { ok: false, error: error.message };
  }
  revalidatePath('/ngedumel');
  return { ok: true };
}
