'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type {
  LibraryData,
  LibraryBook,
  LibraryDrink,
  LibraryCar,
  LibraryMotorcycle,
} from '@/lib/library';
import {
  BOOK_STATUS_LABELS,
  DRINK_CATEGORY_LABELS,
  CAR_STATUS_LABELS,
  MOTO_STATUS_LABELS,
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

  // Highlight tab based on scroll position
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveTab(entry.target.id);
          }
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
    const offset = 72; // sticky tab height
    const top = el.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: 'smooth' });
    setActiveTab(id);
  };

  return (
    <>
      {/* Sticky tabs */}
      <div className="sticky top-[57px] z-20 -mx-6 mb-10 border-b border-[var(--color-line)] bg-[color-mix(in_srgb,var(--color-paper)_90%,transparent)] px-6 backdrop-blur-md">
        <div className="flex gap-1 overflow-x-auto pb-px scrollbar-none">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => scrollTo(t.id)}
              className={`flex-shrink-0 inline-flex items-center gap-1.5 border-b-2 px-3 py-3 text-[13px] font-medium transition-colors ${
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
        <Section
          id="books"
          label="Buku"
          emoji="📚"
          count={data.books.length}
          sectionRefs={sectionRefs}
          emptyText="Belum ada buku yang ditambahkan."
        >
          {data.books.map((item) => (
            <BookCard
              key={item.id}
              item={item}
              onClick={() => setSelected({ item, kind: 'book' })}
            />
          ))}
        </Section>

        <Section
          id="drinks"
          label="Minuman"
          emoji="☕"
          count={data.drinks.length}
          sectionRefs={sectionRefs}
          emptyText="Belum ada minuman yang ditambahkan."
        >
          {data.drinks.map((item) => (
            <DrinkCard
              key={item.id}
              item={item}
              onClick={() => setSelected({ item, kind: 'drink' })}
            />
          ))}
        </Section>

        <Section
          id="cars"
          label="Mobil Klasik"
          emoji="🚗"
          count={data.cars.length}
          sectionRefs={sectionRefs}
          emptyText="Belum ada mobil yang ditambahkan."
        >
          {data.cars.map((item) => (
            <VehicleCard
              key={item.id}
              item={item}
              kind="car"
              onClick={() => setSelected({ item, kind: 'car' })}
            />
          ))}
        </Section>

        <Section
          id="motorcycles"
          label="Motor"
          emoji="🏍️"
          count={data.motorcycles.length}
          sectionRefs={sectionRefs}
          emptyText="Belum ada motor yang ditambahkan."
        >
          {data.motorcycles.map((item) => (
            <VehicleCard
              key={item.id}
              item={item}
              kind="motorcycle"
              onClick={() => setSelected({ item, kind: 'motorcycle' })}
            />
          ))}
        </Section>
      </div>

      {/* Detail modal */}
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
// Section wrapper
// =============================================================================

function Section({
  id,
  label,
  emoji,
  count,
  children,
  sectionRefs,
  emptyText,
}: {
  id: string;
  label: string;
  emoji: string;
  count: number;
  children: React.ReactNode;
  sectionRefs: React.MutableRefObject<Record<string, HTMLElement | null>>;
  emptyText: string;
}) {
  return (
    <section
      id={id}
      ref={(el) => { sectionRefs.current[id] = el; }}
      className="scroll-mt-24"
    >
      <div className="mb-5 flex items-baseline gap-3">
        <h2 className="text-[22px] font-medium tracking-[-0.02em] text-[var(--color-ink)]">
          <span className="mr-2">{emoji}</span>
          {label}
        </h2>
        <span className="font-mono text-[12px] text-[var(--color-ink-4)]">
          {count} item
        </span>
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
// Shared photo component
// =============================================================================

function ItemPhoto({
  src,
  alt,
  aspect = '3/4',
}: {
  src: string | null;
  alt: string;
  aspect?: string;
}) {
  return (
    <div
      className="w-full overflow-hidden bg-[var(--color-paper-2)]"
      style={{ aspectRatio: aspect }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-3xl opacity-30">
          📷
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Badge
// =============================================================================

function Badge({ label }: { label: string }) {
  return (
    <span className="inline-block rounded-full border border-[var(--color-line)] bg-[var(--color-paper-2)] px-2 py-0.5 font-mono text-[10px] text-[var(--color-ink-3)]">
      {label}
    </span>
  );
}

// =============================================================================
// Reels button
// =============================================================================

function ReelsButton({ url }: { url: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 px-2.5 py-1 text-[10.5px] font-medium text-white transition-opacity hover:opacity-90"
    >
      <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M5 3l14 9-14 9V3z" />
      </svg>
      Reels
    </a>
  );
}

// =============================================================================
// Book card
// =============================================================================

function BookCard({
  item,
  onClick,
}: {
  item: LibraryBook;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group text-left"
    >
      <div className="overflow-hidden rounded-[10px] border border-[var(--color-line)] bg-[var(--color-paper)] transition-all duration-200 hover:border-[color-mix(in_srgb,var(--color-accent)_30%,transparent)] hover:shadow-md">
        <ItemPhoto src={item.cover_url} alt={item.title} aspect="3/4" />
        <div className="p-3">
          <p className="mb-0.5 line-clamp-2 text-[13px] font-medium leading-[1.35] text-[var(--color-ink)]">
            {item.title}
          </p>
          {item.author && (
            <p className="mb-2 line-clamp-1 text-[11.5px] text-[var(--color-ink-3)]">
              {item.author}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge label={BOOK_STATUS_LABELS[item.status]} />
            {item.year_read && (
              <span className="font-mono text-[10px] text-[var(--color-ink-4)]">
                {item.year_read}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

// =============================================================================
// Drink card
// =============================================================================

function DrinkCard({
  item,
  onClick,
}: {
  item: LibraryDrink;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group text-left"
    >
      <div className="overflow-hidden rounded-[10px] border border-[var(--color-line)] bg-[var(--color-paper)] transition-all duration-200 hover:border-[color-mix(in_srgb,var(--color-accent)_30%,transparent)] hover:shadow-md">
        <ItemPhoto src={item.photo_url} alt={item.name} aspect="4/3" />
        <div className="p-3">
          <p className="mb-0.5 line-clamp-1 text-[13px] font-medium text-[var(--color-ink)]">
            {item.name}
          </p>
          {item.brand && (
            <p className="mb-2 line-clamp-1 text-[11.5px] text-[var(--color-ink-3)]">
              {item.brand}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge label={DRINK_CATEGORY_LABELS[item.category]} />
            {item.reels_url && <ReelsButton url={item.reels_url} />}
          </div>
        </div>
      </div>
    </button>
  );
}

// =============================================================================
// Vehicle card (car + motorcycle)
// =============================================================================

function VehicleCard({
  item,
  kind,
  onClick,
}: {
  item: LibraryCar | LibraryMotorcycle;
  kind: 'car' | 'motorcycle';
  onClick: () => void;
}) {
  const statusLabel =
    kind === 'car'
      ? CAR_STATUS_LABELS[item.status]
      : MOTO_STATUS_LABELS[item.status];

  return (
    <button
      type="button"
      onClick={onClick}
      className="group text-left"
    >
      <div className="overflow-hidden rounded-[10px] border border-[var(--color-line)] bg-[var(--color-paper)] transition-all duration-200 hover:border-[color-mix(in_srgb,var(--color-accent)_30%,transparent)] hover:shadow-md">
        <ItemPhoto src={item.photo_url} alt={item.name} aspect="4/3" />
        <div className="p-3">
          <p className="mb-0.5 line-clamp-1 text-[13px] font-medium text-[var(--color-ink)]">
            {item.name}
          </p>
          {(item.model || item.year) && (
            <p className="mb-2 line-clamp-1 text-[11.5px] text-[var(--color-ink-3)]">
              {[item.model, item.year].filter(Boolean).join(' · ')}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge label={statusLabel} />
            {item.reels_url && <ReelsButton url={item.reels_url} />}
          </div>
        </div>
      </div>
    </button>
  );
}

// =============================================================================
// Detail modal
// =============================================================================

/** Extract Instagram shortcode from reel/post URL */
function extractIgCode(url: string): string | null {
  const m = url.match(/instagram\.com\/(reel|p)\/([A-Za-z0-9_-]+)/);
  return m ? m[2] : null;
}

function DetailModal({
  item,
  kind,
  onClose,
}: {
  item: AnyItem;
  kind: string;
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  const embedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Load Instagram embed script once when modal opens with a reels URL
  useEffect(() => {
    if (!reelsUrl) return;
    const igCode = extractIgCode(reelsUrl);
    if (!igCode) return;

    // If instagram embed.js already loaded, just re-process
    if ((window as any).instgrm) {
      (window as any).instgrm.Embeds.process();
      return;
    }
    // Load the script
    const existing = document.getElementById('ig-embed-script');
    if (existing) return;
    const script = document.createElement('script');
    script.id = 'ig-embed-script';
    script.src = 'https://www.instagram.com/embed.js';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if ((window as any).instgrm) {
        (window as any).instgrm.Embeds.process();
      }
    };
    document.body.appendChild(script);
  }, []);

  if (!mounted) return null;

  const title = 'title' in item ? item.title : item.name;
  const photoUrl = 'cover_url' in item ? item.cover_url : item.photo_url;
  const photoAspect = kind === 'book' ? '3/4' : '4/3';

  const isBook = kind === 'book';
  const isDrink = kind === 'drink';
  const isCar = kind === 'car';
  const isMoto = kind === 'motorcycle';

  const bookItem = isBook ? (item as LibraryBook) : null;
  const drinkItem = isDrink ? (item as LibraryDrink) : null;
  const carItem = isCar ? (item as LibraryCar) : null;
  const motoItem = isMoto ? (item as LibraryMotorcycle) : null;

  const reelsUrl = drinkItem?.reels_url ?? carItem?.reels_url ?? motoItem?.reels_url;
  const linkUrl = bookItem?.link_url;
  const igCode = reelsUrl ? extractIgCode(reelsUrl) : null;

  let badge = '';
  if (bookItem) badge = BOOK_STATUS_LABELS[bookItem.status];
  if (drinkItem) badge = DRINK_CATEGORY_LABELS[drinkItem.category];
  if (carItem) badge = CAR_STATUS_LABELS[carItem.status];
  if (motoItem) badge = MOTO_STATUS_LABELS[motoItem.status];

  // If there's an IG embed, use full-column layout (embed needs more width)
  // Otherwise use the side-by-side layout
  const hasEmbed = !!igCode;

  return createPortal(
    <div
      className="lightbox-fade-in fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={`relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-[18px] bg-[var(--color-paper)] shadow-2xl ${
          hasEmbed ? 'max-w-[420px]' : 'max-w-[640px] sm:flex-row'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-colors hover:bg-black/60"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* === LAYOUT A: Instagram embed (no side photo) === */}
        {hasEmbed ? (
          <div className="flex flex-col overflow-y-auto">
            {/* Compact header */}
            <div className="flex items-start gap-3 border-b border-[var(--color-line)] px-4 py-3 pr-12">
              {photoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photoUrl}
                  alt={title}
                  className="h-12 w-12 flex-shrink-0 rounded-lg object-cover"
                />
              )}
              <div className="min-w-0">
                <Badge label={badge} />
                <h2 className="mt-0.5 truncate text-[15px] font-medium text-[var(--color-ink)]">
                  {title}
                </h2>
                {(bookItem?.author || drinkItem?.brand ||
                  carItem?.model || motoItem?.model) && (
                  <p className="truncate font-mono text-[11px] text-[var(--color-ink-4)]">
                    {bookItem?.author || drinkItem?.brand ||
                      [carItem?.model ?? motoItem?.model,
                       carItem?.year ?? motoItem?.year]
                         .filter(Boolean).join(' · ')}
                  </p>
                )}
              </div>
            </div>

            {/* Instagram embed */}
            <div
              ref={embedRef}
              className="overflow-y-auto"
              style={{ maxHeight: '70vh' }}
            >
              <blockquote
                className="instagram-media"
                data-instgrm-captioned
                data-instgrm-permalink={`https://www.instagram.com/reel/${igCode}/?utm_source=ig_embed`}
                data-instgrm-version="14"
                style={{
                  background: 'var(--color-paper)',
                  border: 0,
                  borderRadius: 0,
                  boxShadow: 'none',
                  margin: 0,
                  maxWidth: '100%',
                  minWidth: '326px',
                  padding: 0,
                  width: '100%',
                }}
              >
                {/* Fallback content while embed loads */}
                <div className="flex items-center justify-center py-12 font-mono text-[11.5px] text-[var(--color-ink-3)]">
                  <span>memuat embed Instagram...</span>
                </div>
              </blockquote>
            </div>

            {/* Footer links */}
            <div className="flex flex-wrap items-center gap-2 border-t border-[var(--color-line)] px-4 py-3">
              {item.description && (
                <p className="w-full text-[12.5px] leading-[1.55] text-[var(--color-ink-3)]">
                  {item.description}
                </p>
              )}
              <a
                href={reelsUrl!}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 px-3 py-1.5 text-[12px] font-medium text-white transition-opacity hover:opacity-90"
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M5 3l14 9-14 9V3z" />
                </svg>
                Buka di Instagram
              </a>
            </div>
          </div>
        ) : (
          /* === LAYOUT B: Normal side-by-side (no embed) === */
          <>
            {/* Photo */}
            <div
              className="w-full flex-shrink-0 overflow-hidden sm:w-[220px]"
              style={{ aspectRatio: photoAspect }}
            >
              {photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photoUrl}
                  alt={title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-[var(--color-paper-2)] text-5xl opacity-30">
                  📷
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex flex-1 flex-col overflow-y-auto p-5">
              <div className="mb-1">
                <Badge label={badge} />
              </div>
              <h2 className="mb-1 text-[20px] font-medium tracking-[-0.02em] text-[var(--color-ink)]">
                {title}
              </h2>

              {/* Sub-info */}
              <div className="mb-3 font-mono text-[11.5px] text-[var(--color-ink-3)]">
                {bookItem && (
                  <>
                    {bookItem.author && <span>{bookItem.author}</span>}
                    {bookItem.year_read && (
                      <span className="ml-2 text-[var(--color-ink-4)]">· {bookItem.year_read}</span>
                    )}
                  </>
                )}
                {drinkItem?.brand && <span>{drinkItem.brand}</span>}
                {(carItem || motoItem) && (
                  <>
                    {(carItem?.model ?? motoItem?.model) && (
                      <span>{carItem?.model ?? motoItem?.model}</span>
                    )}
                    {(carItem?.year ?? motoItem?.year) && (
                      <span className="ml-2 text-[var(--color-ink-4)]">
                        · {carItem?.year ?? motoItem?.year}
                      </span>
                    )}
                  </>
                )}
              </div>

              {item.description && (
                <p className="mb-4 flex-1 text-[14px] leading-[1.65] text-[var(--color-ink-2)]">
                  {item.description}
                </p>
              )}

              {/* Links */}
              <div className="mt-auto flex flex-wrap gap-2 pt-3">
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
                esc untuk tutup
              </p>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
