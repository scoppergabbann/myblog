'use client';

import Link from 'next/link';
import { useActionState, useEffect, useTransition } from 'react';
import { useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/admin/toast';
import { monologCategories } from '@/lib/monolog-shared';
import type { MonologCategorySlug, MonologStatus } from '@/types/monolog';
import { MonologAudioUpload } from './audio-upload';
import { createMonolog, deleteMonolog, updateMonolog, type MonologFormState } from './actions';

export type AdminMonologEpisode = {
  id?: number;
  slug: string;
  title: string;
  description: string;
  category: MonologCategorySlug;
  audio_url: string;
  audio_path: string | null;
  duration_seconds: number;
  published_at: string | null;
  status: MonologStatus;
  transcript: string | null;
  reflection: string | null;
  tags: string[];
};

const DEFAULT_EPISODE: AdminMonologEpisode = {
  slug: '', title: '', description: '', category: 'random', audio_url: '', audio_path: null,
  duration_seconds: 0, published_at: null, status: 'draft', transcript: null, reflection: null, tags: [],
};

export function MonologEditor({ episode = DEFAULT_EPISODE }: { episode?: AdminMonologEpisode }) {
  const isNew = !episode.id;
  const action = isNew
    ? createMonolog
    : (updateMonolog.bind(null, episode.id!) as typeof createMonolog);
  const [state, formAction] = useActionState<MonologFormState, FormData>(action, null);
  const [, startTransition] = useTransition();
  const router = useRouter();
  const toast = useToast();

  useEffect(() => {
    if (!state) return;
    if (state.ok) {
      toast.success(isNew ? 'Episode Monolog dibuat.' : 'Perubahan Monolog tersimpan.');
      if (isNew) router.push(`/admin/monolog/${state.id}`);
      else router.refresh();
    } else toast.error(state.error);
    // Toast context changes when a toast is added; state is the action result that should trigger this once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNew, router, state]);

  function onDelete() {
    if (!episode.id || !confirm(`Hapus episode "${episode.title}" beserta file audionya?`)) return;
    startTransition(async () => {
      const result = await deleteMonolog(episode.id!);
      if (result.ok) {
        toast.success('Episode Monolog dihapus.');
        router.push('/admin/monolog');
      } else toast.error(result.error);
    });
  }

  return (
    <div>
      <Link href="/admin/monolog" className="mb-2 inline-flex items-center gap-1 text-xs text-[var(--color-ink-3)] hover:text-[var(--color-accent)]">
        <span aria-hidden="true">←</span> monolog
      </Link>
      <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-medium tracking-[-0.025em] text-[var(--color-ink)]">
            {isNew ? 'New Monolog' : 'Edit Monolog'}
          </h1>
          <p className="mt-1 text-sm text-[var(--color-ink-3)]">Upload rekaman, lengkapi metadata, lalu publish saat siap.</p>
        </div>
        {!isNew && episode.status === 'published' && (
          <Link href={`/monolog/${episode.slug}`} target="_blank" className="rounded-lg border border-[var(--color-line)] px-3 py-2 text-xs text-[var(--color-ink-3)] hover:text-[var(--color-accent)]">
            Lihat publik ↗
          </Link>
        )}
      </div>

      <form action={formAction} className="space-y-5">
        <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
          <Field label="Judul" htmlFor="monolog-title">
            <input id="monolog-title" name="title" required maxLength={180} defaultValue={episode.title} autoFocus={isNew} className={inputClass} />
          </Field>
          <Field label="Slug" htmlFor="monolog-slug">
            <input id="monolog-slug" name="slug" required maxLength={100} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" defaultValue={episode.slug} placeholder="judul-episode" className={`${inputClass} font-mono text-sm`} />
          </Field>
        </div>

        <Field label="Deskripsi singkat" htmlFor="monolog-description">
          <textarea id="monolog-description" name="description" required maxLength={600} rows={3} defaultValue={episode.description} className={`${inputClass} resize-y`} />
        </Field>

        <div className="grid grid-cols-3 gap-4 max-md:grid-cols-1">
          <Field label="Kategori" htmlFor="monolog-category">
            <select id="monolog-category" name="category" defaultValue={episode.category} className={inputClass}>
              {monologCategories.map((category) => <option key={category.slug} value={category.slug}>{category.label}</option>)}
            </select>
          </Field>
          <Field label="Status" htmlFor="monolog-status">
            <select id="monolog-status" name="status" defaultValue={episode.status} className={inputClass}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </Field>
          <Field label="Tanggal publikasi (WIB)" htmlFor="monolog-published-at">
            <input id="monolog-published-at" name="published_at" type="datetime-local" defaultValue={toDatetimeLocal(episode.published_at)} className={inputClass} />
          </Field>
        </div>

        <MonologAudioUpload initialUrl={episode.audio_url} initialPath={episode.audio_path} initialDuration={episode.duration_seconds} />

        <Field label="Tags (pisahkan dengan koma)" htmlFor="monolog-tags">
          <input id="monolog-tags" name="tags" defaultValue={episode.tags.join(', ')} placeholder="komunikasi, refleksi" className={`${inputClass} font-mono text-sm`} />
        </Field>

        <Field label="Transkrip (opsional)" htmlFor="monolog-transcript">
          <textarea id="monolog-transcript" name="transcript" rows={14} defaultValue={episode.transcript ?? ''} className={`${inputClass} resize-y leading-relaxed`} />
        </Field>

        <Field label="Refleksi pribadi (opsional)" htmlFor="monolog-reflection">
          <textarea id="monolog-reflection" name="reflection" rows={7} defaultValue={episode.reflection ?? ''} className={`${inputClass} resize-y leading-relaxed`} />
        </Field>

        <div className="flex items-center justify-between gap-4 border-t border-[var(--color-line)] pt-5">
          <SubmitButton isNew={isNew} />
          {!isNew && <button type="button" onClick={onDelete} className="rounded-md border border-red-500/30 px-3 py-2 text-xs text-red-600 hover:bg-red-500/5 dark:text-red-400">Hapus episode</button>}
        </div>
      </form>
    </div>
  );
}

const inputClass = 'w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2 text-[14px] text-[var(--color-ink)] transition-colors focus:border-[var(--color-accent)]';

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return <div><label htmlFor={htmlFor} className="mb-1.5 block font-mono text-[11px] uppercase tracking-wide text-[var(--color-ink-3)]">{label}</label>{children}</div>;
}

function SubmitButton({ isNew }: { isNew: boolean }) {
  const { pending } = useFormStatus();
  return <button type="submit" disabled={pending} className="rounded-lg bg-[var(--color-ink)] px-4 py-2.5 text-sm font-medium text-[var(--color-paper)] hover:opacity-85 disabled:cursor-wait disabled:opacity-50">{pending ? 'Menyimpan…' : isNew ? 'Buat episode' : 'Simpan perubahan'}</button>;
}

function toDatetimeLocal(value: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return '';
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(date).replace(' ', 'T');
}
