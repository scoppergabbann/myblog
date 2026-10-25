import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { buildLibraryStreamContent, isGeneratedLibraryEntry, type LibraryStreamEntry, type StreamLibraryItem } from './library-stream';

export async function enrichLibraryStreamEntries(entries: LibraryStreamEntry[], db: SupabaseClient): Promise<LibraryStreamEntry[]> {
  const ids = [...new Set(entries.filter(isGeneratedLibraryEntry).map(entry => entry.source_library_item_id!))];
  if (!ids.length) return entries;
  // Use the caller's client: public reads keep RLS, admin reads can preview drafts.
  const { data, error } = await db.from('library_items')
    .select('id, name, item_type, details, badge, description, subtitle').in('id', ids);
  if (error) throw new Error('Detail pembaruan library sementara tidak tersedia.');
  const items = new Map(((data ?? []) as StreamLibraryItem[]).map(item => [item.id, item]));
  return entries.map(entry => {
    const item = items.get(entry.source_library_item_id!);
    return isGeneratedLibraryEntry(entry) && item ? { ...entry, content: buildLibraryStreamContent(item) } : entry;
  });
}
