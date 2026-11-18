import 'server-only';
import { createSupabasePublic } from '@/lib/supabase/public';
import { getStreamVisitorHash } from '@/lib/stream-visitor';
import {
  monologReactionOptions,
  monologReactionTarget,
  type MonologReactionStates,
} from '@/lib/monolog-reactions';

export async function getMonologReactionStates(slug: string): Promise<MonologReactionStates> {
  const result = Object.fromEntries(
    monologReactionOptions.map(({ kind }) => [kind, { count: 0, active: false, available: false }]),
  ) as MonologReactionStates;

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return result;

  try {
    const db = createSupabasePublic();
    const visitorHash = await getStreamVisitorHash();
    const targets = monologReactionOptions.map(({ kind }) => ({ kind, ...monologReactionTarget(slug, kind) }));
    const [counts, mine] = await Promise.all([
      Promise.all(targets.map(async (target) => {
        const count = await db.from('reactions').select('id', { count: 'exact', head: true })
          .eq('slug', target.slug).eq('emoji', target.emoji);
        return { ...target, count: count.count ?? 0, available: !count.error };
      })),
      visitorHash
        ? db.from('reactions').select('slug,emoji').eq('ip_hash', visitorHash)
          .in('slug', [...new Set(targets.map((target) => target.slug))])
        : Promise.resolve({ data: [], error: null }),
    ]);
    const active = new Set((mine.data ?? []).map((row) => `${row.slug}|${row.emoji}`));
    for (const item of counts) {
      result[item.kind] = {
        count: item.count,
        active: active.has(`${item.slug}|${item.emoji}`),
        available: item.available && !mine.error,
      };
    }
  } catch {
    // Reactions are optional and must never make an episode unavailable.
  }

  return result;
}
