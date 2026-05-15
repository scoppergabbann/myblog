import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-[680px] px-6">
      <div className="py-32">
        <div className="mb-4 font-mono text-xs text-[var(--color-ink-3)]">
          ~/404
        </div>
        <h1 className="mb-4 text-[36px] font-medium tracking-[-0.035em] text-[var(--color-ink)] max-sm:text-[28px]">
          Halaman tidak ditemukan
        </h1>
        <p className="mb-8 text-[15.5px] text-[var(--color-ink-3)]">
          Mungkin halaman ini sudah dipindahkan, atau memang tidak pernah ada.
        </p>
        <Link
          href="/"
          className="border-b border-[var(--color-line-2)] text-[var(--color-ink)] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
        >
          kembali ke beranda
        </Link>
      </div>
    </div>
  );
}
