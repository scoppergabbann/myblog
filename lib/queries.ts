import { createSupabaseServer } from '@/lib/supabase/server';

export type GuestbookEntry = {
  id: number;
  name: string;
  message: string;
  created_at: string;
};

export type Comment = {
  id: number;
  slug: string;
  name: string;
  message: string;
  created_at: string;
};

export type ReactionCounts = {
  love: number;
  fire: number;
  wow: number;
  lol: number;
  brain: number;
  poop: number;
};

export async function getGuestbookEntries(): Promise<GuestbookEntry[]> {
  try {
    const supabase = await createSupabaseServer();
    const { data, error } = await supabase
      .from('guestbook')
      .select('id, name, message, created_at')
      .eq('approved', true)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('[guestbook fetch]', error);
      return [];
    }
    return data ?? [];
  } catch (e) {
    console.error('[guestbook fetch] exception', e);
    return [];
  }
}

export async function getCommentsForSlug(slug: string): Promise<Comment[]> {
  try {
    const supabase = await createSupabaseServer();
    const { data, error } = await supabase
      .from('comments')
      .select('id, slug, name, message, created_at')
      .eq('slug', slug)
      .eq('approved', true)
      .order('created_at', { ascending: true })
      .limit(200);

    if (error) {
      console.error('[comments fetch]', error);
      return [];
    }
    return data ?? [];
  } catch (e) {
    console.error('[comments fetch] exception', e);
    return [];
  }
}

export async function getReactionsForSlug(
  slug: string
): Promise<ReactionCounts> {
  const empty: ReactionCounts = {
    love: 0,
    fire: 0,
    wow: 0,
    lol: 0,
    brain: 0,
    poop: 0,
  };
  try {
    const supabase = await createSupabaseServer();
    const { data, error } = await supabase
      .from('reactions')
      .select('emoji')
      .eq('slug', slug);

    if (error) {
      console.error('[reactions fetch]', error);
      return empty;
    }

    const counts = { ...empty };
    for (const r of data ?? []) {
      const key = r.emoji as keyof ReactionCounts;
      if (key in counts) counts[key]++;
    }
    return counts;
  } catch (e) {
    console.error('[reactions fetch] exception', e);
    return empty;
  }
}

export async function getViewCount(slug: string): Promise<number> {
  try {
    const supabase = await createSupabaseServer();
    const { data, error } = await supabase
      .from('views')
      .select('count')
      .eq('slug', slug)
      .maybeSingle();
    if (error || !data) return 0;
    return Number(data.count) || 0;
  } catch {
    return 0;
  }
}
