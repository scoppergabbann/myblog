'use server';

import { auth, isAdmin } from '@/auth';
import { createSupabaseAdmin } from '@/lib/supabase/admin';
import { randomBytes } from 'crypto';

const BUCKET = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || 'bbs-images';
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'image/svg+xml',
]);

export type UploadResult =
  | { ok: true; url: string; path: string }
  | { ok: false; error: string };

export async function uploadImage(formData: FormData): Promise<UploadResult> {
  const session = await auth();
  if (!isAdmin(session)) {
    return { ok: false, error: 'Unauthorized' };
  }

  const file = formData.get('file');
  if (!file || !(file instanceof File)) {
    return { ok: false, error: 'No file provided' };
  }

  if (file.size === 0) {
    return { ok: false, error: 'File is empty' };
  }
  if (file.size > MAX_SIZE) {
    return { ok: false, error: 'File too large (max 5MB)' };
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return { ok: false, error: `Unsupported file type: ${file.type}` };
  }

  // Generate a unique path: yyyymm/random-hex-ext
  const now = new Date();
  const folder = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
  const ext = file.name.includes('.')
    ? file.name.split('.').pop()!.toLowerCase().replace(/[^a-z0-9]/g, '')
    : 'bin';
  const safeExt = ext.length > 0 && ext.length <= 5 ? ext : 'bin';
  const name = `${randomBytes(8).toString('hex')}.${safeExt}`;
  const path = `${folder}/${name}`;

  const supabase = createSupabaseAdmin();
  const buffer = await file.arrayBuffer();

  const { error: uploadErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, buffer, {
      contentType: file.type,
      cacheControl: '31536000',
      upsert: false,
    });

  if (uploadErr) {
    console.error('[upload]', uploadErr);
    return { ok: false, error: uploadErr.message };
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);

  return { ok: true, url: data.publicUrl, path };
}

export async function deleteImage(path: string): Promise<{ ok: boolean; error?: string }> {
  const session = await auth();
  if (!isAdmin(session)) {
    return { ok: false, error: 'Unauthorized' };
  }

  const supabase = createSupabaseAdmin();
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true };
}
