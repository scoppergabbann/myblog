import type { Metadata } from 'next';
import { getSiteSettings } from '@/lib/site-settings';
import { siteConfig } from '@/lib/site-config';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Sedang dalam perbaikan',
  description: 'Halaman ini sedang dalam perbaikan singkat.',
  robots: { index: false, follow: false },
};

export default async function MaintenancePage() {
  const settings = await getSiteSettings();

  return (
    <div className="mx-auto max-w-[560px] px-6 py-16 sm:py-24">
      <div className="mb-8 flex items-center gap-2 font-mono text-[12px] text-[var(--color-ink-3)]">
        <span className="maintenance-dot inline-block h-2 w-2 rounded-full bg-[var(--color-accent)]" />
        <span>bbs<span className="text-[var(--color-accent)]">/</span></span>
        <span className="text-[var(--color-ink-4)]">·</span>
        <span>maintenance</span>
      </div>

      {/* Illustration: animated "working on it" scene */}
      <div className="mb-10 flex justify-center">
        <MaintenanceIllustration />
      </div>

      <h1 className="mb-4 text-center text-[32px] font-medium tracking-[-0.025em] text-[var(--color-ink)] max-sm:text-[26px]">
        {settings.maintenanceTitle}
      </h1>

      <p className="mb-8 text-center text-[16px] leading-[1.65] text-[var(--color-ink-2)] max-sm:text-[14.5px]">
        {settings.maintenanceMessage}
      </p>

      {(settings.maintenanceEta || settings.maintenanceContact) && (
        <div className="mx-auto max-w-[420px] space-y-3 rounded-[14px] border border-[var(--color-line)] bg-[var(--color-paper)] p-5">
          {settings.maintenanceEta && (
            <div className="flex items-start gap-3">
              <span className="mt-0.5 font-mono text-[11px] uppercase tracking-wider text-[var(--color-ink-4)]">
                eta
              </span>
              <span className="flex-1 text-[14px] text-[var(--color-ink-2)]">
                {settings.maintenanceEta}
              </span>
            </div>
          )}
          {settings.maintenanceContact && (
            <div className="flex items-start gap-3">
              <span className="mt-0.5 font-mono text-[11px] uppercase tracking-wider text-[var(--color-ink-4)]">
                kontak
              </span>
              <a
                href={
                  settings.maintenanceContact.includes('@')
                    ? `mailto:${settings.maintenanceContact}`
                    : settings.maintenanceContact
                }
                className="flex-1 break-all text-[14px] text-[var(--color-accent)] transition-opacity hover:opacity-80"
              >
                {settings.maintenanceContact}
              </a>
            </div>
          )}
        </div>
      )}

      <p className="mt-10 text-center font-mono text-[11.5px] text-[var(--color-ink-4)]">
        {siteConfig.name}.com · halaman akan auto-refresh tiap 30 detik
      </p>

      {/* Auto-refresh after 30s in case maintenance ends */}
      <meta httpEquiv="refresh" content="30" />
    </div>
  );
}

function MaintenanceIllustration() {
  return (
    <div className="relative h-[160px] w-[200px]">
      {/* SVG illustration: a workbench with a hammer + wrench, gentle animations */}
      <svg
        viewBox="0 0 200 160"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-full w-full"
        aria-hidden="true"
      >
        {/* Workbench surface */}
        <line
          x1="20"
          y1="120"
          x2="180"
          y2="120"
          stroke="var(--color-line-2)"
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* Wrench (rotating gently) */}
        <g className="maintenance-wrench" style={{ transformOrigin: '70px 100px' }}>
          <circle
            cx="70"
            cy="100"
            r="14"
            stroke="var(--color-ink-3)"
            strokeWidth="3"
            fill="none"
          />
          <circle cx="70" cy="100" r="6" fill="var(--color-paper)" />
          <line
            x1="80"
            y1="110"
            x2="105"
            y2="135"
            stroke="var(--color-ink-3)"
            strokeWidth="6"
            strokeLinecap="round"
          />
        </g>

        {/* Hammer (gentle tap motion) */}
        <g
          className="maintenance-hammer"
          style={{ transformOrigin: '140px 95px' }}
        >
          <rect
            x="115"
            y="65"
            width="50"
            height="20"
            rx="3"
            fill="var(--color-accent)"
          />
          <line
            x1="140"
            y1="85"
            x2="140"
            y2="120"
            stroke="var(--color-ink-3)"
            strokeWidth="6"
            strokeLinecap="round"
          />
        </g>

        {/* Sparks (dot pulses) */}
        <circle
          cx="100"
          cy="55"
          r="2"
          fill="var(--color-accent)"
          className="maintenance-spark spark-1"
        />
        <circle
          cx="115"
          cy="40"
          r="1.5"
          fill="var(--color-accent)"
          className="maintenance-spark spark-2"
        />
        <circle
          cx="85"
          cy="45"
          r="1.5"
          fill="var(--color-accent)"
          className="maintenance-spark spark-3"
        />

        {/* Subtle floor shadow */}
        <ellipse
          cx="100"
          cy="135"
          rx="60"
          ry="3"
          fill="var(--color-line)"
          opacity="0.5"
        />
      </svg>
    </div>
  );
}
