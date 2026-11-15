import { monologEpisodes } from '@/content/monolog/episodes';
import type {
  MonologCategorySlug,
  MonologEpisodeInput,
  MonologEpisodeRecord,
  PublishedMonologEpisode,
} from '@/types/monolog';

export const monologCategories = [
  { slug: 'menuju-nikah', label: 'Menuju Nikah' },
  { slug: 'karier', label: 'Karier' },
  { slug: 'olahraga', label: 'Olahraga' },
  { slug: 'hobi', label: 'Hobi' },
  { slug: 'random', label: 'Random' },
] as const satisfies readonly { slug: MonologCategorySlug; label: string }[];

const categoryLabels = new Map<MonologCategorySlug, string>(
  monologCategories.map((category) => [category.slug, category.label]),
);

function contentError(index: number, message: string): never {
  throw new Error(`[monolog] Episode ke-${index + 1}: ${message}`);
}

function isValidAudioUrl(value: string): boolean {
  if (value.startsWith('/audio/monolog/')) {
    return /^\/audio\/monolog\/[a-zA-Z0-9._-]+\.m4a(?:\?.*)?$/.test(value);
  }

  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.pathname.toLowerCase().endsWith('.m4a');
  } catch {
    return false;
  }
}

export function parseMonologEpisodes(
  entries: readonly MonologEpisodeInput[],
): MonologEpisodeRecord[] {
  const ids = new Set<string>();
  const slugs = new Set<string>();

  return entries.map((entry, index) => {
    const id = entry.id.trim();
    const slug = entry.slug.trim();
    const title = entry.title.trim();
    const description = entry.description.trim();

    if (!id) contentError(index, 'id wajib diisi.');
    if (ids.has(id)) contentError(index, `id "${id}" duplikat.`);
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      contentError(index, 'slug hanya boleh berisi huruf kecil, angka, dan tanda hubung.');
    }
    if (slugs.has(slug)) contentError(index, `slug "${slug}" duplikat.`);
    if (!title) contentError(index, 'title wajib diisi.');
    if (!description) contentError(index, 'description wajib diisi.');
    if (!categoryLabels.has(entry.category)) contentError(index, 'category tidak dikenal.');
    if (!['draft', 'published'].includes(entry.status)) contentError(index, 'status tidak dikenal.');

    if (entry.status === 'published') {
      if (!entry.audioUrl || !isValidAudioUrl(entry.audioUrl)) {
        contentError(index, 'episode published membutuhkan URL .m4a yang valid.');
      }
      if (!entry.publishedAt || !Number.isFinite(Date.parse(entry.publishedAt))) {
        contentError(index, 'episode published membutuhkan publishedAt yang valid.');
      }
      if (!Number.isInteger(entry.durationSeconds) || (entry.durationSeconds ?? 0) <= 0) {
        contentError(index, 'episode published membutuhkan durationSeconds lebih dari 0.');
      }
    }

    ids.add(id);
    slugs.add(slug);

    return {
      ...entry,
      id,
      slug,
      title,
      description,
      audioUrl: entry.audioUrl?.trim() || null,
      transcript: entry.transcript?.trim() || null,
      reflection: entry.reflection?.trim() || null,
      tags: [...new Set((entry.tags ?? []).map((tag) => tag.trim()).filter(Boolean))],
    };
  });
}

const episodeRecords = parseMonologEpisodes(monologEpisodes);

function isPublished(episode: MonologEpisodeRecord): episode is PublishedMonologEpisode {
  return episode.status === 'published'
    && typeof episode.audioUrl === 'string'
    && typeof episode.publishedAt === 'string'
    && typeof episode.durationSeconds === 'number';
}

export function getPublishedMonologEpisodes(): PublishedMonologEpisode[] {
  return episodeRecords
    .filter(isPublished)
    .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
}

export function getPublishedMonologEpisode(slug: string): PublishedMonologEpisode | null {
  return getPublishedMonologEpisodes().find((episode) => episode.slug === slug) ?? null;
}

export function getRelatedMonologEpisodes(
  episode: PublishedMonologEpisode,
  limit = 3,
): PublishedMonologEpisode[] {
  const tags = new Set(episode.tags);
  return getPublishedMonologEpisodes()
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

export function monologCategoryLabel(category: MonologCategorySlug): string {
  return categoryLabels.get(category) ?? category;
}

export function formatAudioDuration(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
}

export function audioDurationIso(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainder = seconds % 60;
  return `PT${hours ? `${hours}H` : ''}${minutes ? `${minutes}M` : ''}${remainder || (!hours && !minutes) ? `${remainder}S` : ''}`;
}
