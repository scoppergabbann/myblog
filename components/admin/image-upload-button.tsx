'use client';

import { useRef, useState, type ChangeEvent } from 'react';
import { uploadImage } from '@/lib/storage';

type Props = {
  onUploaded: (url: string, path: string) => void;
  label?: string;
};

export function ImageUploadButton({ onUploaded, label = 'Upload image' }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    const fd = new FormData();
    fd.append('file', file);

    const result = await uploadImage(fd);
    setUploading(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    onUploaded(result.url, result.path);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
        className="inline-flex items-center gap-1.5 self-start rounded-md border border-[var(--color-line)] px-2.5 py-1 font-mono text-[12px] text-[var(--color-ink-3)] transition-all hover:border-[color-mix(in_srgb,var(--color-accent)_30%,transparent)] hover:text-[var(--color-accent)] disabled:cursor-wait disabled:opacity-60"
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        {uploading ? 'Uploading...' : label}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onChange}
      />
      {error && (
        <span className="text-[11.5px] text-red-600 dark:text-red-400">
          {error}
        </span>
      )}
    </div>
  );
}
