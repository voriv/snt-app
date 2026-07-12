'use client';

/**
 * @component ParticipantTable
 * @category features
 * @description Таблица с участниками участка
 *
 * @example
 * ```tsx
 * <ParticipantTable
 *   data={participants}
 *   isLoading={loading}
 *   currentPage={1}
 *   totalPages={1}
 *   onSort={handleSort}
 *   onPageChange={handlePageChange}
 *   isAdmin={true}
 *   onEdit={handleEdit}
 *   onDelete={handleDelete}
 * />
 * ```
 *
 * @spec
 * - Отображает столбцы: №, Пользователь, Роль, Статус, Срок действия, Комментарий, Назначен, Действия
 * - Skeleton loader при isLoading
 * - EmptyState при пустых данных
 * - Пагинация при totalPages > 1
 * - admin=True: показывает кнопки "Редактировать" и "Удалить" (BR-5)
 *
 * @see US-19-2 AC-1.2 (столбцы таблицы)
 * @see US-19-2 AC-6.1-6.2 (пустые состояния)
 */

import type { PlotUserRoleParticipant } from '@/domains/plotUser/plotUser.types';
import { ParticipantRow } from './ParticipantRow';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';

/** Props для ParticipantTable */
export interface ParticipantTableProps {
  /** Данные участников */
  data: PlotUserRoleParticipant[];
  /** Индикатор загрузки */
  isLoading: boolean;
  /** Текущая страница */
  currentPage: number;
  /** Всего страниц */
  totalPages: number;
  /** Флаг администратора (для кнопок редактирования/удаления) */
  isAdmin?: boolean;
  /** Callback при редактировании */
  onEdit?: (participant: PlotUserRoleParticipant) => void;
  /** Callback при удалении */
  onDelete?: (participant: PlotUserRoleParticipant) => void;
  /** Callback при смене страницы */
  onPageChange: (page: number) => void;
}

/**
 * Skeleton для строки таблицы
 */
function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-8"></div></td>
      <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-48"></div></td>
      <td className="px-4 py-3"><div className="h-6 bg-gray-200 rounded w-20"></div></td>
      <td className="px-4 py-3"><div className="h-6 bg-gray-200 rounded w-16"></div></td>
      <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
      <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-32"></div></td>
      <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
      <td className="px-4 py-3"><div className="flex gap-2"><div className="h-8 bg-gray-200 rounded w-16"></div><div className="h-8 bg-gray-200 rounded w-16"></div></div></td>
    </tr>
  );
}

/**
 * @component
 */
export function ParticipantTable({
  data,
  isLoading,
  currentPage,
  totalPages,
  isAdmin,
  onEdit,
  onDelete,
  onPageChange,
}: ParticipantTableProps) {
  if (isLoading) {
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-center">№</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Пользователь</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Роль</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Статус</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Срок действия</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Комментарий</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Назначен</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Действия</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonRow key={i} />
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <EmptyState
        title="Участники не найдены"
        description="Не удалось найти участников участка. Попробуйте изменить параметры поиска или сбросить фильтры."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-center w-16">
                №
              </th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Пользователь
              </th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Роль
              </th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Статус
              </th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Срок действия
              </th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Комментарий
              </th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Назначен
              </th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Действия
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((participant, index) => (
              <ParticipantRow
                key={participant.id}
                participant={participant}
                index={index}
                isAdmin={isAdmin}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Пагинация */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-700">
            Показано{' '}
            <span className="font-medium">{(currentPage - 1) * 25 + 1}</span>
            {' '}-{' '}
            <span className="font-medium">
              {Math.min(currentPage * 25, (currentPage - 1) * 25 + data.length)}
            </span>
            {' '}из{' '}
            <span className="font-medium">
              {(currentPage - 1) * 25 + data.length}
            </span>
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Назад
            </Button>
            <span className="text-sm text-gray-700">
              Страница {currentPage} из {totalPages}
            </span>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Вперёд
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
