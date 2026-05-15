import type { Metadata } from 'next';
import { AdminProviders } from '@/components/admin/providers';

export const metadata: Metadata = {
  title: 'Sign in',
  robots: { index: false, follow: false },
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminProviders>
      <div className="min-h-screen bg-[var(--color-paper)]">{children}</div>
    </AdminProviders>
  );
}
