import { createSupabasePublic } from './supabase/public';

// =============================================================================
// Types
// =============================================================================

export type BookStatus = 'reading' | 'finished' | 'wishlist';
export type DrinkCategory = 'kopi' | 'teh' | 'susu' | 'jus' | 'lainnya';
export type VehicleStatus = 'wishlist' | 'pernah_nyetir' | 'pernah_naik' | 'pernah_punya' | 'impian';

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
// Public queries (anon read)
// =============================================================================

export async function getLibraryData(): Promise<LibraryData> {
  const supabase = createSupabasePublic();

  const [books, drinks, cars, motorcycles] = await Promise.all([
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
  ]);

  return {
    books: (books.data ?? []) as LibraryBook[],
    drinks: (drinks.data ?? []) as LibraryDrink[],
    cars: (cars.data ?? []) as LibraryCar[],
    motorcycles: (motorcycles.data ?? []) as LibraryMotorcycle[],
  };
}
