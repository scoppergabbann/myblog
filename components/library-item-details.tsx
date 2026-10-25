import { libraryForms, isLibraryKind } from '@/lib/library-fields';
import type { LibraryItem } from '@/lib/library';

export function LibraryItemDetails({ item }: { item: LibraryItem }) {
  if (!isLibraryKind(item.item_type) || !item.details) return null;
  const form = libraryForms[item.item_type];
  const fields = form.fields.filter(field => item.details?.[field.key]?.trim());
  if (!fields.length) return null;
  return <dl className="mb-5 grid shrink-0 grid-cols-2 gap-x-5 gap-y-3 rounded-xl border border-[var(--color-line)] bg-[var(--color-paper-2)]/50 p-4 max-sm:grid-cols-1">
    {fields.map(field => <div key={field.key} className="min-w-0">
      <dt className="mb-1 text-[11px] text-[var(--color-ink-3)]">{field.label}</dt>
      <dd className="break-words text-[13px] text-[var(--color-ink)]">{item.details?.[field.key]}</dd>
    </div>)}
  </dl>;
}
export function LibraryItemNotes({ item }: { item: LibraryItem }) {
  if (!isLibraryKind(item.item_type) || !item.details?.notes?.trim()) return null;
  const label = libraryForms[item.item_type].notes;
  if (!label) return null;
  return <section className="mb-5 shrink-0 border-t border-[var(--color-line)] pt-4">
    <h3 className="mb-2 text-sm font-medium">{label}</h3>
    <p className="whitespace-pre-wrap break-words text-[14px] leading-[1.75] text-[var(--color-ink-2)]">{item.details.notes}</p>
  </section>;
}
