# SEO Audit Result - Stage 1

## Homepage Rendering and Mobile Baseline

- Homepage, about and one published article tested at 390x844 in local headless
  Edge, without network/CPU throttling. All had one H1, no page overflow and a
  functioning mobile menu. Measurements observe 5 seconds; these are not field
  CWV scores, percentile results or INP measurements.
- Found homepage visible heading empty with JavaScript disabled. Initial state
  now renders the complete heading on the server. Typing replay starts after
  eight seconds, retaining the existing effect and reduced-motion handling.
- Single-run homepage LCP: 1324ms before, 788ms after. Observed layout-shift sum:
  0.0435 before, 0 after. Variability/caching applies; do not claim field gains.
- About after: LCP 348ms; article after: 2944ms; both observed shift sums 0.
  Article remains a performance investigation target.
- Build including TypeScript passed. No deployment performed; lint setup remains
  pending. Reproducible browser check: scripts/check-public-performance.cjs.
- Machine-readable before/after samples are generated under artifacts/.

## Library Image Optimization

- Library covers, modal photos and thumbnails use responsive next/image with
  stable existing aspect-ratio containers. Cloudinary allowlist is restricted
  to the actual dvalads2e account. Other external URLs retain unoptimized display.
- Mobile/desktop headless Edge checks at 390x900 and 1440x900: no document
  overflow; carousel forward/back and modal open/close passed without page errors.
  Before/after screenshots are generated in artifacts/ and were inspected.
- First cover was a 2048px source for a 163px mobile card. Browser now requests
  a 256px variant on this test device; desktop requests 384px for a 334px card.
- Sample measured payload: original JPEG 962858 bytes, optimized mobile WebP
  9300 bytes. Both returned 200. This is one-image evidence, not a CWV score.
- Production build and TypeScript passed. No production deployment performed.
- Reproduce: node scripts/check-library-browser.cjs <playwright-module-path>
  http://127.0.0.1:3031 after. Test uses installed Edge in headless mode.
- Remaining: field/lab LCP, INP, CLS measurement across other public pages,
  image-heavy articles, full mobile navigation, and existing lint setup.

## Article 404 Follow-up

- Fixed streamed public article 404s with a minimal server-side existence check
  before rendering. Only the slug is selected; unpublished posts require a valid
  existing draft HMAC token. Database errors/timeouts return 503, never 404.
- Missing public article URLs rewrite to the existing not-found UI with HTTP
  404 and X-Robots-Tag: noindex. Loading UI and ordinary streaming are preserved.
- Local HTTP tests with browser and Googlebot user agents: missing article 404,
  missing article plus invalid preview token 404, published article 200.
- Build passed. Regression tests cover preview-token compatibility and database
  failures. Additional query latency per article request is a tradeoff; mobile
  performance measurement remains pending. Not deployed.
- Current local production test server: http://127.0.0.1:3031.

## Database Recovery and HTTP Verification

- User corrected local credentials to the active tdrjrzopcczhwqwsqida project.
  No secret values were printed. Typecheck, behavior tests, and production build
  now pass with real database content (25 generated pages).
- Local production server: http://127.0.0.1:3026.
- Sitemap: HTTP 200, 118 URLs, no admin/sambat/preview entries.
- /writing?page=2: HTTP 200 and self canonical including page=2.
- /library: HTTP 200, index/follow and correct canonical.
- /admin/login: HTTP 200 and noindex/nofollow.
- An actual published article: HTTP 200 and its own canonical.
- Remaining issue: unknown article HTTP 200 with noindex and inherited index
  metadata in streamed HTML. Needs a dedicated pre-stream 404 fix; do not treat
  the previous generic-route 404 check as proof that article 404s are correct.
- No deployment performed. Mobile/performance and maintenance end-to-end checks
  remain pending. Existing lint configuration still needs repair.

## Stage 3 Update

- Maintenance now rewrites to the existing maintenance page with status 503,
  Retry-After: 60 and Cache-Control: no-store. Admin access and crawler access
  to robots.txt/sitemap.xml remain available. Direct maintenance requests also
  get 503 while enabled; disabled maintenance still redirects to home.
- Published article lists/slugs and library reads now throw on database failures
  instead of returning misleading empty collections. Actual empty results are
  still supported; article-not-found remains distinct from database failure.
- Writing list derives its tags from the same fetched posts, removing a second
  full article query per request.
- Added scripts/check-seo-behavior.cjs: uses the real NextResponse implementation
  with mocked auth/database/maintenance to verify statuses, headers, bypasses,
  and failed versus empty/missing database results. Checks passed.
- Typecheck passed; production compilation passed. Production build FAILED
  during tag data collection because the configured Supabase hostname returned
  ENOTFOUND. This is now surfaced rather than silently shipping empty content.
- A working database is required for the next successful production build.
  Check project availability and NEXT_PUBLIC_SUPABASE_URL in .env.local/Vercel.
  No credentials or remote database settings were changed.
- End-to-end maintenance HTTP/render verification and mobile/CWV/image work
  remain pending; no performance-score improvement is claimed. Not deployed.

## Stage 2 Update

- Live read-only checks: HTTPS homepage, robots.txt and sitemap.xml returned
  200; an unknown route returned 404. HTTP redirected to HTTPS with 308.
