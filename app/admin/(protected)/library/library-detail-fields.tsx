'use client';
import { libraryForms, type LibraryKind, type LibraryDetails } from '@/lib/library-fields';

export function LibraryDetailFields({ kind, details, onChange }: {
  kind: LibraryKind; details: LibraryDetails; onChange: (details: LibraryDetails) => void;
}) {
  const form = libraryForms[kind];
  return <>
    {form.fields.length > 0 && <section className="rounded-xl border border-[var(--color-line)] bg-[var(--color-paper-2)]/40 p-4">
      <h3 className="mb-1 text-sm font-medium text-[var(--color-ink)]">{kind === 'book' ? 'Identitas buku' : kind === 'car' || kind === 'motorcycle' ? 'Identitas & spesifikasi' : kind === 'note' ? 'Konteks catatan' : 'Tentang minuman'}</h3>
      <p className="mb-4 text-xs text-[var(--color-ink-3)]">Semua detail di bagian ini opsional. Yang kosong tidak ditampilkan di library publik.</p>
      <div className="grid gap-4 sm:grid-cols-2">
        {form.fields.map(field => <label key={field.key} className="block text-xs text-[var(--color-ink-3)]">
          <span className="mb-1.5 block">{field.label}</span>
          {field.options ? <select className="input-base" value={details[field.key] ?? ''} onChange={e => onChange({ ...details, [field.key]: e.target.value })}>
            <option value="">Belum diisi</option>{field.options.map(option => <option key={option} value={option}>{option}</option>)}
          </select> : <input className="input-base" type={field.type ?? 'text'} min={field.min} max={field.max} maxLength={300} placeholder={field.placeholder} value={details[field.key] ?? ''} onChange={e => onChange({ ...details, [field.key]: e.target.value })} />}
        </label>)}
      </div>
    </section>}
  </>;
}
