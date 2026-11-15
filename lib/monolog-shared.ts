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
