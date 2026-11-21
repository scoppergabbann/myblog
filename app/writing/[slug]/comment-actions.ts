'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseAdmin } from '@/lib/supabase/admin';
import { commentStorageSlug, type CommentTargetKind } from '@/lib/comment-target';
import { getIpHash } from '@/lib/ip-hash';
import { rateLimit } from '@/lib/rate-limit';

export type CommentActionResult =
  | { ok: true }
  | { ok: false; error: string };

export async function submitComment(
  prevState: CommentActionResult | null,
  formData: FormData
): Promise<CommentActionResult> {
  const honeypot = formData.get('website');
  if (typeof honeypot === 'string' && honeypot.length > 0) {
    return { ok: true };
  }

  const slug = formData.get('slug');
  const kindValue = formData.get('kind');
  const name = formData.get('name');
  const message = formData.get('message');

  if (
    typeof slug !== 'string' ||
    typeof name !== 'string' ||
    typeof message !== 'string' ||
    !slug.trim() ||
    !name.trim() ||
    !message.trim()
  ) {
    return { ok: false, error: 'Field tidak lengkap.' };
  }

  if (name.length > 40 || message.length > 800) {
    return { ok: false, error: 'Input terlalu panjang.' };
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 180) {
    return { ok: false, error: 'Halaman komentar tidak valid.' };
  }

  const kind: CommentTargetKind = kindValue === 'monolog' ? 'monolog' : 'writing';
  const supabase = createSupabaseAdmin();
  if (kind === 'monolog') {
    const { data: episode, error: episodeError } = await supabase
      .from('monolog_episodes')
      .select('id')
      .eq('slug', slug)
      .eq('status', 'published')
      .is('archived_at', null)
      .maybeSingle();
    if (episodeError || !episode) return { ok: false, error: 'Monolog tidak tersedia untuk dikomentari.' };
  }

  // Rate limit: 5 comments per IP per hour across articles
  const ipHash = await getIpHash();
  const rl = rateLimit(`comment:${ipHash}`, 5, 60 * 60 * 1000);
  if (!rl.allowed) {
    return { ok: false, error: 'Terlalu banyak komentar. Coba lagi nanti.' };
  }

  const { error } = await supabase.from('comments').insert({
    slug: commentStorageSlug(kind, slug),
    name: name.trim(),
    message: message.trim(),
    ip_hash: ipHash,
  });

  if (error) {
    console.error('[comment insert]', error);
    return { ok: false, error: 'Gagal menyimpan komentar.' };
  }

  revalidatePath(kind === 'monolog' ? `/monolog/${slug}` : `/writing/${slug}`);
  return { ok: true };
}
