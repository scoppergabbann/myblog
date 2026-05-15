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

export type ProjectFormState =
  | { ok: true; id?: number }
  | { ok: false; error: string }
  | null;

function parseStack(raw: string): string[] {
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function urlValid(s: string | null | undefined): boolean {
  if (!s) return true;
  if (s === '#') return true;
  try {
    new URL(s);
    return true;
  } catch {
    return false;
  }
}

function fromForm(formData: FormData) {
  return {
    title: String(formData.get('title') ?? '').trim(),
    description: String(formData.get('description') ?? '').trim(),
    stack: parseStack(String(formData.get('stack') ?? '')),
    status: String(formData.get('status') ?? 'wip'),
    url: String(formData.get('url') ?? '').trim() || null,
    github_url: String(formData.get('github_url') ?? '').trim() || null,
    display_order: Number(formData.get('display_order') ?? 0) || 0,
  };
}

function validate(d: ReturnType<typeof fromForm>): string | null {
  if (!d.title) return 'Title wajib diisi.';
  if (d.title.length > 100) return 'Title terlalu panjang (max 100).';
  if (!d.description) return 'Description wajib diisi.';
  if (d.description.length > 500) return 'Description terlalu panjang (max 500).';
  if (!['live', 'wip', 'archived'].includes(d.status)) return 'Status tidak valid.';
  if (!urlValid(d.url)) return 'URL tidak valid.';
  if (!urlValid(d.github_url)) return 'GitHub URL tidak valid.';
  return null;
}

export async function createProject(
  prevState: ProjectFormState,
  formData: FormData
): Promise<ProjectFormState> {
  await requireAdmin();
  const d = fromForm(formData);
  const err = validate(d);
  if (err) return { ok: false, error: err };

  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from('projects')
    .insert(d)
    .select('id')
    .single();

  if (error) {
    console.error('[projects.create]', error);
    return { ok: false, error: error.message };
  }

  revalidatePath('/admin/projects');
  revalidatePath('/projects');
  revalidatePath('/');

  redirect(`/admin/projects/${data.id}`);
}

export async function updateProject(
  id: number,
  prevState: ProjectFormState,
  formData: FormData
): Promise<ProjectFormState> {
  await requireAdmin();
  const d = fromForm(formData);
  const err = validate(d);
  if (err) return { ok: false, error: err };

  const supabase = createSupabaseAdmin();
  const { error } = await supabase.from('projects').update(d).eq('id', id);

  if (error) {
    console.error('[projects.update]', error);
    return { ok: false, error: error.message };
  }

  revalidatePath('/admin/projects');
  revalidatePath('/projects');
  revalidatePath('/');

  return { ok: true, id };
}

export async function deleteProject(id: number) {
  await requireAdmin();
  const supabase = createSupabaseAdmin();
  const { error } = await supabase.from('projects').delete().eq('id', id);
  if (error) return { ok: false as const, error: error.message };

  revalidatePath('/admin/projects');
  revalidatePath('/projects');
  revalidatePath('/');
  return { ok: true as const };
}

export async function setProjectStatus(
  id: number,
  status: 'live' | 'wip' | 'archived'
) {
  await requireAdmin();
  const supabase = createSupabaseAdmin();
  const { error } = await supabase.from('projects').update({ status }).eq('id', id);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath('/admin/projects');
  revalidatePath('/projects');
  revalidatePath('/');
  return { ok: true as const };
}

export async function setProjectOrder(id: number, display_order: number) {
  await requireAdmin();
  const supabase = createSupabaseAdmin();
  const { error } = await supabase
    .from('projects')
    .update({ display_order })
    .eq('id', id);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath('/admin/projects');
  revalidatePath('/projects');
  revalidatePath('/');
  return { ok: true as const };
}
