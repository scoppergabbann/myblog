import { createSupabaseAdmin } from '@/lib/supabase/admin';
import { SubscribersTable } from './subscribers-table';
import { ExportButton } from './export-button';

export const dynamic = 'force-dynamic';

type Row = {
  id: number;
  email: string;
  confirmed: boolean;
  created_at: string;
  confirmed_at: string | null;
};

async function getSubscribers(): Promise<Row[]> {
  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from('subscribers')
    .select('id, email, confirmed, created_at, confirmed_at')
    .order('created_at', { ascending: false });
  if (error) {
    console.error('[admin.subscribers fetch]', error);
    return [];
  }
  return (data ?? []) as Row[];
}

export default async function AdminSubscribersPage() {
  const subs = await getSubscribers();
  const confirmed = subs.filter((s) => s.confirmed).length;
  const pending = subs.length - confirmed;

  return (
    <div>
      <div className="mb-6 flex items-baseline justify-between gap-4">
        <div>
          <h1 className="mb-1 text-[28px] font-medium tracking-[-0.025em] text-[var(--color-ink)]">
            Subscribers
          </h1>
          <p className="text-sm text-[var(--color-ink-3)]">
            {subs.length} total ·{' '}
            <span className="text-emerald-600 dark:text-emerald-400">
              {confirmed} confirmed
            </span>{' '}
            ·{' '}
            <span className="text-[var(--color-accent)]">{pending} pending</span>
          </p>
        </div>
        <ExportButton disabled={subs.length === 0} />
      </div>

      <SubscribersTable initialData={subs} />

      <p className="mt-4 font-mono text-[11px] text-[var(--color-ink-4)]">
        privacy note: data subscriber adalah PII. jangan share file CSV ke
        publik. delete entry setelah subscriber unsubscribe.
      </p>
    </div>
  );
}
