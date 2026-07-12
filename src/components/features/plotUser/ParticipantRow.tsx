'use client';

/**
 * @component ParticipantRow
 * @category features
 * @description Строка таблицы участников
 *
 * @example
 * ```tsx
 * <ParticipantRow
 *   participant={participant}
 *   index={0}
 *   isAdmin={true}
 *   onEdit={handleEdit}
 *   onDelete={handleDelete}
 * />
 * ```
 *
 * @spec
 * - Отображает: №, Пользователь (Фамилия Имя + email), Роль, Статус, Срок, Комментарий, Назначен, Действия
 * - formatName: "Фамилия Имя (email)" или только email если нет профиля (AC-2.1, AC-2.2)
 * - tooltip при наведении на имя с телефоном (AC-2.3)
 * - Срок: "Бессрочно" или DD.MM.YYYY (AC-7.1, AC-7.2)
 * - Истёкшая связь: серая строка (AC-7.3)
 * - admin=True: кнопки "Редактировать" и "Удалить" (BR-5)
 *
 * @see US-19-2 AC-1.2 (столбцы таблицы)
 * @see US-19-2 AC-2.1-2.3 (информация о пользователе)
 * @see US-19-2 AC-7.1-7.3 (срок действия)
 */

import { useState } from 'react';
import type { PlotUserRoleParticipant } from '@/domains/plotUser/plotUser.types';
import { ParticipantBadge } from './ParticipantBadge';
import { Button } from '@/components/ui/Button';

/** Props для ParticipantRow */
export interface ParticipantRowProps {
  /** Данные участника */
  participant: PlotUserRoleParticipant;
  /** Порядковый номер строки */
  index: number;
  /** Флаг администратора (для кнопок редактирования/удаления) */
  isAdmin?: boolean;
  /** Callback при редактировании */
  onEdit?: (participant: PlotUserRoleParticipant) => void;
  /** Callback при удалении */
  onDelete?: (participant: PlotUserRoleParticipant) => void;
}

/**
 * Форматирует дату в DD.MM.YYYY
 */
function formatDate(date: Date | null | undefined): string {
  if (!date) return '—';
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}.${month}.${year}`;
}

/**
 * Форматирует полное имя пользователя
 */
function formatParticipantName(participant: PlotUserRoleParticipant): string {
  const { user } = participant;
  if (!user) return 'Удалён';

  const firstName = user.firstName || '';
  const lastName = user.lastName || '';
  const email = user.email;

  if (firstName && lastName) {
    const fullName = `${lastName} ${firstName}`;
    return `${fullName} (${email})`;
  }

  if (firstName) {
    return `${firstName} (${email})`;
  }

  if (lastName) {
    return `${lastName} (${email})`;
  }

  return email;
}

/**
 * @component
 */
export function ParticipantRow({
  participant,
  index,
  isAdmin,
  onEdit,
  onDelete,
}: ParticipantRowProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const { user } = participant;
  const isExpired = participant.status === 'expired';

  return (
    <tr
      className={`
        ${isExpired ? 'bg-gray-50 text-gray-400' : 'hover:bg-gray-100'}
        transition-colors
      `}
    >
      {/* № */}
      <td className="px-4 py-3 text-sm text-gray-400 text-center">
        {index + 1}
      </td>

      {/* Пользователь */}
      <td className="px-4 py-3">
        <div className="flex flex-col">
          <div className="relative">
            <button
              type="button"
              className={`text-sm font-medium ${isExpired ? 'text-gray-400' : 'text-gray-900'}`}
              onMouseEnter={() => user?.phone && setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
            >
              {formatParticipantName(participant)}
            </button>
            {user?.phone && showTooltip && (
              <div className="absolute z-10 mt-1 px-2 py-1 text-xs text-white bg-gray-900 rounded shadow-lg whitespace-nowrap -left-1/2 left-1/2">
                {user.phone}
                <div className="absolute top-0 left-1/2 -mt-1 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
              </div>
            )}
          </div>
          {user && (
            <span className="text-xs text-gray-500 mt-1">{user.email}</span>
          )}
        </div>
      </td>

      {/* Роль */}
      <td className="px-4 py-3 text-sm">
        <ParticipantBadge type="role" value={participant.role} />
      </td>

      {/* Статус */}
      <td className="px-4 py-3 text-sm">
        <ParticipantBadge type="status" value={participant.status} />
      </td>

      {/* Срок действия */}
      <td className="px-4 py-3 text-sm text-gray-500">
        {participant.expiresAt ? (
          <div className="flex flex-col">
            <span>до {formatDate(participant.expiresAt)}</span>
            {isExpired && (
              <span className="text-xs text-red-500 font-medium">Истёк</span>
            )}
          </div>
        ) : (
          <span className="text-green-600">Бессрочно</span>
        )}
      </td>

      {/* Комментарий */}
      <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">
        {participant.comment || '—'}
      </td>

      {/* Назначен */}
      <td className="px-4 py-3 text-sm text-gray-500">
        {formatDate(participant.assignedAt)}
      </td>

      {/* Действия */}
      <td className="px-4 py-3 text-sm">
        {isAdmin ? (
          <div className="flex items-center gap-2">
            {onEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(participant)}
                className="text-indigo-600 hover:text-indigo-800"
              >
                Изменить
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(participant)}
                className="text-red-600 hover:text-red-800"
              >
                Удалить
              </Button>
            )}
          </div>
        ) : (
          <span className="text-gray-400">—</span>
        )}
      </td>
    </tr>
  );
}
