import 'server-only';

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

/**
 * Token bucket rate limiter. In-memory — fine for single-instance
 * Vercel deployments. For multi-region, swap with Upstash Ratelimit.
 *
 * @param key   Unique identifier (e.g., `guestbook:${ipHash}`)
 * @param max   Max requests per window
 * @param windowMs Window in ms
 * @returns true if allowed, false if rate-limited
 */
export function rateLimit(
  key: string,
  max: number,
  windowMs: number
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const b = buckets.get(key);

  if (!b || now > b.resetAt) {
    const resetAt = now + windowMs;
    buckets.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: max - 1, resetAt };
  }

  if (b.count >= max) {
    return { allowed: false, remaining: 0, resetAt: b.resetAt };
  }

  b.count++;
  return { allowed: true, remaining: max - b.count, resetAt: b.resetAt };
}

// Lazy cleanup to prevent unbounded growth on long-running servers
setInterval(() => {
  const now = Date.now();
  for (const [k, b] of buckets.entries()) {
    if (now > b.resetAt) buckets.delete(k);
  }
}, 60_000).unref?.();
