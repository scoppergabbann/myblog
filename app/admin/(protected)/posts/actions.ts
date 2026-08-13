'use server';

import { revalidatePath } from 'next/cache';
import { auth, isAdmin } from '@/auth';
import { createSupabaseAdmin } from '@/lib/supabase/admin';
import { hashPremiumPassword } from '@/lib/premium';

async function requireAdmin() {
  const session = await auth();
  if (!isAdmin(session)) {
    throw new Error('Unauthorized');
  }
}

export type PostFormState =
  | { ok: true; id?: number; slug?: string }
  | { ok: false; error: string }
  | null;

function validateSlug(slug: string): string | null {
  if (!slug || slug.length < 1 || slug.length > 80) {
    return 'Slug harus antara 1-80 karakter.';
  }

  if (!/^[a-z0-9-]+$/.test(slug)) {
    return 'Slug hanya boleh lowercase, angka, dan tanda strip.';
  }

  return null;
}

/**
 * Input dari <input type="datetime-local" /> biasanya berbentuk:
 * 2023-04-15T00:00
 *
 * Karena kamu ingin semua tanggal/jam dianggap sebagai WIB / GMT+7,
 * kita JANGAN pakai new Date(value).toISOString().
 *
 * Kita simpan eksplisit sebagai:
 * 2023-04-15T00:00:00+07:00
 */
function toJakartaTimestamptz(value: string): string | null {
  const raw = value.trim();

  if (!raw) return null;

  // Format normal dari datetime-local: YYYY-MM-DDTHH:mm
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(raw)) {
    return `${raw}:00+07:00`;
  }

  // Jika suatu saat ada detik: YYYY-MM-DDTHH:mm:ss
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(raw)) {
    return `${raw}+07:00`;
  }

  throw new Error('Format published_at tidak valid.');
}

/**
 * Untuk fallback jika suatu saat published_at otomatis dibutuhkan.
 * Tetap memakai waktu Asia/Jakarta, bukan UTC polos.
 */
function getCurrentJakartaTimestamptz(): string {
  const jakartaTime = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(new Date());

  return `${jakartaTime.replace(' ', 'T')}+07:00`;
}

function parseTags(tagsRaw: string): string[] {
  return tagsRaw
    ? tagsRaw
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0)
    : [];
}

function validatePostPayload({
  slug,
  title,
  summary,
  content,
  status,
}: {
  slug: string;
  title: string;
  summary: string;
  content: string;
  status: string;
}): string | null {
  const slugErr = validateSlug(slug);
  if (slugErr) return slugErr;

  if (!title) return 'Title wajib diisi.';
  if (title.length > 200) return 'Title terlalu panjang.';

  if (!summary) return 'Summary wajib diisi.';
  if (summary.length > 400) return 'Summary terlalu panjang.';

  if (!content.trim()) return 'Content wajib diisi.';

  if (!['draft', 'published', 'archived'].includes(status)) {
    return 'Status tidak valid.';
  }

  return null;
}

/**
 * Karena kebutuhanmu adalah relokasi konten lama,
 * published_at dibuat wajib agar tanggal custom tidak kosong.
 */
function getRequiredPublishedAt(publishedAtRaw: string): string | PostFormState {
  try {
    const publishedAt = toJakartaTimestamptz(publishedAtRaw);

    if (!publishedAt) {
      return {
        ok: false,
        error: 'Published at wajib diisi.',
      };
    }

    return publishedAt;
  } catch {
    return {
      ok: false,
      error: 'Format published at tidak valid.',
    };
  }
}

export async function createPost(
  prevState: PostFormState,
  formData: FormData
): Promise<PostFormState> {
  await requireAdmin();

  const slug = String(formData.get('slug') ?? '').trim().toLowerCase();
  const title = String(formData.get('title') ?? '').trim();
  const summary = String(formData.get('summary') ?? '').trim();
  const content = String(formData.get('content') ?? '');
  const tagsRaw = String(formData.get('tags') ?? '').trim();
  const status = String(formData.get('status') ?? 'draft');
  const publishedAtRaw = String(formData.get('published_at') ?? '').trim();
  const isPremium = formData.get('is_premium') === 'on';
  const premiumPassword = String(formData.get('premium_password') ?? '');

  const validationError = validatePostPayload({
    slug,
    title,
    summary,
    content,
    status,
  });

  if (validationError) {
    return { ok: false, error: validationError };
  }

  const publishedAtResult = getRequiredPublishedAt(publishedAtRaw);

  if (typeof publishedAtResult !== 'string') {
    return publishedAtResult;
  }

  const tags = parseTags(tagsRaw);
  const publishedAt = publishedAtResult;

  if (isPremium && premiumPassword.length < 4) {
    return {
      ok: false,
      error: 'Password premium wajib diisi minimal 4 karakter.',
    };
  }

  const supabase = createSupabaseAdmin();

  const { data, error } = await supabase
    .from('posts')
    .insert({
      slug,
      title,
      summary,
      content,
      tags,
      status,
      published_at: publishedAt,
      is_premium: isPremium,
    })
    .select('id, slug')
    .single();

  if (error) {
    if (error.code === '23505') {
      return { ok: false, error: 'Slug sudah dipakai. Pilih slug lain.' };
    }

    console.error('[posts.create]', error);
    return { ok: false, error: error.message };
  }

  if (isPremium) {
    const { error: lockError } = await supabase
      .from('post_premium_locks')
      .insert({
        post_id: data.id,
        password_hash: hashPremiumPassword(premiumPassword),
      });

    if (lockError) {
      console.error('[posts.create premium lock]', lockError);
      await supabase.from('posts').delete().eq('id', data.id);
      return { ok: false, error: lockError.message };
    }
  }

  revalidatePath('/admin/posts');
  revalidatePath('/writing');
  revalidatePath('/');

  if (status === 'published') {
    revalidatePath(`/writing/${data.slug}`);
  }

  return { ok: true, id: data.id, slug: data.slug };
}

