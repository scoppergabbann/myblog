import type { Metadata } from 'next';
import { AdminProviders } from '@/components/admin/providers';

export const metadata: Metadata = {
  title: 'Ngedumel',
  robots: { index: false, follow: false },
};

export default function NgedumelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminProviders>{children}</AdminProviders>;
}
