import { auth } from '@/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const path = req.nextUrl.pathname;

  // Allow login pages themselves (otherwise infinite redirect)
  if (path === '/admin/login') return;
  if (path === '/ngedumel/login') return;

  const requiresAuth =
    path.startsWith('/admin') || path.startsWith('/ngedumel');
  if (!requiresAuth) return;

  const isLoggedIn = !!req.auth;
  const adminUser = (process.env.ADMIN_GITHUB_USERNAME || '')
    .toLowerCase()
    .trim();
  const userLogin = req.auth?.user?.login;

  if (!isLoggedIn || !adminUser || userLogin !== adminUser) {
    // /ngedumel/* redirects to its own login page (separate visual identity)
    // /admin/* redirects to /admin/login
    const loginPath = path.startsWith('/ngedumel')
      ? '/ngedumel/login'
      : '/admin/login';
    const url = new URL(loginPath, req.nextUrl);
    url.searchParams.set('from', path);
    return NextResponse.redirect(url);
  }
});

export const config = {
  matcher: ['/admin/:path*', '/ngedumel/:path*'],
};