- www returned 200 independently of the apex domain. Added host-specific 308
  redirect in next.config.mjs; deployment is required for it to take effect.
- Added shared page metadata helper for public sections and tag archives:
  matching canonical, Open Graph URL/title/description/image and Twitter metadata.
- Corrected writing pagination: page 2 and later now have their own canonical
  and title; tracking parameters do not appear in canonical URLs.
- Added truthful WebSite JSON-LD on homepage and visible article breadcrumbs
  with matching BreadcrumbList. Author identity remains pending confirmation.
- Article query failures now throw instead of being treated as missing articles.
  List queries still need a separate error-handling pass.
- Added X-Robots-Tag noindex header for non-production Vercel deployments.
- Typecheck passed. Production build and generated HTML metadata are checked
  locally; database-backed checks remain limited by local Supabase DNS failure.
- Existing lint command is still incompatible; no lint success is claimed.
- Maintenance 503 behavior, live deployed changes, mobile/CWV measurements and
  remaining content/author refinements are still pending. No deployment performed.

Reference: https://developers.google.com/search/docs/specialty/ecommerce/pagination-and-incremental-page-loading

Scope: source audit and indexing foundations. This is not a completed live-site,
mobile, Search Console, or Core Web Vitals audit. No deployment performed.

## Architecture

- Next.js 16.3.1 App Router, React 18.3, TypeScript, Tailwind v4, Vercel.
- Supabase stores content; NextAuth controls admin and sambat access.
- Public routes: /, /about, /writing, /projects, /library, /now, /guestbook, /uses.
- Articles: /writing/[slug]; tag archives: /writing/tag/[tag].
- Private routes: /admin, /sambat; token-protected writing previews.
- Public content is server rendered (ISR or dynamic); library pagination and
  writing filters run in client components. Native Metadata API is already used.
- API endpoints provide authentication and generated OG images; RSS/JSON feeds
  exist. Fonts use next/font; Figure uses next/image. Library uses regular images.

## Critical / High Issues

- Fixed: root canonical was inherited as homepage by other public pages.
- Fixed: site URL could accept localhost or Vercel preview as canonical origin.
- Fixed: sitemap fabricated static modification dates and used publication dates
  for article modifications. It now reads real updated_at values.
- Fixed: sitemap now queries published records only, includes tag archives and
  /uses, and fails on DB errors instead of returning an incomplete success.
- Fixed: preview/development root metadata uses noindex. Private layouts and
  preview routes already have noindex. Robots permits crawlers to see these tags;
  authentication remains the access boundary. Auth API remains disallowed.
- Fixed: article JSON-LD escapes less-than characters; premium status is explicit.
- Outstanding: local Supabase hostname fails DNS resolution. Data-dependent
  article, sitemap and indexing validation needs a working database connection.
- Outstanding: post queries return null/empty lists on DB failure, potentially
  causing false 404s/empty pages. Review failure behavior in the next stage.

## Improvements Implemented / Files Modified

- lib/site-config.ts: normalized HTTPS production origin with fallback.
- app/layout.tsx: removed inherited canonical, added optional Google verification.
- app/page.tsx and public */page.tsx: page-specific canonicals.
- app/writing/[slug]/page.tsx: article canonical and JSON-LD escaping.
- app/writing/tag/[tag]/page.tsx: normalized and encoded tag canonical;
  avoid double decoding route parameters and pre-encoding static params.
- app/sitemap.ts, app/robots.ts: indexing configuration above.
- .env.example: production URL and optional GOOGLE_SITE_VERIFICATION.
- Existing analytics changes were preserved.

## Validation

- TypeScript check passed.
- Build verification performed; local database DNS failures affect content reads.
- Existing lint command `next lint` fails on this Next.js version. No ESLint
  dependency/config exists in the package manifest; lint setup remains pending.
- No test script is configured. Live HTTP statuses, redirect behavior, dynamic
  sitemap contents and mobile layout remain unverified.

## Next Stages

1. Finish P0: verify production HTTP/HTTPS and www redirects, preview headers,
   maintenance status behavior, unknown article 404s and database error handling.
2. P1: per-page social metadata, real author identity (currently "Penulis"),
   truthful website/article/breadcrumb schema, heading and internal-link review.
3. P2: measure mobile/desktop performance, library image sizes, layout shifts,
   hydration and third-party scripts. No measured performance improvement claimed.
4. P3/P4: minimal copy improvements and final social previews based on real content.

## Manual Actions / Google Search Console

1. Deploy after review; set NEXT_PUBLIC_SITE_URL=https://belutbakarsurabaya.com.
2. Verify database URL/project availability and credentials in Vercel; confirm
   /sitemap.xml returns 200 with actual published articles before submission.
3. Add a Domain property in Search Console and verify via its DNS TXT record.
   GOOGLE_SITE_VERIFICATION is optional for a URL-prefix HTML-tag property only.
4. Submit https://belutbakarsurabaya.com/sitemap.xml.
5. Inspect homepage, /writing and a published article; run live URL tests and
   request indexing after successful validation.
6. Monitor Pages/Indexing, Core Web Vitals, HTTPS and applicable rich-result reports.

References:
- https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
- https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag
