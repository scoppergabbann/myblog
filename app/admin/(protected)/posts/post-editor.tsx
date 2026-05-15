'use client';

import { useActionState, useState, useTransition } from 'react';
import { useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ImageUploadButton } from '@/components/admin/image-upload-button';
import { createPost, updatePost, deletePost, type PostFormState } from './actions';

type Post = {
  id?: number;
  slug: string;
  title: string;
  summary: string;
  content: string;
  tags: string[];
  status: 'draft' | 'published' | 'archived';
  published_at: string | null;
};

const DEFAULT_POST: Post = {
  slug: '',
  title: '',
  summary: '',
  content: '',
  tags: [],
  status: 'draft',
  published_at: null,
};

export function PostEditor({ post = DEFAULT_POST }: { post?: Post }) {
  const isNew = !post.id;
  const action = isNew
    ? createPost
    : (updatePost.bind(null, post.id!) as typeof createPost);

  const [state, formAction] = useActionState<PostFormState, FormData>(
    action as unknown as (state: PostFormState, fd: FormData) => Promise<PostFormState>,
    null
  );

  const [content, setContent] = useState(post.content);
  const [, startTransition] = useTransition();
  const router = useRouter();

  const onImageUploaded = (url: string) => {
    const snippet = `\n\n![](${url})\n\n`;
    setContent((c) => c + snippet);
  };

  const onDelete = () => {
    if (!post.id) return;
    if (!confirm(`Hapus post "${post.title}"? Tidak bisa undo.`)) return;
    startTransition(async () => {
      const result = await deletePost(post.id!);
      if (result.ok) router.push('/admin/posts');
    });
  };

  return (
    <div>
      <div className="mb-6 flex items-baseline justify-between gap-4">
        <div>
          <Link
            href="/admin/posts"
            className="mb-2 inline-flex items-center gap-1 text-[12px] text-[var(--color-ink-3)] transition-colors hover:text-[var(--color-accent)]"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            posts
          </Link>
          <h1 className="text-[28px] font-medium tracking-[-0.025em] text-[var(--color-ink)]">
            {isNew ? 'New post' : 'Edit post'}
          </h1>
        </div>

        {!isNew && post.status === 'published' && (
          <Link
            href={`/writing/${post.slug}`}
            target="_blank"
            className="font-mono text-[12px] text-[var(--color-ink-3)] transition-colors hover:text-[var(--color-accent)]"
          >
            view live →
          </Link>
        )}
      </div>

      <form action={formAction} className="space-y-5">
        {/* Title + Slug row */}
        <div className="grid grid-cols-[1fr_300px] gap-4 max-md:grid-cols-1">
          <div>
            <Label>title</Label>
            <input
              type="text"
              name="title"
              defaultValue={post.title}
              required
              maxLength={200}
              autoFocus={isNew}
              className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2 text-[15px] text-[var(--color-ink)] transition-colors focus:border-[var(--color-accent)]"
            />
          </div>
          <div>
            <Label>slug</Label>
            <input
              type="text"
              name="slug"
              defaultValue={post.slug}
              required
              pattern="[a-z0-9-]+"
              maxLength={80}
              placeholder="my-post-slug"
              className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2 font-mono text-[13px] text-[var(--color-ink)] transition-colors focus:border-[var(--color-accent)]"
            />
          </div>
        </div>

        <div>
          <Label>summary</Label>
          <textarea
            name="summary"
            defaultValue={post.summary}
            required
            maxLength={400}
            rows={2}
            className="w-full resize-y rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2 text-[14px] text-[var(--color-ink)] transition-colors focus:border-[var(--color-accent)]"
          />
        </div>

        <div>
          <div className="mb-1.5 flex items-baseline justify-between">
            <Label noMargin>content (MDX)</Label>
            <ImageUploadButton onUploaded={onImageUploaded} label="upload image" />
          </div>
          <textarea
            name="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            rows={24}
            spellCheck
            className="w-full resize-y rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-3 font-mono text-[13.5px] leading-[1.65] text-[var(--color-ink)] transition-colors focus:border-[var(--color-accent)]"
          />
          <p className="mt-1.5 font-mono text-[11px] text-[var(--color-ink-4)]">
            markdown + MDX. tersedia: &lt;Figure&gt;, &lt;Callout kind="note|tip|warning"&gt;
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4 max-md:grid-cols-1">
          <div>
            <Label>tags (comma-separated)</Label>
            <input
              type="text"
              name="tags"
              defaultValue={post.tags.join(', ')}
              placeholder="engineering, reflection"
              className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2 font-mono text-[13px] text-[var(--color-ink)] transition-colors focus:border-[var(--color-accent)]"
            />
          </div>
          <div>
            <Label>status</Label>
            <select
              name="status"
              defaultValue={post.status}
              className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2 text-[13.5px] text-[var(--color-ink)] transition-colors focus:border-[var(--color-accent)]"
            >
              <option value="draft">draft</option>
              <option value="published">published</option>
              <option value="archived">archived</option>
            </select>
          </div>
          <div>
            <Label>published at</Label>
            <input
              type="datetime-local"
              name="published_at"
              defaultValue={
                post.published_at
                  ? new Date(post.published_at).toISOString().slice(0, 16)
                  : ''
              }
              className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2 text-[13px] text-[var(--color-ink)] transition-colors focus:border-[var(--color-accent)]"
            />
            <p className="mt-1 font-mono text-[11px] text-[var(--color-ink-4)]">
              kosongkan untuk auto-set saat publish
            </p>
          </div>
        </div>

        {/* Status feedback */}
        {state && !state.ok && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/5 px-3 py-2 text-[13px] text-red-600 dark:text-red-400">
            {state.error}
          </div>
        )}
        {state?.ok && (
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 text-[13px] text-emerald-600 dark:text-emerald-400">
            Saved.
          </div>
        )}

        {/* Action row */}
        <div className="flex items-center justify-between gap-3 border-t border-[var(--color-line)] pt-5">
          <SubmitButton isNew={isNew} />
          {!isNew && (
            <button
              type="button"
              onClick={onDelete}
              className="rounded-md border border-red-500/30 px-3 py-1.5 font-mono text-[12px] text-red-600 transition-colors hover:border-red-500/60 hover:bg-red-500/5 dark:text-red-400"
            >
              delete post
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

function Label({
  children,
  noMargin = false,
}: {
  children: React.ReactNode;
  noMargin?: boolean;
}) {
  return (
    <label
      className={`block font-mono text-[11.5px] uppercase tracking-wide text-[var(--color-ink-3)] ${
        noMargin ? '' : 'mb-1.5'
      }`}
    >
      {children}
    </label>
  );
}

function SubmitButton({ isNew }: { isNew: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-[var(--color-ink)] px-4 py-2 text-[13.5px] font-medium tracking-tight text-[var(--color-paper)] transition-opacity hover:opacity-85 disabled:cursor-wait disabled:opacity-60"
    >
      {pending ? 'Saving...' : isNew ? 'Create post' : 'Save changes'}
    </button>
  );
}
