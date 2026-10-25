'use server';

import { revalidatePath } from 'next/cache';
import { auth, isAdmin } from '@/auth';
import { createSupabaseAdmin } from '@/lib/supabase/admin';
import { cloudinaryUpload } from '@/lib/cloudinary';
import { siteConfig } from '@/lib/site-config';
import { isLibraryKind, cleanLibraryDetails, type LibraryKind, type LibraryDetails } from '@/lib/library-fields';

async function requireAdmin() {
  const session = await auth();
  if (!isAdmin(session)) throw new Error('Unauthorized');
}

export type ActionResult =
  | { ok: true; id?: number }
  | { ok: false; error: string };

const revalidate = () => {
  revalidatePath('/library');
  revalidatePath('/admin/library');
  revalidatePath('/now');
  revalidatePath('/now/rss.xml');
  revalidatePath('/admin/now');
};

// =============================================================================
// Image upload -> Cloudinary
// =============================================================================

export async function uploadLibraryImage(
  formData: FormData
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  await requireAdmin();

  const file = formData.get('file');
  if (!file || !(file instanceof File)) return { ok: false, error: 'No file' };
  if (file.size > 8 * 1024 * 1024) return { ok: false, error: 'Max 8MB' };

  const allowed = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif']);
  if (!allowed.has(file.type)) return { ok: false, error: 'Format tidak didukung' };

  const buffer = Buffer.from(await file.arrayBuffer());
  const result = await cloudinaryUpload(buffer, file.type, 'library', 'image');

  if (!result.ok) return { ok: false, error: result.error };
  if (!result.url) return { ok: false, error: 'Cloudinary tidak mengembalikan URL' };

  return { ok: true, url: result.url };
}

// =============================================================================
// Categories CRUD
// =============================================================================

export async function upsertCategory(
  id: number | null,
  data: {
    name: string;
    emoji: string;
    description: string | null;
    display_order: number;
    is_hidden: boolean;
    item_type: LibraryKind;
  }
): Promise<ActionResult> {
  await requireAdmin();
  if (!isLibraryKind(data.item_type)) return { ok: false, error: 'Jenis kategori tidak valid.' };
  const supabase = createSupabaseAdmin();

  if (id) {
    const { error } = await supabase.from('library_categories').update(data).eq('id', id);
    if (error) return { ok: false, error: libraryWriteError(error) };
    revalidate();
    return { ok: true, id };
  }

  const { data: inserted, error } = await supabase
    .from('library_categories')
    .insert(data)
    .select('id')
    .single();

  if (error || !inserted) return { ok: false, error: error ? libraryWriteError(error) : 'Insert failed' };

  revalidate();
  return { ok: true, id: inserted.id };
}

export async function deleteCategory(id: number): Promise<ActionResult> {
  await requireAdmin();
  const supabase = createSupabaseAdmin();

  const { error } = await supabase.from('library_categories').delete().eq('id', id);
  if (error) return { ok: false, error: error.message };

  revalidate();
  return { ok: true };
}

// =============================================================================
// Items CRUD
// =============================================================================

function libraryWriteError(error: { code?: string; message: string }) {
  if (error.code === 'PGRST202' || error.code === '42883') return 'Integrasi library ke Stream belum aktif. Jalankan migrasi 017_library_stream.sql di Supabase; item belum disimpan.';
  return ['PGRST204', '42703'].includes(error.code ?? '')
    ? 'Struktur detail library belum aktif. Jalankan migrasi 016_library_item_details.sql di Supabase; isian belum disimpan.'
    : error.message;
}

