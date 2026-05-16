'use server';

import { createSupabaseAdmin } from '@/lib/supabase/admin';
import { getIpHash } from '@/lib/ip-hash';
import { rateLimit } from '@/lib/rate-limit';

const VALID_EMOJI = ['love', 'fire', 'wow', 'lol', 'brain', 'poop'] as const;
export type EmojiKind = (typeof VALID_EMOJI)[number];

export type ReactionActionResult =
  | { ok: true; toggled: 'added' | 'removed' }
  | { ok: false; error: string };

export async function toggleReaction(
  slug: string,
  emoji: string
): Promise<ReactionActionResult> {
  if (!slug || !VALID_EMOJI.includes(emoji as EmojiKind)) {
    return { ok: false, error: 'Invalid input.' };
  }

  const ipHash = await getIpHash();
  const rl = rateLimit(`react:${ipHash}`, 30, 60 * 60 * 1000);
  if (!rl.allowed) {
    return { ok: false, error: 'Slow down.' };
  }

  const supabase = createSupabaseAdmin();

  // Toggle: if exists → delete, else → insert
  const { data: existing } = await supabase
    .from('reactions')
    .select('id')
    .eq('slug', slug)
    .eq('emoji', emoji)
    .eq('ip_hash', ipHash)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase.from('reactions').delete().eq('id', existing.id);
    if (error) return { ok: false, error: 'Failed.' };
    return { ok: true, toggled: 'removed' };
  } else {
    const { error } = await supabase.from('reactions').insert({
      slug,
      emoji,
      ip_hash: ipHash,
    });
    if (error) return { ok: false, error: 'Failed.' };
    return { ok: true, toggled: 'added' };
  }
}

export async function incrementView(slug: string): Promise<number | null> {
  if (!slug) return null;

  // Rate limit: same IP can only bump view once per article per 30 min
  const ipHash = await getIpHash();
  const rl = rateLimit(`view:${slug}:${ipHash}`, 1, 30 * 60 * 1000);
  if (!rl.allowed) {
    // Already counted recently — just return current count
    const supabase = createSupabaseAdmin();
    const { data } = await supabase
      .from('views')
      .select('count')
      .eq('slug', slug)
      .maybeSingle();
    return data?.count ?? null;
  }

  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase.rpc('increment_view', { p_slug: slug });
  if (error) {
    console.error('[increment_view]', error);
    return null;
  }
  return typeof data === 'number' ? data : null;
}
