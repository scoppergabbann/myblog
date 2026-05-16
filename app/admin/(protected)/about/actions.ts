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

function revalidateAll() {
  revalidatePath('/admin/about');
  revalidatePath('/about');
}

export type AboutResult =
  | { ok: true; id?: number }
  | { ok: false; error: string };

export type AboutMetaInput = {
  title: string;
  subtitle: string;
  content: string;
  contact_email: string;
  contact_intro: string;
};

function validateMeta(d: AboutMetaInput): string | null {
  if (!d.title.trim()) return 'Title wajib diisi.';
  if (d.title.length > 100) return 'Title terlalu panjang.';
  if (!d.subtitle.trim()) return 'Subtitle wajib diisi.';
  if (d.subtitle.length > 300) return 'Subtitle terlalu panjang.';
  if (d.contact_email && !/^.+@.+\..+$/.test(d.contact_email.trim())) {
    return 'Format email tidak valid.';
  }
  if (d.content.length > 50000) return 'Content terlalu panjang.';
  return null;
}

export async function updateAboutMeta(
  input: AboutMetaInput
): Promise<AboutResult> {
  await requireAdmin();
  const err = validateMeta(input);
  if (err) return { ok: false, error: err };

  const supabase = createSupabaseAdmin();
  const { error } = await supabase
    .from('about_meta')
    .update({
      title: input.title.trim(),
      subtitle: input.subtitle.trim(),
      content: input.content,
      contact_email: input.contact_email.trim(),
      contact_intro: input.contact_intro.trim(),
    })
    .eq('id', 1);
  if (error) return { ok: false, error: error.message };
  revalidateAll();
  return { ok: true };
}

function validateStack(label: string, value: string): string | null {
  if (!label.trim()) return 'Label wajib diisi.';
  if (label.length > 40) return 'Label terlalu panjang (max 40).';
  if (!value.trim()) return 'Value wajib diisi.';
  if (value.length > 200) return 'Value terlalu panjang.';
  return null;
}

export async function createStackItem(
  label: string,
  value: string
): Promise<AboutResult> {
  await requireAdmin();
  const err = validateStack(label, value);
  if (err) return { ok: false, error: err };

  const supabase = createSupabaseAdmin();
  const { data: maxRow } = await supabase
    .from('about_stack')
    .select('display_order')
    .order('display_order', { ascending: false })
    .limit(1)
    .maybeSingle();
  const newOrder = (maxRow?.display_order ?? 0) + 10;

  const { data, error } = await supabase
    .from('about_stack')
    .insert({ label: label.trim(), value: value.trim(), display_order: newOrder })
    .select('id')
    .single();
  if (error) return { ok: false, error: error.message };
  revalidateAll();
  return { ok: true, id: data.id };
}

export async function updateStackItem(
  id: number,
  label: string,
  value: string
): Promise<AboutResult> {
  await requireAdmin();
  const err = validateStack(label, value);
  if (err) return { ok: false, error: err };

  const supabase = createSupabaseAdmin();
  const { error } = await supabase
    .from('about_stack')
    .update({ label: label.trim(), value: value.trim() })
    .eq('id', id);
  if (error) return { ok: false, error: error.message };
  revalidateAll();
  return { ok: true };
}

export async function deleteStackItem(id: number): Promise<AboutResult> {
  await requireAdmin();
  const supabase = createSupabaseAdmin();
  const { error } = await supabase.from('about_stack').delete().eq('id', id);
  if (error) return { ok: false, error: error.message };
  revalidateAll();
  return { ok: true };
}

export async function moveStackItem(
  id: number,
  direction: 'up' | 'down'
): Promise<AboutResult> {
  await requireAdmin();
  const supabase = createSupabaseAdmin();

  const { data: item } = await supabase
    .from('about_stack')
    .select('id, display_order')
    .eq('id', id)
    .maybeSingle();
  if (!item) return { ok: false, error: 'Item tidak ditemukan.' };

  const op = direction === 'up' ? 'gt' : 'lt';
  const order = direction === 'up' ? 'asc' : 'desc';

  const { data: neighbor } = await supabase
    .from('about_stack')
    .select('id, display_order')
    [op]('display_order', item.display_order)
    .order('display_order', { ascending: order === 'asc' })
    .limit(1)
    .maybeSingle();
  if (!neighbor) return { ok: true };

  await supabase
    .from('about_stack')
    .update({ display_order: neighbor.display_order })
    .eq('id', item.id);
  await supabase
    .from('about_stack')
    .update({ display_order: item.display_order })
    .eq('id', neighbor.id);

  revalidateAll();
  return { ok: true };
}
