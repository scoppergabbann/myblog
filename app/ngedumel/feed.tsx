'use client';

import { useOptimistic, useTransition, useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Avatar } from './avatar';
import { deleteDumel, loadMoreDumels } from './actions';
import { Lightbox } from './lightbox';
import { FileViewer } from './file-viewer';
import { relativeTimeId, formatDate } from '@/lib/utils';

type DumelImage = {
  id: number;
  url: string;
  width: number | null;
  height: number | null;
  position: number;
};

type DumelFile = {
  url: string;
  name: string;
  size: number;
  mime: string;
};

type Dumel = {
  id: number;
  content: string;
  created_at: string;
  images: DumelImage[];
  file: DumelFile | null;
};

type LightboxState = {
  images: DumelImage[];
  startIndex: number;
} | null;

type FileViewerState = DumelFile | null;

export function DumelFeed({
  initialDumels,
  initialHasMore,
  avatarUrl,
  displayName,
  login,
}: {
  initialDumels: Dumel[];
  initialHasMore: boolean;
  avatarUrl?: string;
  displayName: string;
  login: string;
}) {
  // Track loaded dumels — grows as user scrolls. Initial = server-fetched first page.
  const [allDumels, setAllDumels] = useState<Dumel[]>(initialDumels);
  // When useOptimistic is applied, it returns a new array with the deletion applied.
  // We feed it `allDumels` (which includes infinite-scroll-loaded posts).
  const [optimistic, applyOptimistic] = useOptimistic<
    Dumel[],
    { type: 'delete'; id: number }
  >(allDumels, (state, action) => state.filter((d) => d.id !== action.id));
  const [, startTransition] = useTransition();
  const router = useRouter();
  const [lightbox, setLightbox] = useState<LightboxState>(null);
  const [fileViewer, setFileViewer] = useState<FileViewerState>(null);

  // Infinite scroll state
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Keep allDumels in sync if initial data refetches (e.g. after delete → router.refresh)
  useEffect(() => {
    setAllDumels(initialDumels);
    setHasMore(initialHasMore);
  }, [initialDumels, initialHasMore]);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore || allDumels.length === 0) return;
    setLoading(true);
    setLoadError(null);

    const lastCursor = allDumels[allDumels.length - 1].created_at;
    const result = await loadMoreDumels(lastCursor);

    if (result.ok) {
      // Dedupe in case of race (delete + load overlapping)
      setAllDumels((prev) => {
        const existing = new Set(prev.map((d) => d.id));
        const fresh = result.dumels.filter((d) => !existing.has(d.id));
        return [...prev, ...fresh];
      });
      setHasMore(result.hasMore);
    } else {
      setLoadError(result.error);
    }
    setLoading(false);
  }, [loading, hasMore, allDumels]);

  // IntersectionObserver: trigger loadMore when sentinel enters viewport
  useEffect(() => {
    if (!hasMore || loading) return;
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadMore();
        }
      },
      {
        // Trigger 300px before sentinel enters viewport — feels seamless
        rootMargin: '300px',
        threshold: 0,
      }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loading, loadMore]);

  if (optimistic.length === 0) {
    return (
      <div className="rounded-[12px] border border-dashed border-[var(--color-line-2)] bg-[var(--color-paper)] px-6 py-12 text-center">
        <div className="mb-2 font-mono text-[11.5px] uppercase tracking-wide text-[var(--color-ink-3)]">
          // belum ada dumel
        </div>
        <p className="text-sm text-[var(--color-ink-3)]">
          Tulis sesuatu atau upload foto di atas. Hanya kamu yang bisa lihat.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-3">
        {optimistic.map((d) => (
          <DumelCard
            key={d.id}
            dumel={d}
            avatarUrl={avatarUrl}
            displayName={displayName}
            login={login}
            onImageClick={(idx) =>
              setLightbox({ images: d.images, startIndex: idx })
            }
            onFileClick={() => d.file && setFileViewer(d.file)}
            onDelete={() => {
              if (!confirm('Hapus dumel ini?')) return;
              startTransition(async () => {
                applyOptimistic({ type: 'delete', id: d.id });
                // Also remove from allDumels source so it doesn't reappear
                setAllDumels((prev) => prev.filter((x) => x.id !== d.id));
                const result = await deleteDumel(d.id);
                if (result.ok) {
                  router.refresh();
                }
              });
            }}
          />
        ))}
      </div>

      {/* Infinite scroll sentinel + status indicators */}
      <div ref={sentinelRef} className="mt-3">
        {loading && <LoadingIndicator />}
        {loadError && (
          <div className="rounded-[12px] border border-red-500/30 bg-red-500/5 px-4 py-3 text-center">
            <p className="font-mono text-[11.5px] text-red-600 dark:text-red-400">
              gagal load: {loadError}
            </p>
            <button
              type="button"
              onClick={loadMore}
              className="mt-2 font-mono text-[11.5px] text-[var(--color-accent)] underline-offset-2 hover:underline"
            >
              coba lagi
            </button>
          </div>
        )}
        {!hasMore && !loading && optimistic.length >= 5 && <EndOfFeed />}
      </div>

      {lightbox && (
        <Lightbox
          images={lightbox.images}
          startIndex={lightbox.startIndex}
          onClose={() => setLightbox(null)}
        />
      )}

      {fileViewer && (
        <FileViewer file={fileViewer} onClose={() => setFileViewer(null)} />
      )}
    </>
  );
}

