import { createSupabaseAdmin } from '@/lib/supabase/admin';
import { MaintenanceEditor } from './maintenance-editor';

export const dynamic = 'force-dynamic';

export default async function MaintenanceAdminPage() {
  const supabase = createSupabaseAdmin();
  const { data } = await supabase
    .from('site_settings')
    .select(
      'maintenance_enabled, maintenance_title, maintenance_message, maintenance_eta, maintenance_contact'
    )
    .eq('id', 1)
    .maybeSingle();

  const initial = {
    maintenance_enabled: data?.maintenance_enabled ?? false,
    maintenance_title: data?.maintenance_title || 'Sedang dalam perbaikan',
    maintenance_message:
      data?.maintenance_message ||
      'Halamannya lagi di-update sebentar. Balik lagi ya — nuhun banyak!',
    maintenance_eta: data?.maintenance_eta || '',
    maintenance_contact: data?.maintenance_contact || '',
  };

  return (
    <div className="page-fade">
      <div className="mb-8">
        <h1 className="mb-2 text-[26px] font-medium tracking-[-0.025em] text-[var(--color-ink)]">
          Maintenance Mode
        </h1>
        <p className="text-[14px] text-[var(--color-ink-3)]">
          Saat ON, semua visitor akan diarahkan ke <code className="rounded bg-[var(--color-paper-2)] px-1.5 py-0.5 font-mono text-[12px]">/maintenance</code> kecuali admin yang login.
        </p>
      </div>

      <MaintenanceEditor initial={initial} />
    </div>
  );
}
