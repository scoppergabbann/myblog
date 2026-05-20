'use server';

import { revalidatePath } from 'next/cache';
import { auth, isAdmin } from '@/auth';
import { createSupabaseAdmin } from '@/lib/supabase/admin';
import { cloudinaryUpload } from '@/lib/cloudinary';

async function requireAdmin() {
  const session = await auth();
  if (!isAdmin(session)) throw new Error('Unauthorized');
}

export type LibraryActionResult =
  | { ok: true }
  | { ok: false; error: string };

// =============================================================================
// Image upload helper (Cloudinary)
// =============================================================================

const ALLOWED_IMG = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif']);
const MAX_IMG_SIZE = 8 * 1024 * 1024; // 8 MB

export async function uploadLibraryImage(
  formData: FormData
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  await requireAdmin();
  const file = formData.get('file');
  if (!file || !(file instanceof File)) return { ok: false, error: 'No file' };
  if (file.size > MAX_IMG_SIZE) return { ok: false, error: 'Max 8MB' };
  if (!ALLOWED_IMG.has(file.type)) return { ok: false, error: 'Format tidak didukung' };
  const buffer = Buffer.from(await file.arrayBuffer());
  const result = await cloudinaryUpload(buffer, file.type, 'library', 'image');
  if (!result.ok) return { ok: false, error: result.error };
  return { ok: true, url: result.url };
}

// =============================================================================
// Books
// =============================================================================

export async function upsertBook(
  id: number | null,
  data: {
    title: string;
    author: string;
    cover_url: string | null;
    year_read: number | null;
    description: string | null;
    status: string;
    link_url: string | null;
    display_order: number;
  }
): Promise<LibraryActionResult> {
  await requireAdmin();
  const supabase = createSupabaseAdmin();
  const { error } = id
    ? await supabase.from('library_books').update(data).eq('id', id)
    : await supabase.from('library_books').insert(data);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/library');
  revalidatePath('/admin/library');
  return { ok: true };
}

export async function deleteBook(id: number): Promise<LibraryActionResult> {
  await requireAdmin();
  const supabase = createSupabaseAdmin();
  const { error } = await supabase.from('library_books').delete().eq('id', id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/library');
  revalidatePath('/admin/library');
  return { ok: true };
}

// =============================================================================
// Drinks
// =============================================================================

export async function upsertDrink(
  id: number | null,
  data: {
    name: string;
    brand: string | null;
    photo_url: string | null;
    description: string | null;
    category: string;
    reels_url: string | null;
    display_order: number;
  }
): Promise<LibraryActionResult> {
  await requireAdmin();
  const supabase = createSupabaseAdmin();
  const { error } = id
    ? await supabase.from('library_drinks').update(data).eq('id', id)
    : await supabase.from('library_drinks').insert(data);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/library');
  revalidatePath('/admin/library');
  return { ok: true };
}

export async function deleteDrink(id: number): Promise<LibraryActionResult> {
  await requireAdmin();
  const supabase = createSupabaseAdmin();
  const { error } = await supabase.from('library_drinks').delete().eq('id', id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/library');
  revalidatePath('/admin/library');
  return { ok: true };
}

// =============================================================================
// Cars
// =============================================================================

export async function upsertCar(
  id: number | null,
  data: {
    name: string;
    model: string | null;
    year: number | null;
    photo_url: string | null;
    description: string | null;
    status: string;
    reels_url: string | null;
    display_order: number;
  }
): Promise<LibraryActionResult> {
  await requireAdmin();
  const supabase = createSupabaseAdmin();
  const { error } = id
    ? await supabase.from('library_cars').update(data).eq('id', id)
    : await supabase.from('library_cars').insert(data);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/library');
  revalidatePath('/admin/library');
  return { ok: true };
}

export async function deleteCar(id: number): Promise<LibraryActionResult> {
  await requireAdmin();
  const supabase = createSupabaseAdmin();
  const { error } = await supabase.from('library_cars').delete().eq('id', id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/library');
  revalidatePath('/admin/library');
  return { ok: true };
}

// =============================================================================
// Motorcycles
// =============================================================================

export async function upsertMotorcycle(
  id: number | null,
  data: {
    name: string;
    model: string | null;
    year: number | null;
    photo_url: string | null;
    description: string | null;
    status: string;
    reels_url: string | null;
    display_order: number;
  }
): Promise<LibraryActionResult> {
  await requireAdmin();
  const supabase = createSupabaseAdmin();
  const { error } = id
    ? await supabase.from('library_motorcycles').update(data).eq('id', id)
    : await supabase.from('library_motorcycles').insert(data);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/library');
  revalidatePath('/admin/library');
  return { ok: true };
}

export async function deleteMotorcycle(id: number): Promise<LibraryActionResult> {
  await requireAdmin();
  const supabase = createSupabaseAdmin();
  const { error } = await supabase.from('library_motorcycles').delete().eq('id', id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/library');
  revalidatePath('/admin/library');
  return { ok: true };
}
