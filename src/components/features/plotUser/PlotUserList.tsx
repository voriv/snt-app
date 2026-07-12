'use client';

/**
 * @component PlotUserList
 * @category features
 * @description Список связей пользователей с участками
 *
 * @example
 * ```tsx
 * <PlotUserList
 *   data={plotUsers}
 *   onEdit={handleEdit}
 *   onDelete={handleDelete}
 * />
 * ```
 *
 * @spec
 * - Отображает таблицу с колонками: Пользователь, Участок, Роль, Статус, Действия
 * - Использует Badge для отображения роли и статуса
 * - Поддерживает редактирование и удаление
 * - Отображает email пользователя и номер участка если доступны отношения
 */

import { useCallback } from 'react';
import type { PlotUserRoleWithRelations } from '@/domains/plotUser/plotUser.types';
import {
  PlotUserRoleRoleLabel,
  PlotUserRoleStatusLabel,
} from '@/domains/plotUser/plotUser.types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';

/**
 * Props для PlotUserList
 */
export interface PlotUserListProps {
  /** Массив связей с отношениями */
  data: PlotUserRoleWithRelations[];
  /** Callback при редактировании */
  onEdit?: (id: string) => void;
  /** Callback при удалении */
  onDelete?: (id: string) => void;
}

/**
 * @component
 */
export function PlotUserList({
  data,
  onEdit,
  onDelete,
}: PlotUserListProps) {
  const handleEdit = useCallback(
    (id: string) => {
      onEdit?.(id);
    },
    [onEdit]
  );

  const handleDelete = useCallback(
    (id: string) => {
      onDelete?.(id);
    },
    [onDelete]
  );

  if (data.length === 0) {
    return (
      <EmptyState
        title="Нет связей"
        description="Связи пользователей с участками не найдены"
      />
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Пользователь
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Участок
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Роль
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Статус
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Действия
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((item) => (
            <tr
              key={item.id}
              className="hover:bg-gray-50 cursor-pointer"
              onClick={() => onEdit?.(item.id)}
            >
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                <div>
                  <div className="font-medium">
                    {item.user?.lastName && item.user?.firstName
                      ? `${item.user.lastName} ${item.user.firstName}`
                      : item.user?.email || 'Неизвестный пользователь'}
                  </div>
                  <div className="text-gray-500 text-xs">
                    {item.user?.email}
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                <div>
                  <div className="font-medium">
                    {item.plot?.plotNumber || item.plotId}
                  </div>
                  {item.plot?.address && (
                    <div className="text-gray-500 text-xs">
                      {item.plot.address}
                    </div>
                  )}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <Badge variant="default">
                  {PlotUserRoleRoleLabel[item.role]}
                </Badge>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <Badge
                  variant={
                    item.status === 'active'
                      ? 'success'
                      : item.status === 'pending'
                      ? 'warning'
                      : 'danger'
                  }
                >
                  {PlotUserRoleStatusLabel[item.status]}
                </Badge>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <div className="flex space-x-2">
                  {onEdit && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(item.id);
                      }}
                    >
                      Изменить
                    </Button>
                  )}
                  {onDelete && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-900"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(item.id);
                      }}
                    >
                      Удалить
                    </Button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
