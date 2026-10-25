import Link from 'next/link';
import { createSupabaseAdmin } from '@/lib/supabase/admin';
import { StreamEditor } from './stream-editor';
import { SpotifyEditor } from './spotify-editor';
import type { LibraryStreamEntry } from '@/lib/library-stream';
import { enrichLibraryStreamEntries } from '@/lib/library-stream-queries';
export const dynamic = 'force-dynamic';
export default async function AdminNowPage() {
  const db = createSupabaseAdmin();
  const [entries, meta] = await Promise.all([
    db.from('now_entries').select('*')
      .or('legacy_key.is.null,legacy_key.neq.migration-015').order('published_on', { ascending: false }).order('id', { ascending: false }),
    db.from('now_meta').select('spotify_url').eq('id', 1).maybeSingle(),
  ]);
  let streamEntries: LibraryStreamEntry[] = [];
  let detailError = false;
  if (!entries.error) {
    try { streamEntries = await enrichLibraryStreamEntries((entries.data ?? []) as LibraryStreamEntry[], db); }
    catch { detailError = true; }
  }
  const missingMigration = entries.error && ['PGRST205', '42P01'].includes(entries.error.code);
  return <div>
    <div className="mb-7 flex flex-wrap items-start justify-between gap-3">
      <div><h1 className="mb-1 text-[28px] font-medium tracking-[-0.025em]">Stream</h1><p className="text-sm text-[var(--color-ink-3)]">Kelola catatan di /now. Urutan terbaru mengikuti tanggal catatan.</p></div>
      <Link href="/now" target="_blank" className="text-sm underline underline-offset-4">Lihat halaman ↗</Link>
    </div>
    {entries.error || detailError ? <div role="alert" className="mb-8 rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 text-sm">
      {missingMigration ? <>Jalankan <code>supabase/migrations/015_now_stream.sql</code> melalui Supabase SQL Editor untuk mengaktifkan CRUD Stream. Aktivitas lama akan disalin otomatis.</> : 'Data Stream gagal dimuat. Coba muat ulang halaman.'}
    </div> : <StreamEditor entries={streamEntries} />}
    <details className="mt-10 border-t border-[var(--color-line)] pt-5"><summary className="mb-4 cursor-pointer text-sm text-[var(--color-ink-3)]">Musik / Spotify</summary><SpotifyEditor initialUrl={meta.data?.spotify_url ?? null} /></details>
  </div>;
}
