import { createSupabasePublic } from '@/lib/supabase/public';
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
  created_at: string;
  updated_at: string;
};

function mapEpisode(row: MonologRow): MonologEpisodeRecord {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    category: row.category,
    audioUrl: row.audio_url,
    audioPath: row.audio_path,
    durationSeconds: row.duration_seconds,
    publishedAt: row.published_at,
    status: row.status,
    transcript: row.transcript,
    reflection: row.reflection,
    tags: row.tags ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function isPublished(episode: MonologEpisodeRecord): episode is PublishedMonologEpisode {
  return episode.status === 'published'
    && episode.audioUrl.length > 0
    && typeof episode.publishedAt === 'string'
    && episode.durationSeconds > 0;
}

function migrationMissing(code?: string): boolean {
  return code === 'PGRST205' || code === '42P01';
}

export async function getPublishedMonologEpisodes(): Promise<PublishedMonologEpisode[]> {
  const { data, error } = await createSupabasePublic()
    .from('monolog_episodes')
    .select('id, slug, title, description, category, audio_url, audio_path, duration_seconds, published_at, status, transcript, reflection, tags, created_at, updated_at')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .order('id', { ascending: false });

  if (error) {
    if (migrationMissing(error.code)) return [];
    console.error('[monolog.public]', error);
    throw new Error('Monolog sementara tidak tersedia.');
  }

  return ((data ?? []) as MonologRow[]).map(mapEpisode).filter(isPublished);
}

export async function getPublishedMonologEpisode(slug: string): Promise<PublishedMonologEpisode | null> {
  const { data, error } = await createSupabasePublic()
    .from('monolog_episodes')
    .select('id, slug, title, description, category, audio_url, audio_path, duration_seconds, published_at, status, transcript, reflection, tags, created_at, updated_at')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle();

  if (error) {
    if (migrationMissing(error.code)) return null;
    console.error('[monolog.public.detail]', error);
    throw new Error('Monolog sementara tidak tersedia.');
  }

  if (!data) return null;
  const episode = mapEpisode(data as MonologRow);
  return isPublished(episode) ? episode : null;
}

export async function getMonologEpisodeForPreview(slug: string): Promise<MonologEpisodeRecord | null> {
  const { createSupabaseAdmin } = await import('@/lib/supabase/admin');
  const { data, error } = await createSupabaseAdmin()
    .from('monolog_episodes')
    .select('id, slug, title, description, category, audio_url, audio_path, duration_seconds, published_at, status, transcript, reflection, tags, created_at, updated_at')
    .eq('slug', slug)
    .maybeSingle();

  if (error) {
    if (migrationMissing(error.code)) return null;
    console.error('[monolog.preview.detail]', error);
    throw new Error('Preview Monolog sementara tidak tersedia.');
  }

  return data ? mapEpisode(data as MonologRow) : null;
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
