export const libraryKinds = { book: 'Buku', car: 'Mobil', motorcycle: 'Motor', note: 'Catatan', drink: 'Minuman', general: 'Koleksi lainnya' } as const;
export type LibraryKind = keyof typeof libraryKinds;
export type LibraryDetails = Record<string, string>;
export type DetailField = { key: string; label: string; placeholder?: string; type?: 'number' | 'date' | 'textarea'; min?: number; max?: number; options?: string[] };
export type LibraryForm = { name: string; placeholder: string; description: string; descriptionPlaceholder: string; notes?: string; fields: DetailField[]; statuses: string[]; reels: boolean };
const vehicleFields: DetailField[] = [
  { key: 'brand', label: 'Merek', placeholder: 'Honda, BMW, Toyota…' },
  { key: 'model', label: 'Model / varian', placeholder: 'Seri atau varian kendaraan' },
  { key: 'year', label: 'Tahun produksi', type: 'number', min: 1885, max: 2100 },
  { key: 'engine_cc', label: 'Kapasitas mesin (cc)', type: 'number', min: 1, max: 30000 },
  { key: 'transmission', label: 'Transmisi', options: ['Manual', 'Otomatis', 'CVT', 'Semi otomatis', 'Lainnya'] },
  { key: 'fuel', label: 'Tenaga / bahan bakar', options: ['Bensin', 'Diesel', 'Hybrid', 'Listrik', 'Lainnya'] },
  { key: 'color', label: 'Warna' },
];
export const libraryForms: Record<LibraryKind, LibraryForm> = {
  book: { name: 'Judul buku', placeholder: 'Norwegian Wood', description: 'Kesan setelah membaca', descriptionPlaceholder: 'Apa yang berkesan, apa yang kamu sukai, dan untuk siapa buku ini cocok?', notes: 'Catatan & kutipan buku', reels: false,
    statuses: ['Ingin dibaca', 'Sedang dibaca', 'Selesai dibaca', 'Berhenti membaca'], fields: [
      { key: 'author', label: 'Penulis', placeholder: 'Haruki Murakami' },
      { key: 'publisher', label: 'Penerbit', placeholder: 'Penerbit edisi yang kamu baca' },
      { key: 'published_year', label: 'Tahun terbit', type: 'number', min: 1, max: 2100 },
      { key: 'isbn', label: 'ISBN', placeholder: 'ISBN-10 atau ISBN-13' },
      { key: 'pages', label: 'Jumlah halaman', type: 'number', min: 1, max: 100000 },
      { key: 'language', label: 'Bahasa', placeholder: 'Indonesia' },
      { key: 'genre', label: 'Genre', placeholder: 'Novel, biografi, esai…' },
      { key: 'finished_on', label: 'Tanggal selesai dibaca', type: 'date' },
      { key: 'rating', label: 'Penilaian pribadi', options: ['1 / 5', '2 / 5', '3 / 5', '4 / 5', '5 / 5'] },
    ] },
  car: { name: 'Nama mobil', placeholder: 'BMW 325i E30', description: 'Kesan & pengalaman', descriptionPlaceholder: 'Ceritakan karakter mobil, pengalaman mengemudi, atau alasan kamu mengincarnya.', notes: 'Catatan perawatan / modifikasi', fields: vehicleFields, statuses: ['Wishlist', 'Impian', 'Pernah mengemudi', 'Pernah memiliki', 'Dimiliki sekarang'], reels: true },
  motorcycle: { name: 'Nama motor', placeholder: 'Honda Super Cub C70', description: 'Kesan & pengalaman berkendara', descriptionPlaceholder: 'Ceritakan rasa berkendara, karakter motor, atau alasan kamu menyukainya.', notes: 'Catatan perawatan / modifikasi', fields: vehicleFields, statuses: ['Wishlist', 'Impian', 'Pernah mengendarai', 'Pernah memiliki', 'Dimiliki sekarang'], reels: true },
  note: { name: 'Judul catatan', placeholder: 'Hal kecil yang ingin diingat', description: 'Isi catatan', descriptionPlaceholder: 'Tulis gagasan, pengamatan, atau cerita yang ingin kamu simpan.', statuses: [], reels: false, fields: [
    { key: 'topic', label: 'Topik', placeholder: 'Refleksi, ide, perjalanan…' },
    { key: 'written_on', label: 'Tanggal catatan', type: 'date' },
    { key: 'source', label: 'Sumber / referensi', placeholder: 'Buku, percakapan, atau pengalaman' },
  ] },
  drink: { name: 'Nama minuman', placeholder: 'Kopi tubruk', description: 'Kesan & rasa', descriptionPlaceholder: 'Aroma, rasa, tekstur, dan kapan paling enak dinikmati.', notes: 'Catatan penyajian', statuses: ['Favorit', 'Ingin dicoba', 'Sudah dicoba'], reels: true, fields: [
    { key: 'brand', label: 'Merek / kedai' }, { key: 'variety', label: 'Jenis minuman', placeholder: 'Kopi, teh, susu…' },
    { key: 'origin', label: 'Asal / daerah' }, { key: 'serving', label: 'Penyajian', options: ['Panas', 'Dingin', 'Suhu ruang'] },
  ] },
  general: { name: 'Nama koleksi', placeholder: 'Nama item koleksi', description: 'Cerita & kesan', descriptionPlaceholder: 'Apa yang menarik dari koleksi ini?', fields: [], statuses: [], reels: true },
};
export function isLibraryKind(value: unknown): value is LibraryKind {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(libraryKinds, value);
}
// Older categories get a sensible default; the explicit saved type wins after migration.
export function resolveLibraryKind(item?: { item_type?: string | null } | null, category?: { item_type?: string | null; name: string } | null): LibraryKind {
  if (isLibraryKind(item?.item_type)) return item.item_type;
  if (isLibraryKind(category?.item_type)) return category.item_type;
  const name = category?.name.toLowerCase() ?? '';
  if (/buku|books?|bacaan/.test(name)) return 'book';
  if (/motor|motorcycle/.test(name)) return 'motorcycle';
  if (/mobil|cars?\b/.test(name)) return 'car';
  if (/catatan|notes?\b/.test(name)) return 'note';
  if (/minuman|drinks?|kopi|coffee|teh/.test(name)) return 'drink';
  return 'general';
}
export function cleanLibraryDetails(kind: LibraryKind, raw: unknown): { details: LibraryDetails; error?: string } {
  const details: LibraryDetails = {};
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { details, error: 'Detail item tidak valid.' };
  const source = raw as Record<string, unknown>;
  const fields = [...libraryForms[kind].fields, ...(libraryForms[kind].notes ? [{ key: 'notes', label: libraryForms[kind].notes, type: 'textarea' as const }] : [])];
  for (const field of fields) {
    const value = source[field.key];
    if (value !== undefined && typeof value !== 'string') return { details, error: `${field.label} tidak valid.` };
    const text = typeof value === 'string' ? value.trim() : '';
    if (!text) continue;
    if (text.length > (field.type === 'textarea' ? 12000 : 300)) return { details, error: `${field.label} terlalu panjang.` };
    if (field.type === 'number' && (!/^\d+$/.test(text) || Number(text) < (field.min ?? 0) || Number(text) > (field.max ?? 100000))) return { details, error: `${field.label} harus antara ${field.min ?? 0} dan ${field.max ?? 100000}.` };
    if (field.type === 'date' && (!/^\d{4}-\d{2}-\d{2}$/.test(text) || !Number.isFinite(Date.parse(text)) || new Date(text).toISOString().slice(0, 10) !== text)) return { details, error: `${field.label} tidak valid.` };
    if (field.options && !field.options.includes(text)) return { details, error: `${field.label} tidak valid.` };
    if (field.key === 'isbn' && !/^(?:\d{9}[\dXx]|\d{13})$/.test(text.replace(/[\s-]/g, ''))) return { details, error: 'ISBN harus berisi 10 atau 13 digit (boleh memakai tanda hubung).' };
    details[field.key] = text;
  }
  return { details };
}
export function librarySubtitle(kind: LibraryKind, details: LibraryDetails): string | null {
  const keys = kind === 'book' ? ['author', 'published_year'] : kind === 'car' || kind === 'motorcycle' ? ['brand', 'model', 'year'] : kind === 'note' ? ['topic', 'written_on'] : kind === 'drink' ? ['brand', 'variety'] : [];
  return keys.map(key => details[key]).filter(Boolean).join(' · ') || null;
}

export function getLibraryItemSubtitle(item: { subtitle: string | null; item_type?: string | null; details?: LibraryDetails }): string | null {
  return item.subtitle || (isLibraryKind(item.item_type) ? librarySubtitle(item.item_type, item.details ?? {}) : null);
}
