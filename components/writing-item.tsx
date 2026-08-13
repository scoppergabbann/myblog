import Link from 'next/link';
import { formatDate } from '@/lib/utils';
import type { Writing } from '@/types/content';

export function WritingItem({
  writing,
  showReadingTime = false,
}: {
  writing: Writing;
  showReadingTime?: boolean;
}) {
  return (
    <Link
      href={`/writing/${writing.slug}`}
      className="group flex items-baseline gap-6 border-b border-[var(--color-line)] py-[18px] transition-[padding] duration-200 hover:pl-2 last:border-b-0 max-sm:flex-col max-sm:gap-1"
    >
      <span className="min-w-[92px] flex-shrink-0 font-mono text-xs tracking-tight text-[var(--color-ink-4)]">
        {formatDate(writing.date)}
      </span>
      <div>
        <h3 className="text-[15.5px] leading-[1.45] tracking-tight text-[var(--color-ink)] transition-colors duration-200 group-hover:text-[var(--color-accent)]">
          {writing.title}
          {writing.isPremium && (
            <span className="ml-2 rounded-full border border-[color-mix(in_srgb,var(--color-accent)_35%,transparent)] bg-[var(--color-accent-soft)] px-1.5 py-[1px] align-middle font-mono text-[9.5px] uppercase tracking-wide text-[var(--color-accent)]">
              premium
            </span>
          )}
        </h3>
        <p className="mt-[3px] text-[13.5px] leading-[1.55] text-[var(--color-ink-3)]">
          {writing.summary}
          {showReadingTime && (
            <span className="ml-1.5 font-mono text-[11px] text-[var(--color-ink-4)]">
              {writing.readingTime}
            </span>
          )}
        </p>
      </div>
    </Link>
  );
}
