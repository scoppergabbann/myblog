'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // TODO: forward to Sentry / similar
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-[680px] px-6">
      <div className="py-32">
        <div className="mb-4 font-mono text-xs text-[var(--color-ink-3)]">
          ~/oops
        </div>
        <h1 className="mb-4 text-[36px] font-medium tracking-[-0.035em] text-[var(--color-ink)] max-sm:text-[28px]">
          Ada yang tidak beres
        </h1>
        <p className="mb-8 text-[15.5px] leading-[1.65] text-[var(--color-ink-3)]">
          Halaman ini gagal dimuat. Maaf atas ketidaknyamanannya. Kamu bisa
          mencoba memuat ulang atau kembali ke beranda.
        </p>
        {error.digest && (
          <p className="mb-8 font-mono text-[11.5px] text-[var(--color-ink-4)]">
            error id: {error.digest}
          </p>
        )}
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={reset}
            className="rounded-lg bg-[var(--color-ink)] px-4 py-2 text-[13px] font-medium text-[var(--color-paper)] transition-opacity hover:opacity-85"
          >
            Coba lagi
          </button>
          <Link
            href="/"
            className="rounded-lg border border-[var(--color-line)] px-4 py-2 text-[13px] text-[var(--color-ink)] transition-colors hover:border-[var(--color-line-2)]"
          >
            Kembali ke beranda
          </Link>
        </div>
      </div>
    </div>
  );
}
