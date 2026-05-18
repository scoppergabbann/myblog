import type { Metadata } from 'next';
import { createSupabaseAdmin } from '@/lib/supabase/admin';
import { auth } from '@/auth';
import { siteConfig } from '@/lib/site-config';
import { DumelComposer } from './composer';
import { DumelFeed } from './feed';

// Hidden from indexing and dynamic per request (auth-aware)
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Ngedumel',
  robots: { index: false, follow: false },
};

type DumelImage = {
  id: number;
  url: string;
  width: number | null;
  height: number | null;
  position: number;
};

type DumelFile = {
  url: string;
  name: string;
  size: number;
  mime: string;
};

type Dumel = {
  id: number;
  content: string;
  created_at: string;
  images: DumelImage[];
  file: DumelFile | null;
};

async function getDumels(): Promise<{
  dumels: Dumel[];
  hasMore: boolean;
}> {
  const supabase = createSupabaseAdmin();
  // Fetch +1 to detect if more remain after the initial batch
  const PAGE_SIZE = 20;
  const { data, error } = await supabase
    .from('dumel')
    .select(
      `id, content, created_at,
       file_url, file_name, file_size, file_mime,
       dumel_images (id, url, width, height, position)`
    )
    .order('created_at', { ascending: false })
    .limit(PAGE_SIZE + 1);
  if (error) {
    console.error('[ngedumel.list]', error);
    return { dumels: [], hasMore: false };
  }
  const rows = data ?? [];
  const hasMore = rows.length > PAGE_SIZE;
  const trimmed = hasMore ? rows.slice(0, PAGE_SIZE) : rows;

  const dumels = trimmed.map((d: any) => ({
    id: d.id,
    content: d.content,
    created_at: d.created_at,
    images: (d.dumel_images ?? []).sort(
      (a: DumelImage, b: DumelImage) => a.position - b.position
    ),
    file:
      d.file_url && d.file_name
        ? {
            url: d.file_url,
            name: d.file_name,
            size: d.file_size ?? 0,
            mime: d.file_mime ?? 'application/octet-stream',
          }
        : null,
  }));

  return { dumels, hasMore };
}

async function getTotalCount(): Promise<number> {
  const supabase = createSupabaseAdmin();
  const { count } = await supabase
    .from('dumel')
    .select('*', { count: 'exact', head: true });
  return count ?? 0;
}

export default async function NgedumelPage() {
  const session = await auth();
  const [{ dumels, hasMore }, totalCount] = await Promise.all([
    getDumels(),
    getTotalCount(),
  ]);

  const userLogin = session?.user?.login || siteConfig.author.github;
  const avatarUrl = session?.user?.avatar_url;
  const displayName = session?.user?.name || siteConfig.author.name;

  return (
    <div className="mx-auto max-w-[600px] px-4 py-8 sm:px-6 sm:py-10">
      <header className="mb-8">
        <div className="mb-2 font-mono text-[11.5px] text-[var(--color-ink-3)]">
          ~/ngedumel · {totalCount} posts
        </div>
        <h1 className="mb-2 text-[28px] font-medium tracking-[-0.025em] text-[var(--color-ink)]">
          Ngedumel
        </h1>
        <p className="text-[14px] leading-[1.6] text-[var(--color-ink-3)]">
          Curhat tanpa social media. Hanya kamu yang bisa baca.
        </p>
      </header>

      <DumelComposer
        avatarUrl={avatarUrl}
        displayName={displayName}
        login={userLogin}
      />

      <DumelFeed
        initialDumels={dumels}
        initialHasMore={hasMore}
        avatarUrl={avatarUrl}
        displayName={displayName}
        login={userLogin}
      />
    </div>
  );
}
