'use server';

import { redirect } from 'next/navigation';
import { createSupabaseAdmin } from '@/lib/supabase/admin';
import { getIpHash } from '@/lib/ip-hash';
import { rateLimit } from '@/lib/rate-limit';
import { setPremiumUnlocked, verifyPremiumPassword } from '@/lib/premium';

export type PremiumUnlockState =
  | { ok: false; error: string }
  | null;

export async function unlockPremiumPost(
  prevState: PremiumUnlockState,
  formData: FormData
): Promise<PremiumUnlockState> {
  const slug = String(formData.get('slug') ?? '').trim();
  const password = String(formData.get('password') ?? '');

  if (!slug || !password) {
    return { ok: false, error: 'Password wajib diisi.' };
  }

  const ipHash = await getIpHash();
  const rl = rateLimit(`premium:${slug}:${ipHash}`, 8, 15 * 60 * 1000);
  if (!rl.allowed) {
    return { ok: false, error: 'Terlalu banyak percobaan. Coba lagi nanti.' };
  }

  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from('post_premium_locks')
    .select('password_hash, posts!inner(slug, status, is_premium)')
    .eq('posts.slug', slug)
    .eq('posts.status', 'published')
    .eq('posts.is_premium', true)
    .maybeSingle();

  if (error || !data) {
    return { ok: false, error: 'Konten premium tidak ditemukan.' };
  }

  if (!verifyPremiumPassword(password, data.password_hash)) {
    return { ok: false, error: 'Password salah.' };
  }

  await setPremiumUnlocked(slug);
  redirect(`/writing/${slug}`);
}
