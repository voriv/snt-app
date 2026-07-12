/**
 * @component ConnectionsTable
 * @category features
 * @description Таблица связей пользователя с участками
 *
 * @example
 * ```tsx
 * <ConnectionsTable
 *   connections={connections}
 *   onShowDetails={handleShowDetails}
 *   searchQuery={search}
 * />
 * ```
 *
 * @spec
 * - Колонки: Участок, Кадастр, Роль, Статус, Срок, Комментарий, Назначен, Детали (AC-1.2)
 * - Сортировка: активные → ожидание → истёкшие (выполняется на сервере, AC-1.3)
 * - Номер участка: "Уч. [plot_number]" (BR-3)
 * - Адрес: "Уч. [plot_number] — [address]" если есть (AC-2.2)
 * - Кадастр: "Кадастр: [cadastral_number]" если есть (AC-2.3)
 * - Удалённый участок: "[удалён]" (Edge Case #1)
 * - Срок: "Бессрочно" если expires_at=null (BR-4, AC-7.1)
 * - Срок: DD.MM.YYYY (AC-7.2)
 * - Истёкший срок: strikethrough (AC-7.3)
 * - Кнопка "Подробнее" открывает модалку (AC-2.4)
 * - Подсветка совпадений поиска (AC-5.4)
 * - `<th>` для доступности (NFR)
 *
 * @see US-19-3 AC-1.2 (столбцы)
 * @see US-19-3 AC-2.1-2.4 (информация об участке)
 * @see US-19-3 AC-7.1-7.3 (срок действия)
 * @see US-19-3 AC-5.4 (подсветка)
 */
'use client';

import Link from 'next/link';
import { ConnectionBadge } from './ConnectionBadge';
import type { PlotUserRoleConnection } from '@/domains/plotUser/plotUser.types';

export interface ConnectionsTableProps {
  connections: PlotUserRoleConnection[];
  onShowDetails: (connection: PlotUserRoleConnection) => void;
  searchQuery?: string;
}

/**
 * Форматирует дату в формат DD.MM.YYYY
 */
export function formatDate(date: Date | null): string {
  if (!date) return '—';
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}.${month}.${year}`;
}

/**
 * Подсвечивает совпадения поиска в тексте
 */
export function highlightText(text: string, query: string): React.ReactNode {
  if (!query || !text.toLowerCase().includes(query.toLowerCase())) {
    return text;
  }

  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);

  return parts.map((part, i) =>
    regex.test(part) ? (
      <strong key={i} className="font-bold">
        {part}
      </strong>
    ) : (
      part
    )
  );
}

/**
 * Проверяет, истёк ли срок связи
 */
export function isExpired(expiresAt: Date | null, status: string): boolean {
  if (expiresAt === null) return false;
  if (status !== 'expired') return false;
  return new Date(expiresAt) < new Date();
}

export function ConnectionsTable({
  connections,
  onShowDetails,
  searchQuery,
}: ConnectionsTableProps) {
  if (connections.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        Связи не найдены
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Участок
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Кадастр
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Роль
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Статус
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Срок
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Комментарий
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Назначен
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Детали
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-700">
          {connections.map((connection) => {
            const isPlotDeleted = !connection.plot;
            const plotLabel = isPlotDeleted
              ? '[удалён]'
              : searchQuery && connection.plot?.plotNumber
                ? highlightText(connection.plot.plotNumber, searchQuery)
                : connection.plot
                  ? `Уч. ${connection.plot.plotNumber}`
                  : '[удалён]';

            const addressLabel = connection.plot?.address
              ? ` — ${searchQuery && connection.plot.address
                  ? highlightText(connection.plot.address, searchQuery)
                  : connection.plot.address}`
              : '';

            const expiresAtExpired = isExpired(connection.expiresAt, connection.status);

            return (
              <tr
                key={connection.id}
                className={`${connection.status === 'expired' ? 'opacity-50' : ''} hover:bg-gray-50 dark:hover:bg-gray-800`}
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <Link
                    href={`/dashboard/plots/${connection.plotId}`}
                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    {plotLabel}
                    {addressLabel}
                  </Link>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {connection.plot?.cadastralNumber
                    ? `Кадастр: ${connection.plot.cadastralNumber}`
                    : '—'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <ConnectionBadge type="role" value={connection.role} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <ConnectionBadge type="status" value={connection.status} />
                </td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 ${expiresAtExpired ? 'line-through' : ''}`}>
                  {connection.expiresAt === null
                    ? 'Бессрочно'
                    : formatDate(connection.expiresAt)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
                  {connection.comment || '—'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {formatDate(connection.assignedAt)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <button
                    type="button"
                    onClick={() => onShowDetails(connection)}
                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    Подробнее
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
