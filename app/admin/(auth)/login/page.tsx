import { redirect } from 'next/navigation';
import { auth, isAdmin } from '@/auth';
import { CredentialsLoginForm, GithubLoginButton } from './login-button';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; error?: string }>;
}) {
  const session = await auth();
  if (isAdmin(session)) {
    redirect('/admin');
  }

  const sp = await searchParams;
  const from = sp.from || '/admin';
  const error = sp.error;
  const githubEnabled = Boolean(
    process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET
  );

  return (
    <div className="mx-auto max-w-[400px] px-6">
      <div className="py-32">
        <div className="mb-3 font-mono text-xs text-[var(--color-ink-3)]">
          ~/admin
        </div>
        <h1 className="mb-3 text-[28px] font-medium tracking-[-0.025em] text-[var(--color-ink)]">
          Sign in
        </h1>
        <p className="mb-7 text-sm leading-[1.65] text-[var(--color-ink-3)]">
          Masuk dengan username dan password admin. GitHub tetap tersedia
          sebagai opsi jika OAuth dikonfigurasi.
        </p>

        <CredentialsLoginForm callbackUrl={from} />

        {githubEnabled && (
          <div className="mt-5">
            <div className="mb-5 flex items-center gap-3">
              <span className="h-px flex-1 bg-[var(--color-line)]" />
              <span className="font-mono text-[11px] text-[var(--color-ink-4)]">
                atau
              </span>
              <span className="h-px flex-1 bg-[var(--color-line)]" />
            </div>
            <GithubLoginButton callbackUrl={from} />
          </div>
        )}

        {error === 'AccessDenied' && (
          <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/5 px-3 py-2 text-[12.5px] text-red-600 dark:text-red-400">
            Akun GitHub kamu bukan admin yang dikonfigurasi.
          </p>
        )}

        <p className="mt-10 font-mono text-[11.5px] text-[var(--color-ink-4)]">
          tip: set ADMIN_USERNAME and ADMIN_PASSWORD in env
        </p>
      </div>
    </div>
  );
}
