import { createSupabaseAdmin } from '@/lib/supabase/admin';
import { LibraryAdminEditor } from './library-admin-editor';
import type {
  LibraryBook,
  LibraryDrink,
  LibraryCar,
  LibraryMotorcycle,
  LibraryPhoto,
} from '@/lib/library';

export const dynamic = 'force-dynamic';

export default async function LibraryAdminPage() {
  const supabase = createSupabaseAdmin();

  const [books, drinks, cars, motorcycles, photos] = await Promise.all([
    supabase.from('library_books').select('*').order('display_order').order('created_at', { ascending: false }),
    supabase.from('library_drinks').select('*').order('display_order').order('created_at', { ascending: false }),
    supabase.from('library_cars').select('*').order('display_order').order('created_at', { ascending: false }),
    supabase.from('library_motorcycles').select('*').order('display_order').order('created_at', { ascending: false }),
    supabase.from('library_photos').select('id, item_type, item_id, url, position').order('position'),
  ]);

  // Group photos by "type:id" key
  const photoMap: Record<string, LibraryPhoto[]> = {};
  for (const p of photos.data ?? []) {
    const key = `${p.item_type}:${p.item_id}`;
    if (!photoMap[key]) photoMap[key] = [];
    photoMap[key].push({ id: p.id, url: p.url, position: p.position });
  }

  const attach = <T extends { id: number }>(items: T[], type: string) =>
    items.map((item) => ({
      ...item,
      photos: (photoMap[`${type}:${item.id}`] ?? []).sort(
        (a, b) => a.position - b.position
      ),
    }));

  return (
    <div className="page-fade">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="mb-2 text-[26px] font-medium tracking-[-0.025em] text-[var(--color-ink)]">
            Library
          </h1>
          <p className="text-[14px] text-[var(--color-ink-3)]">
            Kelola koleksi buku, minuman, mobil, dan motor.
          </p>
        </div>
        <a
          href="/library"
          target="_blank"
          className="font-mono text-[12px] text-[var(--color-ink-3)] transition-colors hover:text-[var(--color-accent)]"
        >
          view live →
        </a>
      </div>

      <LibraryAdminEditor
        books={attach(books.data ?? [], 'book') as LibraryBook[]}
        drinks={attach(drinks.data ?? [], 'drink') as LibraryDrink[]}
        cars={attach(cars.data ?? [], 'car') as LibraryCar[]}
        motorcycles={attach(motorcycles.data ?? [], 'motorcycle') as LibraryMotorcycle[]}
      />
    </div>
  );
}
