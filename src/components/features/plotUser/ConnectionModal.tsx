/**
 * @component ConnectionModal
 * @category features
 * @description Модальное окно с деталями участка для связи
 *
 * @example
 * ```tsx
 * <ConnectionModal
 *   connection={selectedConnection}
 *   isOpen={isModalOpen}
 *   onClose={handleCloseModal}
 * />
 * ```
 *
 * @spec
 * - Отображает полную информацию об участке (номер, кадастр, площадь, адрес)
 * - Информация о связи (роль, статус, срок, комментарий, дата назначения)
 * - Ссылка на страницу участка `/dashboard/plots/[id]` (AC-2.4)
 * - Кнопка "Закрыть"
 * - Доступность: focus trap, Esc для закрытия
 *
 * @see US-19-3 AC-2.4 (кнопка Подробнее)
 */
'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import type { PlotUserRoleConnection } from '@/domains/plotUser/plotUser.types';
import { formatDate } from './ConnectionsTable';
import { ConnectionBadge } from './ConnectionBadge';

export interface ConnectionModalProps {
  connection: PlotUserRoleConnection | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ConnectionModal({
  connection,
  isOpen,
  onClose,
}: ConnectionModalProps) {
  useEffect(() => {
    if (isOpen) {
      const handleEsc = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };
      document.addEventListener('keydown', handleEsc);
      return () => document.removeEventListener('keydown', handleEsc);
    }
  }, [isOpen, onClose]);

  if (!isOpen || !connection) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal panel */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 shadow-xl transition-all max-w-lg w-full">
          {/* Header */}
          <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white" id="modal-title">
              Детали связи
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
              aria-label="Закрыть"
            >
              ×
            </button>
          </div>

          {/* Body */}
          <div className="px-4 py-4 space-y-4">
            {/* Участок */}
            <div>
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Участок</h4>
              <p className="mt-1 text-sm text-gray-900 dark:text-white">
                {connection.plot
                  ? `Уч. ${connection.plot.plotNumber}${connection.plot.address ? ` — ${connection.plot.address}` : ''}`
                  : '[удалён]'}
              </p>
              {connection.plot?.cadastralNumber && (
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Кадастр: {connection.plot.cadastralNumber}
                </p>
              )}
              {connection.plot?.area && (
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Площадь: {connection.plot.area} кв.м.
                </p>
              )}
              {connection.plot && (
                <Link
                  href={`/dashboard/plots/${connection.plotId}`}
                  className="mt-2 inline-block text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  Перейти к участку →
                </Link>
              )}
            </div>

            {/* Роль и статус */}
            <div className="flex gap-4">
              <div>
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Роль</h4>
                <div className="mt-1">
                  <ConnectionBadge type="role" value={connection.role} />
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Статус</h4>
                <div className="mt-1">
                  <ConnectionBadge type="status" value={connection.status} />
                </div>
              </div>
            </div>

            {/* Срок действия */}
            <div>
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Срок действия</h4>
              <p className="mt-1 text-sm text-gray-900 dark:text-white">
                {connection.expiresAt === null
                  ? 'Бессрочно'
                  : formatDate(connection.expiresAt)}
              </p>
            </div>

            {/* Комментарий */}
            {connection.comment && (
              <div>
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Комментарий</h4>
                <p className="mt-1 text-sm text-gray-900 dark:text-white">{connection.comment}</p>
              </div>
            )}

            {/* Дата назначения */}
            <div>
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Назначен</h4>
              <p className="mt-1 text-sm text-gray-900 dark:text-white">
                {formatDate(connection.assignedAt)}
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
            >
              Закрыть
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
