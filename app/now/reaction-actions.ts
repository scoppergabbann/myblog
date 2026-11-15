'use server';
import { revalidatePath } from 'next/cache';
import { createSupabaseAdmin } from '@/lib/supabase/admin';
import { createSupabasePublic } from '@/lib/supabase/public';
import { getStreamVisitorHash } from '@/lib/stream-visitor';
import { getIpHash } from '@/lib/ip-hash';
import { rateLimit } from '@/lib/rate-limit';
import { isStreamReactionKind, streamReactionTarget, type StreamReactionResult } from '@/lib/stream-reactions';

export async function setStreamReaction(entryId: number, kind: string, active: boolean): Promise<StreamReactionResult> {
  if (!Number.isSafeInteger(entryId) || entryId <= 0 || !isStreamReactionKind(kind) || typeof active !== 'boolean') return { ok: false, error: 'Aktivitas tidak valid.' };
  try {
    const ipHash = await getIpHash();
    if (!rateLimit(`stream-love:${ipHash}`, 60, 60 * 60 * 1000).allowed) return { ok: false, error: 'Terlalu banyak klik. Coba lagi nanti, ya.' };
    const { data: entry, error: entryError } = await createSupabasePublic().from('now_entries')
      .select('id').eq('id', entryId).eq('published', true).maybeSingle();
    if (entryError) return { ok: false, error: 'Aktivitas belum bisa dimuat. Coba lagi.' };
    if (!entry) return { ok: false, error: 'Aktivitas ini sudah tidak tersedia.' };

    const visitorHash = await getStreamVisitorHash(true);
    if (!visitorHash) return { ok: false, error: 'Identitas pengunjung belum tersedia. Muat ulang halaman.' };
    const db = createSupabaseAdmin();
    const { slug, emoji } = streamReactionTarget(entryId, kind);
    // Set the requested state: retries cannot accidentally toggle it twice.
    const { error } = active
      ? await db.from('reactions').upsert({ slug, emoji, ip_hash: visitorHash }, { onConflict: 'slug,emoji,ip_hash', ignoreDuplicates: true })
      : await db.from('reactions').delete().eq('slug', slug).eq('emoji', emoji).eq('ip_hash', visitorHash);
    if (error) return { ok: false, error: 'Reaksi belum tersimpan. Coba lagi, ya.' };
    const result = await db.from('reactions').select('id', { count: 'exact', head: true }).eq('slug', slug).eq('emoji', emoji);
    revalidatePath('/now');
    return { ok: true, active, count: result.error ? null : result.count };
  } catch {
    return { ok: false, error: 'Koneksi terputus. Coba klik lagi, ya.' };
  }
}
