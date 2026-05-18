'use server';

import { revalidatePath } from 'next/cache';
import { auth, isAdmin } from '@/auth';
import { createSupabaseAdmin } from '@/lib/supabase/admin';
import { cloudinaryUpload, cloudinaryDelete } from '@/lib/cloudinary';
import type {
  DumelResult,
  DumelImageInput,
  DumelFileInput,
  UploadDumelImageResult,
  UploadDumelFileResult,
  DumelWithImages,
  LoadMoreResult,
} from './types';

// Re-export constant so feed.tsx etc. can still import it from here
export { DUMEL_PAGE_SIZE } from './types';

// =============================================================================
// Constants
// =============================================================================

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;   // 5 MB per photo
const MAX_FILE_SIZE  = 10 * 1024 * 1024;  // 10 MB per document
const MAX_IMAGES = 4;

const ALLOWED_IMAGE_TYPES = new Set([
  'image/png', 'image/jpeg', 'image/webp', 'image/gif',
]);

const ALLOWED_FILE_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain', 'text/markdown', 'text/csv',
]);

const ALLOWED_FILE_EXTS = new Set([
  'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
  'txt', 'md', 'markdown', 'csv',
]);

// =============================================================================
// Auth guard
// =============================================================================

async function requireAdmin() {
  const session = await auth();
  if (!isAdmin(session)) throw new Error('Unauthorized');
}

// =============================================================================
// Upload: photo → Cloudinary image
// =============================================================================

export async function uploadDumelImage(
  formData: FormData
): Promise<UploadDumelImageResult> {
  await requireAdmin();

  const file = formData.get('file');
  if (!file || !(file instanceof File)) {
    return { ok: false, error: 'No file provided' };
  }
  if (file.size === 0) return { ok: false, error: 'File is empty' };
  if (file.size > MAX_IMAGE_SIZE) {
    return { ok: false, error: 'Foto terlalu besar (max 5MB)' };
  }
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return { ok: false, error: `Tipe tidak didukung: ${file.type}` };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const result = await cloudinaryUpload(buffer, file.type, 'ngedumel/images', 'image');

  if (!result.ok) return { ok: false, error: result.error };
  return { ok: true, url: result.url, publicId: result.publicId };
}

// =============================================================================
// Upload: file → Cloudinary raw
// =============================================================================

