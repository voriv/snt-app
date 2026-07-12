/**
 * @component PlotList
 * @category features
 * @description Таблица списка участков с колонками: номер, кадастр, площадь, адрес, действия
 *
 * @spec
 * - Отображает массив Plot[] в таблице
 * - Пустой массив → EmptyState (обрабатывается на уровне страницы)
 * - Кликабельный номер участка → ссылка на /dashboard/plots/:id
 * - Поля null отображаются как "—"
 * - Семантический HTML: <table>, <thead>, <tbody>
 * - ARIA-лейблы для доступности
 * - Колонка «Действия» содержит кнопки «Редактировать» и «Удалить»
 * - Кнопка «Редактировать» вызывает onEditPlot с id участка (AC-1.1 US-15)
 * - Кнопка «Удалить» вызывает onDeletePlot с id и plotNumber участка (AC-1.1 US-16)
 *
 * @param plots - Массив участков для отображения
 * @param onEditPlot - Коллбек при клике на кнопку «Редактировать» (передаёт id участка)
 * @param onDeletePlot - Коллбек при клике на кнопку «Удалить» (передаёт id и plotNumber)
 *
 * @see docs/user-stories/US-15-plot-editing.md — AC-1.1 (кнопка «Редактировать»)
 * @see docs/user-stories/US-16-plot-deletion.md — AC-1.1 (кнопка «Удалить»)
 */
'use client';

import type { ReactElement } from 'react';
import Link from 'next/link';
import type { Plot } from '@/domains/plot/plot.types';

export interface PlotListProps {
  /** Массив участков для отображения */
  plots: Plot[];
  /** Коллбек при клике на «Редактировать» (передаёт id участка) */
  onEditPlot?: (plotId: string) => void;
  /** Коллбек при клике на «Удалить» (передаёт id и plotNumber участка) */
  onDeletePlot?: (plotId: string, plotNumber: string) => void;
}

export function PlotList({ plots, onEditPlot, onDeletePlot }: PlotListProps): ReactElement {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">№ участка</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Кадастр</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Площадь (м²)</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Адрес</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Действия</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {plots.map((plot) => {
            return (
              <tr key={plot.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <Link href={`/dashboard/plots/${plot.id}`} className="text-indigo-600 hover:text-indigo-900">
                      {plot.plotNumber}
                    </Link>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{plot.cadastralNumber ?? '—'}</td>
                <td className="px-6 py-4 whitespace-nowrap">{plot.area}</td>
                <td className="px-6 py-4 whitespace-nowrap">{plot.address ?? '—'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {/* AC-1.1 (US-15): Кнопка «Редактировать» */}
                  {onEditPlot && (
                    <button
                      type="button"
                      onClick={() => onEditPlot(plot.id)}
                      className="text-indigo-600 hover:text-indigo-900"
                      aria-label={`Редактировать участок №${plot.plotNumber}`}
                    >
                      Редактировать
                    </button>
                  )}
                  {/* AC-1.1 (US-16): Кнопка «Удалить» */}
                  {onDeletePlot && (
                    <button
                      type="button"
                      onClick={() => onDeletePlot(plot.id, plot.plotNumber)}
                      className="text-red-600 hover:text-red-900 ml-4"
                      aria-label={`Удалить участок №${plot.plotNumber}`}
                    >
                      Удалить
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
