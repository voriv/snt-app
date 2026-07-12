/**
 * @file plots/page.tsx
 * @description Страница списка земельных участков СНТ с поддержкой inline-редактирования
 *
 * @spec
 * - Client Component с 'use client'
 * - Загрузка данных через apiClient GET /api/v1/plots
 * - Пустое состояние: EmptyState с заголовком "Участки не найдены"
 * - Ошибки: сообщение "Ошибка загрузки списка участков" с кнопкой "Повторить"
 * - Состояние загрузки: скелетон таблицы
 * - Кнопка "Добавить участок" открывает модалку для создания нового участка
 * - Кликабельный номер участка → ссылка на /dashboard/plots/:id
 * - Inline-редактирование: при клике на "Редактировать" показывается форма
 * - При успешном сохранении — обновление списка/состояния
 * - US-16: Кнопка удаления показывает ConfirmDialog с подтверждением
 * - US-16: Оптимистичное обновление после удаления
 *
 * @data-flow
 * - Client Component → apiClient GET /api/v1/plots → PlotList
 * - PlotList onClick edit → inline PlotForm → apiClient PATCH /plots/:id
 * - PlotList onClick delete → ConfirmDialog → apiClient DELETE /plots/:id
 */
'use client';

import { useState, useEffect, useCallback, type ReactElement } from 'react';
import { apiClient } from '@/lib/api-client';
import { PlotList, PlotFormModal, PlotForm, PlotSearch } from '@/components/features/plots';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import type { Plot } from '@/domains/plot/plot.types';
import type { PlotSearchState } from '@/components/features/plots/PlotSearch';

interface PlotsPageState {
  plots: Plot[];
  isLoading: boolean;
  error: string | null;
}

/**
 * @component PlotsPage
 * @description Страница списка земельных участков
 */
