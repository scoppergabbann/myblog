import 'server-only';
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';

const PASSWORD_PREFIX = 'scrypt';
const COOKIE_PREFIX = 'bbs-premium';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

function getSecret(): string {
  const secret = process.env.AUTH_SECRET || process.env.ADMIN_SECRET;
  if (!secret) {
    throw new Error('Missing AUTH_SECRET or ADMIN_SECRET for premium access');
  }
  return secret;
}

export function hashPremiumPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${PASSWORD_PREFIX}$${salt}$${hash}`;
}

export function verifyPremiumPassword(
  password: string,
  storedHash: string | null | undefined
): boolean {
  if (!storedHash) return false;

  const [prefix, salt, hash] = storedHash.split('$');
  if (prefix !== PASSWORD_PREFIX || !salt || !hash) return false;

  const expected = Buffer.from(hash, 'hex');
  const actual = scryptSync(password, salt, expected.length);
  return (
    expected.length === actual.length && timingSafeEqual(expected, actual)
  );
}

function cookieName(slug: string): string {
  return `${COOKIE_PREFIX}-${slug}`;
}

function signUnlock(slug: string): string {
  return createHmac('sha256', getSecret()).update(slug).digest('hex');
}

export async function isPremiumUnlocked(slug: string): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get(cookieName(slug))?.value === signUnlock(slug);
}

export async function setPremiumUnlocked(slug: string) {
  const cookieStore = await cookies();
  cookieStore.set(cookieName(slug), signUnlock(slug), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: `/writing/${slug}`,
    maxAge: COOKIE_MAX_AGE,
  });
}
