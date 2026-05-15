'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { siteConfig } from '@/lib/site-config';
import { ThemeToggle } from './theme-toggle';

export function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  // Close on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Lock body scroll when menu open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      <nav className="sticky top-0 z-50 border-b border-[var(--color-line)] bg-[color-mix(in_srgb,var(--color-paper)_78%,transparent)] backdrop-blur-md transition-colors duration-200">
        <div className="mx-auto flex max-w-[920px] items-center justify-between gap-6 px-6 py-3.5">
          <Link
            href="/"
            className="inline-flex items-center gap-1 font-mono text-sm font-medium tracking-tight text-[var(--color-ink)] transition-colors hover:text-[var(--color-accent)]"
          >
            {siteConfig.shortName.replace('/', '')}
            <span className="text-[var(--color-accent)]">/</span>
          </Link>

          {/* Desktop links */}
          <div className="hidden items-center gap-1 sm:flex">
            {siteConfig.nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-md px-2.5 py-1.5 text-[13.5px] tracking-tight transition-colors duration-200 hover:bg-[var(--color-paper-2)] ${
                  isActive(item.href)
                    ? 'text-[var(--color-ink)]'
                    : 'text-[var(--color-ink-3)] hover:text-[var(--color-ink)]'
                }`}
              >
                {item.label}
              </Link>
            ))}
            <ThemeToggle />
          </div>

          {/* Mobile: theme toggle + hamburger */}
          <div className="flex items-center gap-1 sm:hidden">
            <ThemeToggle />
            <button
              type="button"
              aria-label={open ? 'Close menu' : 'Open menu'}
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
              className="ml-1 inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--color-line)] text-[var(--color-ink-3)] transition-all hover:border-[var(--color-line-2)] hover:bg-[var(--color-paper-2)] hover:text-[var(--color-ink)]"
            >
              <HamburgerIcon open={open} />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu panel */}
      <MobileMenu
        open={open}
        onClose={() => setOpen(false)}
        isActive={isActive}
      />
    </>
  );
}

function HamburgerIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line
        x1="3"
        y1="6"
        x2="21"
        y2="6"
        style={{
          transition: 'transform 200ms ease, opacity 200ms ease',
          transformOrigin: '12px 6px',
          transform: open ? 'translateY(6px) rotate(45deg)' : 'none',
        }}
      />
      <line
        x1="3"
        y1="12"
        x2="21"
        y2="12"
        style={{
          transition: 'opacity 150ms ease',
          opacity: open ? 0 : 1,
        }}
      />
      <line
        x1="3"
        y1="18"
        x2="21"
        y2="18"
        style={{
          transition: 'transform 200ms ease',
          transformOrigin: '12px 18px',
          transform: open ? 'translateY(-6px) rotate(-45deg)' : 'none',
        }}
      />
    </svg>
  );
}

function MobileMenu({
  open,
  onClose,
  isActive,
}: {
  open: boolean;
  onClose: () => void;
  isActive: (href: string) => boolean;
}) {
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-[var(--color-paper)]/60 backdrop-blur-sm transition-opacity duration-200 sm:hidden"
        style={{
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
        }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className="fixed inset-x-0 top-[57px] z-40 border-b border-[var(--color-line)] bg-[var(--color-paper)] transition-all duration-250 sm:hidden"
        style={{
          opacity: open ? 1 : 0,
          transform: open ? 'translateY(0)' : 'translateY(-8px)',
          pointerEvents: open ? 'auto' : 'none',
          transitionTimingFunction: 'cubic-bezier(0.2, 0, 0, 1)',
        }}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
      >
        <div className="mx-auto max-w-[920px] px-6 py-4">
          <div className="mb-3 font-mono text-[11px] uppercase tracking-wide text-[var(--color-ink-4)]">
            // menu
          </div>

          <nav className="flex flex-col">
            {siteConfig.nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between border-b border-[var(--color-line)] py-3 text-[15px] tracking-tight transition-colors last:border-b-0 ${
                  isActive(item.href)
                    ? 'text-[var(--color-ink)]'
                    : 'text-[var(--color-ink-2)] hover:text-[var(--color-accent)]'
                }`}
              >
                <span>{item.label}</span>
                {isActive(item.href) && (
                  <span className="font-mono text-[10.5px] text-[var(--color-accent)]">
                    ●
                  </span>
                )}
              </Link>
            ))}
          </nav>

          <div className="mt-5 border-t border-[var(--color-line)] pt-4">
            <div className="mb-2 font-mono text-[11px] uppercase tracking-wide text-[var(--color-ink-4)]">
              // private
            </div>
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 rounded-md border border-[var(--color-line)] px-2.5 py-1.5 font-mono text-[12.5px] text-[var(--color-ink-3)] transition-all hover:border-[color-mix(in_srgb,var(--color-accent)_30%,transparent)] hover:text-[var(--color-accent)]"
            >
              <svg
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              admin login
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