function DumelCard({
  dumel,
  avatarUrl,
  displayName,
  login,
  onDelete,
  onImageClick,
  onFileClick,
}: {
  dumel: Dumel;
  avatarUrl?: string;
  displayName: string;
  login: string;
  onDelete: () => void;
  onImageClick: (idx: number) => void;
  onFileClick: () => void;
}) {
  return (
    <article className="group rounded-[14px] border border-[var(--color-line)] bg-[var(--color-paper)] p-3 transition-colors hover:border-[var(--color-line-2)] sm:p-4">
      <header className="mb-2 flex items-start gap-2.5 sm:gap-3">
        <Avatar src={avatarUrl} login={login} name={displayName} size={36} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-[14px] font-medium text-[var(--color-ink)] sm:text-[14.5px]">
              {displayName}
            </span>
            <span className="truncate font-mono text-[11.5px] text-[var(--color-ink-4)]">
              @{login}
            </span>
          </div>
          <time
            dateTime={dumel.created_at}
            title={formatDate(dumel.created_at, true)}
            className="block font-mono text-[11px] text-[var(--color-ink-4)]"
          >
            {relativeTimeId(dumel.created_at)}
          </time>
        </div>
        <button
          type="button"
          onClick={onDelete}
          aria-label="Delete dumel"
          title="Hapus"
          className="-mr-1 -mt-1 inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[var(--color-ink-4)] transition-all hover:bg-red-500/10 hover:text-red-600 sm:opacity-0 sm:group-hover:opacity-100 dark:hover:text-red-400"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14z" />
            <line x1="10" y1="11" x2="10" y2="17" />
            <line x1="14" y1="11" x2="14" y2="17" />
          </svg>
        </button>
      </header>

      {dumel.content && (
        <div className="ml-0 mb-2 whitespace-pre-wrap break-words text-[14.5px] leading-[1.55] text-[var(--color-ink)] sm:ml-[46px] sm:text-[15px]">
          {dumel.content}
        </div>
      )}

      {dumel.images.length > 0 && (
        <div className="ml-0 mt-2 sm:ml-[46px]">
          <ImageCarousel
            images={dumel.images}
            onImageClick={onImageClick}
          />
        </div>
      )}

      {dumel.file && (
        <div className="ml-0 mt-2 sm:ml-[46px]">
          <FileChip file={dumel.file} onClick={onFileClick} />
        </div>
      )}
    </article>
  );
}

