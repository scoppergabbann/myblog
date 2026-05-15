import { auth } from '@/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const path = req.nextUrl.pathname;

  // Allow the login page itself
  if (path === '/admin/login') return;

  if (path.startsWith('/admin')) {
    const isLoggedIn = !!req.auth;
    const adminUser = (process.env.ADMIN_GITHUB_USERNAME || '')
      .toLowerCase()
      .trim();
    const userLogin = req.auth?.user?.login;

    if (!isLoggedIn || !adminUser || userLogin !== adminUser) {
      const url = new URL('/admin/login', req.nextUrl);
      url.searchParams.set('from', path);
      return NextResponse.redirect(url);
    }
  }
});

export const config = {
  matcher: ['/admin/:path*'],
};
