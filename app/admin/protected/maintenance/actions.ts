'use server';

import { revalidatePath } from 'next/cache';
import { auth, isAdmin } from '@/auth';
import { createSupabaseAdmin } from '@/lib/supabase/admin';
import { clearMaintenanceCache } from '@/lib/maintenance-edge';

async function requireAdmin() {
  const session = await auth();
  if (!isAdmin(session)) throw new Error('Unauthorized');
}

export type MaintenanceFormState =
  | { ok: true; message: string }
  | { ok: false; error: string }
  | null;

export async function updateMaintenance(
  _prev: MaintenanceFormState,
  formData: FormData
): Promise<MaintenanceFormState> {
  await requireAdmin();

  const enabled = formData.get('maintenance_enabled') === 'on';
  const title = (formData.get('maintenance_title') as string)?.trim() || '';
  const message = (formData.get('maintenance_message') as string)?.trim() || '';
  const eta = (formData.get('maintenance_eta') as string)?.trim() || null;
  const contact = (formData.get('maintenance_contact') as string)?.trim() || null;

  if (!title || title.length > 200) {
    return { ok: false, error: 'Title wajib diisi (max 200 char).' };
  }
  if (!message || message.length > 1000) {
    return { ok: false, error: 'Message wajib diisi (max 1000 char).' };
  }
  if (eta && eta.length > 200) {
    return { ok: false, error: 'ETA terlalu panjang (max 200 char).' };
  }
  if (contact && contact.length > 200) {
    return { ok: false, error: 'Kontak terlalu panjang (max 200 char).' };
  }

  const supabase = createSupabaseAdmin();
  const { error } = await supabase
    .from('site_settings')
    .update({
      maintenance_enabled: enabled,
      maintenance_title: title,
      maintenance_message: message,
      maintenance_eta: eta,
      maintenance_contact: contact,
    })
    .eq('id', 1);

  if (error) {
    console.error('[site-settings.update]', error);
    return { ok: false, error: error.message };
  }

  // Bust the edge cache so middleware picks up the new state immediately
  clearMaintenanceCache();
  revalidatePath('/maintenance');
  revalidatePath('/admin/maintenance');
  revalidatePath('/admin');

  return {
    ok: true,
    message: enabled
      ? 'Maintenance ON — visitor non-admin akan diarahkan ke /maintenance.'
      : 'Maintenance OFF — site kembali normal.',
  };
}
