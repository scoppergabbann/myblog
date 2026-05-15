'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { auth, isAdmin } from '@/auth';
import { createSupabaseAdmin } from '@/lib/supabase/admin';

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

  const slugErr = validateSlug(slug);
  if (slugErr) return { ok: false, error: slugErr };
  if (!title) return { ok: false, error: 'Title wajib diisi.' };
  if (title.length > 200) return { ok: false, error: 'Title terlalu panjang.' };
  if (!summary) return { ok: false, error: 'Summary wajib diisi.' };
  if (summary.length > 400) return { ok: false, error: 'Summary terlalu panjang.' };
  if (!content.trim()) return { ok: false, error: 'Content wajib diisi.' };
  if (!['draft', 'published', 'archived'].includes(status)) {
    return { ok: false, error: 'Status tidak valid.' };
  }

  const tags = tagsRaw
    ? tagsRaw
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0)
    : [];

  let publishedAt: string | null = null;
  if (status === 'published') {
    publishedAt = publishedAtRaw
      ? new Date(publishedAtRaw).toISOString()
      : new Date().toISOString();
  } else if (publishedAtRaw) {
    publishedAt = new Date(publishedAtRaw).toISOString();
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

  revalidatePath('/admin/posts');
  revalidatePath('/writing');
  revalidatePath('/');
  if (status === 'published') {
    revalidatePath(`/writing/${data.slug}`);
  }

  redirect(`/admin/posts/${data.id}`);
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

  const slugErr = validateSlug(slug);
  if (slugErr) return { ok: false, error: slugErr };
  if (!title) return { ok: false, error: 'Title wajib diisi.' };
  if (title.length > 200) return { ok: false, error: 'Title terlalu panjang.' };
  if (!summary) return { ok: false, error: 'Summary wajib diisi.' };
  if (summary.length > 400) return { ok: false, error: 'Summary terlalu panjang.' };
  if (!content.trim()) return { ok: false, error: 'Content wajib diisi.' };
  if (!['draft', 'published', 'archived'].includes(status)) {
    return { ok: false, error: 'Status tidak valid.' };
  }

  const tags = tagsRaw
    ? tagsRaw
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0)
    : [];

  let publishedAt: string | null = null;
  if (publishedAtRaw) {
    publishedAt = new Date(publishedAtRaw).toISOString();
  }

  const supabase = createSupabaseAdmin();

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
    })
    .eq('id', id);

  if (error) {
    if (error.code === '23505') {
      return { ok: false, error: 'Slug sudah dipakai. Pilih slug lain.' };
    }
    console.error('[posts.update]', error);
    return { ok: false, error: error.message };
  }

  revalidatePath('/admin/posts');
  revalidatePath('/writing');
  revalidatePath('/');
  if (old?.slug && old.slug !== slug) revalidatePath(`/writing/${old.slug}`);
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
  if (row?.slug) revalidatePath(`/writing/${row.slug}`);
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
    // Set published_at only if it's not already set
    const { data: row } = await supabase
      .from('posts')
      .select('slug, published_at')
      .eq('id', id)
      .maybeSingle();
    if (row && !row.published_at) {
      update.published_at = new Date().toISOString();
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
  if (row?.slug) revalidatePath(`/writing/${row.slug}`);
  return { ok: true as const };
}
