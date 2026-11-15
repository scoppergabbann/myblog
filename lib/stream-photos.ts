export const MAX_STREAM_PHOTOS = 3;
export const MAX_STREAM_PHOTO_BYTES = 3 * 1024 * 1024;
export const STREAM_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export type StreamPhoto = { url: string; alt: string };

export function safeStreamPhotoUrl(value: unknown): value is string {
  if (typeof value !== 'string' || !value || value.length > 2048) return false;
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password;
  } catch { return false; }
}

export function validateStreamPhotos(value: unknown): string | null {
  // Omitted photos preserve attachments when an older editor updates a note.
  if (value === undefined) return null;
  if (!Array.isArray(value) || value.length > MAX_STREAM_PHOTOS) return 'Maksimal 3 foto per aktivitas.';
  for (const photo of value) {
    if (!photo || typeof photo !== 'object' || !safeStreamPhotoUrl(photo.url)
      || typeof photo.alt !== 'string' || photo.alt.length > 300) {
      return 'Foto tidak valid. Keterangan foto maksimal 300 karakter.';
    }
  }
  if (new Set(value.map(photo => photo.url)).size !== value.length) return 'Foto yang sama tidak boleh dilampirkan dua kali.';
  return null;
}

export function validateStreamPhotoFile(file: { type: string; size: number }): string | null {
  if (!(STREAM_PHOTO_TYPES as readonly string[]).includes(file.type)) return 'Gunakan foto JPG, PNG, atau WebP.';
  if (file.size <= 0) return 'File foto kosong.';
  if (file.size > MAX_STREAM_PHOTO_BYTES) return 'Ukuran setiap foto maksimal 3 MB.';
  return null;
}

export function streamPhotoMatchesType(bytes: Uint8Array, type: string): boolean {
  if (type === 'image/jpeg') return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (type === 'image/png') return [137, 80, 78, 71, 13, 10, 26, 10].every((byte, index) => bytes[index] === byte);
  if (type === 'image/webp') return String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP';
  return false;
}

export function streamPhotoFeedContent(content: string, photos: StreamPhoto[] = []): string | undefined {
  const visible = photos.filter(photo => safeStreamPhotoUrl(photo.url)).slice(0, MAX_STREAM_PHOTOS);
  if (!visible.length) return undefined;
  const escape = (text: string) => text.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]!);
  return `<p>${escape(content).replace(/\n/g, '<br/>')}</p>` + visible.map((photo, index) =>
    `<p><img src="${escape(photo.url)}" alt="${escape(photo.alt || `Dokumentasi ${index + 1}`)}"/>${photo.alt ? `<br/>${escape(photo.alt)}` : ''}</p>`).join('');
}
