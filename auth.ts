import NextAuth, { type Session } from 'next-auth';
import GitHub from 'next-auth/providers/github';

const ADMIN_USERNAME = (
  process.env.ADMIN_GITHUB_USERNAME || ''
).toLowerCase().trim();

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
    }),
  ],
  pages: {
    signIn: '/admin/login',
  },
  callbacks: {
    async signIn({ profile }) {
      // Only allow the configured admin GitHub user.
      if (!ADMIN_USERNAME) {
        console.warn('[auth] ADMIN_GITHUB_USERNAME not set — denying all logins');
        return false;
      }
      const login = (profile?.login as string | undefined)?.toLowerCase();
      return login === ADMIN_USERNAME;
    },
    async jwt({ token, profile }) {
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
  if (!ADMIN_USERNAME) return false;
  return session?.user?.login === ADMIN_USERNAME;
}
