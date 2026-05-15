'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

/**
 * A subtle top progress bar that appears during page navigation.
 * Listens to all link clicks; uses pathname/searchParams change to mark "done".
 *
 * Mounted once in the root layout. No "loading..." text needed.
 */
export function NavProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const animRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);

  // Start progress when an internal link is clicked
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      // Find nearest anchor
      let el = e.target as HTMLElement | null;
      while (el && el.tagName !== 'A') el = el.parentElement;
      if (!el) return;
      const anchor = el as HTMLAnchorElement;
      const href = anchor.getAttribute('href');
      if (!href) return;
      // Skip: external, anchor-only, mailto, new tab, modifier click
      if (
        href.startsWith('http') ||
        href.startsWith('mailto:') ||
        href.startsWith('#') ||
        anchor.target === '_blank' ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey ||
        e.button !== 0
      ) {
        return;
      }
      // Same path? Skip.
      if (
        href === window.location.pathname + window.location.search ||
        href === window.location.pathname
      ) {
        return;
      }
      start();
    };

    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  // Mark "done" when pathname/searchParams change (new page rendered)
  useEffect(() => {
    finish();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams]);

  const start = () => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    startRef.current = performance.now();
    setProgress(0);
    setVisible(true);

    const tick = () => {
      const elapsed = performance.now() - (startRef.current ?? performance.now());
      // Logarithmic curve approaching ~85% — never reach 100% until "finish"
      const target = Math.min(0.85, 1 - Math.exp(-elapsed / 800));
      setProgress(target);
      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
  };

  const finish = () => {
    if (animRef.current) {
      cancelAnimationFrame(animRef.current);
      animRef.current = null;
    }
    setProgress(1);
    // Fade out after reaching 100%
    setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 200);
  };

  return (
    <div
      aria-hidden="true"
      className="nav-progress"
      style={{
        width: `${progress * 100}%`,
        opacity: visible ? 1 : 0,
      }}
    />
  );
}
