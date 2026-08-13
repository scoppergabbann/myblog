'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { LibraryData, LibraryCategory, LibraryItem, LibraryPhoto } from '@/lib/library';
import { getCoverUrl } from '@/lib/library';

const ITEMS_PER_PAGE = 9;

export function LibraryShelf({ data }: { data: LibraryData }) {
  const { categories, itemsByCategory } = data;
  const sectionRefs = useRef<Record<number, HTMLElement | null>>({});
  const [activeId, setActiveId] = useState(categories[0]?.id ?? 0);
  const [selected, setSelected] = useState<LibraryItem | null>(null);

  // Highlight tab on scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const id = (entry.target as HTMLElement).dataset.catid;
            if (id) setActiveId(Number(id));
          }
        }
      },
      { rootMargin: '-40% 0px -55% 0px', threshold: 0 }
    );
    for (const el of Object.values(sectionRefs.current)) {
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [categories]);

  const scrollTo = (id: number) => {
    const el = sectionRefs.current[id];
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 72;
    window.scrollTo({ top, behavior: 'smooth' });
    setActiveId(id);
  };

  if (categories.length === 0) {
    return (
      <div className="py-16 text-center text-[var(--color-ink-3)]">
        <p className="mb-2 font-mono text-sm">// belum ada kategori</p>
        <p className="text-sm">Tambah kategori di admin panel dulu.</p>
      </div>
    );
  }

  return (
    <>
      {/* Sticky tabs */}
      <div className="sticky top-[57px] z-20 -mx-6 mb-10 border-b border-[var(--color-line)] bg-[color-mix(in_srgb,var(--color-paper)_90%,transparent)] px-6 backdrop-blur-md">
        <div className="scrollbar-none flex gap-1 overflow-x-auto pb-px">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => scrollTo(cat.id)}
              className={`inline-flex flex-shrink-0 items-center gap-1.5 border-b-2 px-3 py-3 text-[13px] font-medium transition-colors ${
                activeId === cat.id
                  ? 'border-[var(--color-accent)] text-[var(--color-accent)]'
                  : 'border-transparent text-[var(--color-ink-3)] hover:text-[var(--color-ink)]'
              }`}
            >
              <span>{cat.emoji}</span>
              <span>{cat.name}</span>
              <span className="font-mono text-[10.5px] text-[var(--color-ink-4)]">
                {(itemsByCategory[cat.id] ?? []).length}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-16">
        {categories.map((cat) => {
          const items = itemsByCategory[cat.id] ?? [];
          return (
            <section
              key={cat.id}
              ref={(el) => { sectionRefs.current[cat.id] = el; }}
              data-catid={cat.id}
              className="scroll-mt-24"
            >
              <div className="mb-5 flex items-baseline gap-3">
                <h2 className="text-[22px] font-medium tracking-[-0.02em] text-[var(--color-ink)]">
                  <span className="mr-2">{cat.emoji}</span>{cat.name}
                </h2>
                <span className="font-mono text-[12px] text-[var(--color-ink-4)]">
                  {items.length} item
                </span>
              </div>
              {cat.description && (
                <p className="mb-5 text-[14px] text-[var(--color-ink-3)]">{cat.description}</p>
              )}
              {items.length === 0 ? (
                <p className="text-sm text-[var(--color-ink-3)]">Belum ada item.</p>
              ) : (
                <CategoryCarousel
                  categoryId={cat.id}
                  items={items}
                  onSelect={setSelected}
                />
              )}
            </section>
          );
        })}
      </div>

      {selected && (
        <DetailModal
          item={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}

// =============================================================================
// Category carousel
// =============================================================================

function CategoryCarousel({
  categoryId,
  items,
  onSelect,
}: {
  categoryId: number;
  items: LibraryItem[];
  onSelect: (item: LibraryItem) => void;
}) {
  const [page, setPage] = useState(0);
  const touchStartX = useRef<number | null>(null);

  const sortedItems = useMemo(
    () =>
      [...items].sort((a, b) => {
        const dateDiff =
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        if (dateDiff !== 0) return dateDiff;
        return a.display_order - b.display_order;
      }),
    [items]
  );

  const pages = useMemo(() => {
    const chunks: LibraryItem[][] = [];
    for (let i = 0; i < sortedItems.length; i += ITEMS_PER_PAGE) {
      chunks.push(sortedItems.slice(i, i + ITEMS_PER_PAGE));
    }
    return chunks;
  }, [sortedItems]);

  const totalPages = pages.length;
  const canGoPrev = page > 0;
  const canGoNext = page < totalPages - 1;
  const firstItem = page * ITEMS_PER_PAGE + 1;
  const lastItem = Math.min((page + 1) * ITEMS_PER_PAGE, sortedItems.length);

  useEffect(() => {
    setPage(0);
  }, [categoryId, items]);

  const goPrev = useCallback(() => {
    setPage((current) => Math.max(0, current - 1));
  }, []);

  const goNext = useCallback(() => {
    setPage((current) => Math.min(totalPages - 1, current + 1));
  }, [totalPages]);

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="font-mono text-[11.5px] text-[var(--color-ink-4)]">
          {firstItem}-{lastItem} dari {sortedItems.length} · terbaru ke terlama
        </p>
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] text-[var(--color-ink-4)]">
              {page + 1}/{totalPages}
            </span>
            <button
              type="button"
              onClick={goPrev}
              disabled={!canGoPrev}
              aria-label="Lihat konten yang lebih baru"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--color-line)] text-[var(--color-ink-3)] transition-colors hover:border-[var(--color-line-2)] hover:text-[var(--color-ink)] disabled:cursor-not-allowed disabled:opacity-35"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <button
              type="button"
              onClick={goNext}
              disabled={!canGoNext}
              aria-label="Lihat konten yang lebih lama"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--color-line)] text-[var(--color-ink-3)] transition-colors hover:border-[color-mix(in_srgb,var(--color-accent)_35%,transparent)] hover:text-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-35"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>
        )}
      </div>

      <div
        className="overflow-hidden"
        onTouchStart={(event) => {
          touchStartX.current = event.touches[0]?.clientX ?? null;
        }}
        onTouchEnd={(event) => {
          if (touchStartX.current === null) return;
          const endX = event.changedTouches[0]?.clientX ?? touchStartX.current;
          const deltaX = endX - touchStartX.current;
          touchStartX.current = null;
          if (Math.abs(deltaX) < 50) return;
          if (deltaX < 0) goNext();
          if (deltaX > 0) goPrev();
        }}
      >
        <div
          className="flex transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${page * 100}%)` }}
        >
          {pages.map((pageItems, index) => (
            <div
              key={`${categoryId}-${index}`}
              className="grid w-full flex-shrink-0 grid-cols-2 gap-3 sm:grid-cols-3"
            >
              {pageItems.map((item) => (
                <LibraryCard
                  key={item.id}
                  item={item}
                  onClick={() => onSelect(item)}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Card
// =============================================================================

function LibraryCard({ item, onClick }: { item: LibraryItem; onClick: () => void }) {
  const coverUrl = getCoverUrl(item);
  const photoCount = item.photos.length;

  return (
    <button type="button" onClick={onClick} className="group text-left">
      <div className="overflow-hidden rounded-[10px] border border-[var(--color-line)] bg-[var(--color-paper)] transition-all duration-200 hover:border-[color-mix(in_srgb,var(--color-accent)_30%,transparent)] hover:shadow-md">
        {/* Cover */}
        <div className="relative w-full overflow-hidden bg-[var(--color-paper-2)]" style={{ aspectRatio: '4/3' }}>
          {coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={coverUrl}
              alt={item.name}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-3xl opacity-20">📷</div>
          )}
          {/* Photo count badge */}
          {photoCount > 1 && (
            <div className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-full bg-black/60 px-1.5 py-0.5 font-mono text-[10px] text-white backdrop-blur-sm">
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              {photoCount}
            </div>
          )}
        </div>
        {/* Info */}
        <div className="p-3">
          <p className="mb-0.5 line-clamp-2 text-[13px] font-medium leading-[1.35] text-[var(--color-ink)]">{item.name}</p>
          {item.subtitle && (
            <p className="mb-2 line-clamp-1 text-[11.5px] text-[var(--color-ink-3)]">{item.subtitle}</p>
          )}
          <div className="flex flex-wrap items-center gap-1.5">
            {item.badge && (
              <span className="inline-block rounded-full border border-[var(--color-line)] bg-[var(--color-paper-2)] px-2 py-0.5 font-mono text-[10px] text-[var(--color-ink-3)]">
                {item.badge}
              </span>
            )}
            {item.reels_url && (
              <a
                href={item.reels_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 px-2 py-0.5 text-[10px] font-medium text-white transition-opacity hover:opacity-85"
              >
                <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M5 3l14 9-14 9V3z" />
                </svg>
                Reels
              </a>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

// =============================================================================
// Detail modal
// =============================================================================

function DetailModal({ item, onClose }: { item: LibraryItem; onClose: () => void }) {
  const [mounted, setMounted] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);

  const galleryPhotos: LibraryPhoto[] =
    item.photos.length > 0 ? item.photos : [];
  const hasMultiple = galleryPhotos.length > 1;

  const prev = useCallback(
    () => setActiveIdx((i) => Math.max(0, i - 1)),
    []
  );
  const next = useCallback(
    () => setActiveIdx((i) => Math.min(galleryPhotos.length - 1, i + 1)),
    [galleryPhotos.length]
  );

  useEffect(() => {
    setMounted(true);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, prev, next]);

  if (!mounted) return null;

  const activePhoto = galleryPhotos[activeIdx] ?? null;

  return createPortal(
    <div
      className="lightbox-fade-in fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[90vh] w-full max-w-[700px] flex-col overflow-hidden rounded-[18px] bg-[var(--color-paper)] shadow-2xl sm:flex-row"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup"
          className="absolute right-3 top-3 z-20 inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-colors hover:bg-black/60"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Photo area */}
        <div className="relative flex w-full flex-col bg-black sm:w-[280px] sm:flex-shrink-0">
          <div className="relative flex-1 overflow-hidden" style={{ aspectRatio: '4/3' }}>
            {activePhoto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={activePhoto.id} src={activePhoto.url} alt={item.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-[var(--color-paper-2)] text-5xl opacity-20">📷</div>
            )}
            {/* Counter */}
            {hasMultiple && (
              <div className="absolute bottom-3 right-3 rounded-full bg-black/60 px-2 py-0.5 font-mono text-[10px] text-white backdrop-blur-sm">
                {activeIdx + 1}/{galleryPhotos.length}
              </div>
            )}
            {/* Arrows */}
            {hasMultiple && activeIdx > 0 && (
              <button type="button" onClick={(e) => { e.stopPropagation(); prev(); }} aria-label="Sebelumnya"
                className="absolute left-2 top-1/2 -translate-y-1/2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
            )}
            {hasMultiple && activeIdx < galleryPhotos.length - 1 && (
              <button type="button" onClick={(e) => { e.stopPropagation(); next(); }} aria-label="Selanjutnya"
                className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            )}
          </div>
          {/* Thumbnail strip */}
          {hasMultiple && (
            <div className="scrollbar-none flex gap-1.5 overflow-x-auto bg-black/80 p-2">
              {galleryPhotos.map((photo, idx) => (
                <button key={photo.id} type="button" onClick={(e) => { e.stopPropagation(); setActiveIdx(idx); }}
                  aria-label={`Foto ${idx + 1}`}
                  className={`flex-shrink-0 overflow-hidden rounded-[5px] transition-all ${idx === activeIdx ? 'ring-2 ring-[var(--color-accent)] ring-offset-1 ring-offset-black/80' : 'opacity-60 hover:opacity-100'}`}
                  style={{ width: 44, height: 44 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo.url} alt="" className="h-full w-full object-cover" loading="lazy" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-1 flex-col overflow-y-auto p-5">
          {item.badge && (
            <span className="mb-1 inline-block self-start rounded-full border border-[var(--color-line)] bg-[var(--color-paper-2)] px-2 py-0.5 font-mono text-[10px] text-[var(--color-ink-3)]">
              {item.badge}
            </span>
          )}
          <h2 className="mb-1 text-[20px] font-medium tracking-[-0.02em] text-[var(--color-ink)]">{item.name}</h2>
          {item.subtitle && (
            <p className="mb-3 font-mono text-[11.5px] text-[var(--color-ink-3)]">{item.subtitle}</p>
          )}
          {item.description && (
            <p className="mb-4 flex-1 text-[14px] leading-[1.65] text-[var(--color-ink-2)]">{item.description}</p>
          )}
          <div className="mt-auto flex flex-wrap gap-2 border-t border-[var(--color-line)] pt-4">
            {item.reels_url && (
              <a href={item.reels_url} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 px-3 py-1.5 text-[12px] font-medium text-white transition-opacity hover:opacity-90">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M5 3l14 9-14 9V3z" />
                </svg>
                Lihat Reels
              </a>
            )}
            {item.link_url && (
              <a href={item.link_url} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-line)] px-3 py-1.5 text-[12px] text-[var(--color-ink-2)] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]">
                Lihat lebih lanjut →
              </a>
            )}
          </div>
          <p className="mt-3 font-mono text-[10.5px] text-[var(--color-ink-4)]">
            {hasMultiple ? 'esc · ← → untuk navigasi foto' : 'esc untuk tutup'}
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
}
