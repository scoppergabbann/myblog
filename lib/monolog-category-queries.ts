import { createSupabasePublic } from '@/lib/supabase/public';
import { defaultMonologCategories } from '@/lib/monolog-shared';
import type { MonologCategory } from '@/types/monolog';

type CategoryRow = {
  id: number;
  slug: string;
  label: string;
  sort_order: number;
};

export function mapMonologCategory(row: CategoryRow): MonologCategory {
  return {
    id: Number(row.id),
    slug: row.slug,
    label: row.label,
    sortOrder: Number(row.sort_order) || 0,
  };
}

function migrationMissing(code?: string): boolean {
  return code === 'PGRST205' || code === '42P01';
}

export async function getMonologCategories(): Promise<MonologCategory[]> {
  try {
    const { data, error } = await createSupabasePublic()
      .from('monolog_categories')
      .select('id, slug, label, sort_order')
      .order('sort_order', { ascending: true })
      .order('id', { ascending: true });
    if (error) {
      if (migrationMissing(error.code)) return defaultMonologCategories;
      console.error('[monolog.categories.public]', error);
      return defaultMonologCategories;
    }
    return (data ?? []).map((row) => mapMonologCategory(row as CategoryRow));
  } catch (error) {
    console.error('[monolog.categories.public]', error);
    return defaultMonologCategories;
  }
}

export async function getAdminMonologCategories(): Promise<MonologCategory[]> {
  const { createSupabaseAdmin } = await import('@/lib/supabase/admin');
  const { data, error } = await createSupabaseAdmin()
    .from('monolog_categories')
    .select('id, slug, label, sort_order')
    .order('sort_order', { ascending: true })
    .order('id', { ascending: true });
  if (error) {
    if (migrationMissing(error.code)) return defaultMonologCategories;
    throw new Error(`Kategori Monolog tidak tersedia: ${error.message}`);
  }
  return (data ?? []).map((row) => mapMonologCategory(row as CategoryRow));
}
