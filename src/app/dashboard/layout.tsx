'use client';

import { SessionProvider, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/layouts';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

/**
 * @component DashboardGuard
 * @description Client Component для защиты маршрутов дашборда
 *
 * @spec
 * - Использует useSession() для проверки авторизации на клиенте
 * - Показывает spinner во время загрузки сессии
 * - Перенаправляет неавторизованных пользователей на /login
 * - Передаёт session данные в AppLayout через props
 */
function DashboardGuard({ children }: DashboardLayoutProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated') {
      const callbackUrl = window.location.pathname;
      router.replace(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
    }
  }, [status, router]);

  if (!mounted || status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return <AppLayout session={session}>{children}</AppLayout>;
}

/**
 * @layout dashboard
 * @description Layout для защищённых страниц дашборда
 *
 * @spec
 * - Оборачивает DashboardGuard в SessionProvider для доступа к сессии
 * - Является Server Component, но оборачивает Client Components
 * - Обеспечивает клиентскую аутентификацию для всех страниц внутри
 */
export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <SessionProvider>
      <DashboardGuard>{children}</DashboardGuard>
    </SessionProvider>
  );
}
