'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import type { HomeContentUpdate, HomeUpdateKind } from '@/lib/home-updates';

const STORAGE_KEY = 'bbs-home-updates-seen-v1';

const KIND_STYLES: Record<HomeUpdateKind, string> = {
  writing: 'bg-[#d95125]',
  monolog: 'bg-[#8755d7]',
  library: 'bg-[#3a8d61]',
  now: 'bg-[#d69a2d]',
};

export function HomeUpdateBird({ updates }: { updates: HomeContentUpdate[] }) {
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const newestTimestamp = useMemo(() => updates.reduce(
    (latest, update) => Math.max(latest, Date.parse(update.publishedAt) || 0),
    0
  ), [updates]);

  useEffect(() => {
    const seenTimestamp = Number(window.localStorage.getItem(STORAGE_KEY) ?? 0);
    setUnreadCount(updates.filter((update) => Date.parse(update.publishedAt) > seenTimestamp).length);
  }, [updates]);

  useEffect(() => {
    if (!open) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [open]);

  function togglePanel() {
    setOpen((current) => {
      const next = !current;
      if (next && newestTimestamp > 0) {
        window.localStorage.setItem(STORAGE_KEY, String(newestTimestamp));
        setUnreadCount(0);
      }
      return next;
    });
  }

  return (
    <div className={`home-bird-notifier fixed inset-0 z-[70] pointer-events-none ${open ? 'is-open' : ''}`}>
      {open && (
        <section
          id="home-update-panel"
          role="dialog"
          aria-modal="false"
          aria-labelledby="home-update-title"
          className="pointer-events-auto fixed bottom-[122px] right-4 isolate w-[min(390px,calc(100vw-2rem))] overflow-visible rounded-[24px] border border-[var(--color-line-2)] bg-[var(--color-paper)] sm:right-6"
        >
          <span className="home-bird-box-perch" aria-hidden="true">
            <BirdSvg />
          </span>
          <header className="flex items-start justify-between gap-5 border-b border-[var(--color-line)] px-5 py-5">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-accent)]">Dari seluruh kebun</p>
              <h2 id="home-update-title" className="mt-1 text-[23px] font-medium tracking-[-0.035em] text-[var(--color-ink)]">Burung pembawa kabar.</h2>
              <p className="mt-1 text-[13px] leading-5 text-[var(--color-ink-3)]">Pembaruan terbaru dari tulisan, suara, koleksi, dan aktivitas.</p>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Tutup kabar terbaru" className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[var(--color-line)] text-[var(--color-ink-3)] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]">×</button>
          </header>

          <div className="max-h-[min(42vh,360px)] overflow-y-auto overscroll-contain">
            {updates.length > 0 ? updates.map((update) => (
              <Link key={update.id} href={update.href} className="group block border-b border-[var(--color-line)] px-5 py-4 last:border-b-0 hover:bg-[var(--color-paper-2)]">
                <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.13em] text-[var(--color-ink-4)]">
                  <span className={`h-2 w-2 rounded-full ${KIND_STYLES[update.kind]}`} aria-hidden="true" />
                  <span>{update.label}</span>
                  <span aria-hidden="true">·</span>
                  <time dateTime={update.publishedAt}>{formatUpdateDate(update.publishedAt)}</time>
                </div>
                <h3 className="mt-2 text-[15px] font-medium leading-snug text-[var(--color-ink)] transition-colors group-hover:text-[var(--color-accent)]">{update.title}</h3>
                <p className="mt-1 line-clamp-2 text-[12.5px] leading-5 text-[var(--color-ink-3)]">{update.summary}</p>
              </Link>
            )) : (
              <p className="px-5 py-8 text-center text-[14px] text-[var(--color-ink-3)]">Belum ada kabar baru.</p>
            )}
          </div>
          <p className="border-t border-[var(--color-line)] px-5 py-3 text-center font-mono text-[10px] text-[var(--color-ink-4)]">Kabar ditandai terbaca ketika panel dibuka.</p>
        </section>
      )}

      <button
        type="button"
        aria-label={unreadCount > 0 ? `Buka ${unreadCount} kabar terbaru` : 'Buka kabar terbaru'}
        aria-expanded={open}
        aria-controls="home-update-panel"
        onClick={togglePanel}
        className="home-bird-perch pointer-events-auto fixed bottom-[max(0.75rem,env(safe-area-inset-bottom))] right-[max(0.75rem,env(safe-area-inset-right))] h-[108px] w-[148px] sm:right-[max(1.25rem,env(safe-area-inset-right))]"
      >
        <span className="home-bird-sprite home-bird-route-sprite absolute bottom-[29px] right-[39px] block h-[66px] w-[72px]" aria-hidden="true">
          <BirdSvg />
        </span>
        <BranchSvg />
        <span className="absolute bottom-[8px] right-[22px] rounded-full border border-[#6f472e] bg-[#8d5b37] px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.12em] text-[#fff8ec]">kabar baru</span>
        {unreadCount > 0 && (
          <span aria-live="polite" className="absolute right-[19px] top-[15px] grid h-7 min-w-7 place-items-center rounded-full border-2 border-[var(--color-paper)] bg-[var(--color-accent)] px-1.5 text-[11px] font-semibold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
    </div>
  );
}

