/**
 * @component PlotFormModal
 * @category features
 * @description Модальное окно формы создания/редактирования участка
 *
 * @spec
 * - При mode="create" показывает заголовок "Новый участок"
 * - При mode="edit" показывает заголовок "Редактировать участок" и предзаполняет данные
 * - При успешной отправке вызывает onPlotSaved и закрывает окно
 * - При отмене вызывает onPlotFormClose и сбрасывает состояние
 *
 * @example
 * ```tsx
 * <PlotFormModal
 *   isOpen={isCreateModalOpen}
 *   mode="create"
 *   onPlotFormClose={() => setIsCreateModalOpen(false)}
 *   onPlotSaved={handlePlotSaved}
 * />
 * ```
 */
'use client';

import { useState, useCallback, type ReactElement } from 'react';
import { PlotForm } from './PlotForm';
import { Plot } from '@/domains/plot/plot.types';

interface PlotFormModalProps {
  /** Флаг открытого состояния модального окна */
  isOpen: boolean;
  /** Режим: create (создание) или edit (редактирование) */
  mode: 'create' | 'edit';
  /** Редактируемый участок (только для mode="edit") */
  plot?: Plot;
  /** Коллбек при закрытии модального окна */
  onPlotFormClose: () => void;
  /** Коллбек при успешном сохранении участка */
  onPlotSaved: (plot: Plot) => void;
}

/**
 * @component PlotFormModal
 * @description Модальное окно с формой создания/редактирования участка
 *
 * @spec
 * - Отображается только при isOpen=true
 * - При режиме 'create' передает mode="create" в PlotForm
 * - При режиме 'edit' передает mode="edit" и plot в PlotForm
 * - При успешной отправке вызывает onPlotSaved и закрывает окно
 */
export function PlotFormModal({
  isOpen,
  mode,
  plot,
  onPlotFormClose,
  onPlotSaved,
}: PlotFormModalProps): ReactElement | null {
  // PlotForm теперь сам управляет состоянием загрузки и API-вызовами

  const handleClose = useCallback(() => {
    onPlotFormClose();
  }, [onPlotFormClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onPlotFormClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-2xl rounded-lg bg-white shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              {mode === 'create' ? 'Новый участок' : 'Редактировать участок'}
            </h2>
            <button
              onClick={onPlotFormClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <span className="sr-only">Закрыть</span>
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {mode === 'create' ? (
              <PlotForm
                mode="create"
                onSubmit={onPlotSaved}
                onCancel={handleClose}
              />
            ) : plot ? (
              <PlotForm
                mode="edit"
                plot={plot}
                onSubmit={onPlotSaved}
                onCancel={handleClose}
              />
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
