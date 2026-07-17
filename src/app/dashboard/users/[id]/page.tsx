/**
 * @page /dashboard/users/:id
 * @auth required
 * @role SUPER_ADMIN
 * @description Страница карточки пользователя
 *
 * @spec
 * - Загружает данные через UserCard компонент
 * - Проверка авторизации и роли SUPER_ADMIN
 * - При отсутствии сессии — редирект на /login
 * - При отсутствии роли — сообщение об отсутствии доступа
 *
 * @data-flow
 * - useSession() → проверка роли → UserCard(userId) → apiClient.get('/users/:id')
 *
 * @see docs/user-stories/US-20-03-просмотр-карточки-пользователя.md
 */
'use client';

import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect } from 'react';
import { UserCard } from '@/components/features/users';

/**
 * Страница карточки пользователя
 */
export default function UserCardPage(): React.ReactElement {
  const { data: session, status } = useSession();
  const params = useParams();
  const router = useRouter();
  const userId = params?.id as string;

  /**
   * Проверка авторизации и роли
   */
  useEffect(() => {
    if (status === 'unauthenticated') {
      const timer = setTimeout(() => router.replace('/login'), 100);
      return () => clearTimeout(timer);
    }
  }, [status, router]);

  /**
   * Флаг: пользователь не имеет роли SUPER_ADMIN
   */
  const isForbidden = useCallback((): boolean => {
    if (!session?.user) {
      return false;
    }
    const roles = (session.user as any).roles as string[] | undefined;
    return roles ? !roles.includes('SUPER_ADMIN') : false;
  }, [session?.user]);

  // Показываем загрузку пока определяется статус сессии
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  // Нет сессии — ждём редиректа
  if (status === 'unauthenticated') {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  // Нет роли SUPER_ADMIN
  if (isForbidden()) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[200px] space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">Доступ запрещён</h2>
        <p className="text-sm text-gray-500">
          Просмотр карточки пользователя доступен только супер-администраторам.
        </p>
        <button
          type="button"
          onClick={() => router.push('/dashboard/users')}
          className="text-sm text-blue-600 hover:text-blue-800 underline"
        >
          ← Вернуться к списку
        </button>
      </div>
    );
  }

  return <UserCard userId={userId} />;
}
