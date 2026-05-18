import { siteConfig } from '@/lib/site-config';
import { getBuildInfo } from '@/lib/build-info';
import { relativeTimeId, formatDate } from '@/lib/utils';

export function Footer() {
  const build = getBuildInfo();
  const lastUpdated = relativeTimeId(build.builtAt);
  const exactTime = formatDate(build.builtAt, true);

  return (
    <footer className="mt-32 border-t border-[var(--color-line)] py-10 pb-14">
      <div className="mx-auto flex max-w-[920px] flex-wrap items-center justify-between gap-6 px-6">
        <p className="text-[12.5px] text-[var(--color-ink-4)]">
          {siteConfig.name}.com ·{' '}
          <span className="font-mono">{siteConfig.shortName}</span> · last
          updated{' '}
          <time
            dateTime={build.builtAt}
            title={exactTime}
            className="font-mono text-[var(--color-ink-3)]"
          >
            {lastUpdated}
          </time>
        </p>
        <div className="flex gap-[18px]">
          <a
            href="/rss.xml"
            className="text-[12.5px] text-[var(--color-ink-3)] transition-colors hover:text-[var(--color-accent)]"
          >
            rss
          </a>
          <a
            href={`https://github.com/${siteConfig.author.github}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[12.5px] text-[var(--color-ink-3)] transition-colors hover:text-[var(--color-accent)]"
          >
            github
          </a>
          <a
            href={`mailto:${siteConfig.author.email}`}
            className="text-[12.5px] text-[var(--color-ink-3)] transition-colors hover:text-[var(--color-accent)]"
          >
            email
          </a>
        </div>
      </div>
    </footer>
  );
}
