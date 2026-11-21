'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { submitComment, type CommentActionResult } from '@/app/writing/[slug]/comment-actions';
import type { CommentTargetKind } from '@/lib/comment-target';

export function CommentForm({
  slug,
  kind = 'writing',
}: {
  slug: string;
  kind?: CommentTargetKind;
}) {
  const [state, formAction] = useActionState<CommentActionResult | null, FormData>(
    submitComment,
    null
  );
  const formRef = useRef<HTMLFormElement>(null);
  const confirmedRef = useRef(false);
  const [confirmationOpen, setConfirmationOpen] = useState(false);

  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form
      ref={formRef}
      action={formAction}
      onSubmit={(event) => {
        if (confirmedRef.current) {
          confirmedRef.current = false;
          return;
        }
        event.preventDefault();
        setConfirmationOpen(true);
      }}
      className="rounded-[14px] border border-[var(--color-line)] bg-[var(--color-paper)] p-4"
    >
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="kind" value={kind} />
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
          className="flex-1 rounded-lg border border-[var(--color-line)] bg-transparent px-3 py-2 text-[15px] text-[var(--color-ink)] transition-colors focus:border-[var(--color-accent)]"
        />
      </div>
      <textarea
        name="message"
        placeholder="Komentar atau pertanyaan..."
        maxLength={800}
        required
        className="mb-2.5 min-h-[96px] w-full resize-y rounded-lg border border-[var(--color-line)] bg-transparent px-3 py-2 text-[15px] text-[var(--color-ink)] transition-colors focus:border-[var(--color-accent)]"
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

      {confirmationOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="comment-confirmation-title"
          className="fixed inset-0 z-[100] grid place-items-center bg-black/70 p-5 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setConfirmationOpen(false);
          }}
        >
          <div className="w-full max-w-[440px] rounded-[20px] border border-white/10 bg-[#1b1815] p-6 text-[#fbf6ed]">
            <p className="font-mono text-[12px] uppercase tracking-[0.14em] text-[#e36d3c]">sebelum dikirim</p>
            <h3 id="comment-confirmation-title" className="mt-3 text-[24px] font-medium tracking-[-0.03em]">
              Kirim komentar ini?
            </h3>
            <p className="mt-3 text-[16px] leading-relaxed text-white/65">
              Setelah dikirim, komentar tidak dapat kamu hapus sendiri. Admin tetap dapat memoderasi komentar bila diperlukan.
            </p>
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmationOpen(false)}
                className="min-h-11 rounded-full border border-white/20 px-5 text-[15px] text-white/75 transition-colors hover:border-white/45 hover:text-white"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  confirmedRef.current = true;
                  setConfirmationOpen(false);
                  formRef.current?.requestSubmit();
                }}
                className="min-h-11 rounded-full bg-[#fbf6ed] px-5 text-[15px] font-medium text-[#1b1815] transition-colors hover:bg-[#e36d3c] hover:text-white"
              >
                Ya, kirim komentar
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="min-h-11 rounded-lg bg-[var(--color-ink)] px-4 py-2 text-[14px] font-medium tracking-tight text-[var(--color-paper)] transition-colors hover:bg-[var(--color-accent)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? 'Mengirim...' : 'Kirim komentar'}
    </button>
  );
}
