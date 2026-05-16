'use client';

import { SessionProvider } from 'next-auth/react';
import type { ReactNode } from 'react';
import { ToastProvider } from './toast';

export function AdminProviders({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <ToastProvider>{children}</ToastProvider>
    </SessionProvider>
  );
}
