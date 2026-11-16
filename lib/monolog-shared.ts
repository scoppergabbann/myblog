import type { MonologCategorySlug } from '@/types/monolog';

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

export function monologCategoryLabel(category: MonologCategorySlug): string {
  return categoryLabels.get(category) ?? category;
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
