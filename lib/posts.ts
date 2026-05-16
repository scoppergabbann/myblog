import readingTimeFn from 'reading-time';
import { createSupabaseServer } from './supabase/server';
import type { Writing } from '@/types/content';

type PostRow = {
  slug: string;
  title: string;
  summary: string;
  content: string;
  tags: string[];
  status: string;
  published_at: string | null;
};

function rowToWriting(row: PostRow): Writing {
  const stats = readingTimeFn(row.content);
  return {
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    content: row.content,
    tags: row.tags ?? [],
    date: row.published_at ?? new Date().toISOString(),
    readingTime: `${Math.ceil(stats.minutes)} min`,
  };
}

export async function getAllWritingSlugs(): Promise<string[]> {
  try {
    const supabase = await createSupabaseServer();
    const { data, error } = await supabase
      .from('posts')
      .select('slug')
      .eq('status', 'published');
    if (error) {
      console.error('[posts.slugs]', error);
      return [];
    }
    return (data ?? []).map((r) => r.slug);
  } catch (e) {
    console.error('[posts.slugs] exception', e);
    return [];
  }
}

export async function getWritingBySlug(
  slug: string,
  options: { includeDraft?: boolean } = {}
): Promise<Writing | null> {
  try {
    const supabase = await createSupabaseServer();
    let q = supabase
      .from('posts')
      .select('slug, title, summary, content, tags, status, published_at')
      .eq('slug', slug);
    if (!options.includeDraft) {
      q = q.eq('status', 'published');
    }
    const { data, error } = await q.maybeSingle();
    if (error || !data) return null;
    return rowToWriting(data as PostRow);
  } catch {
    return null;
  }
}

export async function getAllWritings(): Promise<Writing[]> {
  try {
    const supabase = await createSupabaseServer();
    const { data, error } = await supabase
      .from('posts')
      .select('slug, title, summary, content, tags, status, published_at')
      .eq('status', 'published')
      .order('published_at', { ascending: false });
    if (error) {
      console.error('[posts.all]', error);
      return [];
    }
    return (data ?? []).map((r) => rowToWriting(r as PostRow));
  } catch {
    return [];
  }
}

export async function getAllTags(): Promise<string[]> {
  const posts = await getAllWritings();
  const tags = new Set<string>();
  for (const p of posts) p.tags.forEach((t) => tags.add(t));
  return Array.from(tags).sort();
}

/**
 * Return the prev (newer) and next (older) post relative to the given slug.
 * Both are by published_at order. Returns null if at the edge.
 */
export async function getAdjacentWritings(slug: string): Promise<{
  prev: Pick<Writing, 'slug' | 'title'> | null;
  next: Pick<Writing, 'slug' | 'title'> | null;
}> {
  const all = await getAllWritings();
  const idx = all.findIndex((w) => w.slug === slug);
  if (idx < 0) return { prev: null, next: null };
  // all is ordered newest first; so prev = idx-1 (newer), next = idx+1 (older)
  const prev = idx > 0 ? { slug: all[idx - 1].slug, title: all[idx - 1].title } : null;
  const next = idx < all.length - 1
    ? { slug: all[idx + 1].slug, title: all[idx + 1].title }
    : null;
  return { prev, next };
}

/**
 * Find related posts to the given slug, scored by tag overlap.
 * Returns up to `limit` posts (default 3). Falls back to most recent posts
 * (excluding current) if no tag overlap exists.
 */
export async function getRelatedWritings(
  slug: string,
  limit = 3
): Promise<Pick<Writing, 'slug' | 'title' | 'summary' | 'tags' | 'readingTime' | 'date'>[]> {
  const all = await getAllWritings();
  const current = all.find((w) => w.slug === slug);
  if (!current) return [];

  const others = all.filter((w) => w.slug !== slug);
  if (current.tags.length === 0) {
    return others.slice(0, limit).map(strip);
  }

  // Score by tag intersection size, then recency
  const scored = others
    .map((w) => {
      const overlap = w.tags.filter((t) => current.tags.includes(t)).length;
      return { post: w, overlap };
    })
    .filter((s) => s.overlap > 0)
    .sort((a, b) => {
      if (b.overlap !== a.overlap) return b.overlap - a.overlap;
      return new Date(b.post.date).getTime() - new Date(a.post.date).getTime();
    })
    .slice(0, limit)
    .map((s) => strip(s.post));

  if (scored.length < limit) {
    // Fill remainder with recent posts not already included
    const ids = new Set(scored.map((s) => s.slug));
    for (const w of others) {
      if (scored.length >= limit) break;
      if (!ids.has(w.slug)) scored.push(strip(w));
    }
  }
  return scored;
}

function strip(
  w: Writing
): Pick<Writing, 'slug' | 'title' | 'summary' | 'tags' | 'readingTime' | 'date'> {
  return {
    slug: w.slug,
    title: w.title,
    summary: w.summary,
    tags: w.tags,
    readingTime: w.readingTime,
    date: w.date,
  };
}
