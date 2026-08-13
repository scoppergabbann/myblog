import NextAuth, { type Session } from 'next-auth';
import type { Provider } from '@auth/core/providers';
import Credentials from 'next-auth/providers/credentials';
import GitHub from 'next-auth/providers/github';

const ADMIN_GITHUB_USERNAME = (
  process.env.ADMIN_GITHUB_USERNAME || ''
).toLowerCase().trim();
const ADMIN_USERNAME = (process.env.ADMIN_USERNAME || 'admin')
  .toLowerCase()
  .trim();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';

const providers: Provider[] = [
  Credentials({
    name: 'Admin',
    credentials: {
      username: { label: 'Username', type: 'text' },
      password: { label: 'Password', type: 'password' },
    },
    async authorize(credentials) {
      const username = String(credentials?.username ?? '')
        .toLowerCase()
        .trim();
      const password = String(credentials?.password ?? '');

      if (!ADMIN_PASSWORD) {
        console.warn('[auth] ADMIN_PASSWORD not set - denying password login');
        return null;
      }

      if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
        return null;
      }

      return {
        id: ADMIN_USERNAME,
        name: 'Admin',
        login: ADMIN_USERNAME,
      };
    },
  }),
];

if (process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET) {
  providers.push(
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
    })
  );
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers,
  pages: {
    signIn: '/admin/login',
  },
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider === 'credentials') return true;

      // Only allow the configured admin GitHub user.
      if (!ADMIN_GITHUB_USERNAME) {
        console.warn(
          '[auth] ADMIN_GITHUB_USERNAME not set - denying GitHub login'
        );
        return false;
      }
      const login = (profile?.login as string | undefined)?.toLowerCase();
      return login === ADMIN_GITHUB_USERNAME;
    },
    async jwt({ token, profile, user }) {
      if (user) {
        token.login = (user as { login?: string }).login;
      }
      if (profile) {
        token.login = (profile.login as string | undefined)?.toLowerCase();
        token.avatar_url = profile.avatar_url as string | undefined;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.login = token.login;
        session.user.avatar_url = token.avatar_url;
      }
      return session;
    },
  },
  session: { strategy: 'jwt' },
  trustHost: true,
});

export function isAdmin(session: Session | null): boolean {
  const login = session?.user?.login?.toLowerCase();
  return login === ADMIN_USERNAME || login === ADMIN_GITHUB_USERNAME;
}
