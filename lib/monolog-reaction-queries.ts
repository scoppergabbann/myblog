import 'server-only';
import { createSupabasePublic } from '@/lib/supabase/public';
import { getStreamVisitorHash } from '@/lib/stream-visitor';
import {
  monologReactionOptions,
  monologReactionTarget,
  type MonologReactionStates,
} from '@/lib/monolog-reactions';

export async function getMonologReactionStates(slug: string): Promise<MonologReactionStates> {
  const all = await getMonologReactionStatesForSlugs([slug]);
  return all[slug] ?? emptyMonologReactionStates();
}

function emptyMonologReactionStates(): MonologReactionStates {
  return Object.fromEntries(
    monologReactionOptions.map(({ kind }) => [kind, { count: 0, active: false, available: false }]),
  ) as MonologReactionStates;
}

export async function getMonologReactionStatesForSlugs(slugs: string[]): Promise<Record<string, MonologReactionStates>> {
  const validSlugs = [...new Set(slugs.filter((slug) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)))];
  const result = Object.fromEntries(
    validSlugs.map((slug) => [slug, emptyMonologReactionStates()]),
  ) as Record<string, MonologReactionStates>;

  if (validSlugs.length === 0) return result;

  try {
    const db = createSupabasePublic();
    const visitorHash = await getStreamVisitorHash();
    const targets = validSlugs.flatMap((episodeSlug) => monologReactionOptions.map(({ kind }) => ({
      episodeSlug,
      kind,
      ...monologReactionTarget(episodeSlug, kind),
    })));
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
      result[item.episodeSlug][item.kind] = {
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
