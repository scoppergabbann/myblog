import type { Metadata } from 'next';
import { auth, isAdmin } from '@/auth';
import { getLibraryData } from '@/lib/library';
import { createSupabaseAdmin } from '@/lib/supabase/admin';
import { LibraryShelf } from './library-shelf';
import { formatDate } from '@/lib/utils';
import { pageMetadata } from '@/lib/seo';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = pageMetadata('/library', 'Library',
  'Koleksi hal-hal yang pernah saya baca, coba, dan kagumi.');

export default async function LibraryPage() {
  const session = await auth();
  const adminView = isAdmin(session);
  const data = await getLibraryData(
    adminView
      ? { includeHidden: true, client: createSupabaseAdmin() }
      : undefined
  );
  const totalItems = Object.values(data.itemsByCategory).flat().length;
  const visibleCategoryCount = data.categories.filter((category) => !category.is_hidden).length;
  return (
    <div className="page-fade mx-auto max-w-[1040px] px-6 pb-24 pt-12 max-sm:pt-7">
      <header className="collection-library-hero relative mb-12 overflow-hidden rounded-[28px] px-7 py-8 sm:px-10 sm:py-10">
        <div className="collection-library-orbit" aria-hidden="true" />
        <div className="relative z-10 max-w-[650px]">
          <p className="mb-5 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--monolog-hero-muted)]">
            <span className="h-px w-7 bg-current" /> bbs/ personal library
          </p>
          <h1 className="max-w-[590px] text-[42px] font-medium leading-[1.06] tracking-[-0.045em] text-[var(--monolog-hero-text)] max-sm:text-[34px]">
            Koleksi hal-hal yang layak disimpan.
          </h1>
          <p className="mt-5 max-w-[590px] text-[15.5px] leading-[1.8] text-[var(--monolog-hero-muted)]">
            Buku yang meninggalkan bekas, gunung yang pernah didaki, beans yang pernah diseduh—beserta hal-hal kecil yang layak diingat.
          </p>
          <dl className="mt-8 flex flex-wrap gap-x-8 gap-y-4 border-t border-white/10 pt-5">
            <LibraryStat label="koleksi" value={String(totalItems).padStart(2, '0')} />
            <LibraryStat label="rak kategori" value={String(visibleCategoryCount).padStart(2, '0')} />
            <LibraryStat label="diperbarui" value={formatDate(data.updated, true)} />
          </dl>
        </div>
      </header>
      <LibraryShelf data={data} />
    </div>
  );
}

function LibraryStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-mono text-[9px] uppercase tracking-[0.16em] text-[var(--monolog-hero-muted)]">{label}</dt>
      <dd className="mt-1 text-[15px] font-medium text-[var(--monolog-hero-text)]">{value}</dd>
    </div>
  );
}
