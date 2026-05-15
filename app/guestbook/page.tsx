import type { Metadata } from 'next';
import { getGuestbookEntries } from '@/lib/queries';
import { formatDate } from '@/lib/utils';
import { GuestbookForm } from './guestbook-form';

export const metadata: Metadata = {
  title: 'Buku tamu',
  description: 'Tinggalkan pesan, salam, atau apapun.',
};

export const revalidate = 0; // Always fetch fresh; tiny table

export default async function GuestbookPage() {
  const entries = await getGuestbookEntries();

  return (
    <div className="page-fade mx-auto max-w-[680px] px-6">
      <div className="py-20 pb-10">
        <h1 className="mb-2 text-[36px] font-medium tracking-[-0.035em] text-[var(--color-ink)] max-sm:text-[28px]">
          Buku tamu
        </h1>
        <p className="mb-9 text-[15.5px] text-[var(--color-ink-3)]">
          Tinggalkan pesan, salam, atau apapun. Saya senang tahu siapa yang
          singgah ke sini.{' '}
          <span className="text-[var(--color-ink-4)]">
            {entries.length} pesan sejauh ini.
          </span>
        </p>

        <GuestbookForm />

        <div className="flex flex-col">
          {entries.length === 0 ? (
            <p className="py-6 text-sm text-[var(--color-ink-3)]">
              Belum ada pesan. Jadilah yang pertama.
            </p>
          ) : (
            entries.map((g) => (
              <div
                key={g.id}
                className="border-b border-[var(--color-line)] py-[18px] last:border-b-0"
              >
                <div className="mb-1.5 flex items-baseline justify-between">
                  <span className="text-[14.5px] font-medium text-[var(--color-ink)]">
                    {g.name}
                  </span>
                  <span className="font-mono text-[11px] text-[var(--color-ink-4)]">
                    {formatDate(g.created_at)}
                  </span>
                </div>
                <p className="whitespace-pre-wrap text-[14px] leading-[1.6] text-[var(--color-ink-2)]">
                  {g.message}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
