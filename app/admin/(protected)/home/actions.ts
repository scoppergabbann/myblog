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
  revalidatePath('/admin/home');
  revalidatePath('/');
}

export type HomeResult =
  | { ok: true; id?: number }
  | { ok: false; error: string };

export type HomeMetaInput = {
  mono_label: string;
  hero_intro: string;
  hero_accent_1: string;
  hero_accent_2: string;
  hero_accent_3: string;
  hero_outro: string;
  lead: string;
  location: string;
  timezone: string;
  est_year: string;
  focus_title: string;
  focus_body: string;
};

function validateMeta(d: HomeMetaInput): string | null {
  if (!d.mono_label.trim()) return 'Mono label wajib diisi.';
  if (!d.hero_intro.trim()) return 'Hero intro wajib diisi.';
  if (!d.hero_accent_1.trim() || !d.hero_accent_2.trim() || !d.hero_accent_3.trim()) {
    return 'Ketiga accent word wajib diisi.';
  }
  if (!d.lead.trim()) return 'Lead paragraph wajib diisi.';
  if (d.lead.length > 600) return 'Lead terlalu panjang (max 600).';
  if (!d.location.trim()) return 'Location wajib diisi.';
  if (!d.focus_title.trim()) return 'Focus title wajib diisi.';
  if (!d.focus_body.trim()) return 'Focus body wajib diisi.';
  if (d.focus_body.length > 800) return 'Focus body terlalu panjang.';
  for (const v of Object.values(d)) {
    if (typeof v === 'string' && v.length > 1000) {
      return 'Salah satu field terlalu panjang (>1000 karakter).';
    }
  }
  return null;
}

export async function updateHomeMeta(input: HomeMetaInput): Promise<HomeResult> {
  await requireAdmin();
  const err = validateMeta(input);
  if (err) return { ok: false, error: err };

  const supabase = createSupabaseAdmin();
  const { error } = await supabase.from('home_meta').update(input).eq('id', 1);
  if (error) return { ok: false, error: error.message };
  revalidateAll();
  return { ok: true };
}

function validateLink(label: string, href: string): string | null {
  if (!label.trim()) return 'Label wajib diisi.';
  if (label.length > 60) return 'Label terlalu panjang (max 60).';
  if (!href.trim()) return 'Href wajib diisi.';
  if (href.length > 200) return 'Href terlalu panjang.';
  return null;
}

export async function createQuickLink(
  label: string,
  href: string
): Promise<HomeResult> {
  await requireAdmin();
  const err = validateLink(label, href);
  if (err) return { ok: false, error: err };

  const supabase = createSupabaseAdmin();
  const { data: maxRow } = await supabase
    .from('home_quick_links')
    .select('display_order')
    .order('display_order', { ascending: false })
    .limit(1)
    .maybeSingle();
  const newOrder = (maxRow?.display_order ?? 0) + 10;

  const { data, error } = await supabase
    .from('home_quick_links')
    .insert({ label: label.trim(), href: href.trim(), display_order: newOrder })
    .select('id')
    .single();
  if (error) return { ok: false, error: error.message };
  revalidateAll();
  return { ok: true, id: data.id };
}

export async function updateQuickLink(
  id: number,
  label: string,
  href: string
): Promise<HomeResult> {
  await requireAdmin();
  const err = validateLink(label, href);
  if (err) return { ok: false, error: err };

  const supabase = createSupabaseAdmin();
  const { error } = await supabase
    .from('home_quick_links')
    .update({ label: label.trim(), href: href.trim() })
    .eq('id', id);
  if (error) return { ok: false, error: error.message };
  revalidateAll();
  return { ok: true };
}

export async function deleteQuickLink(id: number): Promise<HomeResult> {
  await requireAdmin();
  const supabase = createSupabaseAdmin();
  const { error } = await supabase
    .from('home_quick_links')
    .delete()
    .eq('id', id);
  if (error) return { ok: false, error: error.message };
  revalidateAll();
  return { ok: true };
}

export async function moveQuickLink(
  id: number,
  direction: 'up' | 'down'
): Promise<HomeResult> {
  await requireAdmin();
  const supabase = createSupabaseAdmin();

  const { data: item } = await supabase
    .from('home_quick_links')
    .select('id, display_order')
    .eq('id', id)
    .maybeSingle();
  if (!item) return { ok: false, error: 'Item tidak ditemukan.' };

  const op = direction === 'up' ? 'gt' : 'lt';
  const order = direction === 'up' ? 'asc' : 'desc';

  const { data: neighbor } = await supabase
    .from('home_quick_links')
    .select('id, display_order')
    [op]('display_order', item.display_order)
    .order('display_order', { ascending: order === 'asc' })
    .limit(1)
    .maybeSingle();
  if (!neighbor) return { ok: true };

  await supabase
    .from('home_quick_links')
    .update({ display_order: neighbor.display_order })
    .eq('id', item.id);
  await supabase
    .from('home_quick_links')
    .update({ display_order: item.display_order })
    .eq('id', neighbor.id);

  revalidateAll();
  return { ok: true };
}
