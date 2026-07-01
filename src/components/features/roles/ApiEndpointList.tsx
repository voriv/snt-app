/**
 * @component ApiEndpointList
 * @category features
 * @description Таблица API endpoints реестра
 *
 * @spec
 * - Колонки: method, path, description, access_type (Badge), is_active
 * - Цветовая индикация access_type: public — зелёный, owner — синий, role — жёлтый, super_admin — красный
 * - Действия: «Редактировать», «Удалить»
 * - is_active=false отображается Badge «Неактивен»
 * - Подтверждение удаления через ConfirmDialog
 * - EmptyState если endpoints.length === 0
 *
 * @see docs/user-stories/US-8-roles-management.md — FR-13, AC-16
 */
'use client';

import { useState } from 'react';
import type { ApiEndpoint } from '@/domains/roles';
import { Badge, ConfirmDialog } from '@/components/ui';

const ACCESS_TYPE_VARIANT: Record<string, 'success' | 'info' | 'warning' | 'danger'> = {
  public: 'success',
  owner: 'info',
  role: 'warning',
  super_admin: 'danger',
};

export interface ApiEndpointListProps {
  /** Список API endpoints */
  endpoints: ApiEndpoint[];
  /** Колбэк при нажатии «Редактировать» */
  onEdit?: (endpoint: ApiEndpoint) => void;
  /** Колбэк при подтверждении удаления */
  onDelete?: (endpoint: ApiEndpoint) => void;
  /** Состояние загрузки */
  isLoading?: boolean;
}

export function ApiEndpointList({
  endpoints,
  onEdit,
  onDelete,
  isLoading = false,
}: ApiEndpointListProps): React.JSX.Element {
  const [endpointToDelete, setEndpointToDelete] = useState<ApiEndpoint | null>(null);

  if (endpoints.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">API endpoints не найдены</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
        <table className="min-w-full divide-y divide-gray-300">
          <thead className="bg-gray-50">
            <tr>
              <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                Метод
              </th>
              <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                Путь
              </th>
              <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                Описание
              </th>
              <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                Доступ
              </th>
              <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                Статус
              </th>
              <th className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                <span className="sr-only">Действия</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {endpoints.map((endpoint) => (
              <tr key={endpoint.id}>
                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                  <Badge variant="default">{endpoint.method}</Badge>
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm font-mono text-gray-900">
                  {endpoint.path}
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                  {endpoint.description || '-'}
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm">
                  <Badge variant={ACCESS_TYPE_VARIANT[endpoint.accessType]}>
                    {endpoint.accessType}
                  </Badge>
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm">
                  {endpoint.isActive ? (
                    <Badge variant="success">Активен</Badge>
                  ) : (
                    <Badge variant="default">Неактивен</Badge>
                  )}
                </td>
                <td className="whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6 space-x-2">
                  {onEdit && (
                    <button
                      type="button"
                      onClick={() => onEdit(endpoint)}
                      disabled={isLoading}
                      className="text-indigo-600 hover:text-indigo-900 disabled:opacity-50"
                    >
                      Редактировать
                    </button>
                  )}
                  {onDelete && (
                    <button
                      type="button"
                      onClick={() => setEndpointToDelete(endpoint)}
                      disabled={isLoading}
                      className="text-red-600 hover:text-red-900 disabled:opacity-50"
                    >
                      Удалить
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        isOpen={endpointToDelete !== null}
        onClose={() => setEndpointToDelete(null)}
        title="Удаление endpoint"
        message={`Удалить ${endpointToDelete?.method} ${endpointToDelete?.path}? Все назначения роли будут удалены.`}
        confirmLabel="Удалить"
        variant="danger"
        isLoading={isLoading}
        onConfirm={() => {
          if (endpointToDelete && onDelete) {
            onDelete(endpointToDelete);
          }
          setEndpointToDelete(null);
        }}
      />
    </>
  );
}
