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

type Dumel = {
  id: number;
  content: string;
  created_at: string;
  images: DumelImage[];
};

async function getDumels(): Promise<Dumel[]> {
  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from('dumel')
    .select(
      `id, content, created_at,
       dumel_images (id, url, width, height, position)`
    )
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) {
    console.error('[ngedumel.list]', error);
    return [];
  }
  // Normalize: sort each dumel's images by position
  return (data ?? []).map((d: any) => ({
    id: d.id,
    content: d.content,
    created_at: d.created_at,
    images: (d.dumel_images ?? []).sort(
      (a: DumelImage, b: DumelImage) => a.position - b.position
    ),
  }));
}

export default async function NgedumelPage() {
  const session = await auth();
  const dumels = await getDumels();

  const userLogin = session?.user?.login || siteConfig.author.github;
  const avatarUrl = session?.user?.avatar_url;
  const displayName = session?.user?.name || siteConfig.author.name;

  return (
    <div className="mx-auto max-w-[600px] px-4 py-8 sm:px-6 sm:py-10">
      <header className="mb-8">
        <div className="mb-2 font-mono text-[11.5px] text-[var(--color-ink-3)]">
          ~/ngedumel · {dumels.length} posts
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
        avatarUrl={avatarUrl}
        displayName={displayName}
        login={userLogin}
      />
    </div>
  );
}
