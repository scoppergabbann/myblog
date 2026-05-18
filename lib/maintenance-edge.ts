/**
 * Edge-friendly maintenance check.
 *
 * Used in middleware (Edge runtime). Fetches site_settings via Supabase
 * REST API directly (no SDK overhead). Caches in module-level memory with
 * 30s TTL — survives between middleware invocations within the same Edge
 * isolate, resets on cold start.
 *
 * Fail-open: if fetch fails, return `false` (don't lock out site).
 */

type CachedState = {
  enabled: boolean;
  expiresAt: number;
};

let cache: CachedState | null = null;
const CACHE_TTL_MS = 30_000;

export async function isMaintenanceEnabled(): Promise<boolean> {
  const now = Date.now();
  if (cache && cache.expiresAt > now) {
    return cache.enabled;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return false;

  try {
    const res = await fetch(
      `${url}/rest/v1/site_settings?id=eq.1&select=maintenance_enabled`,
      {
        headers: {
          apikey: anon,
          authorization: `Bearer ${anon}`,
        },
        // Edge runtime: respect cache, but make it short
        next: { revalidate: 30 },
      }
    );
    if (!res.ok) {
      // Fail-open
      cache = { enabled: false, expiresAt: now + CACHE_TTL_MS };
      return false;
    }
    const rows = (await res.json()) as Array<{ maintenance_enabled: boolean }>;
    const enabled = rows[0]?.maintenance_enabled === true;
    cache = { enabled, expiresAt: now + CACHE_TTL_MS };
    return enabled;
  } catch {
    return false;
  }
}

/** Force next check to bypass cache. Used by admin server action after toggle. */
export function clearMaintenanceCache() {
  cache = null;
}
