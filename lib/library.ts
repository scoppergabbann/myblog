import { createSupabasePublic } from './supabase/public';

// =============================================================================
// Types
// =============================================================================

export type LibraryPhoto = {
  id: number;
  url: string;
  position: number;
};

export type LibraryCategory = {
  id: number;
  name: string;
  emoji: string;
  description: string | null;
  is_hidden: boolean;
  display_order: number;
  created_at: string;
};

export type LibraryItem = {
  id: number;
  category_id: number;
  name: string;
  subtitle: string | null;
  description: string | null;
  badge: string | null;
  reels_url: string | null;
  link_url: string | null;
  display_order: number;
  created_at: string;
  photos: LibraryPhoto[];
};

export type LibraryData = {
  categories: LibraryCategory[];
  itemsByCategory: Record<number, LibraryItem[]>;
};

// =============================================================================
// Helper: get cover URL
// =============================================================================

export function getCoverUrl(item: LibraryItem): string | null {
  return item.photos.length > 0 ? item.photos[0].url : null;
}

// =============================================================================
// Public query (anon read)
// =============================================================================

export async function getLibraryData(): Promise<LibraryData> {
  const supabase = createSupabasePublic();

  const [categoriesResult, itemsResult, photosResult] = await Promise.all([
    supabase
      .from('library_categories')
      .select('*')
      .eq('is_hidden', false)
      .order('display_order', { ascending: true }),
    supabase
      .from('library_items')
      .select('*')
      .order('created_at', { ascending: false })
      .order('display_order', { ascending: true }),
    supabase
      .from('library_photos')
      .select('id, new_item_id, url, position')
      .not('new_item_id', 'is', null)
      .order('position', { ascending: true }),
  ]);

  const categories = (categoriesResult.data ?? []) as LibraryCategory[];
  const rawItems = (itemsResult.data ?? []) as LibraryItem[];

  // Group photos by new_item_id — use Number() to ensure numeric keys
  const photoMap: Record<number, LibraryPhoto[]> = {};
  for (const p of photosResult.data ?? []) {
    const id = Number((p as any).new_item_id);
    if (!id) continue;
    if (!photoMap[id]) photoMap[id] = [];
    photoMap[id].push({ id: p.id, url: p.url, position: p.position });
  }

  // Sort photos within each item
  for (const id in photoMap) {
    photoMap[Number(id)].sort((a, b) => a.position - b.position);
  }

  // Attach photos to items + group by category
  const itemsByCategory: Record<number, LibraryItem[]> = {};
  for (const item of rawItems) {
    const withPhotos: LibraryItem = {
      ...item,
      photos: photoMap[item.id] ?? [],
    };
    if (!itemsByCategory[item.category_id]) {
      itemsByCategory[item.category_id] = [];
    }
    itemsByCategory[item.category_id].push(withPhotos);
  }

  return { categories, itemsByCategory };
}
