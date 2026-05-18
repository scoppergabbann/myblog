'use server';

import { revalidatePath } from 'next/cache';
import { randomBytes } from 'crypto';
import { auth, isAdmin } from '@/auth';
import { createSupabaseAdmin } from '@/lib/supabase/admin';

const BUCKET = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || 'bbs-images';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB per image
const MAX_IMAGES = 4;
const MAX_ATTACHED_FILE_SIZE = 10 * 1024 * 1024; // 10 MB for documents
const ALLOWED_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
]);

// File attachment types (PDF + Office + text)
const ALLOWED_FILE_TYPES = new Set([
  'application/pdf',
  // Word
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  // Excel
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  // PowerPoint
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  // Plain text
  'text/plain',
  'text/markdown',
  'text/csv',
  // Some browsers send Markdown as octet-stream — handle in extension check
]);

const ALLOWED_FILE_EXTS = new Set([
  'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
  'txt', 'md', 'markdown', 'csv',
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

// =============================================================================
// File attachment upload (PDF, Office docs, text)
// =============================================================================

export type DumelFileInput = {
  url: string;
  storagePath: string;
  name: string;
  size: number;
  mime: string;
};

export type UploadDumelFileResult =
  | { ok: true; url: string; storagePath: string; name: string; size: number; mime: string }
  | { ok: false; error: string };

export async function uploadDumelFile(
  formData: FormData
): Promise<UploadDumelFileResult> {
  await requireAdmin();

  const file = formData.get('file');
  if (!file || !(file instanceof File)) {
    return { ok: false, error: 'No file provided' };
  }
  if (file.size === 0) {
    return { ok: false, error: 'File is empty' };
  }
  if (file.size > MAX_ATTACHED_FILE_SIZE) {
    const mb = (file.size / 1024 / 1024).toFixed(1);
    return { ok: false, error: `File terlalu besar (${mb}MB, max 10MB)` };
  }

  // Validate by MIME OR extension (some browsers send odd MIME types)
  const ext = file.name.includes('.')
    ? file.name.split('.').pop()!.toLowerCase().replace(/[^a-z0-9]/g, '')
    : '';
  const mimeOk = ALLOWED_FILE_TYPES.has(file.type);
  const extOk = ALLOWED_FILE_EXTS.has(ext);
  if (!mimeOk && !extOk) {
    return {
      ok: false,
      error: `Tipe file tidak didukung: ${file.type || ext || 'unknown'}`,
    };
  }

  // Path: dumel-files/yyyymm/random.ext
  const now = new Date();
  const folder = `dumel-files/${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
  const safeExt = ext.length > 0 && ext.length <= 5 ? ext : 'bin';
  const storedName = `${randomBytes(8).toString('hex')}.${safeExt}`;
  const path = `${folder}/${storedName}`;

  const buffer = Buffer.from(await file.arrayBuffer());
  const supabase = createSupabaseAdmin();

  // Use original mime if known, else fallback by extension
  const contentType = mimeOk ? file.type : guessMimeFromExt(ext);

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, buffer, {
      contentType,
      cacheControl: '31536000',
      upsert: false,
    });

  if (uploadError) {
    console.error('[dumel.uploadFile]', uploadError);
    return { ok: false, error: uploadError.message };
  }

  const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);

  return {
    ok: true,
    url: pub.publicUrl,
    storagePath: path,
    name: file.name,
    size: file.size,
    mime: contentType,
  };
}

function guessMimeFromExt(ext: string): string {
  const map: Record<string, string> = {
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ppt: 'application/vnd.ms-powerpoint',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    txt: 'text/plain',
    md: 'text/markdown',
    markdown: 'text/markdown',
    csv: 'text/csv',
  };
  return map[ext] || 'application/octet-stream';
}

export async function createDumel(
  content: string,
  images: DumelImageInput[] = [],
  file: DumelFileInput | null = null
): Promise<DumelResult> {
  await requireAdmin();

  const trimmed = content.trim();

  // Allow text-only, image-only, file-only, or any combination
  if (!trimmed && images.length === 0 && !file) {
    return { ok: false, error: 'Tulis sesuatu, upload foto, atau attach file.' };
  }
  if (trimmed.length > 2000) {
    return { ok: false, error: 'Terlalu panjang (max 2000 karakter).' };
  }
  if (images.length > MAX_IMAGES) {
    return { ok: false, error: `Max ${MAX_IMAGES} foto per dumel.` };
  }

  const supabase = createSupabaseAdmin();

  const insertRow: {
    content: string;
    file_url?: string;
    file_storage_path?: string;
    file_name?: string;
    file_size?: number;
    file_mime?: string;
  } = {
    content: trimmed || '',
  };
  if (file) {
    insertRow.file_url = file.url;
    insertRow.file_storage_path = file.storagePath;
    insertRow.file_name = file.name;
    insertRow.file_size = file.size;
    insertRow.file_mime = file.mime;
  }

  const { data, error } = await supabase
    .from('dumel')
    .insert(insertRow)
    .select('id')
    .single();
  if (error || !data) {
    console.error('[dumel.create]', error);
    // Rollback uploaded file if dumel insert failed
    if (file) {
      await supabase.storage.from(BUCKET).remove([file.storagePath]);
    }
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
      // Rollback everything
      await supabase.from('dumel').delete().eq('id', data.id);
      const paths = images.map((img) => img.storagePath);
      if (file) paths.push(file.storagePath);
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

  // Fetch all storage paths to cleanup (images + attached file)
  const [imagesResult, dumelResult] = await Promise.all([
    supabase
      .from('dumel_images')
      .select('storage_path')
      .eq('dumel_id', id),
    supabase
      .from('dumel')
      .select('file_storage_path')
      .eq('id', id)
      .maybeSingle(),
  ]);

  // Delete dumel row — CASCADE will delete dumel_images rows automatically
  const { error } = await supabase.from('dumel').delete().eq('id', id);
  if (error) {
    console.error('[dumel.delete]', error);
    return { ok: false, error: error.message };
  }

  // Collect storage paths for cleanup (best effort — non-fatal if fails)
  const pathsToRemove: string[] = [];
  if (imagesResult.data) {
    pathsToRemove.push(...imagesResult.data.map((r) => r.storage_path));
  }
  if (dumelResult.data?.file_storage_path) {
    pathsToRemove.push(dumelResult.data.file_storage_path);
  }
  if (pathsToRemove.length > 0) {
    const { error: rmError } = await supabase.storage
      .from(BUCKET)
      .remove(pathsToRemove);
    if (rmError) {
      console.error('[dumel.storage.cleanup]', rmError);
    }
  }

  revalidatePath('/ngedumel');
  return { ok: true };
}

// =============================================================================
// Cursor-based pagination for infinite scroll
// =============================================================================

export const DUMEL_PAGE_SIZE = 20;

export type DumelFile = {
  url: string;
  name: string;
  size: number;
  mime: string;
};

export type DumelWithImages = {
  id: number;
  content: string;
  created_at: string;
  images: Array<{
    id: number;
    url: string;
    width: number | null;
    height: number | null;
    position: number;
  }>;
  file: DumelFile | null;
};

export type LoadMoreResult =
  | { ok: true; dumels: DumelWithImages[]; hasMore: boolean }
  | { ok: false; error: string };

/**
 * Load older dumels using cursor-based pagination.
 * Cursor = ISO timestamp of the last dumel in the current view.
 * Fetches dumels with `created_at < cursor`, ordered desc by created_at.
 */
export async function loadMoreDumels(cursor: string): Promise<LoadMoreResult> {
  await requireAdmin();

  if (!cursor || Number.isNaN(new Date(cursor).getTime())) {
    return { ok: false, error: 'Invalid cursor' };
  }

  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from('dumel')
    .select(
      `id, content, created_at,
       file_url, file_name, file_size, file_mime,
       dumel_images (id, url, width, height, position)`
    )
    .lt('created_at', cursor)
    .order('created_at', { ascending: false })
    // Fetch +1 to detect if more remains
    .limit(DUMEL_PAGE_SIZE + 1);

  if (error) {
    console.error('[dumel.loadMore]', error);
    return { ok: false, error: error.message };
  }

  const rows = (data ?? []) as Array<{
    id: number;
    content: string;
    created_at: string;
    file_url: string | null;
    file_name: string | null;
    file_size: number | null;
    file_mime: string | null;
    dumel_images: DumelWithImages['images'];
  }>;
  const hasMore = rows.length > DUMEL_PAGE_SIZE;
  const trimmed = hasMore ? rows.slice(0, DUMEL_PAGE_SIZE) : rows;

  const dumels: DumelWithImages[] = trimmed.map((d) => ({
    id: d.id,
    content: d.content,
    created_at: d.created_at,
    images: (d.dumel_images ?? []).sort((a, b) => a.position - b.position),
    file: d.file_url && d.file_name
      ? {
          url: d.file_url,
          name: d.file_name,
          size: d.file_size ?? 0,
          mime: d.file_mime ?? 'application/octet-stream',
        }
      : null,
  }));

  return { ok: true, dumels, hasMore };
}
