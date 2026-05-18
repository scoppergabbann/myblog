'use server';

import { revalidatePath } from 'next/cache';
import { randomBytes } from 'crypto';
import { auth, isAdmin } from '@/auth';
import { createSupabaseAdmin } from '@/lib/supabase/admin';

const BUCKET = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || 'bbs-images';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB per image
const MAX_IMAGES = 4;
const ALLOWED_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
]);

async function requireAdmin() {
  const session = await auth();
  if (!isAdmin(session)) {
    throw new Error('Unauthorized');
  }
}

export type DumelResult =
  | { ok: true; id?: number }
  | { ok: false; error: string };

export type DumelImageInput = {
  url: string;
  storagePath: string;
  width?: number;
  height?: number;
};

/**
 * Upload a single image to Supabase Storage under dumel/ folder.
 * Called from client one file at a time so we can show per-file progress.
 */
export type UploadDumelImageResult =
  | { ok: true; url: string; storagePath: string }
  | { ok: false; error: string };

export async function uploadDumelImage(
  formData: FormData
): Promise<UploadDumelImageResult> {
  await requireAdmin();

  const file = formData.get('file');
  if (!file || !(file instanceof File)) {
    return { ok: false, error: 'No file provided' };
  }
  if (file.size === 0) {
    return { ok: false, error: 'File is empty' };
  }
  if (file.size > MAX_FILE_SIZE) {
    return { ok: false, error: 'Foto terlalu besar (max 5MB)' };
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return { ok: false, error: `Tipe file tidak didukung: ${file.type}` };
  }

  const now = new Date();
  const folder = `dumel/${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
  const ext = file.name.includes('.')
    ? file.name.split('.').pop()!.toLowerCase().replace(/[^a-z0-9]/g, '')
    : 'bin';
  const safeExt = ext.length > 0 && ext.length <= 5 ? ext : 'bin';
  const name = `${randomBytes(8).toString('hex')}.${safeExt}`;
  const path = `${folder}/${name}`;

  const buffer = Buffer.from(await file.arrayBuffer());
  const supabase = createSupabaseAdmin();
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, buffer, {
      contentType: file.type,
      cacheControl: '31536000',
      upsert: false,
    });

  if (uploadError) {
    console.error('[dumel.upload]', uploadError);
    return { ok: false, error: uploadError.message };
  }

  const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);

  return { ok: true, url: pub.publicUrl, storagePath: path };
}

export async function createDumel(
  content: string,
  images: DumelImageInput[] = []
): Promise<DumelResult> {
  await requireAdmin();

  const trimmed = content.trim();

  // Allow image-only post (no text) — but at least one of them must exist
  if (!trimmed && images.length === 0) {
    return { ok: false, error: 'Tulis sesuatu atau upload foto dulu.' };
  }
  if (trimmed.length > 2000) {
    return { ok: false, error: 'Terlalu panjang (max 2000 karakter).' };
  }
  if (images.length > MAX_IMAGES) {
    return { ok: false, error: `Max ${MAX_IMAGES} foto per dumel.` };
  }

  const supabase = createSupabaseAdmin();

  // Content column has NOT NULL — use empty string for image-only posts
  const { data, error } = await supabase
    .from('dumel')
    .insert({ content: trimmed || '' })
    .select('id')
    .single();
  if (error || !data) {
    console.error('[dumel.create]', error);
    return { ok: false, error: error?.message || 'Gagal post.' };
  }

  // Insert images if any
  if (images.length > 0) {
    const rows = images.map((img, i) => ({
      dumel_id: data.id,
      url: img.url,
      storage_path: img.storagePath,
      width: img.width || null,
      height: img.height || null,
      position: i,
    }));
    const { error: imgError } = await supabase.from('dumel_images').insert(rows);
    if (imgError) {
      console.error('[dumel.images.insert]', imgError);
      // Try to rollback the dumel insert + uploaded images
      await supabase.from('dumel').delete().eq('id', data.id);
      const paths = images.map((img) => img.storagePath);
      await supabase.storage.from(BUCKET).remove(paths);
      return { ok: false, error: imgError.message };
    }
  }

  revalidatePath('/ngedumel');
  return { ok: true, id: data.id };
}

export async function deleteDumel(id: number): Promise<DumelResult> {
  await requireAdmin();
  const supabase = createSupabaseAdmin();

  // Fetch image paths first so we can delete from Storage
  const { data: imgs } = await supabase
    .from('dumel_images')
    .select('storage_path')
    .eq('dumel_id', id);

  // Delete dumel row — CASCADE will delete dumel_images rows automatically
  const { error } = await supabase.from('dumel').delete().eq('id', id);
  if (error) {
    console.error('[dumel.delete]', error);
    return { ok: false, error: error.message };
  }

  // Clean up Storage (best effort — don't fail the whole op if this errors)
  if (imgs && imgs.length > 0) {
    const paths = imgs.map((r) => r.storage_path);
    const { error: rmError } = await supabase.storage.from(BUCKET).remove(paths);
    if (rmError) {
      console.error('[dumel.storage.cleanup]', rmError);
    }
  }

  revalidatePath('/ngedumel');
  return { ok: true };
}
