import type { Metadata } from 'next';
import { nowData } from '@/content/now';
import { formatDate } from '@/lib/utils';
import type { NowSection } from '@/types/content';

export const metadata: Metadata = {
  title: 'Saat ini',
  description: 'Apa yang sedang saya kerjakan, baca, dan pikirkan.',
};

export default function NowPage() {
  return (
    <div className="page-fade mx-auto max-w-[680px] px-6">
      <div className="py-20 pb-10">
        <h1 className="mb-2 text-[36px] font-medium tracking-[-0.035em] text-[var(--color-ink)] max-sm:text-[28px]">
          Saat ini
        </h1>
        <p className="mb-2 mt-2 max-w-[540px] text-[15.5px] text-[var(--color-ink-3)]">
          Halaman ini terinspirasi dari{' '}
          <a
            href="https://nownownow.com"
            target="_blank"
            rel="noopener noreferrer"
            className="border-b border-[var(--color-line-2)] text-[var(--color-ink)] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
          >
            /now page movement
          </a>
          —sebuah ringkasan singkat apa yang sedang saya kerjakan, baca, dan
          pikirkan.
        </p>
        <div className="mb-8 mt-6 flex items-center gap-2 font-mono text-xs text-[var(--color-ink-3)]">
          <span className="dot-live h-[5px] w-[5px] rounded-full" />
          terakhir diperbarui {formatDate(nowData.updated, true)}
        </div>

        <NowList title="// sedang belajar" items={nowData.learning} />
        <NowList title="// sedang dikerjakan" items={nowData.working} />
        <NowList title="// sedang dikonsumsi" items={nowData.consuming} />

        <section className="mb-9">
          <h2 className="mb-3 font-mono text-[13px] font-medium lowercase text-[var(--color-ink-3)]">
            // fokus hidup
          </h2>
          <p className="text-[15px] leading-[1.7] text-[var(--color-ink-2)]">
            {nowData.focus}
          </p>
        </section>
      </div>
    </div>
  );
}

function NowList({ title, items }: { title: string; items: NowSection[] }) {
  return (
    <section className="mb-9">
      <h2 className="mb-3 font-mono text-[13px] font-medium lowercase text-[var(--color-ink-3)]">
        {title}
      </h2>
      <ul className="list-none">
        {items.map((i, idx) => (
          <li
            key={idx}
            className="flex items-baseline gap-3.5 border-b border-[var(--color-line)] py-2 last:border-b-0"
          >
            <span className="min-w-[70px] flex-shrink-0 font-mono text-[11.5px] text-[var(--color-ink-4)]">
              {i.role}
            </span>
            <span className="text-[15px] leading-[1.7] text-[var(--color-ink-2)]">
              {i.text}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
