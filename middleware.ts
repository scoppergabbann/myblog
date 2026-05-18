import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import { isMaintenanceEnabled } from '@/lib/maintenance-edge';

// Routes that should ALWAYS be accessible regardless of maintenance state.
// Admin/ngedumel are auth-protected separately; api/auth handles login flow.
const BYPASS_PATHS = [
  '/admin',
  '/ngedumel',
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

  // ============================================================
  // Layer 1: Auth gating for /admin and /ngedumel
  // ============================================================
  if (path === '/admin/login' || path === '/ngedumel/login') {
    // Always allow login pages
    return NextResponse.next();
  }

  const isLoggedIn = !!req.auth;
  const adminUser = (process.env.ADMIN_GITHUB_USERNAME || '')
    .toLowerCase()
    .trim();
  const userLogin = req.auth?.user?.login;
  const isAdmin = isLoggedIn && adminUser && userLogin === adminUser;

  const requiresAuth =
    path.startsWith('/admin') || path.startsWith('/ngedumel');
  if (requiresAuth && !isAdmin) {
    const loginPath = path.startsWith('/ngedumel')
      ? '/ngedumel/login'
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
      // 307 Temporary Redirect — preserves method, signals temporary state
      return NextResponse.redirect(url, 307);
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
  }

  return NextResponse.next();
});

// Match all routes except static files
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|css|js|woff|woff2|ttf|eot)).*)',
  ],
};
