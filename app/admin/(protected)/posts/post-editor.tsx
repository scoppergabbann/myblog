'use client';

import { useActionState, useEffect, useState, useTransition } from 'react';
import { useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ImageUploadButton } from '@/components/admin/image-upload-button';
import { useToast } from '@/components/admin/toast';
import { slugify } from '@/lib/utils';
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
  is_premium: boolean;
};

const DEFAULT_POST: Post = {
  slug: '',
  title: '',
  summary: '',
  content: '',
  tags: [],
  status: 'draft',
  published_at: null,
  is_premium: false,
};

export function PostEditor({
  post = DEFAULT_POST,
  previewToken,
}: {
  post?: Post;
  previewToken?: string;
}) {
  const isNew = !post.id;
  const action = isNew
    ? createPost
    : (updatePost.bind(null, post.id!) as typeof createPost);

  const [state, formAction] = useActionState<PostFormState, FormData>(
    action as unknown as (state: PostFormState, fd: FormData) => Promise<PostFormState>,
    null
  );

  const [content, setContent] = useState(post.content);
  const [title, setTitle] = useState(post.title);
  const [slug, setSlug] = useState(post.slug);
  // Track whether user manually edited slug. If yes, stop auto-syncing.
  // For existing posts (edit mode), default to manual to avoid clobbering.
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(!isNew);
  const [autosaveStatus, setAutosaveStatus] = useState<'idle' | 'saved'>('idle');
  const [, startTransition] = useTransition();
  const router = useRouter();
  const toast = useToast();

  // localStorage auto-save (content only — never auto-save status/published_at)
  const storageKey = `bbs:post-draft:${post.id ?? 'new'}`;

  // Auto-generate slug from title for new posts (until user edits slug manually)
  useEffect(() => {
    if (slugManuallyEdited) return;
    setSlug(slugify(title));
  }, [title, slugManuallyEdited]);

  // Restore prompt on mount: if there's a localStorage draft newer than what
  // came from the server, offer to restore.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const saved = window.localStorage.getItem(storageKey);
      if (!saved) return;
      const parsed = JSON.parse(saved) as { content: string; savedAt: number };
      if (parsed.content && parsed.content !== post.content) {
        const age = Math.round((Date.now() - parsed.savedAt) / 1000);
        const ageLabel = age < 60 ? `${age}d lalu` : `${Math.round(age / 60)}m lalu`;
        if (
          confirm(
            `Ada draft tersimpan otomatis di browser ini (${ageLabel}). Restore?`
          )
        ) {
          setContent(parsed.content);
        } else {
          window.localStorage.removeItem(storageKey);
        }
      } else if (parsed.content === post.content) {
        // Clean stale match (server already has this content)
        window.localStorage.removeItem(storageKey);
      }
    } catch {
      // ignore corrupted localStorage
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced save to localStorage as user types
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (content === post.content) {
      // No diff vs server — clear any stale saved draft
      window.localStorage.removeItem(storageKey);
      setAutosaveStatus('idle');
      return;
    }
    const t = setTimeout(() => {
      try {
        window.localStorage.setItem(
          storageKey,
          JSON.stringify({ content, savedAt: Date.now() })
        );
        setAutosaveStatus('saved');
      } catch {
        // localStorage full / disabled — silently ignore
      }
    }, 800);
    return () => clearTimeout(t);
  }, [content, post.content, storageKey]);

  // Clear localStorage draft after successful save (state.ok)
  useEffect(() => {
    if (state?.ok && typeof window !== 'undefined') {
      window.localStorage.removeItem(storageKey);
      setAutosaveStatus('idle');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  // Surface success/error from the form action via toast
  useEffect(() => {
    if (!state) return;
    if (state.ok) {
      toast.success(isNew ? 'Post berhasil dibuat.' : 'Perubahan tersimpan.');
      if (isNew && state.id) {
        router.push(`/admin/posts/${state.id}`);
      }
    } else {
      toast.error(state.error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const onImageUploaded = (url: string) => {
    const snippet = `\n\n![](${url})\n\n`;
    setContent((c) => c + snippet);
    toast.success('Image uploaded.');
  };

  const onDelete = () => {
    if (!post.id) return;
    if (!confirm(`Hapus post "${post.title}"? Tidak bisa undo.`)) return;
    startTransition(async () => {
      const result = await deletePost(post.id!);
      if (result.ok) router.push('/admin/posts');
    });
  };

  function toJakartaDateTimeLocal(value: string) {
  const date = new Date(value);

  const formatter = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  return formatter.format(date).replace(' ', 'T');
}

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

        {!isNew && (
          <div className="flex items-center gap-3">
            {post.status !== 'published' && previewToken && (
              <Link
                href={`/writing/preview/${post.slug}?token=${previewToken}`}
                target="_blank"
                className="font-mono text-[12px] text-[var(--color-ink-3)] transition-colors hover:text-[var(--color-accent)]"
              >
                preview draft →
              </Link>
            )}
            {post.status === 'published' && (
              <Link
                href={`/writing/${post.slug}`}
                target="_blank"
                className="font-mono text-[12px] text-[var(--color-ink-3)] transition-colors hover:text-[var(--color-accent)]"
              >
                view live →
              </Link>
            )}
          </div>
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
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={200}
              autoFocus={isNew}
              className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2 text-[15px] text-[var(--color-ink)] transition-colors focus:border-[var(--color-accent)]"
            />
          </div>
          <div>
            <Label>slug</Label>
            <div className="relative">
              <input
                type="text"
                name="slug"
                value={slug}
                onChange={(e) => {
                  setSlug(e.target.value);
                  setSlugManuallyEdited(true);
                }}
                required
                pattern="[a-z0-9-]+"
                maxLength={80}
                placeholder="auto-generate dari title"
                className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2 pr-[68px] font-mono text-[13px] text-[var(--color-ink)] transition-colors focus:border-[var(--color-accent)]"
              />
              {slugManuallyEdited && isNew && (
                <button
                  type="button"
                  onClick={() => {
                    setSlug(slugify(title));
                    setSlugManuallyEdited(false);
                  }}
                  title="Reset to auto-generated from title"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded border border-[var(--color-line)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--color-ink-3)] transition-colors hover:border-[color-mix(in_srgb,var(--color-accent)_30%,transparent)] hover:text-[var(--color-accent)]"
                >
                  reset
                </button>
              )}
            </div>
            {isNew && !slugManuallyEdited && title && (
              <p className="mt-1 font-mono text-[10.5px] text-[var(--color-ink-4)]">
                auto-generated · klik untuk edit manual
              </p>
            )}
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
          <div className="mt-1.5 flex items-baseline justify-between gap-3">
            <p className="font-mono text-[11px] text-[var(--color-ink-4)]">
              markdown + MDX. tersedia: &lt;Figure&gt;, &lt;Callout kind=&quot;note|tip|warning&quot;&gt;
            </p>
            <ContentMeta content={content} autosave={autosaveStatus} />
          </div>
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
                ? toJakartaDateTimeLocal(post.published_at)
                : ''
            }
            required
            className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2 text-[13px] text-[var(--color-ink)] transition-colors focus:border-[var(--color-accent)]"
          />
          <p className="mt-1 font-mono text-[11px] text-[var(--color-ink-4)]">
            wajib diisi · gunakan waktu Asia/Jakarta GMT+7
          </p>
        </div>
        </div>

        <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] px-4 py-3">
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              name="is_premium"
              defaultChecked={post.is_premium}
              className="mt-1 h-4 w-4 rounded border-[var(--color-line)]"
            />
            <span>
              <span className="block text-[14px] font-medium text-[var(--color-ink)]">
                Premium / password protected
              </span>
              <span className="mt-1 block text-[12.5px] leading-[1.55] text-[var(--color-ink-3)]">
                Pembaca harus memasukkan password sebelum isi tulisan ditampilkan.
              </span>
            </span>
          </label>
          <div className="mt-3">
            <Label>premium password</Label>
            <input
              type="password"
              name="premium_password"
              minLength={4}
              placeholder={
                post.is_premium
                  ? 'Kosongkan jika tidak ingin mengganti password'
                  : 'Isi jika post premium'
              }
              className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-bg)] px-3 py-2 text-[13px] text-[var(--color-ink)] transition-colors focus:border-[var(--color-accent)]"
            />
          </div>
        </div>

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

function ContentMeta({
  content,
  autosave,
}: {
  content: string;
  autosave: 'idle' | 'saved';
}) {
  // Strip MDX/markdown markers for a cleaner word count
  const text = content
    .replace(/```[\s\S]*?```/g, ' ') // fenced code blocks
    .replace(/`[^`]*`/g, ' ') // inline code
    .replace(/<[^>]+>/g, ' ') // JSX tags
    .replace(/[#*_>\-[\]()!]/g, ' ');
  const words = text.split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.round(words / 200));

  return (
    <p className="flex-shrink-0 font-mono text-[11px] text-[var(--color-ink-4)]">
      {words.toLocaleString('id-ID')} kata · {minutes} min
      {autosave === 'saved' && (
        <span className="ml-2 text-emerald-600 dark:text-emerald-400">
          · auto-saved
        </span>
      )}
    </p>
  );
}