export async function updatePost(
  id: number,
  prevState: PostFormState,
  formData: FormData
): Promise<PostFormState> {
  await requireAdmin();

  const slug = String(formData.get('slug') ?? '').trim().toLowerCase();
  const title = String(formData.get('title') ?? '').trim();
  const summary = String(formData.get('summary') ?? '').trim();
  const content = String(formData.get('content') ?? '');
  const tagsRaw = String(formData.get('tags') ?? '').trim();
  const status = String(formData.get('status') ?? 'draft');
  const publishedAtRaw = String(formData.get('published_at') ?? '').trim();
  const isPremium = formData.get('is_premium') === 'on';
  const premiumPassword = String(formData.get('premium_password') ?? '');

  const validationError = validatePostPayload({
    slug,
    title,
    summary,
    content,
    status,
  });

  if (validationError) {
    return { ok: false, error: validationError };
  }

  const publishedAtResult = getRequiredPublishedAt(publishedAtRaw);

  if (typeof publishedAtResult !== 'string') {
    return publishedAtResult;
  }

  const tags = parseTags(tagsRaw);
  const publishedAt = publishedAtResult;

  const supabase = createSupabaseAdmin();

  const { data: existingLock } = await supabase
    .from('post_premium_locks')
    .select('post_id')
    .eq('post_id', id)
    .maybeSingle();

  if (isPremium && !existingLock && premiumPassword.length < 4) {
    return {
      ok: false,
      error: 'Password premium wajib diisi minimal 4 karakter.',
    };
  }

  if (isPremium && premiumPassword && premiumPassword.length < 4) {
    return {
      ok: false,
      error: 'Password premium minimal 4 karakter.',
    };
  }

  // Get old slug for revalidation
  const { data: old } = await supabase
    .from('posts')
    .select('slug')
    .eq('id', id)
    .maybeSingle();

  const { error } = await supabase
    .from('posts')
    .update({
      slug,
      title,
      summary,
      content,
      tags,
      status,
      published_at: publishedAt,
      is_premium: isPremium,
    })
    .eq('id', id);

  if (error) {
    if (error.code === '23505') {
      return { ok: false, error: 'Slug sudah dipakai. Pilih slug lain.' };
    }

    console.error('[posts.update]', error);
    return { ok: false, error: error.message };
  }

  if (!isPremium) {
    const { error: lockDeleteError } = await supabase
      .from('post_premium_locks')
      .delete()
      .eq('post_id', id);
    if (lockDeleteError) {
      console.error('[posts.update premium unlock]', lockDeleteError);
      return { ok: false, error: lockDeleteError.message };
    }
  } else if (premiumPassword) {
    const { error: lockUpsertError } = await supabase
      .from('post_premium_locks')
      .upsert({
        post_id: id,
        password_hash: hashPremiumPassword(premiumPassword),
      });
    if (lockUpsertError) {
      console.error('[posts.update premium lock]', lockUpsertError);
      return { ok: false, error: lockUpsertError.message };
    }
  }

  revalidatePath('/admin/posts');
  revalidatePath('/writing');
  revalidatePath('/');

  if (old?.slug && old.slug !== slug) {
    revalidatePath(`/writing/${old.slug}`);
  }

  revalidatePath(`/writing/${slug}`);

  return { ok: true, id, slug };
}

export async function deletePost(id: number) {
  await requireAdmin();

  const supabase = createSupabaseAdmin();

  const { data: row } = await supabase
    .from('posts')
    .select('slug')
    .eq('id', id)
    .maybeSingle();

  const { error } = await supabase.from('posts').delete().eq('id', id);

  if (error) {
    return { ok: false as const, error: error.message };
  }

  revalidatePath('/admin/posts');
  revalidatePath('/writing');
  revalidatePath('/');

  if (row?.slug) {
    revalidatePath(`/writing/${row.slug}`);
  }

  return { ok: true as const };
}

export async function setPostStatus(
  id: number,
  status: 'draft' | 'published' | 'archived'
) {
  await requireAdmin();

  const supabase = createSupabaseAdmin();

  const update: Record<string, unknown> = { status };

  if (status === 'published') {
    // Set published_at only if it's not already set.
    // Fallback ini tetap Asia/Jakarta, bukan UTC polos.
    const { data: row } = await supabase
      .from('posts')
      .select('slug, published_at')
      .eq('id', id)
      .maybeSingle();

    if (row && !row.published_at) {
      update.published_at = getCurrentJakartaTimestamptz();
    }
  }

  const { data: row } = await supabase
    .from('posts')
    .select('slug')
    .eq('id', id)
    .maybeSingle();

  const { error } = await supabase.from('posts').update(update).eq('id', id);

  if (error) {
    return { ok: false as const, error: error.message };
  }

  revalidatePath('/admin/posts');
  revalidatePath('/writing');
  revalidatePath('/');

  if (row?.slug) {
    revalidatePath(`/writing/${row.slug}`);
  }

  return { ok: true as const };
}
