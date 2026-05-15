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

export async function getWritingBySlug(slug: string): Promise<Writing | null> {
  try {
    const supabase = await createSupabaseServer();
    const { data, error } = await supabase
      .from('posts')
      .select('slug, title, summary, content, tags, status, published_at')
      .eq('slug', slug)
      .eq('status', 'published')
      .maybeSingle();
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
