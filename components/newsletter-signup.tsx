'use client';

import { useActionState, useEffect, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import { subscribe, type SubscribeResult } from '@/app/api/subscribe/actions';

export function NewsletterSignup() {
  const [state, formAction] = useActionState<SubscribeResult | null, FormData>(
    subscribe,
    null
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  return (
    <section className="mt-14 rounded-[14px] border border-[var(--color-line)] bg-[var(--color-paper-2)] px-6 py-6">
      <h3 className="mb-1.5 text-[15px] font-medium text-[var(--color-ink)]">
        Dapatkan tulisan baru via email
      </h3>
      <p className="mb-4 text-[13.5px] text-[var(--color-ink-3)]">
        Satu email per tulisan baru. Tidak ada promosi, tidak ada spam.
      </p>

      <form ref={formRef} action={formAction} className="flex gap-2 max-sm:flex-col">
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          style={{ position: 'absolute', left: '-9999px', width: 1, height: 1 }}
        />
        <input
          type="email"
          name="email"
          placeholder="email@kamu.com"
          required
          maxLength={254}
          className="flex-1 rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2 text-[13.5px] text-[var(--color-ink)] transition-colors focus:border-[var(--color-accent)]"
        />
        <SubscribeButton />
      </form>

      {state && !state.ok && (
        <p className="mt-2 text-[12.5px] text-red-600 dark:text-red-400">
          {state.error}
        </p>
      )}
      {state?.ok && (
        <p className="mt-2 text-[12.5px] text-emerald-600 dark:text-emerald-400">
          {state.message}
        </p>
      )}
    </section>
  );
}

function SubscribeButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-[var(--color-ink)] px-5 py-2 text-[13px] font-medium tracking-tight text-[var(--color-paper)] transition-opacity hover:opacity-85 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 max-sm:w-full"
    >
      {pending ? '...' : 'Subscribe'}
    </button>
  );
}
