/**
 * Build info — just the deploy timestamp.
 *
 * NEXT_PUBLIC_BUILD_TIME is set in `next.config.mjs` using
 * `new Date().toISOString()` at config-load time (= true build time).
 * Since Vercel auto-deploys on every push, this is effectively the
 * "last updated" timestamp for the site.
 *
 * In local dev, builtAt = the time `npm run dev` started.
 */
export type BuildInfo = {
  /** ISO timestamp of when the deployment was built */
  builtAt: string;
};

export function getBuildInfo(): BuildInfo {
  return {
    builtAt: process.env.NEXT_PUBLIC_BUILD_TIME || new Date().toISOString(),
  };
}
