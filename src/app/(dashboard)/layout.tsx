'use client';

import { SessionProvider, useSession } from 'next-auth/react';
import { AppLayout } from '@/components/layouts';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

/**
 * @component DashboardLayoutContent
 * @description Внутренний компонент для получения сессии через useSession() и передачи её в AppLayout
 */
function DashboardLayoutContent({ children }: DashboardLayoutProps) {
  const { data: session } = useSession();
  return <AppLayout session={session}>{children}</AppLayout>;
}

/**
 * @component DashboardLayout
 * @description Корневой layout для всех страниц под маршрутом (dashboard)
 *
 * @spec
 * - Обеспечивает SessionProvider для useSession() хука во всех дочерних компонентах
 * - ThemeProvider предоставляется корневым RootLayout через Providers
 * - Передаёт session в AppLayout для отображения Navbar
 */
export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <SessionProvider>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </SessionProvider>
  );
}