function BirdSvg() {
  return (
    <svg viewBox="0 0 82 72" className="h-full w-full overflow-visible" role="presentation">
      <g className="home-bird-body">
        <g className="home-bird-legs">
          <path d="M21 47c-4 8-3 15 1 19M35 49c-1 8 1 13 6 17" fill="none" stroke="#68412c" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M19 65h10M38 66h10" fill="none" stroke="#68412c" strokeWidth="2.5" strokeLinecap="round" />
        </g>
        <path className="home-bird-wing-back" d="M39 36C31 15 18 4 7 8c4 15 14 29 29 39Z" fill="#b94b31" />
        <g className="home-bird-tail">
          <path d="M25 48C14 49 6 45 1 37c10-3 20-1 30 6Z" fill="#873b2c" />
          <path d="M27 44C16 40 10 34 8 26c10 1 19 6 27 14Z" fill="#a8482e" />
        </g>
        <ellipse cx="37" cy="37" rx="25" ry="19" fill="#c75a31" />
        <path className="home-bird-folded-wing" d="M42 34c-10-8-23-7-29 2 8 4 14 11 21 17 9-3 13-10 8-19Z" fill="#efa049" />
        <path className="home-bird-wing-front" d="M42 36C27 25 13 25 4 34c9 9 21 16 34 17 8-4 10-9 4-15Z" fill="#f5b052" />
        <circle cx="57" cy="25" r="15" fill="#d86c3c" />
        <path d="m70 25 11 5-11 4Z" fill="#e5a23c" />
        <circle cx="61" cy="21" r="2.3" fill="#201b17" />
        <path d="M50 10c3-7 9-9 14-8-2 5-5 9-10 12" fill="#3d7a58" />
      </g>
    </svg>
  );
}

function BranchSvg() {
  return (
    <svg viewBox="0 0 148 58" className="absolute bottom-0 left-0 h-[58px] w-[148px] overflow-visible" aria-hidden="true">
      <path d="M8 31c34 4 70 1 130-10" fill="none" stroke="#68412c" strokeWidth="11" strokeLinecap="round" />
      <path d="M11 27c39 4 77 0 124-8" fill="none" stroke="#a16b43" strokeWidth="4" strokeLinecap="round" opacity=".75" />
      <path d="M101 23c8-12 18-16 28-14-4 9-13 15-28 14ZM29 31C22 20 13 17 5 20c5 8 13 12 24 11Z" fill="#4b825e" />
    </svg>
  );
}

function formatUpdateDate(value: string) {
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Jakarta' }).format(new Date(value));
}
