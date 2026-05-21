'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import type {
  LibraryData,
  LibraryBook,
  LibraryDrink,
  LibraryCar,
  LibraryMotorcycle,
  LibraryPhoto,
} from '@/lib/library';
import {
  BOOK_STATUS_LABELS,
  DRINK_CATEGORY_LABELS,
  CAR_STATUS_LABELS,
  MOTO_STATUS_LABELS,
  getCoverUrl,
} from '@/lib/library';

type Tab = { id: string; label: string; emoji: string; count: number };
type AnyItem = LibraryBook | LibraryDrink | LibraryCar | LibraryMotorcycle;

// =============================================================================
// Shell
// =============================================================================

export function LibraryShelf({
  data,
  tabs,
}: {
  data: LibraryData;
  tabs: Tab[];
}) {
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const [activeTab, setActiveTab] = useState(tabs[0]?.id ?? 'books');
  const [selected, setSelected] = useState<{
    item: AnyItem;
    kind: string;
  } | null>(null);

  // Highlight tab on scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveTab(entry.target.id);
        }
      },
      { rootMargin: '-40% 0px -55% 0px', threshold: 0 }
    );
    for (const el of Object.values(sectionRefs.current)) {
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    const el = sectionRefs.current[id];
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 72;
    window.scrollTo({ top, behavior: 'smooth' });
    setActiveTab(id);
  };

  return (
    <>
      {/* Sticky tabs */}
      <div className="sticky top-[57px] z-20 -mx-6 mb-10 border-b border-[var(--color-line)] bg-[color-mix(in_srgb,var(--color-paper)_90%,transparent)] px-6 backdrop-blur-md">
        <div className="scrollbar-none flex gap-1 overflow-x-auto pb-px">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => scrollTo(t.id)}
              className={`inline-flex flex-shrink-0 items-center gap-1.5 border-b-2 px-3 py-3 text-[13px] font-medium transition-colors ${
                activeTab === t.id
                  ? 'border-[var(--color-accent)] text-[var(--color-accent)]'
                  : 'border-transparent text-[var(--color-ink-3)] hover:text-[var(--color-ink)]'
              }`}
            >
              <span>{t.emoji}</span>
              <span>{t.label}</span>
              {t.count > 0 && (
                <span className="font-mono text-[10.5px] text-[var(--color-ink-4)]">
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-16">
        <Section id="books" label="Buku" emoji="📚" count={data.books.length} sectionRefs={sectionRefs} emptyText="Belum ada buku.">
          {data.books.map((item) => (
            <LibraryCard key={item.id} item={item} kind="book" onClick={() => setSelected({ item, kind: 'book' })} />
          ))}
        </Section>
        <Section id="drinks" label="Minuman" emoji="☕" count={data.drinks.length} sectionRefs={sectionRefs} emptyText="Belum ada minuman.">
          {data.drinks.map((item) => (
            <LibraryCard key={item.id} item={item} kind="drink" onClick={() => setSelected({ item, kind: 'drink' })} />
          ))}
        </Section>
        <Section id="cars" label="Mobil Klasik" emoji="🚗" count={data.cars.length} sectionRefs={sectionRefs} emptyText="Belum ada mobil.">
          {data.cars.map((item) => (
            <LibraryCard key={item.id} item={item} kind="car" onClick={() => setSelected({ item, kind: 'car' })} />
          ))}
        </Section>
        <Section id="motorcycles" label="Motor" emoji="🏍️" count={data.motorcycles.length} sectionRefs={sectionRefs} emptyText="Belum ada motor.">
          {data.motorcycles.map((item) => (
            <LibraryCard key={item.id} item={item} kind="motorcycle" onClick={() => setSelected({ item, kind: 'motorcycle' })} />
          ))}
        </Section>
      </div>

      {selected && (
        <DetailModal
          item={selected.item}
          kind={selected.kind}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}

// =============================================================================
// Section
// =============================================================================

function Section({
  id, label, emoji, count, children, sectionRefs, emptyText,
}: {
  id: string; label: string; emoji: string; count: number;
  children: React.ReactNode;
  sectionRefs: React.MutableRefObject<Record<string, HTMLElement | null>>;
  emptyText: string;
}) {
  return (
    <section id={id} ref={(el) => { sectionRefs.current[id] = el; }} className="scroll-mt-24">
      <div className="mb-5 flex items-baseline gap-3">
        <h2 className="text-[22px] font-medium tracking-[-0.02em] text-[var(--color-ink)]">
          <span className="mr-2">{emoji}</span>{label}
        </h2>
        <span className="font-mono text-[12px] text-[var(--color-ink-4)]">{count} item</span>
      </div>
      {count === 0 ? (
        <p className="text-sm text-[var(--color-ink-3)]">{emptyText}</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {children}
        </div>
      )}
    </section>
  );
}

// =============================================================================
// Card
// =============================================================================

function LibraryCard({
  item, kind, onClick,
}: {
  item: AnyItem; kind: string; onClick: () => void;
}) {
  const coverUrl = getCoverUrl(item);
  const title = 'title' in item ? item.title : item.name;
  const aspect = kind === 'book' ? '3/4' : '4/3';
  const photoCount = item.photos.length;

  let badge = '';
  if (kind === 'book') badge = BOOK_STATUS_LABELS[(item as LibraryBook).status];
  if (kind === 'drink') badge = DRINK_CATEGORY_LABELS[(item as LibraryDrink).category];
  if (kind === 'car') badge = CAR_STATUS_LABELS[(item as LibraryCar).status];
  if (kind === 'motorcycle') badge = MOTO_STATUS_LABELS[(item as LibraryMotorcycle).status];

  const sub =
    kind === 'book'
      ? (item as LibraryBook).author
      : kind === 'drink'
        ? (item as LibraryDrink).brand
        : [(item as LibraryCar | LibraryMotorcycle).model,
           (item as LibraryCar | LibraryMotorcycle).year]
            .filter(Boolean).join(' · ');

  const reelsUrl =
    'reels_url' in item ? item.reels_url : null;

  return (
    <button type="button" onClick={onClick} className="group text-left">
      <div className="overflow-hidden rounded-[10px] border border-[var(--color-line)] bg-[var(--color-paper)] transition-all duration-200 hover:border-[color-mix(in_srgb,var(--color-accent)_30%,transparent)] hover:shadow-md">
        {/* Cover photo */}
        <div className="relative w-full overflow-hidden bg-[var(--color-paper-2)]" style={{ aspectRatio: aspect }}>
          {coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={coverUrl}
              alt={title}
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
          <p className="mb-0.5 line-clamp-2 text-[13px] font-medium leading-[1.35] text-[var(--color-ink)]">{title}</p>
          {sub && <p className="mb-2 line-clamp-1 text-[11.5px] text-[var(--color-ink-3)]">{sub}</p>}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="inline-block rounded-full border border-[var(--color-line)] bg-[var(--color-paper-2)] px-2 py-0.5 font-mono text-[10px] text-[var(--color-ink-3)]">
              {badge}
            </span>
            {reelsUrl && (
              <a
                href={reelsUrl}
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
// Detail modal — main photo + thumbnail strip
// =============================================================================

function DetailModal({
  item, kind, onClose,
}: {
  item: AnyItem; kind: string; onClose: () => void;
}) {
  // Derive everything FIRST before any hooks
  const title = 'title' in item ? item.title : item.name;
  const legacyUrl = 'cover_url' in item ? item.cover_url : item.photo_url;
  const reelsUrl = 'reels_url' in item ? item.reels_url : null;
  const linkUrl = 'link_url' in item ? item.link_url : null;

  const isBook = kind === 'book';
  const isDrink = kind === 'drink';
  const isCar = kind === 'car';
  const isMoto = kind === 'motorcycle';

  const bookItem = isBook ? (item as LibraryBook) : null;
  const drinkItem = isDrink ? (item as LibraryDrink) : null;
  const carItem = isCar ? (item as LibraryCar) : null;
  const motoItem = isMoto ? (item as LibraryMotorcycle) : null;

  // Build full photo list — gallery photos first, then legacy url as fallback
  const galleryPhotos: LibraryPhoto[] = item.photos.length > 0
    ? item.photos
    : legacyUrl
      ? [{ id: -1, url: legacyUrl, position: 0 }]
      : [];

  let badge = '';
  if (bookItem) badge = BOOK_STATUS_LABELS[bookItem.status];
  if (drinkItem) badge = DRINK_CATEGORY_LABELS[drinkItem.category];
  if (carItem) badge = CAR_STATUS_LABELS[carItem.status];
  if (motoItem) badge = MOTO_STATUS_LABELS[motoItem.status];

  const subInfo = [
    bookItem?.author,
    drinkItem?.brand,
    carItem?.model ?? motoItem?.model,
    (carItem?.year ?? motoItem?.year)?.toString(),
    (bookItem?.year_read)?.toString(),
  ].filter(Boolean).join(' · ');

  const photoAspect = isBook ? '3/4' : '4/3';
  const hasMultiple = galleryPhotos.length > 1;

  // Hooks
  const [mounted, setMounted] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);

  const prev = useCallback(() => setActiveIdx((i) => Math.max(0, i - 1)), []);
  const next = useCallback(
    () => setActiveIdx((i) => Math.min(galleryPhotos.length - 1, i + 1)),
    [galleryPhotos.length]
  );

  useEffect(() => {
    setMounted(true);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prevOverflow; };
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

        {/* ── Left: photo area ── */}
        <div className="relative flex w-full flex-col bg-black sm:w-[280px] sm:flex-shrink-0">
          {/* Main photo */}
          <div className="relative flex-1 overflow-hidden" style={{ aspectRatio: photoAspect }}>
            {activePhoto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={activePhoto.id}
                src={activePhoto.url}
                alt={title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-[var(--color-paper-2)] text-5xl opacity-20">📷</div>
            )}

            {/* Counter */}
            {hasMultiple && (
              <div className="absolute bottom-3 right-3 rounded-full bg-black/60 px-2 py-0.5 font-mono text-[10px] text-white backdrop-blur-sm">
                {activeIdx + 1}/{galleryPhotos.length}
              </div>
            )}

            {/* Prev / Next arrow overlays (visible on hover) */}
            {hasMultiple && activeIdx > 0 && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); prev(); }}
                aria-label="Foto sebelumnya"
                className="absolute left-2 top-1/2 -translate-y-1/2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition-opacity hover:bg-black/70 group-hover:opacity-100 focus:opacity-100"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
            )}
            {hasMultiple && activeIdx < galleryPhotos.length - 1 && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); next(); }}
                aria-label="Foto selanjutnya"
                className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition-opacity hover:bg-black/70 focus:opacity-100"
              >
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
                <button
                  key={photo.id}
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setActiveIdx(idx); }}
                  aria-label={`Foto ${idx + 1}`}
                  className={`flex-shrink-0 overflow-hidden rounded-[5px] transition-all ${
                    idx === activeIdx
                      ? 'ring-2 ring-[var(--color-accent)] ring-offset-1 ring-offset-black/80'
                      : 'opacity-60 hover:opacity-100'
                  }`}
                  style={{ width: 44, height: 44 }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.url}
                    alt=""
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Right: info ── */}
        <div className="flex flex-1 flex-col overflow-y-auto p-5">
          <span className="mb-1 inline-block self-start rounded-full border border-[var(--color-line)] bg-[var(--color-paper-2)] px-2 py-0.5 font-mono text-[10px] text-[var(--color-ink-3)]">
            {badge}
          </span>
          <h2 className="mb-1 text-[20px] font-medium tracking-[-0.02em] text-[var(--color-ink)]">
            {title}
          </h2>
          {subInfo && (
            <p className="mb-3 font-mono text-[11.5px] text-[var(--color-ink-3)]">{subInfo}</p>
          )}
          {item.description && (
            <p className="mb-4 flex-1 text-[14px] leading-[1.65] text-[var(--color-ink-2)]">
              {item.description}
            </p>
          )}

          {/* Links */}
          <div className="mt-auto flex flex-wrap gap-2 border-t border-[var(--color-line)] pt-4">
            {reelsUrl && (
              <a
                href={reelsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 px-3 py-1.5 text-[12px] font-medium text-white transition-opacity hover:opacity-90"
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M5 3l14 9-14 9V3z" />
                </svg>
                Lihat Reels
              </a>
            )}
            {linkUrl && (
              <a
                href={linkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-line)] px-3 py-1.5 text-[12px] text-[var(--color-ink-2)] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
              >
                Lihat buku →
              </a>
            )}
          </div>
          <p className="mt-3 font-mono text-[10.5px] text-[var(--color-ink-4)]">
            esc · ← → untuk navigasi foto
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
}
