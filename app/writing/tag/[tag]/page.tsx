import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getAllTags, getAllWritings } from '@/lib/posts';
import { WritingItem } from '@/components/writing-item';
import { siteConfig } from '@/lib/site-config';

export const revalidate = 60;

export async function generateStaticParams() {
  const tags = await getAllTags();
  return tags.map((tag) => ({ tag: encodeURIComponent(tag) }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tag: string }>;
}): Promise<Metadata> {
  const { tag } = await params;
  const decoded = decodeURIComponent(tag);
  return {
    title: `#${decoded}`,
    description: `Tulisan dengan tag #${decoded}.`,
    openGraph: {
      title: `#${decoded} — ${siteConfig.shortName}`,
      description: `Tulisan dengan tag #${decoded}.`,
      type: 'website',
      url: `${siteConfig.url}/writing/tag/${tag}`,
    },
  };
}

export default async function TagPage({
  params,
}: {
  params: Promise<{ tag: string }>;
}) {
  const { tag: rawTag } = await params;
  const tag = decodeURIComponent(rawTag).toLowerCase();
  const all = await getAllWritings();
  const filtered = all.filter((w) =>
    w.tags.some((t) => t.toLowerCase() === tag)
  );

  if (filtered.length === 0) notFound();

  return (
    <div className="page-fade mx-auto max-w-[680px] px-6 py-16">
      <Link
        href="/writing"
        className="mb-6 inline-flex items-center gap-1.5 text-[13px] text-[var(--color-ink-3)] transition-colors hover:text-[var(--color-accent)]"
      >
        ← semua tulisan
      </Link>

      <div className="mb-8">
        <p className="mb-2 font-mono text-sm text-[var(--color-ink-3)]">
          // tag
        </p>
        <h1 className="text-[36px] font-medium tracking-[-0.035em] text-[var(--color-ink)] max-sm:text-[28px]">
          #{tag}
        </h1>
        <p className="mt-2 text-sm text-[var(--color-ink-3)]">
          {filtered.length} tulisan
        </p>
      </div>

      <div className="flex flex-col">
        {filtered.map((w) => (
          <WritingItem key={w.slug} writing={w} showReadingTime />
        ))}
      </div>
    </div>
  );
}
