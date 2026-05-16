import { siteConfig } from '@/lib/site-config';

export function Footer() {
  return (
    <footer className="mt-32 border-t border-[var(--color-line)] py-10 pb-14">
      <div className="mx-auto flex max-w-[920px] flex-wrap items-center justify-between gap-6 px-6">
        <p className="text-[12.5px] text-[var(--color-ink-4)]">
          {siteConfig.name}.com ·{' '}
          <span className="font-mono">{siteConfig.shortName}</span> · last
          updated{' '}
          <span className="font-mono text-[var(--color-ink-3)]">
            Sabtu, 17 Mei 2026
          </span>
        </p>
        <div className="flex gap-[18px]">
          <a
            href="#"
            className="text-[12.5px] text-[var(--color-ink-3)] transition-colors hover:text-[var(--color-accent)]"
          >
            © Copyright 2026
          </a>
          <a
            href={`#`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[12.5px] text-[var(--color-ink-3)] transition-colors hover:text-[var(--color-accent)]"
          >
            github
          </a>
          <a
            href={`mailto:mcfawwaz@hotmail.com`}
            className="text-[12.5px] text-[var(--color-ink-3)] transition-colors hover:text-[var(--color-accent)]"
          >
            email
          </a>
        </div>
      </div>
    </footer>
  );
}
