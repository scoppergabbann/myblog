const supportedExtensions = ['.m4a', '.mp4', '.webm', '.ogg'] as const;
const supportedMimeTypes = new Set([
  '',
  'audio/mp4',
  'audio/x-m4a',
  'audio/m4a',
  'video/mp4',
  'application/mp4',
  'audio/webm',
  'audio/ogg',
]);

export const MONOLOG_AUDIO_STORAGE_MIME_TYPES = [
  'audio/mp4',
  'audio/x-m4a',
  'audio/m4a',
  'video/mp4',
  'application/mp4',
  'audio/webm',
  'audio/ogg',
];

export const MONOLOG_RECORDING_MIME_CANDIDATES = [
  'audio/mp4;codecs=mp4a.40.2',
  'audio/mp4',
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/ogg;codecs=opus',
  'audio/ogg',
];

export function monologAudioExtension(name: string): (typeof supportedExtensions)[number] | null {
  const normalized = name.trim().toLowerCase();
  return supportedExtensions.find((extension) => normalized.endsWith(extension)) ?? null;
}

export function monologAudioMimeValid(type: string): boolean {
  return supportedMimeTypes.has(type.trim().toLowerCase().split(';')[0]);
}

export function monologAudioUrlValid(value: string): boolean {
  if (!value) return true;
  if (/^\/audio\/monolog\/[A-Za-z0-9._-]+\.(?:m4a|mp4|webm|ogg)(?:\?.*)?$/.test(value)) return true;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && /\.(?:m4a|mp4|webm|ogg)$/.test(url.pathname.toLowerCase());
  } catch {
    return false;
  }
}

export function normalizeMonologAudioFile(file: File): File {
  const extension = monologAudioExtension(file.name);
  const mime = file.type.trim().toLowerCase().split(';')[0];
  if (extension === '.m4a' && mime === 'audio/mp4') return file;
  if (extension === '.webm' && mime === 'audio/webm') return file;
  if (extension === '.ogg' && mime === 'audio/ogg') return file;

  const baseName = file.name.replace(/\.(?:m4a|mp4|webm|ogg)$/i, '');
  return new File([file], `${baseName}.m4a`, {
    type: 'audio/mp4',
    lastModified: file.lastModified,
  });
}

export function monologRecordingExtension(type: string): 'm4a' | 'webm' | 'ogg' {
  const mime = type.trim().toLowerCase().split(';')[0];
  if (mime === 'audio/ogg') return 'ogg';
  if (['audio/mp4', 'video/mp4', 'application/mp4'].includes(mime)) return 'm4a';
  return 'webm';
}
