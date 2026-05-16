import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth, isAdmin } from '@/auth';
import { AdminSignOutButton } from '@/components/admin/sign-out-button';
import { AdminProviders } from '@/components/admin/providers';

export const metadata: Metadata = {
  title: 'Admin',
  robots: { index: false, follow: false },
};

const nav = [
  { href: '/admin', label: 'overview', exact: true },
  { href: '/admin/posts', label: 'posts' },
  { href: '/admin/projects', label: 'projects' },
  { href: '/admin/home', label: 'home' },
  { href: '/admin/about', label: 'about' },
  { href: '/admin/now', label: 'now' },
  { href: '/admin/guestbook', label: 'guestbook' },
  { href: '/admin/comments', label: 'comments' },
  { href: '/admin/subscribers', label: 'subscribers' },
  { href: '/admin/views', label: 'views' },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!isAdmin(session)) {
    redirect('/admin/login');
  }

  const userLogin: string = session?.user?.login ?? '';
  const avatar: string | undefined = session?.user?.avatar_url;

  return (
    <AdminProviders>
      <div className="min-h-screen bg-[var(--color-paper)]">
      <div className="mx-auto flex max-w-[1400px] gap-8 px-6 py-6 max-lg:flex-col max-lg:gap-4">
        <aside className="w-[200px] flex-shrink-0 max-lg:w-full">
          <div className="sticky top-6">
            <Link
              href="/"
              className="mb-7 inline-flex items-center gap-1 font-mono text-sm font-medium tracking-tight text-[var(--color-ink)] transition-colors hover:text-[var(--color-accent)]"
            >
              bbs<span className="text-[var(--color-accent)]">/</span>
              <span className="ml-2 rounded bg-[var(--color-paper-2)] px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-[var(--color-ink-3)]">
                admin
              </span>
            </Link>

            <nav className="flex flex-col gap-0.5 max-lg:flex-row max-lg:flex-wrap">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-md px-2.5 py-1.5 font-mono text-[13px] text-[var(--color-ink-3)] transition-colors hover:bg-[var(--color-paper-2)] hover:text-[var(--color-ink)]"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="mt-7 border-t border-[var(--color-line)] pt-5">
              <div className="mb-2.5 flex items-center gap-2">
                {avatar && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatar}
                    alt={userLogin}
                    width={24}
                    height={24}
                    className="h-6 w-6 rounded-full"
                  />
                )}
                <span className="font-mono text-[12px] text-[var(--color-ink-3)]">
                  @{userLogin}
                </span>
              </div>
              <AdminSignOutButton />
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1 pb-16">{children}</main>
      </div>
    </div>
    </AdminProviders>
  );
}
