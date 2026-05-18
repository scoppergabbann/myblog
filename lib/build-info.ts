import 'server-only';
import { siteConfig } from './site-config';

/**
 * Build info derived from Vercel env vars + custom build-time injection.
 *
 * Auto-set by Vercel during build (no manual config needed):
 *   VERCEL_GIT_COMMIT_SHA       — full commit SHA
 *   VERCEL_GIT_COMMIT_REF       — branch name
 *   VERCEL_GIT_REPO_OWNER       — github username/org
 *   VERCEL_GIT_REPO_SLUG        — repo name
 *   VERCEL_GIT_PROVIDER         — 'github', 'gitlab', etc.
 *
 * Build timestamp comes from NEXT_PUBLIC_BUILD_TIME, which is set in
 * `next.config.mjs` using new Date().toISOString() at config-load time
 * (= true build time). Since Vercel auto-deploys on every push, this is
 * effectively the commit timestamp (within a few seconds).
 *
 * In local dev, builtAt = the time `npm run dev` started.
 */

export type BuildInfo = {
  builtAt: string;
  shortSha: string | null;
  fullSha: string | null;
  commitUrl: string | null;
  branch: string | null;
};

export function getBuildInfo(): BuildInfo {
  const builtAt =
    process.env.NEXT_PUBLIC_BUILD_TIME || new Date().toISOString();
  const fullSha = process.env.VERCEL_GIT_COMMIT_SHA || null;
  const shortSha = fullSha ? fullSha.slice(0, 7) : null;
  const branch = process.env.VERCEL_GIT_COMMIT_REF || null;
  const owner = process.env.VERCEL_GIT_REPO_OWNER;
  const repo = process.env.VERCEL_GIT_REPO_SLUG;
  const provider = process.env.VERCEL_GIT_PROVIDER || 'github';

  const commitUrl =
    fullSha && owner && repo && provider === 'github'
      ? `https://github.com/${owner}/${repo}/commit/${fullSha}`
      : fullSha && siteConfig.author.github
        ? `https://github.com/${siteConfig.author.github}/bbs-site/commit/${fullSha}`
        : null;

  return {
    builtAt,
    shortSha,
    fullSha,
    commitUrl,
    branch,
  };
}
