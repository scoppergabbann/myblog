import type { LibraryData } from './library';
import type { StreamEntry } from './now-stream';
import type { Writing } from '@/types/content';
import type { PublishedMonologEpisode } from '@/types/monolog';

export type HomeUpdateKind = 'writing' | 'monolog' | 'library' | 'now';

export type HomeContentUpdate = {
  id: string;
  kind: HomeUpdateKind;
  label: string;
  title: string;
  summary: string;
  href: string;
  publishedAt: string;
};

export function buildHomeContentUpdates({
  writings,
  monologEpisodes,
  library,
  streamEntries,
  limit = 8,
}: {
  writings: Writing[];
  monologEpisodes: PublishedMonologEpisode[];
  library: LibraryData;
  streamEntries: StreamEntry[];
  limit?: number;
}): HomeContentUpdate[] {
  const categoryNames = new Map(library.categories.map((category) => [category.id, category.name]));
  const libraryItems = Object.values(library.itemsByCategory).flat();

  const updates: HomeContentUpdate[] = [
    ...writings.map((writing) => ({
      id: `writing-${writing.slug}`,
      kind: 'writing' as const,
      label: 'Writing',
      title: writing.title,
      summary: writing.summary,
      href: `/writing/${writing.slug}`,
      publishedAt: writing.date,
    })),
    ...monologEpisodes.map((episode) => ({
      id: `monolog-${episode.slug}`,
      kind: 'monolog' as const,
      label: 'Monolog',
      title: episode.title,
      summary: episode.description,
      href: `/monolog/${episode.slug}`,
      publishedAt: episode.publishedAt,
    })),
    ...libraryItems.map((item) => ({
      id: `library-${item.id}`,
      kind: 'library' as const,
      label: `Library · ${categoryNames.get(item.category_id) ?? 'Koleksi'}`,
      title: item.name,
      summary: item.description || item.subtitle || 'Koleksi baru ditambahkan ke Library.',
      href: `/library#item-${item.id}`,
      publishedAt: item.created_at,
    })),
    ...streamEntries.map((entry) => ({
      id: `now-${entry.id}`,
      kind: 'now' as const,
      label: 'Now',
      title: entry.title,
      summary: cleanSummary(entry.content),
      href: `/now#update-${entry.id}`,
      publishedAt: `${entry.published_on}T12:00:00+07:00`,
    })),
  ];

  return updates
    .filter((update) => Number.isFinite(Date.parse(update.publishedAt)))
    .sort((left, right) => Date.parse(right.publishedAt) - Date.parse(left.publishedAt))
    .slice(0, Math.max(0, limit));
}

function cleanSummary(value: string): string {
  return value
    .replace(/\[[^\]]+\]\([^\)]+\)/g, (match) => match.replace(/^\[|\]\([^\)]+\)$/g, ''))
    .replace(/[*_`>#~-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 180);
}
