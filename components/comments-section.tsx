import { getCommentsForSlug } from '@/lib/queries';
import { commentStorageSlug, type CommentTargetKind } from '@/lib/comment-target';
import { formatDate } from '@/lib/utils';
import { CommentForm } from './comment-form';

export async function CommentsSection({
  slug,
  kind = 'writing',
}: {
  slug: string;
  kind?: CommentTargetKind;
}) {
  const comments = await getCommentsForSlug(commentStorageSlug(kind, slug));

  return (
    <section
      id="comments"
      className="mt-16 border-t border-[var(--color-line)] pt-10"
    >
      <h2 className="mb-2 font-mono text-sm font-medium lowercase text-[var(--color-ink-3)]">
        // diskusi
      </h2>
      <p className="mb-6 text-[15px] leading-relaxed text-[var(--color-ink-3)]">
        {comments.length} komentar. Tulis tanggapan, cerita, atau hal yang ingin kamu sampaikan.
      </p>

      <CommentForm slug={slug} kind={kind} />

      <div className="mt-8 flex flex-col">
        {comments.length === 0 ? (
          <p className="py-4 text-sm text-[var(--color-ink-3)]">
            Belum ada komentar. Jadilah yang pertama.
          </p>
        ) : (
          comments.map((c) => (
            <div
              key={c.id}
              className="border-b border-[var(--color-line)] py-4 last:border-b-0"
            >
              <div className="mb-1 flex items-baseline justify-between">
                <span className="text-[15px] font-medium text-[var(--color-ink)]">
                  {c.name}
                </span>
                <span className="font-mono text-[11px] text-[var(--color-ink-4)]">
                  {formatDate(c.created_at)}
                </span>
              </div>
              <p className="whitespace-pre-wrap text-[15.5px] leading-[1.7] text-[var(--color-ink-2)]">
                {c.message}
              </p>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
