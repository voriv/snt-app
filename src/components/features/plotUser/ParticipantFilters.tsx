'use client';

/**
 * @component ParticipantFilters
 * @category features
 * @description Фильтры для списка участников
 *
 * @example
 * ```tsx
 * <ParticipantFilters
 *   roleFilter={role}
 *   statusFilter={status}
 *   onRoleChange={setRole}
 *   onStatusChange={setStatus}
 *   onReset={handleReset}
 * />
 * ```
 *
 * @spec
 * - Фильтр по роли: Все, Владелец, Проживает, Представитель
 * - Фильтр по статусу: Все, Активные, Ожидание, Истёкшие
 * - Кнопка "Сбросить фильтры"
 * - Использует Select из ui/Select
 *
 * @see US-19-2 FR-3 (фильтр по роли)
 * @see US-19-2 FR-4 (фильтр по статусу)
 */

import {
  PlotUserRoleRoleLabel,
  PlotUserRoleStatusLabel,
  type PlotUserRoleRole,
  type PlotUserRoleStatus,
} from '@/domains/plotUser/plotUser.types';
import { Select } from '@/components/ui/Select';

/** Props для ParticipantFilters */
export interface ParticipantFiltersProps {
  /** Текущий фильтр по роли (undefined = все) */
  roleFilter?: PlotUserRoleRole;
  /** Текущий фильтр по статусу (undefined = все) */
  statusFilter?: PlotUserRoleStatus;
  /** Callback при изменении роли */
  onRoleChange: (role: PlotUserRoleRole | undefined) => void;
  /** Callback при изменении статуса */
  onStatusChange: (status: PlotUserRoleStatus | undefined) => void;
  /** Callback при сбросе фильтров */
  onReset: () => void;
}

/**
 * @component
 */
export function ParticipantFilters({
  roleFilter,
  statusFilter,
  onRoleChange,
  onStatusChange,
  onReset,
}: ParticipantFiltersProps) {
  const roleOptions = [
    { value: '', label: 'Все роли' },
    { value: '1', label: PlotUserRoleRoleLabel[1] },
    { value: '2', label: PlotUserRoleRoleLabel[2] },
    { value: '3', label: PlotUserRoleRoleLabel[3] },
  ];

  const statusOptions = [
    { value: '', label: 'Все статусы' },
    { value: 'active', label: PlotUserRoleStatusLabel.active },
    { value: 'pending', label: PlotUserRoleStatusLabel.pending },
    { value: 'expired', label: PlotUserRoleStatusLabel.expired },
  ];

  const hasActiveFilters = roleFilter !== undefined || statusFilter !== undefined;

  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="flex-1 min-w-[200px]">
        <Select
          value={roleFilter ?? ''}
          onChange={(e) => {
            const value = e.target.value;
            onRoleChange(value ? Number(value) as PlotUserRoleRole : undefined);
          }}
        >
          {roleOptions.map((option) => (
            <option key={option.value || 'all'} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </div>

      <div className="flex-1 min-w-[200px]">
        <Select
          value={statusFilter ?? ''}
          onChange={(e) => {
            const value = e.target.value;
            onStatusChange(
              value ? (value as PlotUserRoleStatus) : undefined
            );
          }}
        >
          {statusOptions.map((option) => (
            <option key={option.value || 'all'} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </div>

      {hasActiveFilters && (
        <button
          type="button"
          onClick={onReset}
          className="px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          Сбросить фильтры
        </button>
      )}
    </div>
  );
}
