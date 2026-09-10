import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import { isMaintenanceEnabled } from '@/lib/maintenance-edge';
import { articleStatus } from '@/lib/article-status-edge';

// Routes that should ALWAYS be accessible regardless of maintenance state.
// Admin/sambat are auth-protected separately; api/auth handles login flow.
const BYPASS_PATHS = [
  '/admin',
  '/sambat',
  '/maintenance',
  '/api',
  '/_next',
  '/favicon',
  '/robots.txt',
  '/sitemap.xml',
];

function isBypassed(path: string): boolean {
  return BYPASS_PATHS.some((p) => path === p || path.startsWith(`${p}/`));
}

export default auth(async (req) => {
  const path = req.nextUrl.pathname;

  if (path === '/ngedumel' || path.startsWith('/ngedumel/')) {
    const url = new URL(
      path.replace(/^\/ngedumel/, '/sambat'),
      req.nextUrl
    );
    url.search = req.nextUrl.search;
    return NextResponse.redirect(url, 308);
  }

  // ============================================================
  // Layer 1: Auth gating for /admin and /sambat
  // ============================================================
  if (path === '/admin/login' || path === '/sambat/login') {
    // Always allow login pages
    return NextResponse.next();
  }

  const isLoggedIn = !!req.auth;
  const adminGithubUser = (process.env.ADMIN_GITHUB_USERNAME || '')
    .toLowerCase()
    .trim();
  const adminPasswordUser = (process.env.ADMIN_USERNAME || 'admin')
    .toLowerCase()
    .trim();
  const userLogin = req.auth?.user?.login;
  const isAdmin =
    isLoggedIn &&
    (userLogin === adminPasswordUser || userLogin === adminGithubUser);

  const requiresAuth =
    path.startsWith('/admin') || path.startsWith('/sambat');
  if (requiresAuth && !isAdmin) {
    const loginPath = path.startsWith('/sambat')
      ? '/sambat/login'
      : '/admin/login';
    const url = new URL(loginPath, req.nextUrl);
    url.searchParams.set('from', path);
    return NextResponse.redirect(url);
  }

  // ============================================================
  // Layer 2: Maintenance mode redirect (for non-admin visitors)
  // ============================================================
  if (!isBypassed(path) && !isAdmin) {
    const maintenanceOn = await isMaintenanceEnabled();
    if (maintenanceOn) {
      const url = new URL('/maintenance', req.nextUrl);
      return NextResponse.rewrite(url, {
        status: 503,
        headers: { 'Retry-After': '60', 'Cache-Control': 'no-store' },
      });
    }
  }

  // ============================================================
  // Layer 3: If maintenance is OFF, don't let visitors land on /maintenance
  // (only redirects if a visitor manually navigates there)
  // ============================================================
  if (path === '/maintenance' && !isAdmin) {
    const maintenanceOn = await isMaintenanceEnabled();
    if (!maintenanceOn) {
      return NextResponse.redirect(new URL('/', req.nextUrl));
    }
    return NextResponse.next({
      status: 503,
      headers: { 'Retry-After': '60', 'Cache-Control': 'no-store' },
    });
  }

  const articleMatch = path.match(/^\/writing\/([^/]+)$/);
  if (articleMatch) {
    let slug: string;
    try { slug = decodeURIComponent(articleMatch[1]); } catch { slug = ''; }
    const status = slug ? await articleStatus(slug, req.nextUrl.searchParams.get('preview')) : 404;
    if (status === 404) {
      return NextResponse.rewrite(new URL('/_not-found', req.nextUrl), {
        status: 404,
        headers: { 'X-Robots-Tag': 'noindex', 'Cache-Control': 'no-store' },
      });
    }
    if (status === 503) {
      return new NextResponse('Konten sementara tidak tersedia. Silakan coba lagi.', {
        status: 503,
        headers: { 'Retry-After': '60', 'Cache-Control': 'no-store', 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }
  }
  return NextResponse.next();
});

// Match all routes except static files
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|css|js|woff|woff2|ttf|eot)).*)',
  ],
};
