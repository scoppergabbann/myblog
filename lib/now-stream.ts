export const streamCategories = { maintenance: 'Maintenance', release: 'Release', life: 'Life' } as const;
export type StreamCategory = keyof typeof streamCategories;
export type StreamEntry = { id: number; title: string; category: StreamCategory; project: string; project_url: string; content: string; published_on: string; published: boolean };
export type StreamInput = Omit<StreamEntry, 'id'>;
export function safeStreamUrl(value: string): boolean {
  if (!value) return true;
  try { return ['https:', 'http:'].includes(new URL(value).protocol); } catch { return false; }
}
export function validateStream(input: StreamInput): string | null {
  if (!input.title.trim() || input.title.trim().length > 160) return 'Judul wajib diisi, maksimal 160 karakter.';
  if (!Object.prototype.hasOwnProperty.call(streamCategories, input.category)) return 'Kategori tidak valid.';
  if (!input.content.trim() || input.content.length > 20000) return 'Isi wajib diisi, maksimal 20.000 karakter.';
  if (input.project.length > 100) return 'Nama proyek maksimal 100 karakter.';
  if (input.project_url.length > 1000 || !safeStreamUrl(input.project_url)) return 'URL proyek harus berupa URL http atau https.';
  if (input.project_url && !input.project.trim()) return 'Isi nama proyek untuk URL tersebut.';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.published_on) || !Number.isFinite(Date.parse(input.published_on)) || new Date(input.published_on).toISOString().slice(0, 10) !== input.published_on) return 'Tanggal tidak valid.';
  if (typeof input.published !== 'boolean') return 'Status publikasi tidak valid.';
  return null;
}
