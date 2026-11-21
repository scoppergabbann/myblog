'use server';

import { randomBytes } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { auth, isAdmin } from '@/auth';
import { createSupabaseAdmin } from '@/lib/supabase/admin';
import {
  MONOLOG_AUDIO_STORAGE_MIME_TYPES,
  monologAudioExtension,
  monologAudioMimeValid,
  monologAudioUrlValid,
} from '@/lib/monolog-audio';
import { monologCategories } from '@/lib/monolog-shared';

const AUDIO_BUCKET = 'monolog-audio';
const MAX_AUDIO_SIZE = 50 * 1024 * 1024;
const AUDIO_PATH_PATTERN = /^[0-9]{4}\/[0-9]{2}\/[a-f0-9]{32}\.m4a$/;

export type MonologFormState =
  | { ok: true; id: number; slug: string }
  | { ok: false; error: string }
  | null;

export type MonologActionResult =
  | { ok: true }
  | { ok: false; error: string };

export type MonologUploadResult =
  | { ok: true; bucket: string; path: string; token: string; signedUrl: string; publicUrl: string }
  | { ok: false; error: string };

async function requireAdmin() {
  if (!isAdmin(await auth())) throw new Error('Unauthorized');
}

function databaseError(code: string | undefined, message: string): string {
  if (code === 'PGRST205' || code === '42P01') {
    return 'Fitur Monolog belum aktif. Jalankan migrasi 019_monolog.sql di Supabase terlebih dahulu.';
  }
  if (code === 'PGRST204') {
    return 'Kontrol pin dan arsip belum aktif. Jalankan migrasi 020_monolog_library_controls.sql di Supabase.';
  }
  if (code === '23505') return 'Slug sudah dipakai. Pilih slug lain.';
  if (message.includes('MONOLOG_CATEGORY_LIMIT')) {
    return 'Kategori ini sudah memiliki 5 episode published. Arsipkan atau jadikan draft salah satunya terlebih dahulu.';
  }
  return message;
}

function toJakartaTimestamptz(value: string): string | null {
  const raw = value.trim();
  if (!raw) return null;
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(raw)) return `${raw}:00+07:00`;
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(raw)) return `${raw}+07:00`;
  return null;
}

function currentJakartaTimestamptz(): string {
  const value = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  }).format(new Date());
  return `${value.replace(' ', 'T')}+07:00`;
}

function parseTags(value: string): string[] {
  return [...new Set(value.split(',').map((tag) => tag.trim()).filter(Boolean))];
}

function fromForm(formData: FormData) {
  return {
    slug: String(formData.get('slug') ?? '').trim().toLowerCase(),
    title: String(formData.get('title') ?? '').trim(),
    description: String(formData.get('description') ?? '').trim(),
    category: String(formData.get('category') ?? ''),
    audio_url: String(formData.get('audio_url') ?? '').trim(),
    audio_path: String(formData.get('audio_path') ?? '').trim() || null,
    duration_seconds: Number(formData.get('duration_seconds') ?? 0),
    published_at: toJakartaTimestamptz(String(formData.get('published_at') ?? '')),
    status: String(formData.get('status') ?? 'draft'),
    transcript: String(formData.get('transcript') ?? '').trim() || null,
    reflection: String(formData.get('reflection') ?? '').trim() || null,
    tags: parseTags(String(formData.get('tags') ?? '')),
    updated_at: new Date().toISOString(),
  };
}

