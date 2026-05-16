import Link from 'next/link';
import { formatDate } from '@/lib/utils';

type Adj = { slug: string; title: string } | null;
type Related = {
  slug: string;
  title: string;
  summary: string;
  tags: string[];
  readingTime: string;
  date: string;
};

export function ArticleFooterNav({
  prev,
  next,
  related,
}: {
  prev: Adj;
  next: Adj;
  related: Related[];
}) {
  return (
    <div className="mt-10 border-t border-[var(--color-line)] pt-8">
      {(prev || next) && (
        <div className="mb-10 grid grid-cols-2 gap-3 max-sm:grid-cols-1">
          {prev ? (
            <Link
              href={`/writing/${prev.slug}`}
              className="group rounded-[12px] border border-[var(--color-line)] bg-[var(--color-paper)] px-4 py-3 transition-colors hover:border-[color-mix(in_srgb,var(--color-accent)_30%,transparent)]"
            >
              <span className="block font-mono text-[10.5px] uppercase tracking-wide text-[var(--color-ink-4)]">
                ← lebih baru
              </span>
              <span className="mt-1 block text-[14px] leading-[1.45] text-[var(--color-ink-2)] transition-colors group-hover:text-[var(--color-accent)]">
                {prev.title}
              </span>
            </Link>
          ) : (
            <div />
          )}
          {next ? (
            <Link
              href={`/writing/${next.slug}`}
              className="group rounded-[12px] border border-[var(--color-line)] bg-[var(--color-paper)] px-4 py-3 text-right transition-colors hover:border-[color-mix(in_srgb,var(--color-accent)_30%,transparent)]"
            >
              <span className="block font-mono text-[10.5px] uppercase tracking-wide text-[var(--color-ink-4)]">
                lebih lama →
              </span>
              <span className="mt-1 block text-[14px] leading-[1.45] text-[var(--color-ink-2)] transition-colors group-hover:text-[var(--color-accent)]">
                {next.title}
              </span>
            </Link>
          ) : (
            <div />
          )}
        </div>
      )}

      {related.length > 0 && (
        <section>
          <h2 className="mb-4 font-mono text-sm font-medium lowercase text-[var(--color-ink-3)]">
            // tulisan terkait
          </h2>
          <div className="flex flex-col">
            {related.map((r) => (
              <Link
                key={r.slug}
                href={`/writing/${r.slug}`}
                className="group flex items-baseline gap-4 border-b border-[var(--color-line)] py-3 last:border-b-0 max-sm:flex-col max-sm:items-start max-sm:gap-1"
              >
                <span className="flex-1 text-[15px] text-[var(--color-ink-2)] transition-colors group-hover:text-[var(--color-accent)]">
                  {r.title}
                </span>
                <span className="flex-shrink-0 font-mono text-[11.5px] text-[var(--color-ink-4)]">
                  {formatDate(r.date)} · {r.readingTime}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
