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
  revalidatePath('/admin/now');
  revalidatePath('/now');
  revalidatePath('/');
}

export type NowResult =
  | { ok: true; id?: number }
  | { ok: false; error: string };

const SECTIONS = ['learning', 'working', 'consuming'] as const;
type Section = (typeof SECTIONS)[number];

export async function updateFocus(focus: string): Promise<NowResult> {
  await requireAdmin();
  if (focus.length > 1000) {
    return { ok: false, error: 'Focus terlalu panjang (max 1000 karakter).' };
  }
  const supabase = createSupabaseAdmin();
  const { error } = await supabase
    .from('now_meta')
    .update({ focus, updated_at: new Date().toISOString() })
    .eq('id', 1);
  if (error) return { ok: false, error: error.message };
  revalidateAll();
  return { ok: true };
}

export async function touchUpdatedAt(): Promise<NowResult> {
  await requireAdmin();
  const supabase = createSupabaseAdmin();
  const { error } = await supabase
    .from('now_meta')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', 1);
  if (error) return { ok: false, error: error.message };
  revalidateAll();
  return { ok: true };
}

export async function updateSpotifyEmbed(rawUrl: string): Promise<NowResult> {
  await requireAdmin();
  const value = rawUrl.trim();

  // Empty = clear the embed
  if (!value) {
    const supabase = createSupabaseAdmin();
    const { error } = await supabase
      .from('now_meta')
      .update({ spotify_url: null, updated_at: new Date().toISOString() })
      .eq('id', 1);
    if (error) return { ok: false, error: error.message };
    revalidateAll();
    return { ok: true };
  }

  // Validate it parses to something we can embed
  const { parseSpotifyEmbedUrl } = await import('@/lib/spotify-embed');
  if (!parseSpotifyEmbedUrl(value)) {
    return {
      ok: false,
      error:
        'URL tidak valid. Gunakan link share dari Spotify (track/playlist/album/artist).',
    };
  }

  if (value.length > 500) {
    return { ok: false, error: 'URL terlalu panjang.' };
  }

  const supabase = createSupabaseAdmin();
  const { error } = await supabase
    .from('now_meta')
    .update({ spotify_url: value, updated_at: new Date().toISOString() })
    .eq('id', 1);
  if (error) return { ok: false, error: error.message };
  revalidateAll();
  return { ok: true };
}

export async function createNowItem(
  section: Section,
  role: string,
  content: string
): Promise<NowResult> {
  await requireAdmin();
  if (!SECTIONS.includes(section)) {
    return { ok: false, error: 'Invalid section.' };
  }
  const r = role.trim();
  const c = content.trim();
  if (!r) return { ok: false, error: 'Role wajib diisi.' };
  if (!c) return { ok: false, error: 'Content wajib diisi.' };
  if (r.length > 50) return { ok: false, error: 'Role terlalu panjang (max 50).' };
  if (c.length > 500) return { ok: false, error: 'Content terlalu panjang (max 500).' };

  const supabase = createSupabaseAdmin();

  // Get current max display_order in this section, add 10 for new item at top
  const { data: maxRow } = await supabase
    .from('now_items')
    .select('display_order')
    .eq('section', section)
    .order('display_order', { ascending: false })
    .limit(1)
    .maybeSingle();
  const newOrder = (maxRow?.display_order ?? 0) + 10;

  const { data, error } = await supabase
    .from('now_items')
    .insert({ section, role: r, content: c, display_order: newOrder })
    .select('id')
    .single();
  if (error) return { ok: false, error: error.message };
  revalidateAll();
  return { ok: true, id: data.id };
}

export async function updateNowItem(
  id: number,
  role: string,
  content: string
): Promise<NowResult> {
  await requireAdmin();
  const r = role.trim();
  const c = content.trim();
  if (!r) return { ok: false, error: 'Role wajib diisi.' };
  if (!c) return { ok: false, error: 'Content wajib diisi.' };
  if (r.length > 50) return { ok: false, error: 'Role terlalu panjang (max 50).' };
  if (c.length > 500) return { ok: false, error: 'Content terlalu panjang (max 500).' };

  const supabase = createSupabaseAdmin();
  const { error } = await supabase
    .from('now_items')
    .update({ role: r, content: c })
    .eq('id', id);
  if (error) return { ok: false, error: error.message };
  revalidateAll();
  return { ok: true };
}

export async function deleteNowItem(id: number): Promise<NowResult> {
  await requireAdmin();
  const supabase = createSupabaseAdmin();
  const { error } = await supabase.from('now_items').delete().eq('id', id);
  if (error) return { ok: false, error: error.message };
  revalidateAll();
  return { ok: true };
}

export async function moveNowItem(
  id: number,
  direction: 'up' | 'down'
): Promise<NowResult> {
  await requireAdmin();
  const supabase = createSupabaseAdmin();

  // Find target item + neighbor
  const { data: item } = await supabase
    .from('now_items')
    .select('id, section, display_order')
    .eq('id', id)
    .maybeSingle();
  if (!item) return { ok: false, error: 'Item tidak ditemukan.' };

  // For 'up' visually (higher in list) means higher display_order
  const op = direction === 'up' ? 'gt' : 'lt';
  const order = direction === 'up' ? 'asc' : 'desc';

  const { data: neighbor } = await supabase
    .from('now_items')
    .select('id, display_order')
    .eq('section', item.section)
    [op]('display_order', item.display_order)
    .order('display_order', { ascending: order === 'asc' })
    .limit(1)
    .maybeSingle();
  if (!neighbor) return { ok: true }; // already at edge

  // Swap display_order
  await supabase
    .from('now_items')
    .update({ display_order: neighbor.display_order })
    .eq('id', item.id);
  await supabase
    .from('now_items')
    .update({ display_order: item.display_order })
    .eq('id', neighbor.id);

  revalidateAll();
  return { ok: true };
}
