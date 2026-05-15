'use client';

import { useActionState, useEffect, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import { submitComment, type CommentActionResult } from '@/app/writing/[slug]/comment-actions';

export function CommentForm({ slug }: { slug: string }) {
  const [state, formAction] = useActionState<CommentActionResult | null, FormData>(
    submitComment,
    null
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="rounded-[14px] border border-[var(--color-line)] bg-[var(--color-paper)] p-4"
    >
      <input type="hidden" name="slug" value={slug} />
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        style={{ position: 'absolute', left: '-9999px', width: 1, height: 1 }}
      />

      <div className="mb-2.5 flex gap-2.5 max-sm:flex-col">
        <input
          type="text"
          name="name"
          placeholder="Nama"
          maxLength={40}
          required
          className="flex-1 rounded-lg border border-[var(--color-line)] bg-transparent px-3 py-2 text-[13.5px] text-[var(--color-ink)] transition-colors focus:border-[var(--color-accent)]"
        />
      </div>
      <textarea
        name="message"
        placeholder="Komentar atau pertanyaan..."
        maxLength={800}
        required
        className="mb-2.5 min-h-[72px] w-full resize-y rounded-lg border border-[var(--color-line)] bg-transparent px-3 py-2 text-[13.5px] text-[var(--color-ink)] transition-colors focus:border-[var(--color-accent)]"
      />

      <div className="flex items-center justify-between gap-3">
        <SubmitButton />
        {state && !state.ok && (
          <span className="text-[12px] text-red-600 dark:text-red-400">
            {state.error}
          </span>
        )}
        {state?.ok && (
          <span className="text-[12px] text-emerald-600 dark:text-emerald-400">
            Terima kasih atas komentarnya.
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
      className="rounded-lg bg-[var(--color-ink)] px-4 py-2 text-[12.5px] font-medium tracking-tight text-[var(--color-paper)] transition-opacity hover:opacity-85 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? 'Mengirim...' : 'Kirim komentar'}
    </button>
  );
}
