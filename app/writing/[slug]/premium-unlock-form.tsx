'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import {
  unlockPremiumPost,
  type PremiumUnlockState,
} from './premium-actions';

export function PremiumUnlockForm({ slug }: { slug: string }) {
  const [state, formAction] = useActionState<PremiumUnlockState, FormData>(
    unlockPremiumPost,
    null
  );

  return (
    <div className="my-10 rounded-[12px] border border-[var(--color-line)] bg-[var(--color-paper)] px-5 py-5">
      <div className="mb-4">
        <p className="font-mono text-[11.5px] uppercase tracking-wide text-[var(--color-ink-4)]">
          premium
        </p>
        <h2 className="mt-1 text-[20px] font-medium tracking-[-0.02em] text-[var(--color-ink)]">
          Tulisan ini dikunci.
        </h2>
        <p className="mt-2 text-[14px] leading-[1.65] text-[var(--color-ink-3)]">
          Masukkan password yang saya bagikan untuk membuka isi lengkapnya.
        </p>
      </div>

      <form action={formAction} className="flex gap-2 max-sm:flex-col">
        <input type="hidden" name="slug" value={slug} />
        <input
          type="password"
          name="password"
          required
          autoComplete="current-password"
          placeholder="Password"
          className="min-w-0 flex-1 rounded-lg border border-[var(--color-line)] bg-[var(--color-bg)] px-3 py-2 text-[14px] text-[var(--color-ink)] transition-colors focus:border-[var(--color-accent)]"
        />
        <UnlockButton />
      </form>

      {state?.error && (
        <p className="mt-2 font-mono text-[11.5px] text-red-600 dark:text-red-400">
          {state.error}
        </p>
      )}
    </div>
  );
}

function UnlockButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-[var(--color-ink)] px-4 py-2 text-[13.5px] font-medium tracking-tight text-[var(--color-paper)] transition-opacity hover:opacity-85 disabled:cursor-wait disabled:opacity-60"
    >
      {pending ? 'Membuka...' : 'Buka'}
    </button>
  );
}