export async function uploadDumelFile(
  formData: FormData
): Promise<UploadDumelFileResult> {
  await requireAdmin();

  const file = formData.get('file');
  if (!file || !(file instanceof File)) {
    return { ok: false, error: 'No file provided' };
  }
  if (file.size === 0) return { ok: false, error: 'File is empty' };
  if (file.size > MAX_FILE_SIZE) {
    const mb = (file.size / 1024 / 1024).toFixed(1);
    return { ok: false, error: `File terlalu besar (${mb}MB, max 10MB)` };
  }

  const ext = file.name.includes('.')
    ? file.name.split('.').pop()!.toLowerCase().replace(/[^a-z0-9]/g, '')
    : '';
  const mimeOk = ALLOWED_FILE_TYPES.has(file.type);
  const extOk  = ALLOWED_FILE_EXTS.has(ext);
  if (!mimeOk && !extOk) {
    return {
      ok: false,
      error: `Tipe file tidak didukung: ${file.type || ext || 'unknown'}`,
    };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const mime   = mimeOk ? file.type : guessMimeFromExt(ext);
  const result = await cloudinaryUpload(buffer, mime, 'ngedumel/files', 'raw');

  if (!result.ok) return { ok: false, error: result.error };
  return {
    ok: true,
    url: result.url,
    publicId: result.publicId,
    name: file.name,
    size: file.size,
    mime,
  };
}

function guessMimeFromExt(ext: string): string {
  const map: Record<string, string> = {
    pdf:  'application/pdf',
    doc:  'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls:  'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ppt:  'application/vnd.ms-powerpoint',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    txt:  'text/plain',
    md:   'text/markdown',
    csv:  'text/csv',
  };
  return map[ext] || 'application/octet-stream';
}

// =============================================================================
// Create dumel
// =============================================================================

export async function createDumel(
  content: string,
  images: DumelImageInput[] = [],
  file: DumelFileInput | null = null
): Promise<DumelResult> {
  await requireAdmin();

  const trimmed = content.trim();
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

  const insertRow: Record<string, unknown> = { content: trimmed || '' };
  if (file) {
    insertRow.file_url                      = file.url;
    insertRow.file_cloudinary_public_id     = file.publicId;
    insertRow.file_cloudinary_resource_type = 'raw';
    insertRow.file_name                     = file.name;
    insertRow.file_size                     = file.size;
    insertRow.file_mime                     = file.mime;
  }

  const { data, error } = await supabase
    .from('dumel')
    .insert(insertRow)
    .select('id')
    .single();

  if (error || !data) {
    console.error('[dumel.create]', error);
    if (file) {
      await cloudinaryDelete(file.publicId, 'raw').catch(console.error);
    }
    return { ok: false, error: error?.message || 'Gagal post.' };
  }

  if (images.length > 0) {
    const rows = images.map((img, i) => ({
      dumel_id: data.id,
      url: img.url,
      cloudinary_public_id: img.publicId,
      cloudinary_resource_type: 'image',
      storage_path: null,
      width: img.width || null,
      height: img.height || null,
      position: i,
    }));
    const { error: imgError } = await supabase.from('dumel_images').insert(rows);
    if (imgError) {
      console.error('[dumel.images.insert]', imgError);
      await supabase.from('dumel').delete().eq('id', data.id);
      await Promise.allSettled([
        ...images.map((img) => cloudinaryDelete(img.publicId, 'image')),
        file ? cloudinaryDelete(file.publicId, 'raw') : Promise.resolve(),
      ]);
      return { ok: false, error: imgError.message };
    }
  }

  revalidatePath('/ngedumel');
  return { ok: true, id: data.id };
}

// =============================================================================
// Delete dumel (+ Cloudinary cleanup)
// =============================================================================

export async function deleteDumel(id: number): Promise<DumelResult> {
  await requireAdmin();
  const supabase = createSupabaseAdmin();

  const [imagesResult, dumelResult] = await Promise.all([
    supabase
      .from('dumel_images')
      .select('cloudinary_public_id, cloudinary_resource_type')
      .eq('dumel_id', id),
    supabase
      .from('dumel')
      .select('file_cloudinary_public_id, file_cloudinary_resource_type')
      .eq('id', id)
      .maybeSingle(),
  ]);

  const { error } = await supabase.from('dumel').delete().eq('id', id);
  if (error) {
    console.error('[dumel.delete]', error);
    return { ok: false, error: error.message };
  }

  // Cleanup Cloudinary (best effort)
  const cleanups: Promise<unknown>[] = [];
  for (const img of imagesResult.data ?? []) {
    if (img.cloudinary_public_id) {
      cleanups.push(
        cloudinaryDelete(
          img.cloudinary_public_id,
          (img.cloudinary_resource_type as 'image' | 'raw') || 'image'
        )
      );
    }
  }
  const fd = dumelResult.data;
  if (fd?.file_cloudinary_public_id) {
    cleanups.push(
      cloudinaryDelete(
        fd.file_cloudinary_public_id,
        (fd.file_cloudinary_resource_type as 'image' | 'raw') || 'raw'
      )
    );
  }
  if (cleanups.length > 0) await Promise.allSettled(cleanups);

  revalidatePath('/ngedumel');
  return { ok: true };
}

// =============================================================================
// Cursor-based pagination for infinite scroll
// =============================================================================

const DUMEL_SELECT = `
  id, content, created_at,
  file_url, file_name, file_size, file_mime,
  dumel_images (id, url, width, height, position)
`;

function rowToDumel(d: {
  id: number;
  content: string;
  created_at: string;
  file_url?: string | null;
  file_name?: string | null;
  file_size?: number | null;
  file_mime?: string | null;
  dumel_images?: Array<{
    id: number;
    url: string;
    width: number | null;
    height: number | null;
    position: number;
  }>;
}): DumelWithImages {
  return {
    id: d.id,
    content: d.content,
    created_at: d.created_at,
    images: (d.dumel_images ?? []).sort((a, b) => a.position - b.position),
    file:
      d.file_url && d.file_name
        ? {
            url: d.file_url,
            name: d.file_name,
            size: d.file_size ?? 0,
            mime: d.file_mime ?? 'application/octet-stream',
          }
        : null,
  };
}

export async function loadMoreDumels(cursor: string): Promise<LoadMoreResult> {
  await requireAdmin();

  if (!cursor || Number.isNaN(new Date(cursor).getTime())) {
    return { ok: false, error: 'Invalid cursor' };
  }

  const { DUMEL_PAGE_SIZE } = await import('./types');
  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from('dumel')
    .select(DUMEL_SELECT)
    .lt('created_at', cursor)
    .order('created_at', { ascending: false })
    .limit(DUMEL_PAGE_SIZE + 1);

  if (error) {
    console.error('[dumel.loadMore]', error);
    return { ok: false, error: error.message };
  }

  const rows = (data ?? []) as Parameters<typeof rowToDumel>[0][];
  const hasMore = rows.length > DUMEL_PAGE_SIZE;
  const trimmed = hasMore ? rows.slice(0, DUMEL_PAGE_SIZE) : rows;

  return { ok: true, dumels: trimmed.map(rowToDumel), hasMore };
}
