'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { siteConfig } from '@/lib/site-config';
import { ThemeToggle } from './theme-toggle';

export function Nav() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <nav className="sticky top-0 z-50 border-b border-[var(--color-line)] bg-[color-mix(in_srgb,var(--color-paper)_78%,transparent)] backdrop-blur-md transition-colors duration-200">
      <div className="mx-auto flex max-w-[920px] items-center justify-between gap-6 px-6 py-3.5">
        <Link
          href="/"
          className="inline-flex items-center gap-1 font-mono text-sm font-medium tracking-tight text-[var(--color-ink)] transition-colors hover:text-[var(--color-accent)]"
        >
          {siteConfig.shortName.replace('/', '')}
          <span className="text-[var(--color-accent)]">/</span>
        </Link>

        <div className="flex items-center gap-1">
          {siteConfig.nav.map((item) => {
            const hideMobile =
              item.label === 'about' ||
              item.label === 'uses' ||
              item.label === 'guestbook';
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-md px-2.5 py-1.5 text-[13.5px] tracking-tight transition-colors duration-200 hover:bg-[var(--color-paper-2)] ${
                  isActive(item.href)
                    ? 'text-[var(--color-ink)]'
                    : 'text-[var(--color-ink-3)] hover:text-[var(--color-ink)]'
                } ${hideMobile ? 'hidden sm:inline-block' : ''}`}
              >
                {item.label}
              </Link>
            );
          })}
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}
