import 'server-only';
import { cookies } from 'next/headers';
import { createHash, randomUUID } from 'node:crypto';

const COOKIE = 'bbs-stream-visitor';
export async function getStreamVisitorHash(create = false): Promise<string | null> {
  const jar = await cookies();
  let visitor = jar.get(COOKIE)?.value;
  if (!visitor || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(visitor)) {
    if (!create) return null;
    visitor = randomUUID();
    jar.set(COOKIE, visitor, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 60 * 60 * 24 * 365 });
  }
  // Reuse the existing reaction identity column without storing raw cookie IDs.
  return createHash('sha256').update(`stream-visitor:${visitor}`).digest('hex');
}
