'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

type DumelFile = {
  url: string;
  name: string;
  size: number;
  mime: string;
};

export function FileViewer({
  file,
  onClose,
}: {
  file: DumelFile;
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [textError, setTextError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // Keyboard close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const kind = detectKind(file);

  // Fetch text content for text files
  useEffect(() => {
    if (kind !== 'text') return;
    let cancelled = false;
    fetch(file.url)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.text();
      })
      .then((t) => {
        if (!cancelled) setTextContent(t);
      })
      .catch((err) => {
        if (!cancelled) setTextError(err.message || 'gagal load');
      });
    return () => {
      cancelled = true;
    };
  }, [kind, file.url]);

  if (!mounted) return null;

  return createPortal(
    <div
      className="lightbox-fade-in fixed inset-0 z-[100] flex flex-col bg-black/95 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={`File viewer: ${file.name}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
        <div className="min-w-0 flex-1">
          <div className="truncate text-[14px] font-medium text-white">
            {file.name}
          </div>
          <div className="font-mono text-[11px] text-white/50">
            {formatBytes(file.size)} · {file.mime}
          </div>
        </div>

        <a
          href={file.url}
          target="_blank"
          rel="noopener noreferrer"
          download={file.name}
          className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 font-mono text-[11px] text-white transition-colors hover:bg-white/20"
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
            aria-hidden="true"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
          </svg>
          download
        </a>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
        >
          <svg
            width="16"
            height="16"
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

      {/* Body */}
      <div className="flex flex-1 items-stretch justify-center overflow-hidden bg-[var(--color-paper)]">
        {kind === 'pdf' && (
          <iframe
            src={`${file.url}#view=FitH`}
            title={file.name}
            className="h-full w-full border-0"
          />
        )}

        {kind === 'office' && <OfficePreview file={file} />}

        {kind === 'text' && (
          <div className="h-full w-full overflow-auto bg-[var(--color-paper)] p-6">
            {textError ? (
              <p className="font-mono text-sm text-red-600">{textError}</p>
            ) : textContent === null ? (
              <p className="font-mono text-sm text-[var(--color-ink-3)]">
                memuat...
              </p>
            ) : (
              <pre className="mx-auto max-w-[760px] whitespace-pre-wrap break-words font-mono text-[13px] leading-[1.6] text-[var(--color-ink)]">
                {textContent}
              </pre>
            )}
          </div>
        )}

        {kind === 'unknown' && (
          <div className="flex w-full max-w-md flex-col items-center justify-center gap-4 p-8 text-center">
            <p className="text-[14px] text-[var(--color-ink-3)]">
              File ini tidak bisa di-preview langsung di browser. Download untuk
              buka di aplikasi.
            </p>
            <a
              href={file.url}
              target="_blank"
              rel="noopener noreferrer"
              download={file.name}
              className="rounded-full bg-[var(--color-ink)] px-4 py-2 text-[13px] font-medium text-[var(--color-paper)] transition-opacity hover:opacity-85"
            >
              Download file
            </a>
          </div>
        )}
      </div>

      {/* Footer hint */}
      <div className="border-t border-white/10 px-4 py-2 text-center font-mono text-[10.5px] text-white/40">
        esc untuk tutup
      </div>
    </div>,
    document.body
  );
}

function OfficePreview({ file }: { file: DumelFile }) {
  // Google Docs viewer can render Word/Excel/PowerPoint via embedded iframe.
  // The URL must be publicly accessible (which our Supabase Storage URLs are).
  const viewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(file.url)}&embedded=true`;

  return (
    <div className="flex h-full w-full flex-col">
      <iframe
        src={viewerUrl}
        title={file.name}
        className="h-full w-full border-0 bg-[var(--color-paper)]"
        // sandbox limit untuk security — allow scripts (Google viewer butuh)
      />
      <div className="border-t border-[var(--color-line)] bg-[var(--color-paper-2)] px-4 py-2 text-center font-mono text-[10.5px] text-[var(--color-ink-4)]">
        preview via Google Docs · belum muncul?{' '}
        <a
          href={file.url}
          target="_blank"
          rel="noopener noreferrer"
          download={file.name}
          className="text-[var(--color-accent)] underline-offset-2 hover:underline"
        >
          download
        </a>
      </div>
    </div>
  );
}

function detectKind(file: DumelFile): 'pdf' | 'office' | 'text' | 'unknown' {
  const mime = file.mime.toLowerCase();
  const ext = file.name.includes('.')
    ? file.name.split('.').pop()!.toLowerCase()
    : '';

  if (mime === 'application/pdf' || ext === 'pdf') return 'pdf';

  const officeMimes = [
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  ];
  const officeExts = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'];
  if (officeMimes.includes(mime) || officeExts.includes(ext)) return 'office';

  const textExts = ['txt', 'md', 'markdown', 'csv'];
  if (
    mime.startsWith('text/') ||
    textExts.includes(ext)
  ) {
    return 'text';
  }

  return 'unknown';
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
