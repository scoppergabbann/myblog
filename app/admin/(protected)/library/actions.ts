'use server';

import { revalidatePath } from 'next/cache';
import { auth, isAdmin } from '@/auth';
import { createSupabaseAdmin } from '@/lib/supabase/admin';
import { cloudinaryUpload } from '@/lib/cloudinary';

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
};

// =============================================================================
// Image upload → Cloudinary
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
  return { ok: true, url: result.url };
}

// =============================================================================
// Categories CRUD
// =============================================================================

export async function upsertCategory(
  id: number | null,
  data: { name: string; emoji: string; description: string | null; display_order: number }
): Promise<ActionResult> {
  await requireAdmin();
  const supabase = createSupabaseAdmin();
  if (id) {
    const { error } = await supabase.from('library_categories').update(data).eq('id', id);
    if (error) return { ok: false, error: error.message };
    revalidate();
    return { ok: true, id };
  } else {
    const { data: inserted, error } = await supabase
      .from('library_categories').insert(data).select('id').single();
    if (error || !inserted) return { ok: false, error: error?.message ?? 'Insert failed' };
    revalidate();
    return { ok: true, id: inserted.id };
  }
}

export async function deleteCategory(id: number): Promise<ActionResult> {
  await requireAdmin();
  const supabase = createSupabaseAdmin();
  // Items are cascade-deleted by DB FK
  const { error } = await supabase.from('library_categories').delete().eq('id', id);
  if (error) return { ok: false, error: error.message };
  revalidate();
  return { ok: true };
}

// =============================================================================
// Items CRUD
// =============================================================================

export async function upsertItem(
  id: number | null,
  data: {
    category_id: number;
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
  const supabase = createSupabaseAdmin();
  if (id) {
    const { error } = await supabase.from('library_items').update(data).eq('id', id);
    if (error) return { ok: false, error: error.message };
    revalidate();
    return { ok: true, id };
  } else {
    const { data: inserted, error } = await supabase
      .from('library_items').insert(data).select('id').single();
    if (error || !inserted) return { ok: false, error: error?.message ?? 'Insert failed' };
    revalidate();
    return { ok: true, id: inserted.id };
  }
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
// Photos CRUD (tied to new_item_id)
// =============================================================================

export async function addItemPhoto(
  itemId: number,
  url: string,
  position: number
): Promise<ActionResult> {
  await requireAdmin();
  const supabase = createSupabaseAdmin();
  const { data: inserted, error } = await supabase
    .from('library_photos')
    .insert({ new_item_id: itemId, url, position, item_type: 'book', item_id: 0 })
    .select('id').single();
  if (error || !inserted) return { ok: false, error: error?.message ?? 'Insert failed' };
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
