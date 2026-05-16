'use server';

import { revalidatePath } from 'next/cache';
import { auth, isAdmin } from '@/auth';
import { createSupabaseAdmin } from '@/lib/supabase/admin';

async function requireAdmin() {
  const session = await auth();
  if (!isAdmin(session)) {
    throw new Error('Unauthorized');
  }
}

export async function setSubscriberConfirmed(id: number, confirmed: boolean) {
  await requireAdmin();
  const supabase = createSupabaseAdmin();
  const update: Record<string, unknown> = { confirmed };
  if (confirmed) {
    update.confirmed_at = new Date().toISOString();
    update.confirm_token = null;
  }
  const { error } = await supabase.from('subscribers').update(update).eq('id', id);
  if (error) {
    console.error('[subscribers.confirm]', error);
    return { ok: false as const, error: error.message };
  }
  revalidatePath('/admin/subscribers');
  return { ok: true as const };
}

export async function deleteSubscriber(id: number) {
  await requireAdmin();
  const supabase = createSupabaseAdmin();
  const { error } = await supabase.from('subscribers').delete().eq('id', id);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath('/admin/subscribers');
  return { ok: true as const };
}

export async function bulkActionSubscribers(
  ids: number[],
  action: 'confirm' | 'unconfirm' | 'delete'
) {
  await requireAdmin();
  if (ids.length === 0) return { ok: true as const, affected: 0 };

  const supabase = createSupabaseAdmin();
  if (action === 'delete') {
    const { error } = await supabase
      .from('subscribers')
      .delete()
      .in('id', ids);
    if (error) return { ok: false as const, error: error.message };
  } else {
    const update: Record<string, unknown> = {
      confirmed: action === 'confirm',
    };
    if (action === 'confirm') {
      update.confirmed_at = new Date().toISOString();
      update.confirm_token = null;
    }
    const { error } = await supabase
      .from('subscribers')
      .update(update)
      .in('id', ids);
    if (error) return { ok: false as const, error: error.message };
  }
  revalidatePath('/admin/subscribers');
  return { ok: true as const, affected: ids.length };
}

// Returns CSV as a base64 data URL so the client can trigger download
export async function exportSubscribersCsv(): Promise<{
  ok: true;
  filename: string;
  csv: string;
} | { ok: false; error: string }> {
  await requireAdmin();
  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from('subscribers')
    .select('email, confirmed, created_at, confirmed_at')
    .order('created_at', { ascending: false });
  if (error) return { ok: false, error: error.message };

  const rows = data ?? [];
  const header = 'email,confirmed,created_at,confirmed_at';
  const lines = rows.map((r) =>
    [
      escapeCsv(r.email),
      r.confirmed ? 'true' : 'false',
      escapeCsv(r.created_at ?? ''),
      escapeCsv(r.confirmed_at ?? ''),
    ].join(',')
  );
  const csv = [header, ...lines].join('\n');
  const today = new Date().toISOString().split('T')[0];
  return { ok: true, filename: `subscribers-${today}.csv`, csv };
}

function escapeCsv(v: string): string {
  if (v.includes(',') || v.includes('"') || v.includes('\n')) {
    return `"${v.replace(/"/g, '""')}"`;
  }
  return v;
}
