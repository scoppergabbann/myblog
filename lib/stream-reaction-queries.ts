import 'server-only';
import { createSupabasePublic } from '@/lib/supabase/public';
import { getStreamVisitorHash } from '@/lib/stream-visitor';
import { streamReactionOptions, streamReactionTarget, type StreamReactionStates } from '@/lib/stream-reactions';

export async function getStreamReactionStates(entryIds: number[]): Promise<Record<number, StreamReactionStates>> {
  const ids = [...new Set(entryIds.filter(id => Number.isSafeInteger(id) && id > 0))];
  if (!ids.length) return {};
  const targets = ids.flatMap(id => streamReactionOptions.map(({ kind }) => ({ id, kind, ...streamReactionTarget(id, kind) })));
  const result = Object.fromEntries(ids.map(id => [id, Object.fromEntries(streamReactionOptions.map(({ kind }) => [kind, { count: 0, active: false, available: false }]))])) as Record<number, StreamReactionStates>;
  try {
    const db = createSupabasePublic();
    const visitorHash = await getStreamVisitorHash();
    const [counts, mine] = await Promise.all([
      Promise.all(targets.map(async target => {
        const count = await db.from('reactions').select('id', { count: 'exact', head: true })
          .eq('slug', target.slug).eq('emoji', target.emoji);
        return { ...target, count: count.count ?? 0, available: !count.error };
      })),
      visitorHash ? db.from('reactions').select('slug,emoji').eq('ip_hash', visitorHash)
        .in('slug', [...new Set(targets.map(target => target.slug))]) : Promise.resolve({ data: [], error: null }),
    ]);
    const active = new Set((mine.data ?? []).map(row => `${row.slug}|${row.emoji}`));
    for (const item of counts) result[item.id][item.kind] = {
      count: item.count, active: active.has(`${item.slug}|${item.emoji}`), available: item.available && !mine.error,
    };
  } catch { /* Keep unavailable states without breaking the public timeline. */ }
  return result;
}
