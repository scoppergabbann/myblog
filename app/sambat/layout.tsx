import type { Metadata } from 'next';
import { AdminProviders } from '@/components/admin/providers';

export const metadata: Metadata = {
  title: 'Sambat',
  robots: { index: false, follow: false },
};

export default function SambatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminProviders>{children}</AdminProviders>;
}
