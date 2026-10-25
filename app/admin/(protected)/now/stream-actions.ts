'use server';
import { auth, isAdmin } from '@/auth';
import { createSupabaseAdmin } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { validateStream, type StreamInput } from '@/lib/now-stream';
import type { NowResult } from './actions';
async function requireAdmin() {
  if (!isAdmin(await auth())) throw new Error('Unauthorized');
}
function refresh() {
  revalidatePath('/now');
  revalidatePath('/now/rss.xml');
  revalidatePath('/admin/now');
}
function databaseError(code: string, message: string) {
  return code === 'PGRST205' || code === '42P01'
    ? 'Jalankan migrasi 015_now_stream.sql di Supabase terlebih dahulu.' : message;
}
export async function saveStreamEntry(id: number | null, input: StreamInput): Promise<NowResult> {
  await requireAdmin();
  if (id !== null && (!Number.isSafeInteger(id) || id <= 0)) return { ok: false, error: 'ID tidak valid.' };
  const validation = validateStream(input);
  if (validation) return { ok: false, error: validation };
  const values = { title: input.title.trim(), category: input.category, project: input.project.trim(),
    project_url: input.project_url.trim(), content: input.content.trim(), published_on: input.published_on,
    published: input.published, updated_at: new Date().toISOString() };
  const db = createSupabaseAdmin();
  const query = id === null ? db.from('now_entries').insert(values) : db.from('now_entries').update(values).eq('id', id).or('legacy_key.is.null,legacy_key.neq.migration-015');
  const { data, error } = await query.select('id').maybeSingle();
  if (error) return { ok: false, error: databaseError(error.code, error.message) };
  if (!data) return { ok: false, error: 'Catatan tidak ditemukan. Muat ulang halaman.' };
  refresh();
  return { ok: true, id: data.id };
}
export async function deleteStreamEntry(id: number): Promise<NowResult> {
  await requireAdmin();
  if (!Number.isSafeInteger(id) || id <= 0) return { ok: false, error: 'ID tidak valid.' };
  const { data, error } = await createSupabaseAdmin().from('now_entries').delete().eq('id', id)
    .or('legacy_key.is.null,legacy_key.neq.migration-015').select('id').maybeSingle();
  if (error) return { ok: false, error: databaseError(error.code, error.message) };
  if (!data) return { ok: false, error: 'Catatan tidak ditemukan.' };
  refresh();
  return { ok: true };
}