function validate(input: ReturnType<typeof fromForm>): string | null {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(input.slug) || input.slug.length > 100) {
    return 'Slug wajib diisi dengan huruf kecil, angka, dan tanda hubung (maks. 100 karakter).';
  }
  if (!input.title || input.title.length > 180) return 'Judul wajib diisi (maks. 180 karakter).';
  if (!input.description || input.description.length > 600) return 'Deskripsi wajib diisi (maks. 600 karakter).';
  if (!monologCategories.some((category) => category.slug === input.category)) return 'Kategori tidak valid.';
  if (!['draft', 'published'].includes(input.status)) return 'Status tidak valid.';
  if (!Number.isSafeInteger(input.duration_seconds) || input.duration_seconds < 0 || input.duration_seconds > 86400) {
    return 'Durasi harus berupa detik antara 0 dan 86400.';
  }
  if (!monologAudioUrlValid(input.audio_url)) return 'URL audio harus berupa HTTPS .m4a, .mp4, .webm, atau .ogg yang valid.';
  if (input.audio_path && !AUDIO_PATH_PATTERN.test(input.audio_path)) return 'Path audio tidak valid.';
  if (input.tags.length > 20) return 'Maksimal 20 tag.';
  if ((input.transcript?.length ?? 0) > 100000) return 'Transkrip terlalu panjang.';
  if ((input.reflection?.length ?? 0) > 30000) return 'Refleksi terlalu panjang.';
  if (input.status === 'published') {
    if (!input.audio_url) return 'Upload audio sebelum menerbitkan episode.';
    if (input.duration_seconds <= 0) return 'Durasi audio wajib diisi sebelum menerbitkan.';
    if (!input.published_at) return 'Tanggal publikasi wajib diisi sebelum menerbitkan.';
  }
  return null;
}

function refresh(slugs: Array<string | null | undefined> = []) {
  revalidatePath('/admin/monolog');
  revalidatePath('/monolog');
  revalidatePath('/sitemap.xml');
  for (const slug of slugs) if (slug) revalidatePath(`/monolog/${slug}`);
}

async function removeAudio(path: string | null) {
  if (!path || !AUDIO_PATH_PATTERN.test(path)) return;
  const { error } = await createSupabaseAdmin().storage.from(AUDIO_BUCKET).remove([path]);
  if (error) console.error('[monolog.audio.remove]', error);
}

async function referencedAudioPaths(): Promise<Set<string>> {
  const { data, error } = await createSupabaseAdmin()
    .from('monolog_episodes')
    .select('audio_path')
    .not('audio_path', 'is', null);
  if (error) throw error;
  return new Set((data ?? []).flatMap((row) => typeof row.audio_path === 'string' ? [row.audio_path] : []));
}

async function cleanupOrphanedMonologAudio() {
  try {
    const db = createSupabaseAdmin();
    const referenced = await referencedAudioPaths();
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    const { data: years, error: yearsError } = await db.storage.from(AUDIO_BUCKET).list('', { limit: 100 });
    if (yearsError) throw yearsError;

    const stalePaths: string[] = [];
    for (const year of years ?? []) {
      if (!/^\d{4}$/.test(year.name) || year.id) continue;
      const { data: months, error: monthsError } = await db.storage.from(AUDIO_BUCKET).list(year.name, { limit: 100 });
      if (monthsError) throw monthsError;
      for (const month of months ?? []) {
        if (!/^\d{2}$/.test(month.name) || month.id) continue;
        const prefix = `${year.name}/${month.name}`;
        const { data: files, error: filesError } = await db.storage.from(AUDIO_BUCKET).list(prefix, { limit: 1000 });
        if (filesError) throw filesError;
        for (const file of files ?? []) {
          const path = `${prefix}/${file.name}`;
          const createdAt = Date.parse(file.created_at ?? file.updated_at ?? '');
          if (AUDIO_PATH_PATTERN.test(path) && !referenced.has(path) && Number.isFinite(createdAt) && createdAt < cutoff) {
            stalePaths.push(path);
          }
        }
      }
    }

    for (let index = 0; index < stalePaths.length; index += 100) {
      const { error } = await db.storage.from(AUDIO_BUCKET).remove(stalePaths.slice(index, index + 100));
      if (error) throw error;
    }
  } catch (error) {
    console.error('[monolog.audio.cleanup]', error);
  }
}

export async function discardMonologAudio(path: string): Promise<MonologActionResult & { retained?: boolean }> {
  await requireAdmin();
  if (!AUDIO_PATH_PATTERN.test(path)) return { ok: false, error: 'Path audio tidak valid.' };

  const { data, error } = await createSupabaseAdmin()
    .from('monolog_episodes')
    .select('id')
    .eq('audio_path', path)
    .limit(1);
  if (error) return { ok: false, error: databaseError(error.code, error.message) };
  if ((data?.length ?? 0) > 0) return { ok: true, retained: true };

  await removeAudio(path);
  return { ok: true, retained: false };
}

