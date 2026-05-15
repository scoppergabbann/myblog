import 'server-only';
import { createHash } from 'crypto';
import { headers } from 'next/headers';

/**
 * Derive a stable hash from client IP, salted with ADMIN_SECRET.
 * We never store raw IP. Used to rate-limit per-IP and detect abuse
 * without keeping personally identifiable info.
 */
export async function getIpHash(): Promise<string> {
  const h = await headers();
  const forwarded = h.get('x-forwarded-for');
  const realIp = h.get('x-real-ip');
  const ip = forwarded?.split(',')[0]?.trim() || realIp || 'unknown';

  const salt = process.env.ADMIN_SECRET || 'dev-salt';
  return createHash('sha256').update(`${salt}:${ip}`).digest('hex').slice(0, 32);
}
