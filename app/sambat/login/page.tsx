import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth, isAdmin } from '@/auth';
import { LoginButton } from './login-button';

export const metadata: Metadata = {
  title: 'Sign in · sambat',
  robots: { index: false, follow: false },
};

export default async function SambatLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; error?: string }>;
}) {
  const session = await auth();
  if (isAdmin(session)) {
    redirect('/sambat');
  }

  const sp = await searchParams;
  const from = sp.from || '/sambat';
  const error = sp.error;

  return (
    <div className="mx-auto max-w-[400px] px-6">
      <div className="py-32">
        <div className="mb-3 font-mono text-xs text-[var(--color-ink-3)]">
          ~/sambat
        </div>
        <h1 className="mb-3 text-[28px] font-medium tracking-[-0.025em] text-[var(--color-ink)]">
          Sign in
        </h1>
        <p className="mb-7 text-sm leading-[1.65] text-[var(--color-ink-3)]">
          Halaman privat — hanya kamu yang bisa baca dan posting di sini.
          Login via GitHub akan memverifikasi username kamu.
        </p>

        <LoginButton callbackUrl={from} />

        {error === 'AccessDenied' && (
          <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/5 px-3 py-2 text-[12.5px] text-red-600 dark:text-red-400">
            Akun GitHub kamu bukan admin yang dikonfigurasi.
          </p>
        )}

        <p className="mt-10 font-mono text-[11.5px] text-[var(--color-ink-4)]">
          curhat tanpa social media, hanya untuk kamu sendiri
        </p>
      </div>
    </div>
  );
}
