'use client';

import { useRef, useState, type ChangeEvent } from 'react';
import { createSupabaseBrowser } from '@/lib/supabase/browser';
import { prepareMonologAudioUpload } from './actions';

function readDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const audio = new Audio();
    const cleanup = () => URL.revokeObjectURL(objectUrl);
    audio.preload = 'metadata';
    audio.onloadedmetadata = () => {
      const duration = audio.duration;
      cleanup();
      if (Number.isFinite(duration) && duration > 0) resolve(Math.round(duration));
      else reject(new Error('Durasi audio tidak terbaca.'));
    };
    audio.onerror = () => {
      cleanup();
      reject(new Error('Metadata audio tidak dapat dibaca.'));
    };
    audio.src = objectUrl;
  });
}

export function MonologAudioUpload({
  initialUrl,
  initialPath,
  initialDuration,
}: {
  initialUrl: string;
  initialPath: string | null;
  initialDuration: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [audioUrl, setAudioUrl] = useState(initialUrl);
  const [audioPath, setAudioPath] = useState(initialPath ?? '');
  const [duration, setDuration] = useState(initialDuration);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  async function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    setNote(null);

    let detectedDuration = 0;
    try {
      detectedDuration = await readDuration(file);
    } catch {
      setNote('File terunggah, tetapi durasinya perlu diisi manual.');
    }

    const signed = await prepareMonologAudioUpload({
      name: file.name,
      type: file.type,
      size: file.size,
    });
    if (!signed.ok) {
      setError(signed.error);
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
      return;
    }

    const supabase = createSupabaseBrowser();
    const { error: uploadError } = await supabase.storage
      .from(signed.bucket)
      .uploadToSignedUrl(signed.path, signed.token, file, {
        contentType: 'audio/mp4',
        cacheControl: '31536000',
      });

    if (uploadError) setError(uploadError.message);
    else {
      setAudioUrl(signed.publicUrl);
      setAudioPath(signed.path);
      if (detectedDuration > 0) setDuration(detectedDuration);
      setNote(detectedDuration > 0
        ? `Upload selesai. Durasi terdeteksi ${formatDuration(detectedDuration)}.`
        : 'Upload selesai. Isi durasi audio secara manual.');
    }

    setUploading(false);
    if (inputRef.current) inputRef.current.value = '';
  }

  return (
    <div className="space-y-3 rounded-xl border border-[var(--color-line)] bg-[var(--color-paper-2)]/45 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-[var(--color-ink)]">Audio Voice Memos</p>
          <p className="mt-0.5 text-xs text-[var(--color-ink-3)]">File .m4a, maksimal 50 MB.</p>
        </div>
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="inline-flex min-h-10 items-center rounded-lg border border-[var(--color-line-2)] bg-[var(--color-paper)] px-3 py-2 text-xs text-[var(--color-ink-2)] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] disabled:cursor-wait disabled:opacity-50"
        >
          {uploading ? 'Mengunggah…' : audioUrl ? 'Ganti audio' : 'Upload .m4a'}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".m4a,audio/mp4,audio/x-m4a,audio/m4a"
          className="hidden"
          onChange={(event) => void onFileChange(event)}
        />
      </div>

      <div>
        <label htmlFor="monolog-audio-url" className="mb-1.5 block font-mono text-[11px] uppercase tracking-wide text-[var(--color-ink-3)]">
          URL audio
        </label>
        <input
          id="monolog-audio-url"
          name="audio_url"
          type="text"
          value={audioUrl}
          onChange={(event) => {
            setAudioUrl(event.currentTarget.value);
            setAudioPath('');
          }}
          placeholder="Upload file atau tempel URL HTTPS .m4a"
          className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2 font-mono text-xs text-[var(--color-ink)] transition-colors focus:border-[var(--color-accent)]"
        />
        <input type="hidden" name="audio_path" value={audioPath} />
      </div>

      <div className="max-w-[220px]">
        <label htmlFor="monolog-duration" className="mb-1.5 block font-mono text-[11px] uppercase tracking-wide text-[var(--color-ink-3)]">
          Durasi (detik)
        </label>
        <input
          id="monolog-duration"
          name="duration_seconds"
          type="number"
          min={0}
          max={86400}
          step={1}
          value={duration}
          onChange={(event) => setDuration(Number(event.currentTarget.value))}
          className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2 font-mono text-sm text-[var(--color-ink)] transition-colors focus:border-[var(--color-accent)]"
        />
      </div>

      {audioUrl && (
        <audio key={audioUrl} controls preload="metadata" src={audioUrl} className="w-full">
          Browser tidak mendukung pemutar audio.
        </audio>
      )}
      {note && <p role="status" className="text-xs text-emerald-700 dark:text-emerald-400">{note}</p>}
      {error && <p role="alert" className="text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}

function formatDuration(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}
