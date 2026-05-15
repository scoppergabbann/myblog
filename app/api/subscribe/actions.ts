'use server';

import { randomBytes } from 'crypto';
import { createSupabaseAdmin } from '@/lib/supabase/admin';
import { getIpHash } from '@/lib/ip-hash';
import { rateLimit } from '@/lib/rate-limit';

export type SubscribeResult =
  | { ok: true; message: string }
  | { ok: false; error: string };

export async function subscribe(
  prevState: SubscribeResult | null,
  formData: FormData
): Promise<SubscribeResult> {
  const honeypot = formData.get('website');
  if (typeof honeypot === 'string' && honeypot.length > 0) {
    return { ok: true, message: 'Terima kasih!' };
  }

  const email = formData.get('email');
  if (typeof email !== 'string' || !email.trim()) {
    return { ok: false, error: 'Email wajib diisi.' };
  }

  const trimmed = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed) || trimmed.length > 254) {
    return { ok: false, error: 'Email tidak valid.' };
  }

  const ipHash = await getIpHash();
  const rl = rateLimit(`subscribe:${ipHash}`, 3, 60 * 60 * 1000);
  if (!rl.allowed) {
    return { ok: false, error: 'Terlalu banyak percobaan. Coba lagi nanti.' };
  }

  const supabase = createSupabaseAdmin();

  // Check if already subscribed
  const { data: existing } = await supabase
    .from('subscribers')
    .select('id, confirmed')
    .eq('email', trimmed)
    .maybeSingle();

  if (existing?.confirmed) {
    return { ok: true, message: 'Kamu sudah subscribed. Terima kasih!' };
  }

  // Generate confirm token (for double opt-in flow later)
  const token = randomBytes(24).toString('hex');

  if (existing && !existing.confirmed) {
    // Resend token if exists but unconfirmed
    await supabase
      .from('subscribers')
      .update({ confirm_token: token })
      .eq('id', existing.id);
  } else {
    const { error } = await supabase.from('subscribers').insert({
      email: trimmed,
      confirm_token: token,
    });
    if (error) {
      console.error('[subscribe insert]', error);
      return { ok: false, error: 'Gagal subscribe. Coba lagi.' };
    }
  }

  // TODO: send confirmation email via Resend/Postmark
  // For now, we mark as ready-to-confirm and admin can verify manually.
  return {
    ok: true,
    message: 'Terima kasih! Email konfirmasi akan dikirim segera.',
  };
}