export default function PlotsPage(): ReactElement {
  const [state, setState] = useState<PlotsPageState>({
    plots: [],
    isLoading: true,
    error: null,
  });

  // US-17: Состояние поиска
  const [searchState, setSearchState] = useState<PlotSearchState>({
    number: '',
    cadastral: '',
    note: '',
  });
  const [searchResults, setSearchResults] = useState<Plot[] | null>(null);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingPlotId, setEditingPlotId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // US-16: Состояние для диалога удаления
  const [deleteDialogState, setDeleteDialogState] = useState<{
    isOpen: boolean;
    plotId: string | null;
    plotNumber: string | null;
  }>({ isOpen: false, plotId: null, plotNumber: null });
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const loadPlots = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const response = await apiClient.get<Plot[]>('/plots');
      if (response.success && response.data) {
        setState({ plots: response.data, isLoading: false, error: null });
      } else {
        setState({
          plots: [],
          isLoading: false,
          error: response.error?.message || 'Ошибка загрузки данных',
        });
      }
    } catch (err) {
      console.error('Failed to load plots:', err);
      setState({
        plots: [],
        isLoading: false,
        error: err instanceof Error ? err.message : 'Ошибка загрузки списка участков',
      });
    }
  }, []);

  useEffect(() => {
    loadPlots();
  }, [loadPlots]);

  // US-17: Обработчик результатов поиска
  const handleSearchChange = useCallback((plots: Plot[]) => {
    setSearchResults(plots);
  }, []);

  // US-17: Сброс поиска
  const handleSearchClear = useCallback(() => {
    setSearchState({ number: '', cadastral: '', note: '' });
    setSearchResults(null);
    // Загружаем полный список
    loadPlots();
  }, [loadPlots]);

  // AC-2.3: Обработка успешного создания участка
  const handlePlotSaved = useCallback(
    (plot: Plot) => {
      // Обновляем список участков
      setState((prev) => ({
        ...prev,
        plots: [...prev.plots, plot],
      }));
      // Закрываем модалку
      setIsCreateModalOpen(false);
    },
    []
  );

  // AC-1.1: Начало редактирования участка
  const handleEditPlot = useCallback((plotId: string) => {
    setEditingPlotId(plotId);
  }, []);

  // AC-3.1: Отмена редактирования
  const handleCancelEdit = useCallback(() => {
    setEditingPlotId(null);
  }, []);

  // AC-2.1: Обновление участка
  const handleSavePlot = useCallback(
    async (data: {
      cadastralNumber: string | null;
      area: number;
      address: string | null;
      note: string | null;
    }) => {
      if (!editingPlotId) return;

      try {
        setIsSubmitting(true);
        const response = await apiClient.patch<Plot>(`/plots/${editingPlotId}`, data);
        if (response.success && response.data) {
          // Обновляем участок в списке
          setState((prev) => ({
            ...prev,
            plots: prev.plots.map((p) =>
              p.id === editingPlotId ? response.data! : p
            ),
          }));
          setEditingPlotId(null);
        } else if (response.error) {
          // AC-2.4: Ошибка дубликата / валидации
          setState((prev) => ({
            ...prev,
            error: response.error?.message || 'Ошибка сохранения',
          }));
        }
      } catch (err) {
        console.error('Failed to update plot:', err);
        setState((prev) => ({
          ...prev,
          error: err instanceof Error ? err.message : 'Ошибка сохранения',
        }));
      } finally {
        setIsSubmitting(false);
      }
    },
    [editingPlotId]
  );

  // US-16: Открытие диалога удаления
  const handleDeletePlot = useCallback((plotId: string, plotNumber: string) => {
    setDeleteDialogState({ isOpen: true, plotId, plotNumber });
    setDeleteError(null);
  }, []);

  // US-16: Закрытие диалога удаления
  const handleCloseDeleteDialog = useCallback(() => {
    setDeleteDialogState({ isOpen: false, plotId: null, plotNumber: null });
    setDeleteError(null);
  }, []);

  // US-16: Подтверждение удаления
  const handleConfirmDelete = useCallback(async () => {
    // Блокировка от повторных вызовов (prevent race condition)
    if (isDeleting) return;
    
    if (!deleteDialogState.plotId || !deleteDialogState.plotNumber) return;

    try {
      setIsDeleting(true);
      setDeleteError(null);

      const response = await apiClient.delete(`/plots/${deleteDialogState.plotId}`);

      if (response.success) {
        // Оптимистичное обновление - удаляем участок из списка
        setState((prev) => ({
          ...prev,
          plots: prev.plots.filter((p) => p.id !== deleteDialogState.plotId),
        }));
        handleCloseDeleteDialog();
      } else if (response.error) {
        const errorCode = response.error.code;
        
        if (errorCode === 'NOT_FOUND') {
          // Участок уже удалён (возможно через другой сеанс) - просто закрываем диалог
          // без показа ошибки пользователю
          handleCloseDeleteDialog();
        } else {
          setDeleteError(response.error.message || 'Ошибка удаления участка');
        }
      }
    } catch (err) {
      console.error('Failed to delete plot:', err);
      setDeleteError(err instanceof Error ? err.message : 'Ошибка удаления участка. Попробуйте позже.');
    } finally {
      setIsDeleting(false);
    }
  }, [deleteDialogState.plotId, deleteDialogState.plotNumber, isDeleting, handleCloseDeleteDialog]);

  // Получаем данные для редактируемого участка
  const editingPlot = editingPlotId
    ? state.plots.find((p) => p.id === editingPlotId)
    : null;

  if (state.isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Участки</h1>
          <Button variant="primary" disabled>
            Добавить участок
          </Button>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-gray-200 rounded" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-100 rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (state.error && !editingPlot) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Участки</h1>
        </div>
        <EmptyState
          title="Ошибка загрузки"
          description={state.error}
        />
        <div className="mt-4 flex justify-center">
          <Button variant="primary" onClick={loadPlots}>
            Повторить попытку
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Участки</h1>
        <Button variant="primary" onClick={() => setIsCreateModalOpen(true)}>
          Добавить участок
        </Button>
      </div>

      {/* US-17: Компонент поиска */}
      <div className="mb-6">
        <PlotSearch
          value={searchState}
          onChange={handleSearchChange}
          isLoading={state.isLoading}
        />
      </div>

      {/* AC-2.4: Сообщение об ошибке API */}
      {state.error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700">
          {state.error}
        </div>
      )}

      {editingPlot ? (
        <>
          <PlotForm
            mode="edit"
            plot={editingPlot}
            onSubmit={handleSavePlot}
            onCancel={handleCancelEdit}
            isLoading={isSubmitting}
          />
          <div className="mt-4">
            <Button variant="secondary" onClick={handleCancelEdit}>
              ← Назад к списку
            </Button>
          </div>
        </>
      ) : (
        <>
          {state.plots.length === 0 ? (
            <EmptyState
              title="Участки не найдены"
              description="Добавьте первый участок, чтобы начать учет"
            />
          ) : (
            <>
              {/* US-16: Сообщение об ошибке удаления */}
              {deleteError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700">
                  {deleteError}
                </div>
              )}

              {/* US-17: Используем результаты поиска или все участки */}
              <PlotList
                plots={searchResults ?? state.plots}
                onEditPlot={handleEditPlot}
                onDeletePlot={handleDeletePlot}
              />
            </>
          )}

          {/* AC-1.1: Модальное окно создания участка */}
          <PlotFormModal
            isOpen={isCreateModalOpen}
            mode="create"
            onPlotFormClose={() => setIsCreateModalOpen(false)}
            onPlotSaved={handlePlotSaved}
          />

          {/* US-16: Диалог подтверждения удаления */}
          <ConfirmDialog
            isOpen={deleteDialogState.isOpen}
            onClose={handleCloseDeleteDialog}
            title="Подтверждение удаления"
            message={
              deleteDialogState.plotNumber
                ? `Вы уверены, что хотите удалить участок №${deleteDialogState.plotNumber}? Это действие нельзя отменить.`
                : 'Вы уверены, что хотите удалить этот участок? Это действие нельзя отменить.'
            }
            onConfirm={handleConfirmDelete}
            variant="danger"
            confirmLabel="Удалить"
            cancelLabel="Отмена"
            isLoading={isDeleting}
          />
        </>
      )}
    </div>
  );
}
