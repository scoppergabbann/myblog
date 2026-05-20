import { createSupabaseAdmin } from '@/lib/supabase/admin';
import { LibraryAdminEditor } from './library-admin-editor';
import type {
  LibraryBook,
  LibraryDrink,
  LibraryCar,
  LibraryMotorcycle,
} from '@/lib/library';

export const dynamic = 'force-dynamic';

export default async function LibraryAdminPage() {
  const supabase = createSupabaseAdmin();

  const [books, drinks, cars, motorcycles] = await Promise.all([
    supabase.from('library_books').select('*').order('display_order').order('created_at', { ascending: false }),
    supabase.from('library_drinks').select('*').order('display_order').order('created_at', { ascending: false }),
    supabase.from('library_cars').select('*').order('display_order').order('created_at', { ascending: false }),
    supabase.from('library_motorcycles').select('*').order('display_order').order('created_at', { ascending: false }),
  ]);

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
        books={(books.data ?? []) as LibraryBook[]}
        drinks={(drinks.data ?? []) as LibraryDrink[]}
        cars={(cars.data ?? []) as LibraryCar[]}
        motorcycles={(motorcycles.data ?? []) as LibraryMotorcycle[]}
      />
    </div>
  );
}
