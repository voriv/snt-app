/**
 * @file src/app/dashboard/layout.tsx
 * @component DashboardLayout
 * @category features
 * @description Корневой layout для всех страниц дашборда с защитой от неавторизованного доступа
 *
 * @spec
 * - Server Component (не использует 'use client')
 * - Использует getServerSession() из @/lib/auth для проверки сессии
 * - Состояния:
 *   - authenticated: рендерит children и AppLayout
 *   - unauthenticated: редирект на /login
 * - Не дублирует SessionProvider — используется Providers из корневого layout
 * - Обработка ошибок: при ошибке сессии — редирект на /login
 *
 * @data-flow
 * - auth() (из @/lib/auth) → получение сессии
 * - session === null → редирект на /login
 * - session !== null → рендер детей через AppLayout
 *
 * @see docs/user-stories/US-05-реализация-процесса-аутентификации.md — FR-REQ-AUTH-001, AC-4.1, EC-03
 * @see src/app/layout.tsx — где настроен Providers с SessionProvider
 * @see src/lib/auth.ts — где настроена конфигурация NextAuth
 */
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { AppLayout } from '@/components/layouts';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

/**
 * @component DashboardLayout
 * @description Корневой layout для всех страниц дашборда с защитой от неавторизованного доступа
 *
 * @spec
 * - Server Component — нет 'use client'
 * - Использует getServerSession() из @/lib/auth для проверки сессии
 * - При отсутствии сессии — редирект на /login
 * - При наличии сессии — рендерит children через AppLayout
 * - Не использует SessionProvider (он уже в корневом layout)
 *
 * @see docs/user-stories/US-05-реализация-процесса-аутентификации.md — FR-REQ-AUTH-001, AC-4.1
 */
export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  // Проверка авторизации через серверную сессию
  const session = await auth();

  // Если сессия отсутствует — редирект на /login
  if (!session) {
    redirect('/login');
  }

  // Сессия валидна — рендерим контент
  return <AppLayout session={session}>{children}</AppLayout>;
}
