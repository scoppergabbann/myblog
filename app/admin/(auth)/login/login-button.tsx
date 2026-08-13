'use client';

import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

export function CredentialsLoginForm({
  callbackUrl,
}: {
  callbackUrl: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        setError(null);

        const formData = new FormData(event.currentTarget);
        const username = String(formData.get('username') ?? '');
        const password = String(formData.get('password') ?? '');

        startTransition(async () => {
          const result = await signIn('credentials', {
            username,
            password,
            callbackUrl,
            redirect: false,
          });

          if (!result || result.error) {
            setError('Username atau password salah.');
            return;
          }

          router.push(result.url || callbackUrl);
          router.refresh();
        });
      }}
    >
      <div>
        <label className="mb-1.5 block font-mono text-[11.5px] uppercase tracking-wide text-[var(--color-ink-3)]">
          username
        </label>
        <input
          type="text"
          name="username"
          autoComplete="username"
          required
          defaultValue="admin"
          className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2 text-[14px] text-[var(--color-ink)] transition-colors focus:border-[var(--color-accent)]"
        />
      </div>

      <div>
        <label className="mb-1.5 block font-mono text-[11.5px] uppercase tracking-wide text-[var(--color-ink-3)]">
          password
        </label>
        <input
          type="password"
          name="password"
          autoComplete="current-password"
          required
          className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2 text-[14px] text-[var(--color-ink)] transition-colors focus:border-[var(--color-accent)]"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="inline-flex w-full items-center justify-center rounded-lg bg-[var(--color-ink)] px-4 py-3 text-[14px] font-medium text-[var(--color-paper)] transition-opacity hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
      >
        {pending ? 'Memeriksa...' : 'Sign in'}
      </button>

      {error && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/5 px-3 py-2 text-[12.5px] text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </form>
  );
}

export function GithubLoginButton({ callbackUrl }: { callbackUrl: string }) {
  const [loading, setLoading] = useState(false);

  return (
    <button
      type="button"
      disabled={loading}
      onClick={() => {
        setLoading(true);
        signIn('github', { callbackUrl });
      }}
      className="inline-flex w-full items-center justify-center gap-2.5 rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] px-4 py-3 text-[14px] font-medium text-[var(--color-ink)] transition-colors hover:border-[var(--color-line-2)] disabled:cursor-wait disabled:opacity-60"
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.4 3-.405 1.02.005 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
      </svg>
      {loading ? 'Mengarahkan...' : 'Sign in with GitHub'}
    </button>
  );
}
