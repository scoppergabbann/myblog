const supportedExtensions = ['.m4a', '.mp4'] as const;
const supportedMimeTypes = new Set([
  '',
  'audio/mp4',
  'audio/x-m4a',
  'audio/m4a',
  'video/mp4',
  'application/mp4',
]);

export function monologAudioExtension(name: string): (typeof supportedExtensions)[number] | null {
  const normalized = name.trim().toLowerCase();
  return supportedExtensions.find((extension) => normalized.endsWith(extension)) ?? null;
}

export function monologAudioMimeValid(type: string): boolean {
  return supportedMimeTypes.has(type.trim().toLowerCase());
}

export function monologAudioUrlValid(value: string): boolean {
  if (!value) return true;
  if (/^\/audio\/monolog\/[A-Za-z0-9._-]+\.(?:m4a|mp4)(?:\?.*)?$/.test(value)) return true;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && /\.(?:m4a|mp4)$/.test(url.pathname.toLowerCase());
  } catch {
    return false;
  }
}

export function normalizeMonologAudioFile(file: File): File {
  const extension = monologAudioExtension(file.name);
  const mime = file.type.trim().toLowerCase();
  if (extension === '.m4a' && mime === 'audio/mp4') return file;

  const baseName = file.name.replace(/\.(?:m4a|mp4)$/i, '');
  return new File([file], `${baseName}.m4a`, {
    type: 'audio/mp4',
    lastModified: file.lastModified,
  });
}
