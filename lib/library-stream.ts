import type { LibraryItem } from './library';
import { isLibraryKind, libraryForms } from './library-fields';
import type { StreamEntry } from './now-stream';

export type LibraryStreamEntry = StreamEntry & { source_library_item_id?: number | null };
export type StreamLibraryItem = Pick<LibraryItem, 'id' | 'name' | 'item_type' | 'details' | 'badge' | 'description' | 'subtitle'>;

function escapeMarkdown(value: string): string {
  return value.replace(/[\\`*_{}\[\]()<>#!|~]/g, '\\$&');
}
function inline(value: string): string { return escapeMarkdown(value.replace(/\s+/g, ' ').trim()); }
function excerpt(value: string): string {
  const text = value.trim();
  const characters = Array.from(text);
  return escapeMarkdown(characters.length > 500 ? characters.slice(0, 500).join('').trimEnd() + '…' : text);
}

export function buildLibraryStreamContent(item: StreamLibraryItem): string {
  const kind = isLibraryKind(item.item_type) ? item.item_type : 'general';
  const label = { book: 'buku', car: 'mobil', motorcycle: 'motor', note: 'catatan', drink: 'minuman', general: 'item' }[kind];
  const form = libraryForms[kind];
  const paragraphs = [`Menambahkan **${inline(item.name)}** ke koleksi ${label}.`];
  const lines: string[] = [];
  if (item.badge?.trim()) lines.push(`- **${kind === 'book' ? 'Status baca' : 'Status'}:** ${inline(item.badge)}`);
  for (const field of form.fields) {
    const value = item.details?.[field.key];
    if (typeof value === 'string' && value.trim()) lines.push(`- **${field.label}:** ${inline(value)}`);
  }
  if (lines.length) paragraphs.push(lines.join('\n'));
  if (item.subtitle?.trim() && !form.fields.some(field => item.details?.[field.key]?.trim())) paragraphs.push(`**Info tambahan:** ${inline(item.subtitle)}`);
  if (item.description?.trim()) paragraphs.push(`**${form.description}**\n\n${excerpt(item.description)}`);
  const notes = item.details?.notes;
  if (form.notes && typeof notes === 'string' && notes.trim()) paragraphs.push(`**${form.notes}**\n\n${excerpt(notes)}`);
  paragraphs.push(`[Lihat detail lengkap di library](/library#item-${item.id}).`);
  return paragraphs.join('\n\n');
}

export function isGeneratedLibraryEntry(entry: LibraryStreamEntry): boolean {
  if (!entry.source_library_item_id) return false;
  // Preserve handwritten entries and manual overrides in the Stream editor.
  const match = /^Baru menambahkan (?:buku|mobil|motor|catatan|minuman|item) ke koleksi library\.\s+\[Lihat detail di library\]\(\/library#item-(\d+)\)\.$/.exec(entry.content.trim());
  return Boolean(match && Number(match[1]) === entry.source_library_item_id);
}
