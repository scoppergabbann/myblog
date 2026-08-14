'use client';

import { useState, useTransition, useRef, useEffect } from 'react';
import { Avatar } from './avatar';
import { createDumel, uploadDumelImage, uploadDumelFile } from './actions';
import { resizeImage } from './image-resize';

const MAX = 2000;
const MAX_IMAGES = 4;
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const FILE_ACCEPT =
  '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.md,.csv,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/plain,text/markdown,text/csv';

type PendingImage = {
  /** Local preview URL (object URL) */
  previewUrl: string;
  /** Uploaded result, populated after upload finishes */
  uploaded?: { url: string; publicId: string; width: number; height: number };
  /** Set while upload in flight */
  uploading: boolean;
  /** Error message if upload failed */
  error?: string;
};

type PendingFile = {
  name: string;
  size: number;
  uploaded?: { url: string; publicId: string; mime: string };
  uploading: boolean;
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
  const [attachedFile, setAttachedFile] = useState<PendingFile | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isPending, startTransition] = useTransition();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
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
  const allImagesUploaded = images.every((img) => img.uploaded);
  const anyImageUploading = images.some((img) => img.uploading);
  const fileReady = !attachedFile || (attachedFile.uploaded && !attachedFile.uploading);
  const fileUploading = !!attachedFile?.uploading;
  const anyUploading = anyImageUploading || fileUploading;
  const canPost =
    (trimmed.length > 0 || images.length > 0 || !!attachedFile?.uploaded) &&
    trimmed.length <= MAX &&
    !isPending &&
    !anyUploading &&
    allImagesUploaded &&
    fileReady;

  const onSubmit = () => {
    if (!canPost) return;
    setError(null);
    const imageInputs = images
      .filter((img) => img.uploaded)
      .map((img) => ({
        url: img.uploaded!.url,
        publicId: img.uploaded!.publicId,
        width: img.uploaded!.width,
        height: img.uploaded!.height,
      }));

    const fileInput =
      attachedFile?.uploaded
        ? {
            url: attachedFile.uploaded.url,
            publicId: attachedFile.uploaded.publicId,
            name: attachedFile.name,
            size: attachedFile.size,
            mime: attachedFile.uploaded.mime,
          }
        : null;

    startTransition(async () => {
      const result = await createDumel(content, imageInputs, fileInput);
      if (result.ok) {
        // Revoke local previews
        images.forEach((img) => URL.revokeObjectURL(img.previewUrl));
        setContent('');
        setImages([]);
        setAttachedFile(null);
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
                  publicId: result.publicId,
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

  const handleAttachFile = async (file: File) => {
    if (attachedFile) {
      setError('Sudah ada file ter-attach. Hapus dulu kalau mau ganti.');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      const mb = (file.size / 1024 / 1024).toFixed(1);
      setError(`File terlalu besar (${mb}MB, max 10MB)`);
      return;
    }
    setAttachedFile({
      name: file.name,
      size: file.size,
      uploading: true,
    });
    try {
      const fd = new FormData();
      fd.append('file', file);
      const result = await uploadDumelFile(fd);
      if (result.ok) {
        setAttachedFile({
          name: result.name,
          size: result.size,
          uploading: false,
          uploaded: {
            url: result.url,
            publicId: result.publicId,
            mime: result.mime,
          },
        });
      } else {
        setAttachedFile({
          name: file.name,
          size: file.size,
          uploading: false,
          error: result.error,
        });
      }
    } catch (err) {
      setAttachedFile({
        name: file.name,
        size: file.size,
        uploading: false,
        error: err instanceof Error ? err.message : 'Upload gagal',
      });
    }
  };

  const removeAttachedFile = () => {
    setAttachedFile(null);
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
    if (e.dataTransfer.files.length === 0) return;

    // Split between images and non-image files
    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter((f) => f.type.startsWith('image/'));
    const docFiles = files.filter((f) => !f.type.startsWith('image/'));

    if (imageFiles.length > 0) {
      handleFiles(imageFiles);
    }
    // Only support 1 document — take first one
    if (docFiles.length > 0) {
      handleAttachFile(docFiles[0]);
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

          {/* File attachment preview */}
          {attachedFile && (
            <div className="mt-2">
              <FileChipPreview file={attachedFile} onRemove={removeAttachedFile} />
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

          {/* Document/file attach button */}
          <input
            ref={docInputRef}
            type="file"
            accept={FILE_ACCEPT}
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleAttachFile(f);
              e.target.value = '';
            }}
          />
          <button
            type="button"
            onClick={() => docInputRef.current?.click()}
            disabled={!!attachedFile}
            aria-label="Attach file"
            title={attachedFile ? 'Sudah ada file ter-attach' : 'Attach file (PDF, doc, txt)'}
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
              <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
            </svg>
          </button>

          {error ? (
            <span className="text-red-600 dark:text-red-400">{error}</span>
          ) : (
            <span className="font-mono text-[var(--color-ink-4)]">
              {trimmed.length > 0 && `${trimmed.length}/${MAX} · `}
              {images.length > 0 && `${images.length}/${MAX_IMAGES} foto · `}
              {attachedFile && `1 file · `}
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
              : 'Sambat'}
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

function FileChipPreview({
  file,
  onRemove,
}: {
  file: PendingFile;
  onRemove: () => void;
}) {
  const sizeStr = formatBytes(file.size);
  return (
    <div
      className={`flex items-center gap-2 rounded-[10px] border px-3 py-2 transition-colors ${
        file.error
          ? 'border-red-500/40 bg-red-500/5'
          : 'border-[var(--color-line)] bg-[var(--color-paper-2)]'
      }`}
    >
      <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-[var(--color-paper)]">
        {file.uploading ? (
          <div className="h-3 w-3 animate-spin rounded-full border-2 border-[var(--color-line-2)] border-t-[var(--color-accent)]" />
        ) : (
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={file.error ? 'text-red-600' : 'text-[var(--color-ink-3)]'}
            aria-hidden="true"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[12.5px] font-medium text-[var(--color-ink)]">
          {file.name}
        </div>
        <div className="font-mono text-[10.5px] text-[var(--color-ink-4)]">
          {file.error ? (
            <span className="text-red-600 dark:text-red-400">{file.error}</span>
          ) : (
            <>
              {sizeStr}
              {file.uploading && ' · uploading...'}
              {file.uploaded && ' · siap'}
            </>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={onRemove}
        aria-label="Hapus file"
        className="-mr-1 inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[var(--color-ink-4)] transition-colors hover:bg-[var(--color-paper)] hover:text-red-600"
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

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
