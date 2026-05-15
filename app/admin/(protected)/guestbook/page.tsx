import { createSupabaseAdmin } from '@/lib/supabase/admin';
import { GuestbookTable } from './guestbook-table';

export const dynamic = 'force-dynamic';

type Row = {
  id: number;
  name: string;
  message: string;
  approved: boolean;
  created_at: string;
};

async function getEntries(): Promise<Row[]> {
  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from('guestbook')
    .select('id, name, message, approved, created_at')
    .order('created_at', { ascending: false })
    .limit(500);
  if (error) {
    console.error('[admin.guestbook fetch]', error);
    return [];
  }
  return (data ?? []) as Row[];
}

export default async function AdminGuestbookPage() {
  const entries = await getEntries();
  const pending = entries.filter((e) => !e.approved).length;

  return (
    <div>
      <div className="mb-6 flex items-baseline justify-between gap-4">
        <div>
          <h1 className="mb-1 text-[28px] font-medium tracking-[-0.025em] text-[var(--color-ink)]">
            Guestbook
          </h1>
          <p className="text-sm text-[var(--color-ink-3)]">
            {entries.length} total pesan
            {pending > 0 && (
              <>
                {' · '}
                <span className="text-[var(--color-accent)]">
                  {pending} menunggu moderasi
                </span>
              </>
            )}
          </p>
        </div>
      </div>

      <GuestbookTable initialData={entries} />
    </div>
  );
}