export async function createMonolog(
  _previous: MonologFormState,
  formData: FormData,
): Promise<MonologFormState> {
  await requireAdmin();
  const input = fromForm(formData);
  const validation = validate(input);
  if (validation) return { ok: false, error: validation };

  const { data, error } = await createSupabaseAdmin()
    .from('monolog_episodes')
    .insert(input)
    .select('id, slug')
    .single();

  if (error) return { ok: false, error: databaseError(error.code, error.message) };
  refresh([data.slug]);
  return { ok: true, id: data.id, slug: data.slug };
}

export async function updateMonolog(
  id: number,
  _previous: MonologFormState,
  formData: FormData,
): Promise<MonologFormState> {
  await requireAdmin();
  if (!Number.isSafeInteger(id) || id <= 0) return { ok: false, error: 'ID episode tidak valid.' };
  const input = fromForm(formData);
  const validation = validate(input);
  if (validation) return { ok: false, error: validation };

  const db = createSupabaseAdmin();
  const { data: old, error: oldError } = await db
    .from('monolog_episodes')
    .select('slug, audio_path')
    .eq('id', id)
    .maybeSingle();
  if (oldError) return { ok: false, error: databaseError(oldError.code, oldError.message) };
  if (!old) return { ok: false, error: 'Episode tidak ditemukan.' };

  const { data, error } = await db
    .from('monolog_episodes')
    .update(input)
    .eq('id', id)
    .select('id, slug')
    .maybeSingle();
  if (error) return { ok: false, error: databaseError(error.code, error.message) };
  if (!data) return { ok: false, error: 'Episode tidak ditemukan.' };

  if (old.audio_path && old.audio_path !== input.audio_path) await removeAudio(old.audio_path);
  refresh([old.slug, data.slug]);
  return { ok: true, id: data.id, slug: data.slug };
}

export async function deleteMonolog(id: number): Promise<MonologActionResult> {
  await requireAdmin();
  if (!Number.isSafeInteger(id) || id <= 0) return { ok: false, error: 'ID episode tidak valid.' };
  const db = createSupabaseAdmin();
  const { data: row, error: readError } = await db
    .from('monolog_episodes')
    .select('slug, audio_path')
    .eq('id', id)
    .maybeSingle();
  if (readError) return { ok: false, error: databaseError(readError.code, readError.message) };
  if (!row) return { ok: false, error: 'Episode tidak ditemukan.' };

  const { error } = await db.from('monolog_episodes').delete().eq('id', id);
  if (error) return { ok: false, error: databaseError(error.code, error.message) };
  await removeAudio(row.audio_path);
  refresh([row.slug]);
  return { ok: true };
}

export async function setMonologStatus(
  id: number,
  status: 'draft' | 'published',
): Promise<MonologActionResult> {
  await requireAdmin();
  if (!Number.isSafeInteger(id) || id <= 0) return { ok: false, error: 'ID episode tidak valid.' };
  if (!['draft', 'published'].includes(status)) return { ok: false, error: 'Status tidak valid.' };

  const db = createSupabaseAdmin();
  const { data: row, error: readError } = await db
    .from('monolog_episodes')
    .select('slug, audio_url, duration_seconds, published_at, archived_at')
    .eq('id', id)
    .maybeSingle();
  if (readError) return { ok: false, error: databaseError(readError.code, readError.message) };
  if (!row) return { ok: false, error: 'Episode tidak ditemukan.' };
  if (row.archived_at) return { ok: false, error: 'Pulihkan episode dari arsip sebelum mengubah status publikasinya.' };
  if (status === 'published' && (!row.audio_url || row.duration_seconds <= 0)) {
    return { ok: false, error: 'Upload audio dan isi durasinya sebelum publish.' };
  }

  const update: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
  if (status === 'published' && !row.published_at) update.published_at = currentJakartaTimestamptz();
  const { error } = await db.from('monolog_episodes').update(update).eq('id', id);
  if (error) return { ok: false, error: databaseError(error.code, error.message) };
  refresh([row.slug]);
  return { ok: true };
}

