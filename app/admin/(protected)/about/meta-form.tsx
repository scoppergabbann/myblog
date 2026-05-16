'use client';

import { useState, useTransition } from 'react';
import { useToast } from '@/components/admin/toast';
import { ImageUploadButton } from '@/components/admin/image-upload-button';
import { updateAboutMeta, type AboutMetaInput } from './actions';

export function AboutMetaForm({ initial }: { initial: AboutMetaInput }) {
  const [data, setData] = useState(initial);
  const [, startTransition] = useTransition();
  const toast = useToast();

  const set = <K extends keyof AboutMetaInput>(key: K, value: AboutMetaInput[K]) =>
    setData((d) => ({ ...d, [key]: value }));

  const dirty = JSON.stringify(data) !== JSON.stringify(initial);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const result = await updateAboutMeta(data);
      if (result.ok) toast.success('About page tersimpan.');
      else toast.error(result.error);
    });
  };

  const onImageUploaded = (url: string) => {
    const snippet = `\n\n![](${url})\n\n`;
    set('content', data.content + snippet);
    toast.success('Image uploaded.');
  };

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid grid-cols-[1fr_300px] gap-4 max-md:grid-cols-1">
        <div>
          <Label>title</Label>
          <input
            type="text"
            value={data.title}
            onChange={(e) => set('title', e.target.value)}
            maxLength={100}
            required
            className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2 text-[15px] text-[var(--color-ink)] transition-colors focus:border-[var(--color-accent)]"
          />
        </div>
        <div>
          <Label>contact email</Label>
          <input
            type="email"
            value={data.contact_email}
            onChange={(e) => set('contact_email', e.target.value)}
            maxLength={120}
            className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2 font-mono text-[13px] text-[var(--color-ink)] transition-colors focus:border-[var(--color-accent)]"
          />
        </div>
      </div>

      <div>
        <Label>subtitle</Label>
        <textarea
          value={data.subtitle}
          onChange={(e) => set('subtitle', e.target.value)}
          maxLength={300}
          rows={2}
          className="w-full resize-y rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2 text-[14px] text-[var(--color-ink)] transition-colors focus:border-[var(--color-accent)]"
        />
      </div>

      <div>
        <div className="mb-1.5 flex items-baseline justify-between">
          <label className="block font-mono text-[11.5px] uppercase tracking-wide text-[var(--color-ink-3)]">
            content (MDX)
          </label>
          <ImageUploadButton onUploaded={onImageUploaded} label="upload image" />
        </div>
        <textarea
          value={data.content}
          onChange={(e) => set('content', e.target.value)}
          rows={20}
          spellCheck
          className="w-full resize-y rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-3 font-mono text-[13.5px] leading-[1.65] text-[var(--color-ink)] transition-colors focus:border-[var(--color-accent)]"
        />
        <p className="mt-1.5 font-mono text-[11px] text-[var(--color-ink-4)]">
          markdown + MDX. tersedia: &lt;Figure&gt;, &lt;Callout kind=&quot;note|tip|warning&quot;&gt;.
          struktur lewat heading: ## // cerita, ## // filosofi, dll.
        </p>
      </div>

      <div>
        <Label>contact intro</Label>
        <input
          type="text"
          value={data.contact_intro}
          onChange={(e) => set('contact_intro', e.target.value)}
          maxLength={200}
          placeholder="Saya merespon email pelan-pelan..."
          className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2 text-[13.5px] text-[var(--color-ink)] transition-colors focus:border-[var(--color-accent)]"
        />
        <p className="mt-1 font-mono text-[11px] text-[var(--color-ink-4)]">
          kalimat sebelum link email di section &ldquo;// hubungi&rdquo;
        </p>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-[var(--color-line)] pt-5">
        <button
          type="submit"
          disabled={!dirty}
          className="rounded-lg bg-[var(--color-ink)] px-4 py-2 text-[13.5px] font-medium tracking-tight text-[var(--color-paper)] transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Save changes
        </button>
        {!dirty && (
          <span className="font-mono text-[11px] text-[var(--color-ink-4)]">
            no changes
          </span>
        )}
      </div>
    </form>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-1.5 block font-mono text-[11.5px] uppercase tracking-wide text-[var(--color-ink-3)]">
      {children}
    </label>
  );
}
