import { createSupabaseAdmin } from '@/lib/supabase/admin';
import type { LibraryCategory, LibraryItem, LibraryPhoto } from '@/lib/library';
import { LibraryAdminEditor } from './library-admin-editor';

export const dynamic = 'force-dynamic';

export default async function LibraryAdminPage() {
  const supabase = createSupabaseAdmin();

  const [categoriesResult, itemsResult, photosResult] = await Promise.all([
    supabase.from('library_categories').select('*').order('display_order'),
    supabase.from('library_items').select('*').order('display_order').order('created_at', { ascending: false }),
    supabase.from('library_photos').select('id, new_item_id, url, position')
      .not('new_item_id', 'is', null).order('position'),
  ]);

  const categories = (categoriesResult.data ?? []) as LibraryCategory[];
  const rawItems = (itemsResult.data ?? []) as LibraryItem[];

  // Attach photos to items — Number() ensures consistent numeric keys
  const photoMap: Record<number, LibraryPhoto[]> = {};
  for (const p of photosResult.data ?? []) {
    const id = Number((p as any).new_item_id);
    if (!id) continue;
    if (!photoMap[id]) photoMap[id] = [];
    photoMap[id].push({ id: p.id, url: p.url, position: p.position });
  }

  const items: LibraryItem[] = rawItems.map((item) => ({
    ...item,
    photos: (photoMap[item.id] ?? []).sort((a, b) => a.position - b.position),
  }));

  return (
    <div className="page-fade">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="mb-2 text-[26px] font-medium tracking-[-0.025em] text-[var(--color-ink)]">Library</h1>
          <p className="text-[14px] text-[var(--color-ink-3)]">Kelola kategori dan koleksi item library.</p>
        </div>
        <a href="/library" target="_blank" className="font-mono text-[12px] text-[var(--color-ink-3)] transition-colors hover:text-[var(--color-accent)]">
          view live →
        </a>
      </div>
      <LibraryAdminEditor categories={categories} items={items} />
    </div>
  );
}
