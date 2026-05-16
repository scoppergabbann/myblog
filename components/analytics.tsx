import Script from 'next/script';

/**
 * Inject Plausible OR Umami analytics based on env vars. If neither is set,
 * renders nothing — safe to keep mounted in production unconditionally.
 *
 * Plausible:
 *   NEXT_PUBLIC_PLAUSIBLE_DOMAIN=belutbakarsurabaya.com
 *   NEXT_PUBLIC_PLAUSIBLE_SCRIPT (optional, default: https://plausible.io/js/script.js)
 *
 * Umami:
 *   NEXT_PUBLIC_UMAMI_WEBSITE_ID=<uuid>
 *   NEXT_PUBLIC_UMAMI_SCRIPT (optional, default: https://cloud.umami.is/script.js)
 *
 * Privacy-friendly: no cookies, no fingerprinting, GDPR-compliant by default.
 */
export function Analytics() {
  const plausibleDomain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
  const plausibleScript =
    process.env.NEXT_PUBLIC_PLAUSIBLE_SCRIPT || 'https://plausible.io/js/script.js';

  const umamiId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;
  const umamiScript =
    process.env.NEXT_PUBLIC_UMAMI_SCRIPT || 'https://cloud.umami.is/script.js';

  return (
    <>
      {plausibleDomain && (
        <Script
          defer
          data-domain={plausibleDomain}
          src={plausibleScript}
          strategy="afterInteractive"
        />
      )}
      {umamiId && (
        <Script
          defer
          data-website-id={umamiId}
          src={umamiScript}
          strategy="afterInteractive"
        />
      )}
    </>
  );
}
