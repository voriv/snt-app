/**
 * @component RoleList
 * @category features
 * @description Таблица ролей с действиями
 *
 * @spec
 * - Системные роли помечаются Badge «Системная»
 * - Кнопка «Удалить» заблокирована для системных ролей (is_system=true)
 * - Колонки: имя, описание, системная (значок), действия
 * - Действия: «Редактировать», «Управлять страницами», «Управлять API», «Управлять участниками», «Удалить»
 * - Подтверждение удаления через ConfirmDialog
 * - EmptyState если roles.length === 0
 *
 * @see docs/user-stories/US-8-roles-management.md — FR-2, FR-5, FR-9, AC-6, AC-16
 */
'use client';

import { useState } from 'react';
import type { Role } from '@/domains/roles';
import { Badge, Button, ConfirmDialog } from '@/components/ui';

export interface RoleListProps {
  /** Список ролей для отображения */
  roles: Role[];
  /** Колбэк при нажатии «Редактировать» */
  onEdit?: (role: Role) => void;
  /** Колбэк при нажатии «Управлять страницами» */
  onManagePages?: (role: Role) => void;
  /** Колбэк при нажатии «Управлять API» */
  onManageApiEndpoints?: (role: Role) => void;
  /** Колбэк при нажатии «Управлять участниками» */
  onManageUsers?: (role: Role) => void;
  /** Колбэк при подтверждении удаления роли */
  onDelete?: (role: Role) => void;
  /** Состояние загрузки */
  isLoading?: boolean;
}

export function RoleList({
  roles,
  onEdit,
  onManagePages,
  onManageApiEndpoints,
  onManageUsers,
  onDelete,
  isLoading = false,
}: RoleListProps): React.JSX.Element {
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);

  if (roles.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Роли не найдены</p>
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
                Имя
              </th>
              <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                Описание
              </th>
              <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                Тип
              </th>
              <th className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                <span className="sr-only">Действия</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {roles.map((role) => (
              <tr key={role.id}>
                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                  {role.name}
                </td>
                <td className="px-3 py-4 text-sm text-gray-500">
                  {role.description || '-'}
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm">
                  {role.isSystem ? (
                    <Badge variant="warning">Системная</Badge>
                  ) : (
                    <Badge variant="default">Пользовательская</Badge>
                  )}
                </td>
                <td className="whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6 space-x-2">
                  {onEdit && (
                    <button
                      type="button"
                      onClick={() => onEdit(role)}
                      disabled={isLoading}
                      className="text-indigo-600 hover:text-indigo-900 disabled:opacity-50"
                    >
                      Редактировать
                    </button>
                  )}
                  {onManagePages && (
                    <button
                      type="button"
                      onClick={() => onManagePages(role)}
                      disabled={isLoading}
                      className="text-indigo-600 hover:text-indigo-900 disabled:opacity-50"
                    >
                      Страницы
                    </button>
                  )}
                  {onManageApiEndpoints && (
                    <button
                      type="button"
                      onClick={() => onManageApiEndpoints(role)}
                      disabled={isLoading}
                      className="text-indigo-600 hover:text-indigo-900 disabled:opacity-50"
                    >
                      API
                    </button>
                  )}
                  {onManageUsers && (
                    <button
                      type="button"
                      onClick={() => onManageUsers(role)}
                      disabled={isLoading}
                      className="text-indigo-600 hover:text-indigo-900 disabled:opacity-50"
                    >
                      Участники
                    </button>
                  )}
                  {onDelete && !role.isSystem && (
                    <button
                      type="button"
                      onClick={() => setRoleToDelete(role)}
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
        isOpen={roleToDelete !== null}
        onClose={() => setRoleToDelete(null)}
        title="Удаление роли"
        message={`Вы действительно хотите удалить роль «${roleToDelete?.name}»? Все назначения (участники, страницы, API endpoints) будут удалены.`}
        confirmLabel="Удалить"
        variant="danger"
        isLoading={isLoading}
        onConfirm={() => {
          if (roleToDelete && onDelete) {
            onDelete(roleToDelete);
          }
          setRoleToDelete(null);
        }}
      />
    </>
  );
}
