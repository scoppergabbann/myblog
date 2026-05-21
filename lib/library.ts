import { createSupabasePublic } from './supabase/public';

// =============================================================================
// Types
// =============================================================================

export type BookStatus = 'reading' | 'finished' | 'wishlist';
export type DrinkCategory = 'kopi' | 'teh' | 'susu' | 'jus' | 'lainnya';
export type VehicleStatus =
  | 'wishlist'
  | 'pernah_nyetir'
  | 'pernah_naik'
  | 'pernah_punya'
  | 'impian';

export type LibraryPhoto = {
  id: number;
  url: string;
  position: number;
};

export type LibraryBook = {
  id: number;
  title: string;
  author: string;
  cover_url: string | null;
  year_read: number | null;
  description: string | null;
  status: BookStatus;
  link_url: string | null;
  display_order: number;
  created_at: string;
  photos: LibraryPhoto[];
};

export type LibraryDrink = {
  id: number;
  name: string;
  brand: string | null;
  photo_url: string | null;
  description: string | null;
  category: DrinkCategory;
  reels_url: string | null;
  display_order: number;
  created_at: string;
  photos: LibraryPhoto[];
};

export type LibraryCar = {
  id: number;
  name: string;
  model: string | null;
  year: number | null;
  photo_url: string | null;
  description: string | null;
  status: VehicleStatus;
  reels_url: string | null;
  display_order: number;
  created_at: string;
  photos: LibraryPhoto[];
};

export type LibraryMotorcycle = {
  id: number;
  name: string;
  model: string | null;
  year: number | null;
  photo_url: string | null;
  description: string | null;
  status: VehicleStatus;
  reels_url: string | null;
  display_order: number;
  created_at: string;
  photos: LibraryPhoto[];
};

export type LibraryData = {
  books: LibraryBook[];
  drinks: LibraryDrink[];
  cars: LibraryCar[];
  motorcycles: LibraryMotorcycle[];
};

// =============================================================================
// Labels
// =============================================================================

export const BOOK_STATUS_LABELS: Record<BookStatus, string> = {
  reading: 'Sedang dibaca',
  finished: 'Selesai',
  wishlist: 'Wishlist',
};

export const DRINK_CATEGORY_LABELS: Record<DrinkCategory, string> = {
  kopi: 'Kopi',
  teh: 'Teh',
  susu: 'Susu',
  jus: 'Jus',
  lainnya: 'Lainnya',
};

export const CAR_STATUS_LABELS: Record<string, string> = {
  wishlist: 'Wishlist',
  pernah_nyetir: 'Pernah nyetir',
  pernah_punya: 'Pernah punya',
  impian: 'Impian',
};

export const MOTO_STATUS_LABELS: Record<string, string> = {
  wishlist: 'Wishlist',
  pernah_naik: 'Pernah naik',
  pernah_punya: 'Pernah punya',
  impian: 'Impian',
};

// =============================================================================
// Helpers
// =============================================================================

type RawPhoto = { id: number; url: string; position: number };

function sortPhotos(photos: RawPhoto[]): LibraryPhoto[] {
  return [...photos].sort((a, b) => a.position - b.position);
}

/**
 * Get cover URL for a library item.
 * Priority: first gallery photo → legacy photo_url/cover_url field
 */
export function getCoverUrl(
  item: LibraryBook | LibraryDrink | LibraryCar | LibraryMotorcycle
): string | null {
  if (item.photos.length > 0) return item.photos[0].url;
  if ('cover_url' in item) return item.cover_url;
  return item.photo_url;
}

// =============================================================================
// Public queries (anon read)
// =============================================================================

export async function getLibraryData(): Promise<LibraryData> {
  const supabase = createSupabasePublic();

  const [books, drinks, cars, motorcycles, photos] = await Promise.all([
    supabase
      .from('library_books')
      .select('*')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false }),
    supabase
      .from('library_drinks')
      .select('*')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false }),
    supabase
      .from('library_cars')
      .select('*')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false }),
    supabase
      .from('library_motorcycles')
      .select('*')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false }),
    supabase
      .from('library_photos')
      .select('id, item_type, item_id, url, position')
      .order('position', { ascending: true }),
  ]);

  // Group photos by item_type + item_id
  const photoMap: Record<string, LibraryPhoto[]> = {};
  for (const p of photos.data ?? []) {
    const key = `${p.item_type}:${p.item_id}`;
    if (!photoMap[key]) photoMap[key] = [];
    photoMap[key].push({ id: p.id, url: p.url, position: p.position });
  }

  const attachPhotos = <
    T extends { id: number },
  >(
    items: T[],
    itemType: string
  ): (T & { photos: LibraryPhoto[] })[] =>
    items.map((item) => ({
      ...item,
      photos: sortPhotos(photoMap[`${itemType}:${item.id}`] ?? []),
    }));

  return {
    books: attachPhotos(
      (books.data ?? []) as LibraryBook[],
      'book'
    ) as LibraryBook[],
    drinks: attachPhotos(
      (drinks.data ?? []) as LibraryDrink[],
      'drink'
    ) as LibraryDrink[],
    cars: attachPhotos(
      (cars.data ?? []) as LibraryCar[],
      'car'
    ) as LibraryCar[],
    motorcycles: attachPhotos(
      (motorcycles.data ?? []) as LibraryMotorcycle[],
      'motorcycle'
    ) as LibraryMotorcycle[],
  };
}
