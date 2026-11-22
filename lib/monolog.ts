import { createSupabasePublic } from '@/lib/supabase/public';
import { getAdminMonologCategories, getMonologCategories } from '@/lib/monolog-category-queries';
import { monologCategoryLabel } from '@/lib/monolog-shared';
import type {
  MonologCategorySlug,
  MonologEpisodeRecord,
  PublishedMonologEpisode,
} from '@/types/monolog';

type MonologRow = {
  id: number;
  slug: string;
  title: string;
  description: string;
  category: MonologCategorySlug;
  audio_url: string;
  audio_path: string | null;
  duration_seconds: number;
  published_at: string | null;
  status: 'draft' | 'published';
  transcript: string | null;
  reflection: string | null;
  tags: string[] | null;
  is_pinned: boolean;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
};

function mapEpisode(row: MonologRow, categoryLabels = new Map<string, string>()): MonologEpisodeRecord {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    category: row.category,
    categoryLabel: categoryLabels.get(row.category) ?? monologCategoryLabel(row.category),
    audioUrl: row.audio_url,
    audioPath: row.audio_path,
    durationSeconds: row.duration_seconds,
    publishedAt: row.published_at,
    status: row.status,
    transcript: row.transcript,
    reflection: row.reflection,
    tags: row.tags ?? [],
    isPinned: Boolean(row.is_pinned),
    archivedAt: row.archived_at ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function isPublished(episode: MonologEpisodeRecord): episode is PublishedMonologEpisode {
  return episode.status === 'published'
    && episode.archivedAt === null
    && episode.audioUrl.length > 0
    && typeof episode.publishedAt === 'string'
    && episode.durationSeconds > 0;
}

function migrationMissing(code?: string): boolean {
  return code === 'PGRST205' || code === '42P01';
}

export async function getPublishedMonologEpisodes(): Promise<PublishedMonologEpisode[]> {
  const [{ data, error }, categories] = await Promise.all([
    createSupabasePublic()
      .from('monolog_episodes')
      .select('id, slug, title, description, category, audio_url, audio_path, duration_seconds, published_at, status, transcript, reflection, tags, is_pinned, archived_at, created_at, updated_at')
      .eq('status', 'published')
      .is('archived_at', null)
      .order('is_pinned', { ascending: false })
      .order('published_at', { ascending: false })
      .order('id', { ascending: false }),
    getMonologCategories(),
  ]);

  if (error) {
    if (migrationMissing(error.code)) return [];
    console.error('[monolog.public]', error);
    throw new Error('Monolog sementara tidak tersedia.');
  }

  const categoryLabels = new Map(categories.map((category) => [category.slug, category.label]));
  return ((data ?? []) as MonologRow[]).map((row) => mapEpisode(row, categoryLabels)).filter(isPublished);
}

export async function getPublishedMonologEpisode(slug: string): Promise<PublishedMonologEpisode | null> {
  const [{ data, error }, categories] = await Promise.all([
    createSupabasePublic()
      .from('monolog_episodes')
      .select('id, slug, title, description, category, audio_url, audio_path, duration_seconds, published_at, status, transcript, reflection, tags, is_pinned, archived_at, created_at, updated_at')
      .eq('slug', slug)
      .eq('status', 'published')
      .is('archived_at', null)
      .maybeSingle(),
    getMonologCategories(),
  ]);

  if (error) {
    if (migrationMissing(error.code)) return null;
    console.error('[monolog.public.detail]', error);
    throw new Error('Monolog sementara tidak tersedia.');
  }

  if (!data) return null;
  const categoryLabels = new Map(categories.map((category) => [category.slug, category.label]));
  const episode = mapEpisode(data as MonologRow, categoryLabels);
  return isPublished(episode) ? episode : null;
}

export async function getMonologEpisodeForPreview(slug: string): Promise<MonologEpisodeRecord | null> {
  const { createSupabaseAdmin } = await import('@/lib/supabase/admin');
  const [{ data, error }, categories] = await Promise.all([
    createSupabaseAdmin()
      .from('monolog_episodes')
      .select('id, slug, title, description, category, audio_url, audio_path, duration_seconds, published_at, status, transcript, reflection, tags, is_pinned, archived_at, created_at, updated_at')
      .eq('slug', slug)
      .maybeSingle(),
    getAdminMonologCategories(),
  ]);

  if (error) {
    if (migrationMissing(error.code)) return null;
    console.error('[monolog.preview.detail]', error);
    throw new Error('Preview Monolog sementara tidak tersedia.');
  }

  const categoryLabels = new Map(categories.map((category) => [category.slug, category.label]));
  return data ? mapEpisode(data as MonologRow, categoryLabels) : null;
}

export function getRelatedMonologEpisodes(
  episode: PublishedMonologEpisode,
  episodes: PublishedMonologEpisode[],
  limit = 3,
): PublishedMonologEpisode[] {
  const tags = new Set(episode.tags);
  return episodes
    .filter((candidate) => candidate.slug !== episode.slug)
    .map((candidate) => ({
      candidate,
      score: (candidate.category === episode.category ? 10 : 0)
        + candidate.tags.filter((tag) => tags.has(tag)).length,
    }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score
      || Date.parse(b.candidate.publishedAt) - Date.parse(a.candidate.publishedAt))
    .slice(0, limit)
    .map(({ candidate }) => candidate);
}
