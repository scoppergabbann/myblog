'use client';

import { usePathname } from 'next/navigation';

export function HideOnMaintenance({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === '/maintenance') return null;
  return <>{children}</>;
}
