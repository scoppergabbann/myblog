'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseAdmin } from '@/lib/supabase/admin';
import { createSupabasePublic } from '@/lib/supabase/public';
import { getIpHash } from '@/lib/ip-hash';
import {
  monologReactionOptions,
  monologReactionTarget,
  type MonologReactionKind,
  type MonologReactionResult,
} from '@/lib/monolog-reactions';
import { rateLimit } from '@/lib/rate-limit';
import { getStreamVisitorHash } from '@/lib/stream-visitor';

function isMonologReactionKind(value: unknown): value is MonologReactionKind {
  return monologReactionOptions.some(({ kind }) => kind === value);
}

export async function setMonologReaction(
  slug: string,
  kind: string,
  active: boolean,
): Promise<MonologReactionResult> {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || !isMonologReactionKind(kind) || typeof active !== 'boolean') {
    return { ok: false, error: 'Monolog tidak valid.' };
  }

  try {
    const ipHash = await getIpHash();
    if (!rateLimit(`monolog-reaction:${ipHash}`, 60, 60 * 60 * 1000).allowed) {
      return { ok: false, error: 'Terlalu banyak klik. Coba lagi nanti, ya.' };
    }

    const { data: episode, error: episodeError } = await createSupabasePublic()
      .from('monolog_episodes')
      .select('slug')
      .eq('slug', slug)
      .eq('status', 'published')
      .maybeSingle();
    if (episodeError) return { ok: false, error: 'Monolog belum bisa dimuat. Coba lagi.' };
    if (!episode) return { ok: false, error: 'Monolog ini sudah tidak tersedia.' };

    const visitorHash = await getStreamVisitorHash(true);
    if (!visitorHash) return { ok: false, error: 'Identitas pengunjung belum tersedia. Muat ulang halaman.' };

    const db = createSupabaseAdmin();
    const target = monologReactionTarget(slug, kind);
    const { error } = active
      ? await db.from('reactions').upsert(
        { slug: target.slug, emoji: target.emoji, ip_hash: visitorHash },
        { onConflict: 'slug,emoji,ip_hash', ignoreDuplicates: true },
      )
      : await db.from('reactions').delete()
        .eq('slug', target.slug).eq('emoji', target.emoji).eq('ip_hash', visitorHash);
    if (error) return { ok: false, error: 'Reaksi belum tersimpan. Coba lagi, ya.' };

    const count = await db.from('reactions').select('id', { count: 'exact', head: true })
      .eq('slug', target.slug).eq('emoji', target.emoji);
    revalidatePath(`/monolog/${slug}`);
    return { ok: true, active, count: count.error ? null : count.count };
  } catch {
    return { ok: false, error: 'Koneksi terputus. Coba klik lagi, ya.' };
  }
}
