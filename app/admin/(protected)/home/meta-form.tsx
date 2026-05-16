'use client';

import { useState, useTransition } from 'react';
import { useToast } from '@/components/admin/toast';
import { updateHomeMeta, type HomeMetaInput } from './actions';

export function HomeMetaForm({ initial }: { initial: HomeMetaInput }) {
  const [data, setData] = useState(initial);
  const [, startTransition] = useTransition();
  const toast = useToast();

  const set = <K extends keyof HomeMetaInput>(key: K, value: HomeMetaInput[K]) =>
    setData((d) => ({ ...d, [key]: value }));

  const dirty = JSON.stringify(data) !== JSON.stringify(initial);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const result = await updateHomeMeta(data);
      if (result.ok) toast.success('Home page tersimpan.');
      else toast.error(result.error);
    });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* Hero section */}
      <fieldset className="rounded-[12px] border border-[var(--color-line)] bg-[var(--color-paper)] p-4">
        <legend className="px-2 font-mono text-[11px] uppercase tracking-wide text-[var(--color-ink-3)]">
          // hero
        </legend>

        <Field label="mono label" hint="kecil di atas heading, contoh: ~/halo">
          <Input
            value={data.mono_label}
            onChange={(v) => set('mono_label', v)}
            maxLength={40}
            mono
          />
        </Field>

        <Field label="hero intro" hint="kalimat pembuka sebelum 3 kata accent">
          <Input
            value={data.hero_intro}
            onChange={(v) => set('hero_intro', v)}
            maxLength={120}
          />
        </Field>

        <div className="mb-3 grid grid-cols-3 gap-3 max-sm:grid-cols-1">
          <Field label="accent 1">
            <Input
              value={data.hero_accent_1}
              onChange={(v) => set('hero_accent_1', v)}
              maxLength={40}
              accent
            />
          </Field>
          <Field label="accent 2">
            <Input
              value={data.hero_accent_2}
              onChange={(v) => set('hero_accent_2', v)}
              maxLength={40}
              accent
            />
          </Field>
          <Field label="accent 3">
            <Input
              value={data.hero_accent_3}
              onChange={(v) => set('hero_accent_3', v)}
              maxLength={40}
              accent
            />
          </Field>
        </div>

        <Field label="hero outro" hint="biasanya tanda baca, contoh: . atau !">
          <Input
            value={data.hero_outro}
            onChange={(v) => set('hero_outro', v)}
            maxLength={20}
          />
        </Field>

        <Field label="lead paragraph">
          <textarea
            value={data.lead}
            onChange={(e) => set('lead', e.target.value)}
            maxLength={600}
            rows={3}
            className="w-full resize-y rounded-lg border border-[var(--color-line)] bg-[var(--color-paper-2)] px-3 py-2 text-[14px] leading-[1.6] text-[var(--color-ink)] transition-colors focus:border-[var(--color-accent)]"
          />
          <Counter value={data.lead.length} max={600} />
        </Field>
      </fieldset>

      {/* Meta row */}
      <fieldset className="rounded-[12px] border border-[var(--color-line)] bg-[var(--color-paper)] p-4">
        <legend className="px-2 font-mono text-[11px] uppercase tracking-wide text-[var(--color-ink-3)]">
          // meta row (location · timezone · est)
        </legend>

        <div className="grid grid-cols-3 gap-3 max-sm:grid-cols-1">
          <Field label="location">
            <Input
              value={data.location}
              onChange={(v) => set('location', v)}
              maxLength={60}
            />
          </Field>
          <Field label="timezone">
            <Input
              value={data.timezone}
              onChange={(v) => set('timezone', v)}
              maxLength={20}
              mono
            />
          </Field>
          <Field label="est. year">
            <Input
              value={data.est_year}
              onChange={(v) => set('est_year', v)}
              maxLength={20}
              mono
            />
          </Field>
        </div>
      </fieldset>

      {/* Focus card */}
      <fieldset className="rounded-[12px] border border-[var(--color-line)] bg-[var(--color-paper)] p-4">
        <legend className="px-2 font-mono text-[11px] uppercase tracking-wide text-[var(--color-ink-3)]">
          // sedang fokus
        </legend>

        <Field label="focus title">
          <Input
            value={data.focus_title}
            onChange={(v) => set('focus_title', v)}
            maxLength={120}
          />
        </Field>

        <Field label="focus body">
          <textarea
            value={data.focus_body}
            onChange={(e) => set('focus_body', e.target.value)}
            maxLength={800}
            rows={3}
            className="w-full resize-y rounded-lg border border-[var(--color-line)] bg-[var(--color-paper-2)] px-3 py-2 text-[14px] leading-[1.6] text-[var(--color-ink)] transition-colors focus:border-[var(--color-accent)]"
          />
          <Counter value={data.focus_body.length} max={800} />
        </Field>
      </fieldset>

      <div className="flex items-center justify-between gap-3">
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

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-3 last:mb-0">
      <label className="mb-1 block font-mono text-[10.5px] uppercase tracking-wide text-[var(--color-ink-3)]">
        {label}
      </label>
      {children}
      {hint && (
        <p className="mt-1 font-mono text-[10.5px] text-[var(--color-ink-4)]">
          {hint}
        </p>
      )}
    </div>
  );
}

function Input({
  value,
  onChange,
  maxLength,
  mono = false,
  accent = false,
}: {
  value: string;
  onChange: (v: string) => void;
  maxLength?: number;
  mono?: boolean;
  accent?: boolean;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      maxLength={maxLength}
      className={`w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-paper-2)] px-3 py-2 text-[13.5px] transition-colors focus:border-[var(--color-accent)] ${
        mono ? 'font-mono' : ''
      } ${accent ? 'text-[var(--color-accent)]' : 'text-[var(--color-ink)]'}`}
    />
  );
}

function Counter({ value, max }: { value: number; max: number }) {
  return (
    <p className="mt-1 text-right font-mono text-[10.5px] text-[var(--color-ink-4)]">
      {value}/{max}
    </p>
  );
}
