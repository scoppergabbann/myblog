'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/admin/toast';
import { slugifyMonologCategory } from '@/lib/monolog-shared';
import type { MonologCategory } from '@/types/monolog';
import {
  createMonologCategory,
  deleteMonologCategory,
  updateMonologCategory,
} from './category-actions';

export function CategoryManager({
  categories,
  usage,
  migrationReady,
}: {
  categories: MonologCategory[];
  usage: Record<string, number>;
  migrationReady: boolean;
}) {
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [busy, startTransition] = useTransition();
  const router = useRouter();
  const toast = useToast();

  function remove(category: MonologCategory) {
    if ((usage[category.slug] ?? 0) > 0) {
      toast.error(`Kategori masih dipakai oleh ${usage[category.slug]} episode.`);
      return;
    }
    if (!confirm(`Hapus kategori “${category.label}”?`)) return;
    startTransition(async () => {
      const result = await deleteMonologCategory(category.id);
      if (result.ok) {
        toast.success('Kategori dihapus.');
        router.refresh();
      } else toast.error(result.error);
    });
  }

  return (
    <section className="mt-12 border-t border-[var(--color-line)] pt-8" aria-labelledby="monolog-categories-title">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="monolog-categories-title" className="text-[22px] font-medium tracking-[-0.025em] text-[var(--color-ink)]">Kategori Monolog</h2>
          <p className="mt-1 text-[14px] text-[var(--color-ink-3)]">Atur nama, slug, dan urutan rak di perpustakaan audio.</p>
        </div>
        {migrationReady && !creating && (
          <button type="button" disabled={busy} onClick={() => { setCreating(true); setEditingId(null); }} className="min-h-10 rounded-lg bg-[var(--color-ink)] px-4 text-[14px] font-medium text-[var(--color-paper)] transition-colors hover:bg-[var(--color-accent)] disabled:opacity-50">
            Tambah kategori
          </button>
        )}
      </div>

      {!migrationReady ? (
        <div className="rounded-xl border border-[color-mix(in_srgb,var(--color-accent)_35%,transparent)] bg-[var(--color-accent-soft)] p-5">
          <p className="font-medium text-[var(--color-ink)]">Aktifkan kategori dinamis</p>
          <p className="mt-2 text-[14px] leading-relaxed text-[var(--color-ink-3)]">
            Jalankan <code className="font-mono text-[var(--color-accent)]">supabase/migrations/021_monolog_categories.sql</code> melalui SQL Editor Supabase satu kali.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-[var(--color-line)]">
          {creating && (
            <CategoryForm
              mode="create"
              busy={busy}
              initial={{ id: 0, label: '', slug: '', sortOrder: 0 }}
              onCancel={() => setCreating(false)}
              onSaved={() => { setCreating(false); router.refresh(); }}
            />
          )}
          {categories.map((category) => editingId === category.id ? (
            <CategoryForm
              key={category.id}
              mode="edit"
              busy={busy}
              initial={category}
              onCancel={() => setEditingId(null)}
              onSaved={() => { setEditingId(null); router.refresh(); }}
            />
          ) : (
            <div key={category.id} className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--color-line)] px-4 py-3 last:border-b-0">
              <div className="min-w-0">
                <p className="text-[15px] font-medium text-[var(--color-ink)]">{category.label}</p>
                <p className="mt-1 font-mono text-[12px] text-[var(--color-ink-4)]">{category.slug} · urutan {category.sortOrder} · {usage[category.slug] ?? 0} episode</p>
              </div>
              <div className="flex gap-2">
                <button type="button" disabled={busy} onClick={() => { setEditingId(category.id); setCreating(false); }} className={secondaryButton}>Edit</button>
                <button type="button" disabled={busy || (usage[category.slug] ?? 0) > 0} title={(usage[category.slug] ?? 0) > 0 ? 'Pindahkan episode ke kategori lain sebelum menghapus.' : undefined} onClick={() => remove(category)} className={`${secondaryButton} text-red-600 disabled:text-[var(--color-ink-4)] dark:text-red-400`}>Hapus</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function CategoryForm({
  mode,
  initial,
  busy,
  onCancel,
  onSaved,
}: {
  mode: 'create' | 'edit';
  initial: MonologCategory;
  busy: boolean;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [label, setLabel] = useState(initial.label);
  const [slug, setSlug] = useState(initial.slug);
  const [slugManual, setSlugManual] = useState(mode === 'edit');
  const [sortOrder, setSortOrder] = useState(initial.sortOrder);
  const [saving, startTransition] = useTransition();
  const toast = useToast();

  function save() {
    if (saving) return;
    startTransition(async () => {
      const input = { label, slug, sortOrder };
      const result = mode === 'create'
        ? await createMonologCategory(input)
        : await updateMonologCategory(initial.id, input);
      if (result.ok) {
        toast.success(mode === 'create' ? 'Kategori ditambahkan.' : 'Kategori diperbarui.');
        onSaved();
      } else toast.error(result.error);
    });
  }

  return (
    <div className="grid gap-3 border-b border-[var(--color-line)] bg-[var(--color-paper-2)] p-4 md:grid-cols-[1.2fr_1fr_120px_auto] md:items-end">
      <label className="text-[13px] text-[var(--color-ink-3)]">Nama
        <input value={label} maxLength={60} onChange={(event) => { const value = event.currentTarget.value; setLabel(value); if (!slugManual) setSlug(slugifyMonologCategory(value)); }} className={inputClass} autoFocus />
      </label>
      <label className="text-[13px] text-[var(--color-ink-3)]">Slug
        <input
          value={slug}
          maxLength={50}
          pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
          readOnly={mode === 'create' && !slugManual}
          onChange={(event) => { setSlug(event.currentTarget.value); setSlugManual(true); }}
          className={`${inputClass} font-mono ${mode === 'create' && !slugManual ? 'cursor-default bg-[var(--color-paper-2)]' : ''}`}
        />
        {mode === 'create' && (
          <button
            type="button"
            onClick={() => {
              if (slugManual) setSlug(slugifyMonologCategory(label));
              setSlugManual((current) => !current);
            }}
            className="mt-1 text-[11px] font-medium text-[var(--color-accent)] hover:text-[var(--color-ink)]"
          >
            {slugManual ? 'Pakai otomatis' : 'Ubah manual'}
          </button>
        )}
      </label>
      <label className="text-[13px] text-[var(--color-ink-3)]">Urutan
        <input type="number" min={0} max={10000} value={sortOrder} onChange={(event) => setSortOrder(Number(event.currentTarget.value))} className={inputClass} />
      </label>
      <div className="flex gap-2">
        <button type="button" disabled={busy || saving || !label.trim() || !slug.trim()} onClick={save} className="min-h-10 rounded-lg bg-[var(--color-ink)] px-3 text-[14px] font-medium text-[var(--color-paper)] transition-colors hover:bg-[var(--color-accent)] disabled:opacity-40">{saving ? 'Menyimpan…' : 'Simpan'}</button>
        <button type="button" disabled={busy || saving} onClick={onCancel} className={secondaryButton}>Batal</button>
      </div>
    </div>
  );
}

const inputClass = 'mt-1.5 min-h-10 w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] px-3 text-[14px] text-[var(--color-ink)] focus:border-[var(--color-accent)]';
const secondaryButton = 'min-h-10 rounded-lg border border-[var(--color-line)] px-3 text-[14px] text-[var(--color-ink-3)] transition-colors hover:border-[var(--color-line-2)] hover:text-[var(--color-ink)] disabled:cursor-not-allowed disabled:opacity-40';
