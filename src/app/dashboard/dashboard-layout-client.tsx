'use client';

import { SessionProvider } from 'next-auth/react';
import type { Session } from 'next-auth';
import { AppLayout } from '@/components/layouts';

interface DashboardLayoutClientProps {
  children: React.ReactNode;
  session: Session | null;
}

export function DashboardLayoutClient({ children, session }: DashboardLayoutClientProps) {
  return (
    <SessionProvider session={session}>
      <AppLayout session={session}>{children}</AppLayout>
    </SessionProvider>
  );
}