export async function setMonologPinned(id: number, pinned: boolean): Promise<MonologActionResult> {
  await requireAdmin();
  if (!Number.isSafeInteger(id) || id <= 0 || typeof pinned !== 'boolean') {
    return { ok: false, error: 'Episode tidak valid.' };
  }

  const db = createSupabaseAdmin();
  const { data: row, error: readError } = await db.from('monolog_episodes')
    .select('slug, status, archived_at').eq('id', id).maybeSingle();
  if (readError) return { ok: false, error: databaseError(readError.code, readError.message) };
  if (!row) return { ok: false, error: 'Episode tidak ditemukan.' };
  if (pinned && (row.status !== 'published' || row.archived_at)) {
    return { ok: false, error: 'Hanya episode published yang aktif yang dapat disematkan.' };
  }

  const { error } = await db.from('monolog_episodes')
    .update({ is_pinned: pinned, updated_at: new Date().toISOString() }).eq('id', id);
  if (error) return { ok: false, error: databaseError(error.code, error.message) };
  refresh([row.slug]);
  return { ok: true };
}

export async function setMonologArchived(id: number, archived: boolean): Promise<MonologActionResult> {
  await requireAdmin();
  if (!Number.isSafeInteger(id) || id <= 0 || typeof archived !== 'boolean') {
    return { ok: false, error: 'Episode tidak valid.' };
  }

  const db = createSupabaseAdmin();
  const { data: row, error: readError } = await db.from('monolog_episodes')
    .select('slug').eq('id', id).maybeSingle();
  if (readError) return { ok: false, error: databaseError(readError.code, readError.message) };
  if (!row) return { ok: false, error: 'Episode tidak ditemukan.' };

  const update = archived
    ? { archived_at: new Date().toISOString(), is_pinned: false, updated_at: new Date().toISOString() }
    : { archived_at: null, updated_at: new Date().toISOString() };
  const { error } = await db.from('monolog_episodes').update(update).eq('id', id);
  if (error) return { ok: false, error: databaseError(error.code, error.message) };
  refresh([row.slug]);
  return { ok: true };
}

export async function prepareMonologAudioUpload(input: {
  name: string;
  type: string;
  size: number;
}): Promise<MonologUploadResult> {
  await requireAdmin();
  const name = input.name.trim().toLowerCase();
  if (!monologAudioExtension(name)) return { ok: false, error: 'Format audio harus .m4a, .mp4, .webm, atau .ogg.' };
  if (!Number.isSafeInteger(input.size) || input.size <= 0) return { ok: false, error: 'File audio kosong atau tidak valid.' };
  if (input.size > MAX_AUDIO_SIZE) return { ok: false, error: 'Ukuran audio maksimal 50 MB.' };
  if (!monologAudioMimeValid(input.type)) return { ok: false, error: 'Tipe file audio tidak didukung.' };

  await cleanupOrphanedMonologAudio();

  const now = new Date();
  const folder = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}`;
  const path = `${folder}/${randomBytes(16).toString('hex')}.m4a`;
  const db = createSupabaseAdmin();
  const { error: bucketError } = await db.storage.updateBucket(AUDIO_BUCKET, {
    public: true,
    fileSizeLimit: MAX_AUDIO_SIZE,
    allowedMimeTypes: MONOLOG_AUDIO_STORAGE_MIME_TYPES,
  });
  if (bucketError) {
    const message = bucketError.message.toLowerCase().includes('bucket not found')
      ? 'Bucket monolog-audio belum ada. Jalankan migrasi 019_monolog.sql di Supabase.'
      : `Konfigurasi penyimpanan audio gagal: ${bucketError.message}`;
    return { ok: false, error: message };
  }
  const { data, error } = await db.storage.from(AUDIO_BUCKET).createSignedUploadUrl(path);
  if (error) {
    const message = error.message.toLowerCase().includes('bucket not found')
      ? 'Bucket monolog-audio belum ada. Jalankan migrasi 019_monolog.sql di Supabase.'
      : error.message;
    return { ok: false, error: message };
  }
  const { data: publicData } = db.storage.from(AUDIO_BUCKET).getPublicUrl(path);
  return {
    ok: true,
    bucket: AUDIO_BUCKET,
    path,
    token: data.token,
    signedUrl: data.signedUrl,
    publicUrl: publicData.publicUrl,
  };
}
