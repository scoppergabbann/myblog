import type { ReactNode } from 'react';

export function ComingSoon({
  title,
  subtitle,
  session,
}: {
  title: string;
  subtitle: string;
  session: number;
}) {
  return (
    <div>
      <h1 className="mb-2 text-[28px] font-medium tracking-[-0.025em] text-[var(--color-ink)]">
        {title}
      </h1>
      <p className="mb-8 text-sm text-[var(--color-ink-3)]">{subtitle}</p>

      <div className="rounded-[12px] border border-dashed border-[var(--color-line-2)] bg-[var(--color-paper-2)] px-6 py-10 text-center">
        <div className="mb-2 font-mono text-[11.5px] uppercase tracking-wide text-[var(--color-ink-3)]">
          // coming in sesi {session}
        </div>
        <p className="text-sm text-[var(--color-ink-3)]">
          Halaman ini sudah ada di roadmap. Foundation auth + database sudah
          siap, tinggal build UI-nya.
        </p>
      </div>
    </div>
  );
}
