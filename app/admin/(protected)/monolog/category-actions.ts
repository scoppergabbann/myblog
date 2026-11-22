'use server';

import { revalidatePath } from 'next/cache';
import { auth, isAdmin } from '@/auth';
import { createSupabaseAdmin } from '@/lib/supabase/admin';

export type MonologCategoryActionResult =
  | { ok: true }
  | { ok: false; error: string };

type CategoryInput = {
  label: string;
  slug: string;
  sortOrder?: number;
};

async function requireAdmin() {
  if (!isAdmin(await auth())) throw new Error('Unauthorized');
}

function normalizeInput(input: CategoryInput) {
  return {
    label: input.label.trim(),
    slug: input.slug.trim().toLowerCase(),
    sortOrder: Number(input.sortOrder ?? 0),
  };
}

function validateCategory(input: ReturnType<typeof normalizeInput>): string | null {
  if (!input.label || input.label.length > 60) return 'Nama kategori wajib diisi (maks. 60 karakter).';
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(input.slug) || input.slug.length > 50) {
    return 'Slug kategori hanya boleh berisi huruf kecil, angka, dan tanda hubung (maks. 50 karakter).';
  }
  if (!Number.isSafeInteger(input.sortOrder) || input.sortOrder < 0 || input.sortOrder > 10000) {
    return 'Urutan kategori harus berupa angka antara 0 dan 10000.';
  }
  return null;
}

function categoryError(code: string | undefined, message: string): string {
  if (code === 'PGRST205' || code === '42P01') {
    return 'Fitur kategori dinamis belum aktif. Jalankan migrasi 021_monolog_categories.sql di Supabase.';
  }
  if (code === '23505') return 'Nama atau slug kategori sudah digunakan.';
  if (code === '23503') return 'Kategori masih dipakai oleh episode dan tidak dapat dihapus.';
  return message;
}

function refreshCategories() {
  revalidatePath('/');
  revalidatePath('/monolog');
  revalidatePath('/admin/monolog');
  revalidatePath('/admin/monolog/new');
}

export async function createMonologCategory(input: CategoryInput): Promise<MonologCategoryActionResult> {
  await requireAdmin();
  const normalized = normalizeInput(input);
  const validation = validateCategory(normalized);
  if (validation) return { ok: false, error: validation };

  const db = createSupabaseAdmin();
  let sortOrder = normalized.sortOrder;
  if (!input.sortOrder) {
    const { data: last } = await db.from('monolog_categories')
      .select('sort_order').order('sort_order', { ascending: false }).limit(1).maybeSingle();
    sortOrder = Math.min(10000, (Number(last?.sort_order) || 0) + 10);
  }
  const { error } = await db.from('monolog_categories').insert({
    label: normalized.label,
    slug: normalized.slug,
    sort_order: sortOrder,
    updated_at: new Date().toISOString(),
  });
  if (error) return { ok: false, error: categoryError(error.code, error.message) };
  refreshCategories();
  return { ok: true };
}

export async function updateMonologCategory(
  id: number,
  input: CategoryInput,
): Promise<MonologCategoryActionResult> {
  await requireAdmin();
  if (!Number.isSafeInteger(id) || id <= 0) return { ok: false, error: 'Kategori tidak valid.' };
  const normalized = normalizeInput(input);
  const validation = validateCategory(normalized);
  if (validation) return { ok: false, error: validation };

  const { data, error } = await createSupabaseAdmin().from('monolog_categories')
    .update({
      label: normalized.label,
      slug: normalized.slug,
      sort_order: normalized.sortOrder,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('id')
    .maybeSingle();
  if (error) return { ok: false, error: categoryError(error.code, error.message) };
  if (!data) return { ok: false, error: 'Kategori tidak ditemukan.' };
  refreshCategories();
  return { ok: true };
}

export async function deleteMonologCategory(id: number): Promise<MonologCategoryActionResult> {
  await requireAdmin();
  if (!Number.isSafeInteger(id) || id <= 0) return { ok: false, error: 'Kategori tidak valid.' };
  const db = createSupabaseAdmin();
  const { data: category, error: readError } = await db.from('monolog_categories')
    .select('slug, label').eq('id', id).maybeSingle();
  if (readError) return { ok: false, error: categoryError(readError.code, readError.message) };
  if (!category) return { ok: false, error: 'Kategori tidak ditemukan.' };

  const { count, error: usageError } = await db.from('monolog_episodes')
    .select('id', { count: 'exact', head: true }).eq('category', category.slug);
  if (usageError) return { ok: false, error: usageError.message };
  if ((count ?? 0) > 0) return { ok: false, error: `Kategori “${category.label}” masih dipakai oleh ${count} episode.` };

  const { count: categoryCount, error: countError } = await db.from('monolog_categories')
    .select('id', { count: 'exact', head: true });
  if (countError) return { ok: false, error: categoryError(countError.code, countError.message) };
  if ((categoryCount ?? 0) <= 1) return { ok: false, error: 'Minimal satu kategori harus tetap tersedia.' };

  const { error } = await db.from('monolog_categories').delete().eq('id', id);
  if (error) return { ok: false, error: categoryError(error.code, error.message) };
  refreshCategories();
  return { ok: true };
}