function FileChip({
  file,
  onClick,
}: {
  file: DumelFile;
  onClick: () => void;
}) {
  const ext = file.name.includes('.')
    ? file.name.split('.').pop()!.toLowerCase()
    : '';
  const sizeStr =
    file.size < 1024
      ? `${file.size} B`
      : file.size < 1024 * 1024
        ? `${(file.size / 1024).toFixed(1)} KB`
        : `${(file.size / 1024 / 1024).toFixed(1)} MB`;

  return (
    <button
      type="button"
      onClick={onClick}
      className="group/chip inline-flex max-w-full items-center gap-2 rounded-full border border-[var(--color-line)] bg-[var(--color-paper-2)] px-3 py-1.5 text-left transition-all hover:border-[color-mix(in_srgb,var(--color-accent)_40%,transparent)] hover:bg-[var(--color-accent-soft)]"
    >
      <svg
        width="13"
        height="13"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="flex-shrink-0 text-[var(--color-ink-3)] transition-colors group-hover/chip:text-[var(--color-accent)]"
        aria-hidden="true"
      >
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
      </svg>
      <span className="truncate text-[12.5px] font-medium text-[var(--color-ink-2)] transition-colors group-hover/chip:text-[var(--color-accent)]">
        {file.name}
      </span>
      <span className="flex-shrink-0 font-mono text-[10.5px] text-[var(--color-ink-4)]">
        {ext && `${ext.toUpperCase()} · `}
        {sizeStr}
      </span>
    </button>
  );
}

function ImageCarousel({
  images,
  onImageClick,
}: {
  images: DumelImage[];
  onImageClick: (idx: number) => void;
}) {
  // Single image: full width, natural aspect (capped at 16:9 to avoid super tall)
  if (images.length === 1) {
    const img = images[0];
    return (
      <button
        type="button"
        onClick={() => onImageClick(0)}
        className="block w-full overflow-hidden rounded-[10px] border border-[var(--color-line)] bg-[var(--color-paper-2)] transition-opacity hover:opacity-95"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={img.url}
          alt=""
          loading="lazy"
          className="block max-h-[480px] w-full object-cover"
        />
      </button>
    );
  }

  // Multiple: horizontal scroll carousel with snap
  return (
    <div className="relative">
      <div
        className="ngedumel-carousel flex snap-x snap-mandatory gap-2 overflow-x-auto pb-1"
        role="region"
        aria-label="Foto carousel"
      >
        {images.map((img, idx) => (
          <button
            key={img.id}
            type="button"
            onClick={() => onImageClick(idx)}
            className="snap-start overflow-hidden rounded-[10px] border border-[var(--color-line)] bg-[var(--color-paper-2)] transition-opacity hover:opacity-95"
            style={{
              flex: '0 0 80%',
              maxWidth: '380px',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img.url}
              alt=""
              loading="lazy"
              className="block aspect-[4/3] w-full object-cover"
            />
          </button>
        ))}
      </div>

      {/* Dot indicators */}
      <div className="mt-2 flex justify-center gap-1.5">
        {images.map((_, idx) => (
          <span
            key={idx}
            className="inline-block h-1 w-1 rounded-full bg-[var(--color-line-2)]"
            aria-hidden="true"
          />
        ))}
        <span className="ml-1 font-mono text-[10px] text-[var(--color-ink-4)]">
          {images.length} foto · swipe
        </span>
      </div>
    </div>
  );
}

function LoadingIndicator() {
  return (
    <div className="flex items-center justify-center gap-2 py-6">
      <div className="h-3 w-3 animate-spin rounded-full border-2 border-[var(--color-line-2)] border-t-[var(--color-accent)]" />
      <span className="font-mono text-[11px] text-[var(--color-ink-4)]">
        memuat dumel lama...
      </span>
    </div>
  );
}

function EndOfFeed() {
  return (
    <div className="mt-2 rounded-[10px] border border-dashed border-[var(--color-line)] bg-[var(--color-paper)] px-6 py-7 text-center">
      <div className="mb-1 font-mono text-[11px] uppercase tracking-wider text-[var(--color-ink-4)]">
        // end of dumel
      </div>
      <p className="text-[12.5px] text-[var(--color-ink-3)]">
        Sudah sampai bawah — no more dumel.
      </p>
    </div>
  );
}
