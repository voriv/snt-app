/**
 * @page /dashboard/users
 * @auth required
 * @role SUPER_ADMIN
 * @description Страница списка пользователей
 *
 * @spec
 * - Client Component с директивой 'use client'
 * - useSession() для проверки авторизации
 * - Рендер UserList компонента
 * - При отсутствии сессии — редирект на /login
 *
 * @data-flow
 * - UserList → apiClient.getWithQuery('/users') → API Route Handler → UsersService → UsersRepository → DB
 *
 * @see docs/user-stories/US-20-01-просмотр-списка-пользователей.md
 */
'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import type { ReactElement } from 'react';
import { UserList } from '@/components/features/users/UserList';

export default function UsersPage(): ReactElement {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      setTimeout(() => router.replace('/login'), 100);
    }
  }, [status, router]);

  if (status === 'loading' || status === 'unauthenticated') {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
          <p className="mt-4 text-sm text-gray-500">Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Пользователи</h1>
        <p className="mt-1 text-sm text-gray-500">Список всех зарегистрированных пользователей системы</p>
      </div>
      <UserList />
    </div>
  );
}
