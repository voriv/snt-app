'use client';

/**
 * @component UserConnectionsList
 * @category features/users
 * @description Таблица связей пользователя с участками
 *
 * @example
 * ```tsx
 * <UserConnectionsList userId="abc123" />
 * ```
 *
 * @spec
 * - Загружает данные через apiClient.get(`/users/${userId}/connections`)
 * - Состояния: loading (skeleton), error, empty, success
 * - Отображает: номер участка, кадастровый номер, роль, дата назначения
 * - Ссылка на карточку участка через plotId
 *
 * @see US-20-04
 */
import { useEffect, useState, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import type { UserPlotConnection } from '@/domains/users';
import { EmptyState } from '@/components/ui/EmptyState';

export interface UserConnectionsListProps {
  /** ID пользователя */
  userId: string;
}

/**
 * @component UserConnectionsList
 * @category features/users
 * @description Таблица связей пользователя с участками
 */
export function UserConnectionsList({ userId }: UserConnectionsListProps) {
  const [connections, setConnections] = useState<UserPlotConnection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadConnections = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.get<UserPlotConnection[]>(`/users/${userId}/connections`);
      if (response.success && response.data) {
        setConnections(response.data);
      } else {
        setError(response.error?.message ?? 'Не удалось загрузить связи');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadConnections();
  }, [loadConnections]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse flex gap-4 p-3 rounded bg-gray-100">
            <div className="h-4 bg-gray-300 rounded w-16" />
            <div className="h-4 bg-gray-300 rounded w-24" />
            <div className="h-4 bg-gray-300 rounded w-20" />
            <div className="h-4 bg-gray-300 rounded w-32 ml-auto" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        title="Ошибка загрузки"
        description={error}
      />
    );
  }

  if (connections.length === 0) {
    return (
      <EmptyState
        title="Нет связей с участками"
        description="У пользователя нет назначенных участков"
      />
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Участок
            </th>
            <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Кадастровый номер
            </th>
            <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Роль
            </th>
            <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Назначен
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {connections.map((conn) => (
            <tr key={conn.plotId} className="hover:bg-gray-50">
              <td className="px-3 py-2 whitespace-nowrap">
                <a
                  href={`/dashboard/plots/${conn.plotId}`}
                  className="text-blue-600 hover:text-blue-800 hover:underline"
                >
                  {conn.plotNumber}
                </a>
              </td>
              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                {conn.cadastralNumber ?? '—'}
              </td>
              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                {conn.roleName}
              </td>
              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                {new Intl.DateTimeFormat('ru-RU').format(new Date(conn.assignedAt))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
