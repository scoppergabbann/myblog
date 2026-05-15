'use client';

import { useActionState, useEffect, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import { submitGuestbookEntry, type GuestbookActionResult } from './actions';

export function GuestbookForm() {
  const [state, formAction] = useActionState<GuestbookActionResult | null, FormData>(
    submitGuestbookEntry,
    null
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="mb-9 rounded-[14px] border border-[var(--color-line)] bg-[var(--color-paper)] p-5"
    >
      {/* Honeypot: hidden from real users */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        style={{ position: 'absolute', left: '-9999px', width: 1, height: 1 }}
      />

      <input
        type="text"
        name="name"
        placeholder="Nama (atau anonim)"
        maxLength={40}
        required
        className="mb-3 w-full rounded-lg border border-[var(--color-line)] bg-transparent px-3 py-2.5 text-sm text-[var(--color-ink)] transition-colors focus:border-[var(--color-accent)]"
      />
      <textarea
        name="message"
        placeholder="Tulis sesuatu yang baik..."
        maxLength={280}
        required
        className="mb-3 min-h-[80px] w-full resize-y rounded-lg border border-[var(--color-line)] bg-transparent px-3 py-2.5 text-sm text-[var(--color-ink)] transition-colors focus:border-[var(--color-accent)]"
      />

      <div className="flex items-center justify-between gap-3">
        <SubmitButton />
        {state && !state.ok && (
          <span className="text-[12.5px] text-red-600 dark:text-red-400">
            {state.error}
          </span>
        )}
        {state?.ok && (
          <span className="text-[12.5px] text-emerald-600 dark:text-emerald-400">
            Terima kasih! Pesan kamu sudah tercatat.
          </span>
        )}
      </div>
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-[var(--color-ink)] px-[18px] py-2.5 text-[13.5px] font-medium tracking-tight text-[var(--color-paper)] transition-opacity hover:opacity-85 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? 'Mengirim...' : 'Kirim pesan'}
    </button>
  );
}
