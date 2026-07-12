/**
 * @page /dashboard
 * @auth required
 * @role MEMBER, ADMIN
 * @description Главная страница панели управления
 *
 * @spec
 * - Client Component с 'use client'
 * - Отображает ссылки на основные разделы системы
 * - Доступ гарантируется DashboardLayout (редирект на /login при отсутствии сессии)
 * - Блок "Мои участки" с ссылкой на /dashboard/my-connections (TV-2)
 *
 * @data-flow
 * - dashboard/layout.tsx → useSession() → защита маршрута
 * - Component рендерит контент без проверки сессии (дублирование убрано)
 *
 * @see docs/user-stories/US-8-roles-management.md
 * @see US-19-3 TV-2: Дашборд — блок "Мои участки"
 */
'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui';

export default function DashboardPage(): React.JSX.Element {
  const { data: session } = useSession();

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Требуется авторизация</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="py-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Панель управления
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Управление ролями</CardTitle>
            </CardHeader>
            <CardBody>
              <p className="text-sm text-gray-600 mb-4">
                Управление ролями, правами доступа и назначением ресурсов
              </p>
              <Link
                href="/dashboard/roles"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Перейти →
              </Link>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Участки</CardTitle>
            </CardHeader>
            <CardBody>
              <p className="text-sm text-gray-600 mb-4">
                Реестр земельных участков СНТ
              </p>
              <Link
                href="/dashboard/plots"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Перейти →
              </Link>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Мои участки</CardTitle>
            </CardHeader>
            <CardBody>
              <p className="text-sm text-gray-600 mb-4">
                Связи пользователя с участками СНТ
              </p>
              <Link
                href="/dashboard/my-connections"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Перейти →
              </Link>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
