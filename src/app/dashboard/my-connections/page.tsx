/**
 * @page /dashboard/my-connections
 * @auth required
 * @description Страница списка связей пользователя с участками СНТ
 *
 * @spec
 * - Client Component: данные загружаются на клиенте через useSession()
 * - Отображает UserConnectionsList с userId из сессии
 * - Полная ширина контента (без limit)
 * - Loading/error/empty состояния обрабатываются UserConnectionsList
 *
 * @data-flow
 * - Client Component → useSession() → UserConnectionsList → apiClient.get('/plot-users/connections')
 *
 * @see US-19-3 TV-3: Отдельная страница "Мои связи"
 */
'use client';

import { useState, useEffect, useCallback, type ReactElement } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { UserConnectionsList } from '@/components/features/plotUser';

/**
 * @component MyConnectionsPage
 * @description Страница списка связей пользователя с участками
 */
export default function MyConnectionsPage(): ReactElement {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);

  const checkSession = useCallback(async () => {
    if (status === 'unauthenticated') {
      router.replace('/login');
      return;
    }

    if (status === 'authenticated' && session?.user?.id) {
      setUserId(session.user.id);
    }
  }, [status, session, router]);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  if (status === 'loading' || !userId) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Мои участки</h1>
        </div>
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          Загрузка...
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Мои участки</h1>
      </div>

      <UserConnectionsList userId={userId} />
    </div>
  );
}
