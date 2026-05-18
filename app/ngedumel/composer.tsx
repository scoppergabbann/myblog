'use client';

import { useState, useTransition, useRef, useEffect } from 'react';
import { Avatar } from './avatar';
import { createDumel, uploadDumelImage } from './actions';
import { resizeImage } from './image-resize';

const MAX = 2000;
const MAX_IMAGES = 4;

type PendingImage = {
  /** Local preview URL (object URL) */
  previewUrl: string;
  /** Uploaded result, populated after upload finishes */
  uploaded?: { url: string; storagePath: string; width: number; height: number };
  /** Set while upload in flight */
  uploading: boolean;
  /** Error message if upload failed */
  error?: string;
};

export function DumelComposer({
  avatarUrl,
  displayName,
  login,
}: {
  avatarUrl?: string;
  displayName: string;
  login: string;
}) {
  const [content, setContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [images, setImages] = useState<PendingImage[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isPending, startTransition] = useTransition();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);

  // Auto-resize textarea as user types
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 320)}px`;
  }, [content]);

  // Clean up object URLs when component unmounts or images change
  useEffect(() => {
    return () => {
      images.forEach((img) => URL.revokeObjectURL(img.previewUrl));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const trimmed = content.trim();
  const allUploaded = images.every((img) => img.uploaded);
  const anyUploading = images.some((img) => img.uploading);
  const canPost =
    (trimmed.length > 0 || images.length > 0) &&
    trimmed.length <= MAX &&
    !isPending &&
    !anyUploading &&
    allUploaded;

  const onSubmit = () => {
    if (!canPost) return;
    setError(null);
    const imageInputs = images
      .filter((img) => img.uploaded)
      .map((img) => ({
        url: img.uploaded!.url,
        storagePath: img.uploaded!.storagePath,
        width: img.uploaded!.width,
        height: img.uploaded!.height,
      }));

    startTransition(async () => {
      const result = await createDumel(content, imageInputs);
      if (result.ok) {
        // Revoke local previews
        images.forEach((img) => URL.revokeObjectURL(img.previewUrl));
        setContent('');
        setImages([]);
      } else {
        setError(result.error);
      }
    });
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      onSubmit();
    }
  };

  const handleFiles = async (files: FileList | File[]) => {
    const fileList = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (fileList.length === 0) return;

    const remaining = MAX_IMAGES - images.length;
    if (remaining <= 0) {
      setError(`Max ${MAX_IMAGES} foto per dumel.`);
      return;
    }
    const toUpload = fileList.slice(0, remaining);
    if (fileList.length > remaining) {
      setError(`Hanya ${remaining} foto lagi yang bisa di-upload.`);
    }

    // Add placeholders immediately with object URL previews
    const newImages: PendingImage[] = toUpload.map((file) => ({
      previewUrl: URL.createObjectURL(file),
      uploading: true,
    }));
    setImages((prev) => [...prev, ...newImages]);
    const startIdx = images.length;

    // Upload each one
    for (let i = 0; i < toUpload.length; i++) {
      const file = toUpload[i];
      const slotIdx = startIdx + i;
      try {
        // Client-side resize first
        const { file: resized, width, height } = await resizeImage(file);
        const fd = new FormData();
        fd.append('file', resized);
        const result = await uploadDumelImage(fd);
        if (result.ok) {
          setImages((prev) => {
            const next = [...prev];
            if (next[slotIdx]) {
              next[slotIdx] = {
                ...next[slotIdx],
                uploading: false,
                uploaded: {
                  url: result.url,
                  storagePath: result.storagePath,
                  width,
                  height,
                },
              };
            }
            return next;
          });
        } else {
          setImages((prev) => {
            const next = [...prev];
            if (next[slotIdx]) {
              next[slotIdx] = {
                ...next[slotIdx],
                uploading: false,
                error: result.error,
              };
            }
            return next;
          });
        }
      } catch (err) {
        setImages((prev) => {
          const next = [...prev];
          if (next[slotIdx]) {
            next[slotIdx] = {
              ...next[slotIdx],
              uploading: false,
              error: err instanceof Error ? err.message : 'Upload gagal',
            };
          }
          return next;
        });
      }
    }
  };

  const removeImage = (idx: number) => {
    setImages((prev) => {
      const target = prev[idx];
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((_, i) => i !== idx);
    });
  };

  // Drag-and-drop handlers
  const onDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;
    if (e.dataTransfer.types.includes('Files')) {
      setIsDragOver(true);
    }
  };
  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setIsDragOver(false);
    }
  };
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current = 0;
    setIsDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  // Paste handler — useful for screenshots
  const onPaste = (e: React.ClipboardEvent) => {
    if (!e.clipboardData?.files || e.clipboardData.files.length === 0) return;
    const imageFiles = Array.from(e.clipboardData.files).filter((f) =>
      f.type.startsWith('image/')
    );
    if (imageFiles.length > 0) {
      e.preventDefault();
      handleFiles(imageFiles);
    }
  };

  return (
    <div
      className={`relative mb-6 rounded-[14px] border bg-[var(--color-paper)] p-3 transition-colors sm:mb-7 sm:p-4 ${
        isDragOver
          ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)]'
          : 'border-[var(--color-line)]'
      }`}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      {/* Drag-over overlay */}
      {isDragOver && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-[14px] bg-[var(--color-accent-soft)]">
          <p className="font-mono text-sm font-medium text-[var(--color-accent)]">
            lepaskan foto di sini
          </p>
        </div>
      )}

      <div className="flex gap-2.5 sm:gap-3">
        <Avatar src={avatarUrl} login={login} name={displayName} size={36} />
        <div className="min-w-0 flex-1">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={onKeyDown}
            onPaste={onPaste}
            placeholder="Lagi mikir apa?"
            rows={2}
            maxLength={MAX}
            className="w-full resize-none overflow-hidden border-none bg-transparent text-[15px] leading-[1.55] text-[var(--color-ink)] placeholder:text-[var(--color-ink-4)] focus:outline-none"
          />

          {/* Image previews */}
          {images.length > 0 && (
            <div className="mt-2 grid grid-cols-4 gap-2">
              {images.map((img, idx) => (
                <ImagePreview key={idx} image={img} onRemove={() => removeImage(idx)} />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-t border-[var(--color-line)] pt-3">
        <div className="flex min-w-0 items-center gap-3 text-[11.5px]">
          {/* Image upload button */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files) handleFiles(e.target.files);
              e.target.value = ''; // reset so same file can be selected twice
            }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={images.length >= MAX_IMAGES}
            aria-label="Tambah foto"
            title={
              images.length >= MAX_IMAGES
                ? `Max ${MAX_IMAGES} foto`
                : 'Tambah foto'
            }
            className="inline-flex h-7 w-7 items-center justify-center rounded-full text-[var(--color-ink-3)] transition-colors hover:bg-[var(--color-paper-2)] hover:text-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-30"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </button>

          {error ? (
            <span className="text-red-600 dark:text-red-400">{error}</span>
          ) : (
            <span className="font-mono text-[var(--color-ink-4)]">
              {trimmed.length > 0 && `${trimmed.length}/${MAX} · `}
              {images.length > 0 && `${images.length}/${MAX_IMAGES} foto · `}
              <span className="hidden sm:inline">⌘+Enter untuk post</span>
              <span className="sm:hidden">tap untuk post</span>
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onSubmit}
          disabled={!canPost}
          className="flex-shrink-0 rounded-full bg-[var(--color-ink)] px-4 py-1.5 text-[12.5px] font-medium tracking-tight text-[var(--color-paper)] transition-all hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-30"
        >
          {isPending
            ? 'Posting...'
            : anyUploading
              ? 'Uploading...'
              : 'Ngedumel'}
        </button>
      </div>
    </div>
  );
}

function ImagePreview({
  image,
  onRemove,
}: {
  image: PendingImage;
  onRemove: () => void;
}) {
  return (
    <div className="group relative aspect-square overflow-hidden rounded-[8px] border border-[var(--color-line)] bg-[var(--color-paper-2)]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={image.previewUrl}
        alt=""
        className={`h-full w-full object-cover transition-opacity ${
          image.uploading ? 'opacity-50' : ''
        } ${image.error ? 'opacity-30' : ''}`}
      />

      {/* Loading shimmer */}
      {image.uploading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--color-line-2)] border-t-[var(--color-accent)]" />
        </div>
      )}

      {/* Error overlay */}
      {image.error && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-500/15 p-2 text-center">
          <span className="font-mono text-[9.5px] leading-tight text-red-600 dark:text-red-400">
            {image.error}
          </span>
        </div>
      )}

      {/* Remove button */}
      <button
        type="button"
        onClick={onRemove}
        aria-label="Hapus foto"
        className="absolute right-1 top-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity hover:bg-black/80 group-hover:opacity-100"
      >
        <svg
          width="11"
          height="11"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}
