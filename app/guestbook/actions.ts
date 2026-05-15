'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseAdmin } from '@/lib/supabase/admin';
import { getIpHash } from '@/lib/ip-hash';
import { rateLimit } from '@/lib/rate-limit';

export type GuestbookActionResult =
  | { ok: true }
  | { ok: false; error: string };

export async function submitGuestbookEntry(
  prevState: GuestbookActionResult | null,
  formData: FormData
): Promise<GuestbookActionResult> {
  // Honeypot — bots fill this hidden field, humans don't
  const honeypot = formData.get('website');
  if (typeof honeypot === 'string' && honeypot.length > 0) {
    return { ok: true }; // Silently succeed for bots
  }

  const name = formData.get('name');
  const message = formData.get('message');

  if (
    typeof name !== 'string' ||
    typeof message !== 'string' ||
    !name.trim() ||
    !message.trim()
  ) {
    return { ok: false, error: 'Nama dan pesan wajib diisi.' };
  }

  if (name.length > 40) {
    return { ok: false, error: 'Nama terlalu panjang (max 40 karakter).' };
  }
  if (message.length > 280) {
    return { ok: false, error: 'Pesan terlalu panjang (max 280 karakter).' };
  }

  // Rate limit: 3 entries per IP per hour
  const ipHash = await getIpHash();
  const rl = rateLimit(`guestbook:${ipHash}`, 3, 60 * 60 * 1000);
  if (!rl.allowed) {
    return {
      ok: false,
      error: 'Terlalu banyak pesan. Coba lagi nanti.',
    };
  }

  const supabase = createSupabaseAdmin();
  const { error } = await supabase.from('guestbook').insert({
    name: name.trim(),
    message: message.trim(),
    ip_hash: ipHash,
  });

  if (error) {
    console.error('[guestbook insert]', error);
    return { ok: false, error: 'Gagal menyimpan pesan. Coba lagi.' };
  }

  revalidatePath('/guestbook');
  return { ok: true };
}
