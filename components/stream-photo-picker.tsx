'use client';
import { startTransition, useId, useRef, useState, type ChangeEvent } from 'react';
import { uploadStreamPhoto } from '@/lib/stream-photo-upload';
import { MAX_STREAM_PHOTOS, STREAM_PHOTO_TYPES, validateStreamPhotoFile, type StreamPhoto } from '@/lib/stream-photos';

type Props = {
  photos: StreamPhoto[];
  onChange: (photos: StreamPhoto[]) => void;
  onBusyChange: (busy: boolean) => void;
  disabled?: boolean;
};

export function StreamPhotoPicker({ photos, onChange, onBusyChange, disabled = false }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const inFlight = useRef(false);
  const helpId = useId();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState('');

  function select(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';
    if (!files.length || disabled || inFlight.current) return;
    setError('');
    if (photos.length + files.length > MAX_STREAM_PHOTOS) {
      setError(`Maksimal 3 foto. Kamu masih bisa menambahkan ${MAX_STREAM_PHOTOS - photos.length} foto.`);
      return;
    }
    for (const file of files) {
      const issue = validateStreamPhotoFile(file);
      if (issue) { setError(`${file.name}: ${issue}`); return; }
    }
    inFlight.current = true;
    setUploading(true); onBusyChange(true);
    startTransition(() => { void upload(files); });
  }

  async function upload(files: File[]) {
    const next = [...photos];
    try {
      for (const [index, file] of files.entries()) {
        setProgress(`Mengunggah foto ${index + 1} dari ${files.length}...`);
        const data = new FormData();
        data.set('file', file);
        const result = await uploadStreamPhoto(data);
        if (!result.ok) { setError(`${file.name}: ${result.error}`); return; }
        next.push({ url: result.url, alt: '' });
        // Keep successful uploads if a later file fails; retry only missing files.
        onChange([...next]);
      }
    } catch {
      setError('Unggah foto gagal. Foto yang sudah berhasil tetap ada. Coba pilih kembali foto yang belum terunggah.');
    } finally {
      inFlight.current = false;
      setUploading(false); onBusyChange(false); setProgress('');
    }
  }

  return <fieldset disabled={disabled || uploading} className="space-y-3">
    <legend className="mb-2 flex w-full items-center justify-between gap-3 text-sm font-medium">
      <span>Foto dokumentasi <span className="font-normal text-[var(--color-ink-3)]">(opsional)</span></span>
      <span className="text-xs font-normal text-[var(--color-ink-3)]">{photos.length}/{MAX_STREAM_PHOTOS}</span>
    </legend>
    {photos.length > 0 && <ol className="grid list-none grid-cols-1 gap-3 sm:grid-cols-3">
      {photos.map((photo, index) => <li key={photo.url} className="min-w-0 rounded-xl border border-[var(--color-line)] p-2">
        <div className="relative">
          <img src={photo.url} alt={photo.alt || `Pratinjau foto ${index + 1}`} className="aspect-[4/3] w-full rounded-lg object-cover" />
          <button type="button" aria-label={`Hapus foto ${index + 1}`} onClick={() => { setError(''); onChange(photos.filter((_, i) => i !== index)); }}
            className="absolute right-1 top-1 flex h-8 w-8 items-center justify-center rounded-full bg-black/70 text-lg text-white hover:bg-black disabled:opacity-50">×</button>
        </div>
        <label className="mt-2 block text-xs text-[var(--color-ink-3)]">Keterangan foto {index + 1}
          <input maxLength={300} value={photo.alt} placeholder="Opsional" className="input-base mt-1 !px-2 !py-1.5 !text-xs"
            onChange={event => onChange(photos.map((item, i) => i === index ? { ...item, alt: event.target.value } : item))} />
        </label>
      </li>)}
    </ol>}
    <input ref={input} type="file" multiple accept={STREAM_PHOTO_TYPES.join(',')} onChange={select} className="hidden" aria-label="Pilih foto dokumentasi" />
    <button type="button" disabled={photos.length >= MAX_STREAM_PHOTOS} onClick={() => input.current?.click()} aria-describedby={helpId}
      className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--color-line-2)] px-4 py-3 text-sm text-[var(--color-ink-3)] hover:bg-[var(--color-paper-2)] disabled:cursor-not-allowed disabled:opacity-50">
      <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="3" y="3" width="18" height="18" rx="3" /><circle cx="8" cy="8" r="1.5" /><path d="m3 17 6-6 4 4 3-3 5 5" /></svg>
      {uploading ? 'Mengunggah...' : photos.length >= MAX_STREAM_PHOTOS ? 'Maksimal 3 foto terpilih' : 'Tambah foto'}
    </button>
    <p id={helpId} className="text-xs text-[var(--color-ink-3)]">JPG, PNG, atau WebP · maksimal 3 MB per foto. Hapus foto untuk menggantinya.</p>
    {progress && <p role="status" className="text-xs text-[var(--color-accent)]">{progress}</p>}
    {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
  </fieldset>;
}
