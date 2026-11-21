'use client';

import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import {
  MONOLOG_RECORDING_MIME_CANDIDATES,
  monologRecordingExtension,
  normalizeMonologAudioFile,
} from '@/lib/monolog-audio';
import { discardMonologAudio, prepareMonologAudioUpload } from './actions';

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

function uploadWithProgress(
  signedUrl: string,
  file: File,
  onProgress: (percent: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', signedUrl);
    xhr.setRequestHeader('x-upsert', 'false');
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (anonKey) {
      xhr.setRequestHeader('apikey', anonKey);
      xhr.setRequestHeader('Authorization', `Bearer ${anonKey}`);
    }
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
    };
    xhr.onerror = () => reject(new Error('Koneksi terputus saat mengunggah audio.'));
    xhr.onabort = () => reject(new Error('Upload audio dibatalkan.'));
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress(100);
        resolve();
        return;
      }
      try {
        const payload = JSON.parse(xhr.responseText) as { message?: string; error?: string };
        reject(new Error(payload.message ?? payload.error ?? `Upload gagal (${xhr.status}).`));
      } catch {
        reject(new Error(`Upload gagal (${xhr.status}).`));
      }
    };

    const body = new FormData();
    body.append('cacheControl', '31536000');
    body.append('', file);
    xhr.send(body);
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
  const recorderRef = useRef<MediaRecorder | null>(null);
  const recordingStreamRef = useRef<MediaStream | null>(null);
  const recordingChunksRef = useRef<Blob[]>([]);
  const recordingStartedAtRef = useRef(0);
  const recordingCancelledRef = useRef(false);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const initialPathRef = useRef(initialPath ?? '');
  const activePathRef = useRef(initialPath ?? '');
  const [audioUrl, setAudioUrl] = useState(initialUrl);
  const [audioPath, setAudioPath] = useState(initialPath ?? '');
  const [duration, setDuration] = useState(initialDuration);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [recording, setRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => () => {
    recordingCancelledRef.current = true;
    if (recorderRef.current?.state === 'recording') {
      recorderRef.current.ondataavailable = null;
      recorderRef.current.onerror = null;
      recorderRef.current.onstop = null;
      recorderRef.current.stop();
    }
    recordingStreamRef.current?.getTracks().forEach((track) => track.stop());
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    const path = activePathRef.current;
    if (path && path !== initialPathRef.current) void discardMonologAudio(path);
  }, []);

  function setCurrentAudioPath(path: string) {
    activePathRef.current = path;
    setAudioPath(path);
  }

  function discardPendingPath() {
    const path = activePathRef.current;
    if (path && path !== initialPathRef.current) void discardMonologAudio(path);
  }

  async function uploadAudioFile(file: File, knownDuration = 0) {
    setUploading(true);
    setUploadProgress(0);
    setError(null);
    setNote(null);

    let detectedDuration = knownDuration;
    if (detectedDuration <= 0) {
      try {
        detectedDuration = await readDuration(file);
      } catch {
        setNote('File terunggah, tetapi durasinya perlu diisi manual.');
      }
    }

    const signed = await prepareMonologAudioUpload({
      name: file.name,
      type: file.type,
      size: file.size,
    });
    if (!signed.ok) {
      setError(signed.error);
      setUploading(false);
      return;
    }

    try {
      await uploadWithProgress(signed.signedUrl, normalizeMonologAudioFile(file), setUploadProgress);
      const previousPath = activePathRef.current;
      if (previousPath && previousPath !== initialPathRef.current && previousPath !== signed.path) {
        void discardMonologAudio(previousPath);
      }
      setAudioUrl(signed.publicUrl);
      setCurrentAudioPath(signed.path);
      if (detectedDuration > 0) setDuration(detectedDuration);
      setNote(detectedDuration > 0
        ? `Upload selesai. Durasi terdeteksi ${formatDuration(detectedDuration)}.`
        : 'Upload selesai. Isi durasi audio secara manual.');
    } catch (uploadError) {
      void discardMonologAudio(signed.path);
      setError(uploadError instanceof Error ? uploadError.message : 'Upload audio gagal.');
    }

    setUploading(false);
  }

  async function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    if (!file) return;
    await uploadAudioFile(file);
    if (inputRef.current) inputRef.current.value = '';
  }

  function cleanupRecorder() {
    recordingStreamRef.current?.getTracks().forEach((track) => track.stop());
    recordingStreamRef.current = null;
    recorderRef.current = null;
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    recordingTimerRef.current = null;
    setRecording(false);
  }

  async function startRecording() {
    setError(null);
    setNote(null);
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setError('Browser ini belum mendukung perekaman audio langsung. Gunakan upload file sebagai alternatif.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      const mimeType = MONOLOG_RECORDING_MIME_CANDIDATES.find((candidate) => MediaRecorder.isTypeSupported(candidate));
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      recordingStreamRef.current = stream;
      recorderRef.current = recorder;
      recordingChunksRef.current = [];
      recordingCancelledRef.current = false;
      recordingStartedAtRef.current = Date.now();
      setRecordingSeconds(0);

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) recordingChunksRef.current.push(event.data);
      };
      recorder.onerror = () => {
        recordingCancelledRef.current = true;
        cleanupRecorder();
        setError('Perekaman terhenti karena browser mengalami masalah. Silakan coba lagi.');
      };
      recorder.onstop = () => {
        const cancelled = recordingCancelledRef.current;
        const seconds = Math.max(1, Math.round((Date.now() - recordingStartedAtRef.current) / 1000));
        const chunks = recordingChunksRef.current;
        const recorderType = (recorder.mimeType || mimeType || chunks[0]?.type || 'audio/webm').split(';')[0];
        const recordedType = recorderType === 'video/webm'
          ? 'audio/webm'
          : ['video/mp4', 'application/mp4'].includes(recorderType) ? 'audio/mp4' : recorderType;
        cleanupRecorder();
        if (cancelled) {
          setNote('Rekaman dibatalkan. Tidak ada audio yang disimpan.');
          return;
        }
        if (chunks.length === 0) {
          setError('Rekaman kosong. Periksa izin mikrofon lalu coba lagi.');
          return;
        }

        const extension = monologRecordingExtension(recordedType);
        const blob = new Blob(chunks, { type: recordedType });
        const stamp = new Date().toISOString().replace(/[:.]/g, '-');
        const file = new File([blob], `monolog-${stamp}.${extension}`, {
          type: recordedType,
          lastModified: Date.now(),
        });
        void uploadAudioFile(file, seconds);
      };

      recorder.start(1000);
      setRecording(true);
      setNote('Mikrofon aktif. Rekaman belum disimpan sampai kamu menekan “Selesai & gunakan”.');
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds(Math.floor((Date.now() - recordingStartedAtRef.current) / 1000));
      }, 250);
    } catch (recordingError) {
      cleanupRecorder();
      const permissionDenied = recordingError instanceof DOMException
        && ['NotAllowedError', 'PermissionDeniedError'].includes(recordingError.name);
      setError(permissionDenied
        ? 'Izin mikrofon ditolak. Izinkan mikrofon untuk situs ini lalu coba lagi.'
        : 'Mikrofon tidak dapat dibuka. Pastikan tidak sedang dipakai aplikasi lain.');
    }
  }

  function stopRecording(cancelled: boolean) {
    recordingCancelledRef.current = cancelled;
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== 'inactive') recorder.stop();
    else cleanupRecorder();
  }

  return (
    <div className="space-y-3 rounded-xl border border-[var(--color-line)] bg-[var(--color-paper-2)]/45 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-[var(--color-ink)]">Audio Monolog</p>
          <p className="mt-0.5 text-xs text-[var(--color-ink-3)]">Rekam langsung atau pilih file .m4a/.mp4, maksimal 50 MB.</p>
        </div>
        {!recording && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={uploading}
              onClick={() => void startRecording()}
              className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-[var(--color-ink)] px-3 py-2 text-[14px] font-medium text-[var(--color-paper)] transition-colors hover:bg-[var(--color-accent)] disabled:cursor-wait disabled:opacity-50"
            >
              <span aria-hidden="true" className="h-2 w-2 rounded-full bg-red-500" />
              Rekam di sini
            </button>
            <button
              type="button"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
              className="inline-flex min-h-10 items-center rounded-lg border border-[var(--color-line-2)] bg-[var(--color-paper)] px-3 py-2 text-[14px] text-[var(--color-ink-2)] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] disabled:cursor-wait disabled:opacity-50"
            >
              {uploading ? `Mengunggah ${uploadProgress}%` : audioUrl ? 'Ganti audio' : 'Pilih file'}
            </button>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept=".m4a,.mp4,.webm,.ogg,audio/mp4,audio/x-m4a,audio/m4a,video/mp4,application/mp4,audio/webm,audio/ogg"
          className="hidden"
          onChange={(event) => void onFileChange(event)}
        />
      </div>

      {recording && (
        <div role="status" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-500/25 bg-red-500/5 p-3">
          <div className="flex items-center gap-3">
            <span aria-hidden="true" className="h-3 w-3 animate-pulse rounded-full bg-red-500" />
            <div>
              <p className="text-[14px] font-medium text-[var(--color-ink)]">Sedang merekam</p>
              <p className="font-mono text-[13px] text-[var(--color-ink-3)]">{formatDuration(recordingSeconds)}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => stopRecording(true)} className="min-h-10 rounded-lg border border-[var(--color-line-2)] px-3 text-[14px] text-[var(--color-ink-3)] transition-colors hover:text-[var(--color-ink)]">
              Batalkan
            </button>
            <button type="button" onClick={() => stopRecording(false)} className="min-h-10 rounded-lg bg-red-600 px-3 text-[14px] font-medium text-white transition-colors hover:bg-red-700">
              Selesai &amp; gunakan
            </button>
          </div>
        </div>
      )}

      {uploading && (
        <div
          role="progressbar"
          aria-label="Progress upload audio"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={uploadProgress}
          className="h-1.5 overflow-hidden rounded-full bg-[var(--color-line)]"
        >
          <div
            className="h-full rounded-full bg-[var(--color-accent)] transition-[width] duration-150"
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
      )}

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
            discardPendingPath();
            setAudioUrl(event.currentTarget.value);
            setCurrentAudioPath('');
          }}
          placeholder="Rekam, upload file, atau tempel URL audio HTTPS"
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
