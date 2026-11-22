import type { MonologCategory, MonologCategorySlug } from '@/types/monolog';

export const defaultMonologCategories: MonologCategory[] = [
  { id: 1, slug: 'menuju-nikah', label: 'Menuju Nikah', sortOrder: 10 },
  { id: 2, slug: 'karier', label: 'Karier', sortOrder: 20 },
  { id: 3, slug: 'olahraga', label: 'Olahraga', sortOrder: 30 },
  { id: 4, slug: 'hobi', label: 'Hobi', sortOrder: 40 },
  { id: 5, slug: 'random', label: 'Random', sortOrder: 50 },
];

export function monologCategoryLabel(
  category: MonologCategorySlug,
  categories: Pick<MonologCategory, 'slug' | 'label'>[] = defaultMonologCategories,
): string {
  const fallback = category.split('-').filter(Boolean)
    .map((word) => `${word[0]?.toUpperCase() ?? ''}${word.slice(1)}`).join(' ');
  return categories.find((item) => item.slug === category)?.label || fallback || category;
}

export function slugifyMonologCategory(value: string): string {
  return slugifyMonologTitle(value).slice(0, 50).replace(/-+$/g, '');
}

export function slugifyMonologTitle(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100)
    .replace(/-+$/g, '');
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
