import 'server-only';
import { createHmac, timingSafeEqual } from 'crypto';

/**
 * Generate a stable HMAC token for a given slug, signed with ADMIN_SECRET.
 * Anyone with the URL+token can preview a draft. The token does not expire
 * because it's per-slug; rotating ADMIN_SECRET invalidates all old links.
 */
export function makeDraftToken(slug: string): string {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return '';
  const h = createHmac('sha256', secret);
  h.update(`draft:${slug}`);
  return h.digest('hex').slice(0, 24);
}

/**
 * Constant-time comparison against the expected token.
 */
export function verifyDraftToken(slug: string, token: string): boolean {
  const expected = makeDraftToken(slug);
  if (!expected || !token) return false;
  if (expected.length !== token.length) return false;
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(token));
  } catch {
    return false;
  }
}
