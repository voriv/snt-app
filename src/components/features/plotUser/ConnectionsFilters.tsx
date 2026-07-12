/**
 * @component ConnectionsFilters
 * @category features
 * @description Фильтры по роли и статусу для списка связей пользователя
 *
 * @example
 * ```tsx
 * <ConnectionsFilters
 *   filters={filters}
 *   onFilterChange={handleFilterChange}
 *   onReset={handleReset}
 * />
 * ```
 *
 * @spec
 * - Фильтр по роли: Все / Владелец / Проживает / Представитель
 * - Фильтр по статусу: Все / Активные / Ожидание / Истёкшие
 * - Кнопка "Сбросить фильтры"
 * - aria-label для доступности (NFR: Доступность)
 *
 * @see US-19-3 FR-3 (фильтр по роли)
 * @see US-19-3 FR-4 (фильтр по статусу)
 */
'use client';

import type { ChangeEvent } from 'react';
import type { PlotUserRoleRole, PlotUserRoleStatus } from '@/domains/plotUser/plotUser.types';
import { PlotUserRoleRoleLabel, PlotUserRoleStatusLabel } from '@/domains/plotUser/plotUser.types';

export interface ConnectionsFiltersValue {
  role?: PlotUserRoleRole | 'all';
  status?: PlotUserRoleStatus | 'all';
}

export interface ConnectionsFiltersProps {
  filters: ConnectionsFiltersValue;
  onFilterChange: (filters: ConnectionsFiltersValue) => void;
  onReset: () => void;
}

const roleOptions = [
  { value: 'all', label: 'Все роли' },
  { value: 1, label: PlotUserRoleRoleLabel[1] },
  { value: 2, label: PlotUserRoleRoleLabel[2] },
  { value: 3, label: PlotUserRoleRoleLabel[3] },
] as const;

const statusOptions = [
  { value: 'all', label: 'Все статусы' },
  { value: 'active', label: PlotUserRoleStatusLabel.active },
  { value: 'pending', label: PlotUserRoleStatusLabel.pending },
  { value: 'expired', label: PlotUserRoleStatusLabel.expired },
] as const;

export function ConnectionsFilters({
  filters,
  onFilterChange,
  onReset,
}: ConnectionsFiltersProps): React.ReactElement {
  const handleRoleChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    onFilterChange({
      ...filters,
      role: value === 'all' ? 'all' : (parseInt(value) as PlotUserRoleRole),
    });
  };

  const handleStatusChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    onFilterChange({
      ...filters,
      status: value === 'all' ? 'all' : (value as PlotUserRoleStatus),
    });
  };

  return (
    <div className="flex items-center gap-4 flex-wrap">
      <div className="w-full sm:w-auto">
        <label className="block text-sm font-medium text-gray-700 mb-1">Роль</label>
        <select
          value={filters.role?.toString() ?? 'all'}
          onChange={handleRoleChange}
          aria-label="Фильтр по роли"
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2"
        >
          <option value="all">Все роли</option>
          {roleOptions.slice(1).map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <div className="w-full sm:w-auto">
        <label className="block text-sm font-medium text-gray-700 mb-1">Статус</label>
        <select
          value={filters.status?.toString() ?? 'all'}
          onChange={handleStatusChange}
          aria-label="Фильтр по статусу"
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2"
        >
          <option value="all">Все статусы</option>
          {statusOptions.slice(1).map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <button
        type="button"
        onClick={onReset}
        className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700 self-end"
        aria-label="Сбросить фильтры"
      >
        Сбросить
      </button>
    </div>
  );
}
