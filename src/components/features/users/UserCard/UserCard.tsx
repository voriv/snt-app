/**
 * @component UserCard
 * @category features/users
 * @description Карточка пользователя с разделами «Профиль» и «Роли»
 *
 * @spec
 * - Загружает данные через apiClient.get('/users/${id}')
 * - Раздел «Профиль»: email, имя, фамилия, отчество, телефон, дата регистрации
 * - Раздел «Роли»: бейджи с названиями ролей или «Роли не назначены»
 * - Обработка «Профиль не заполнен» (firstName == null)
 * - Обработка 404 — «Пользователь не найден» + кнопка «Вернуться к списку»
 * - Состояние загрузки — скелетон
 * - Кнопка «Назад к списку» — router.push('/dashboard/users')
 *
 * @see docs/user-stories/US-20-03-просмотр-карточки-пользователя.md
 */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { UserConnectionsList } from '@/components/features/users/UserConnectionsList';

/**
 * @type UserDetail
 * @description Полная информация о пользователе для карточки
 */
interface UserDetail {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  patronymic: string | null;
  phone: string | null;
  createdAt: string;
  roles: UserRoleDetail[];
}

/**
 * @type UserRoleDetail
 * @description Детальная информация о назначенной роли
 */
interface UserRoleDetail {
  roleId: string;
  roleName: string;
  roleDescription: string | null;
}

/**
 * @interface UserCardProps
 * @description Props для компонента UserCard
 */
interface UserCardProps {
  /** Уникальный идентификатор пользователя */
  userId: string;
}

/**
 * Карточка пользователя с разделами «Профиль» и «Роли»
 *
 * @param props - Props компонента
 * @returns Карточка пользователя
 */
export function UserCard({ userId }: UserCardProps): React.ReactElement {
  const router = useRouter();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  /**
   * Загрузить данные пользователя
   */
  const loadUser = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setNotFound(false);

    try {
      const response = await apiClient.get<UserDetail>(`/users/${userId}`);
      if (response.success && response.data) {
        setUser(response.data);
      }
    } catch (err) {
      if (err instanceof Error && 'statusCode' in err && (err as { statusCode: number }).statusCode === 404) {
        setNotFound(true);
      } else {
        setError(err instanceof Error ? err.message : 'Ошибка загрузки данных');
      }
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  /**
   * Форматировать дату для отображения
   */
  const formatDate = useCallback((dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }, []);

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-4" />
          <div className="h-4 bg-gray-200 rounded w-96" />
        </div>
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <div className="h-6 bg-gray-200 rounded w-32" />
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-full" />
            <div className="h-4 bg-gray-200 rounded w-full" />
            <div className="h-4 bg-gray-200 rounded w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <button
          type="button"
          onClick={() => router.push('/dashboard/users')}
          className="text-sm text-blue-600 hover:text-blue-800 underline"
        >
          ← Вернуться к списку
        </button>
        <EmptyState
          title="Пользователь не найден"
          description="Пользователь с указанным идентификатором не существует или был удалён."
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <button
          type="button"
          onClick={() => router.push('/dashboard/users')}
          className="text-sm text-blue-600 hover:text-blue-800 underline"
        >
          ← Вернуться к списку
        </button>
        <EmptyState
          title="Ошибка загрузки"
          description={error}
        />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <button
          type="button"
          onClick={() => router.push('/dashboard/users')}
          className="text-sm text-blue-600 hover:text-blue-800 underline"
        >
          ← Вернуться к списку
        </button>
        <EmptyState
          title="Нет данных"
          description="Не удалось загрузить информацию о пользователе."
        />
      </div>
    );
  }

  const hasProfile = user.firstName !== null || user.lastName !== null;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Кнопка назад */}
      <button
        type="button"
        onClick={() => router.push('/dashboard/users')}
        className="text-sm text-blue-600 hover:text-blue-800 underline"
      >
        ← Назад к списку
      </button>

      {/* Заголовок */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {hasProfile && user.firstName
            ? `${user.firstName} ${user.lastName || ''}`.trim()
            : user.email}
        </h1>
        <p className="text-sm text-gray-500 mt-1">{user.email}</p>
      </div>

      {/* Профиль */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4" id="profile-section">
            Профиль
          </h2>

          {!hasProfile ? (
            <div className="text-sm text-gray-500 italic">Профиль пользователя не заполнен</div>
          ) : (
            <dl className="space-y-3">
              {user.firstName && (
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">Имя</dt>
                  <dd className="text-sm font-medium text-gray-900">{user.firstName}</dd>
                </div>
              )}
              {user.lastName && (
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">Фамилия</dt>
                  <dd className="text-sm font-medium text-gray-900">{user.lastName}</dd>
                </div>
              )}
              {user.patronymic && (
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">Отчество</dt>
                  <dd className="text-sm font-medium text-gray-900">{user.patronymic}</dd>
                </div>
              )}
              {user.phone && (
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">Телефон</dt>
                  <dd className="text-sm font-medium text-gray-900">{user.phone}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Дата регистрации</dt>
                <dd className="text-sm font-medium text-gray-900">{formatDate(user.createdAt)}</dd>
              </div>
            </dl>
          )}
        </div>
      </div>

      {/* Роли */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4" id="roles-section">
            Роли
          </h2>

          {user.roles.length === 0 ? (
            <div className="text-sm text-gray-500 italic">Роли не назначены</div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {user.roles.map(role => (
                <div key={role.roleId} className="flex flex-col items-start">
                  <Badge variant="info">{role.roleName}</Badge>
                  {role.roleDescription && (
                    <span className="text-xs text-gray-400 mt-1">{role.roleDescription}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Связи с участками */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4" id="connections-section">
            Связи с участками
          </h2>
          <UserConnectionsList userId={user.id} />
        </div>
      </div>
    </div>
  );
}

export default UserCard;
