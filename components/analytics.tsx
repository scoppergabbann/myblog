import Script from 'next/script';

/**
 * Inject configured analytics providers from env vars. When none are set,
 * this renders nothing, so it is safe to keep mounted unconditionally.
 *
 * Google Analytics 4:
 *   NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
 *
 * Plausible:
 *   NEXT_PUBLIC_PLAUSIBLE_DOMAIN=belutbakarsurabaya.com
 *   NEXT_PUBLIC_PLAUSIBLE_SCRIPT (optional, default: https://plausible.io/js/script.js)
 *
 * Umami:
 *   NEXT_PUBLIC_UMAMI_WEBSITE_ID=<uuid>
 *   NEXT_PUBLIC_UMAMI_SCRIPT (optional, default: https://cloud.umami.is/script.js)
 *
 * Plausible and Umami are privacy-friendly by default. Google Analytics may
 * require consent configuration depending on the visitor's jurisdiction.
 */
export function Analytics() {
  const rawGaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();
  const gaId =
    rawGaId && /^G-[A-Z0-9]+$/i.test(rawGaId) ? rawGaId.toUpperCase() : null;

  const plausibleDomain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
  const plausibleScript =
    process.env.NEXT_PUBLIC_PLAUSIBLE_SCRIPT || 'https://plausible.io/js/script.js';

  const umamiId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;
  const umamiScript =
    process.env.NEXT_PUBLIC_UMAMI_SCRIPT || 'https://cloud.umami.is/script.js';

  return (
    <>
      {gaId && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`}
            strategy="afterInteractive"
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${gaId}');
            `}
          </Script>
        </>
      )}
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