export async function upsertItem(
  id: number | null,
  data: {
    category_id: number;
    item_type: LibraryKind;
    details: LibraryDetails;
    name: string;
    subtitle: string | null;
    description: string | null;
    badge: string | null;
    reels_url: string | null;
    link_url: string | null;
    display_order: number;
  }
): Promise<ActionResult> {
  await requireAdmin();
  if (id !== null && (!Number.isSafeInteger(id) || id <= 0)) return { ok: false, error: 'ID item tidak valid.' };
  if (!isLibraryKind(data.item_type)) return { ok: false, error: 'Jenis item tidak valid.' };
  if (!data.name.trim() || data.name.length > 200) return { ok: false, error: 'Nama / judul wajib diisi, maksimal 200 karakter.' };
  if (!Number.isSafeInteger(data.category_id) || data.category_id <= 0 || !Number.isSafeInteger(data.display_order) || data.display_order < 0) return { ok: false, error: 'Kategori atau urutan tampil tidak valid.' };
  if (data.description && data.description.length > 20000) return { ok: false, error: 'Cerita / kesan maksimal 20.000 karakter.' };
  if ((data.subtitle?.length ?? 0) > 600 || (data.badge?.length ?? 0) > 100) return { ok: false, error: 'Subtitle atau status terlalu panjang.' };
  for (const value of [data.link_url, data.reels_url]) {
    if (!value) continue;
    try { if (value.length > 2000 || !['https:', 'http:'].includes(new URL(value).protocol)) throw new Error(); }
    catch { return { ok: false, error: 'Tautan harus berupa URL http atau https yang valid.' }; }
  }
  const cleaned = cleanLibraryDetails(data.item_type, data.details);
  if (cleaned.error) return { ok: false, error: cleaned.error };
  if (new TextEncoder().encode(JSON.stringify(cleaned.details)).length > 18000) return { ok: false, error: 'Total detail terlalu panjang. Ringkas catatan tambahan.' };
  const payload = { category_id: data.category_id, item_type: data.item_type, details: cleaned.details,
    name: data.name.trim(), subtitle: data.subtitle?.trim() || null,
    description: data.description?.trim() || null, badge: data.badge?.trim() || null,
    reels_url: data.reels_url?.trim() || null, link_url: data.link_url?.trim() || null, display_order: data.display_order };
  const supabase = createSupabaseAdmin();

  if (id) {
    const { data: updated, error } = await supabase.from('library_items').update(payload).eq('id', id).select('id').maybeSingle();
    if (error) return { ok: false, error: libraryWriteError(error) };
    if (!updated) return { ok: false, error: 'Item tidak ditemukan. Muat ulang halaman.' };
    revalidate();
    return { ok: true, id };
  }

  // The RPC creates both records atomically; an edit only updates the existing item.
  const { data: insertedId, error } = await supabase.rpc('create_library_item_with_stream', {
    p_item: payload, p_site_url: siteConfig.url,
  });
  if (error) return { ok: false, error: libraryWriteError(error) };
  const newId = Number(insertedId);
  if (!Number.isSafeInteger(newId) || newId <= 0) return { ok: false, error: 'Database tidak mengembalikan ID item.' };
  revalidate();
  return { ok: true, id: newId };
}

export async function deleteItem(id: number): Promise<ActionResult> {
  await requireAdmin();
  const supabase = createSupabaseAdmin();

  const { error } = await supabase.from('library_items').delete().eq('id', id);
  if (error) return { ok: false, error: error.message };

  revalidate();
  return { ok: true };
}

// =============================================================================
// Photos CRUD - primary relation is new_item_id
// =============================================================================

export async function addItemPhoto(
  itemId: number,
  url: string,
  position: number
): Promise<ActionResult> {
  await requireAdmin();
  const supabase = createSupabaseAdmin();

  const payload = {
    new_item_id: itemId,
    url,
    position,
    item_type: 'book',
    item_id: 0,
  };

  const { data: inserted, error } = await supabase
    .from('library_photos')
    .insert(payload)
    .select('id')
    .single();

  if (error || !inserted) {
    console.error('PHOTO INSERT ERROR:', { payload, error });
    return { ok: false, error: error?.message ?? 'Insert failed' };
  }

  revalidate();
  return { ok: true, id: inserted.id };
}

export async function deleteItemPhoto(photoId: number): Promise<ActionResult> {
  await requireAdmin();
  const supabase = createSupabaseAdmin();

  const { error } = await supabase.from('library_photos').delete().eq('id', photoId);
  if (error) return { ok: false, error: error.message };

  revalidate();
  return { ok: true };
}

export async function reorderItemPhotos(
  updates: { id: number; position: number }[]
): Promise<ActionResult> {
  await requireAdmin();
  const supabase = createSupabaseAdmin();

  if (updates.length === 0) return { ok: true };

  const results = await Promise.all(
    updates.map(({ id, position }) =>
      supabase.from('library_photos').update({ position }).eq('id', id)
    )
  );

  const failed = results.find((result) => result.error);
  if (failed?.error) return { ok: false, error: failed.error.message };

  revalidate();
  return { ok: true };
}
