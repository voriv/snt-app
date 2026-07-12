/**
 * @file plot-users/page.tsx
 * @description Страница списка связей пользователей с участками
 *
 * @spec
 * - Client Component с 'use client'
 * - Загрузка данных через apiClient GET /api/v1/plot-users с relation preload
 * - Пустое состояние: EmptyState с заголовком "Связи не найдены"
 * - Ошибки: сообщение "Ошибка загрузки списка связей" с кнопкой "Повторить"
 * - Состояние загрузки: скелетон таблицы
 * - Кнопка "Добавить связь" открывает форму для создания новой связи
 * - Inline-редактирование: при клике на "Редактировать" показывается форма
 * - При успешном сохранении — обновление списка
 * - US-19-1: Удаление связи через ConfirmDialog с подтверждением
 *
 * @data-flow
 * - Client Component → apiClient GET /api/v1/plot-users → PlotUserList
 * - PlotUserList onClick edit → PlotUserForm → apiClient PATCH /plot-users/:id
 * - PlotUserList onClick delete → ConfirmDialog → apiClient DELETE /plot-users/:id
 */
'use client';

import { useState, useEffect, useCallback, type ReactElement } from 'react';
import { apiClient } from '@/lib/api-client';
import { PlotUserList, PlotUserForm } from '@/components/features/plotUser';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import type { PlotUserRoleWithRelations } from '@/domains/plotUser/plotUser.types';

interface PlotUsersPageState {
  plotUsers: PlotUserRoleWithRelations[];
  isLoading: boolean;
  error: string | null;
}

/**
 * @component PlotUsersPage
 * @description Страница списка связей пользователей с участками
 * @auth required
 * @role MEMBER, ADMIN
 * @spec
 * - Загружает данные при монтировании
 * - При отсутствии данных показывает EmptyState
 * - При ошибке показывает сообщение с кнопкой повторной загрузки
 */
export default function PlotUsersPage(): ReactElement {
  const [state, setState] = useState<PlotUsersPageState>({
    plotUsers: [],
    isLoading: true,
    error: null,
  });

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingPlotUserId, setEditingPlotUserId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Состояние для диалога удаления
  const [deleteDialogState, setDeleteDialogState] = useState<{
    isOpen: boolean;
    plotUserId: string | null;
    plotUserDescription: string | null;
  }>({ isOpen: false, plotUserId: null, plotUserDescription: null });

  const [deleteError, setDeleteError] = useState<string | null>(null);

  const loadPlotUsers = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const response = await apiClient.get<PlotUserRoleWithRelations[]>('/plot-users');
      if (response.success && response.data) {
        setState({
          plotUsers: response.data,
          isLoading: false,
          error: null,
        });
      } else {
        setState({
          plotUsers: [],
          isLoading: false,
          error: response.error?.message || 'Ошибка загрузки данных',
        });
      }
    } catch (err) {
      console.error('Failed to load plot users:', err);
      setState({
        plotUsers: [],
        isLoading: false,
        error:
          err instanceof Error ? err.message : 'Ошибка загрузки списка связей',
      });
    }
  }, []);

  useEffect(() => {
    loadPlotUsers();
  }, [loadPlotUsers]);

  // Обработчик создания новой связи
  const handleSave = useCallback(
    async (data: {
      userId: string;
      plotId: string;
      role: 1 | 2 | 3;
      expiresAt?: string | null;
      comment?: string | null;
    }): Promise<void> => {
      setIsSubmitting(true);
      try {
        const response = await apiClient.post('/plot-users', {
          userId: data.userId,
          plotId: data.plotId,
          role: data.role,
          ...(data.expiresAt && data.expiresAt !== null && { expiresAt: data.expiresAt }),
          ...(data.comment && data.comment !== null && { comment: data.comment }),
        });

        if (response.success) {
          setSuccessMessage('Связь успешно создана');
          setTimeout(() => setSuccessMessage(null), 3000);
          setIsCreateModalOpen(false);
          await loadPlotUsers();
        } else {
          throw new Error(
            response.error?.message || 'Ошибка при сохранении'
          );
        }
      } catch (err) {
        setIsSubmitting(false);
        throw err;
      }
    },
    [loadPlotUsers]
  );

  // Обработчик редактирования
  const handleEdit = useCallback((id: string) => {
    setEditingPlotUserId(id);
    setIsCreateModalOpen(true);
  }, []);

  // Обработчик удаления
  const handleDelete = useCallback((id: string) => {
    const item = state.plotUsers.find((p) => p.id === id);
    setDeleteDialogState({
      isOpen: true,
      plotUserId: id,
      plotUserDescription: item
        ? `Пользователь: ${item.user?.email || 'Неизвестный'}, Участок: ${item.plot?.plotNumber || item.plotId}`
        : null,
    });
  }, [state.plotUsers]);

  const handleCloseDeleteDialog = useCallback(() => {
    setDeleteDialogState({
      isOpen: false,
      plotUserId: null,
      plotUserDescription: null,
    });
    setDeleteError(null);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteDialogState.plotUserId) return;

    try {
      const response = await apiClient.delete(`/plot-users/${deleteDialogState.plotUserId}`);
      
      if (response.success) {
        // Optimistic update
        setState((prev) => ({
          ...prev,
          plotUsers: prev.plotUsers.filter(
            (p) => p.id !== deleteDialogState.plotUserId
          ),
        }));
        handleCloseDeleteDialog();
      } else {
        throw new Error(
          response.error?.message || 'Ошибка при удалении'
        );
      }
    } catch (err) {
      console.error('Failed to delete plot user:', err);
      setDeleteError(
        err instanceof Error ? err.message : 'Ошибка при удалении'
      );
    }
  }, [deleteDialogState.plotUserId, handleCloseDeleteDialog]);

  if (state.isLoading) {
    return (
      <div className="flex items-center justify-center p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-2">
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Связи пользователей с участками</h1>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          Добавить связь
        </Button>
      </div>

      {state.error && (
        <div className="bg-red-50 border border-red-200 rounded p-4 mb-6">
          <div className="flex items-center justify-between">
            <p className="text-red-800">{state.error}</p>
            <Button variant="secondary" size="sm" onClick={loadPlotUsers}>
              Повторить
            </Button>
          </div>
        </div>
      )}

      {deleteError && (
        <div className="bg-red-50 border border-red-200 rounded p-4 mb-6">
          <div className="flex items-center justify-between">
            <p className="text-red-800">{deleteError}</p>
            <Button variant="secondary" size="sm" onClick={() => setDeleteError(null)}>
              Закрыть
            </Button>
          </div>
        </div>
      )}

      {/* Сообщение об успешном создании связи */}
      {successMessage && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg dark:bg-green-900/20 dark:border-green-800">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-sm font-medium text-green-800 dark:text-green-300">
              {successMessage}
            </span>
            <button
              onClick={() => setSuccessMessage(null)}
              className="ml-auto text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {state.plotUsers.length === 0 ? (
        <EmptyState
          title="Связи не найдены"
          description="Связи пользователей с участками не найдены. Нажмите 'Добавить связь', чтобы создать новую."
        />
      ) : (
        <PlotUserList
          data={state.plotUsers}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      {/* Модальное окно создания/редактирования */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {editingPlotUserId ? 'Редактировать связь' : 'Новая связь'}
            </h2>
            <PlotUserForm
              isEditing={!!editingPlotUserId}
              onSubmit={async (data) => {
                if (editingPlotUserId) {
                  // Обновление существующей записи
                  setIsSubmitting(true);
                  try {
                    const response = await apiClient.patch(`/plot-users/${editingPlotUserId}`, {
                      userId: data.userId,
                      plotId: data.plotId,
                      role: data.role,
                      ...(data.expiresAt && data.expiresAt !== null && { expiresAt: data.expiresAt }),
                      ...(data.comment && data.comment !== null && { comment: data.comment }),
                    });

                    if (response.success) {
                      setIsCreateModalOpen(false);
                      setEditingPlotUserId(null);
                      await loadPlotUsers();
                    } else {
                      throw new Error(
                        response.error?.message || 'Ошибка при обновлении'
                      );
                    }
                  } catch (err) {
                    console.error('Failed to update plot user:', err);
                    // Не выбрасываем ошибку, чтобы форма осталась открытой
                    setIsSubmitting(false);
                  }
                } else {
                  // Создание новой записи
                  await handleSave(data);
                }
              }}
              isLoading={isSubmitting}
              editId={editingPlotUserId ?? undefined}
              onError={(errorMessage) => {
                console.error('Ошибка при сохранении:', errorMessage);
              }}
              onCancel={() => {
                setIsCreateModalOpen(false);
                setEditingPlotUserId(null);
              }}
            />
          </div>
        </div>
      )}

      {/* Диалог подтверждения удаления */}
      <ConfirmDialog
        isOpen={deleteDialogState.isOpen}
        onClose={handleCloseDeleteDialog}
        onConfirm={handleConfirmDelete}
        title="Подтверждение удаления"
        message={`Вы действительно хотите удалить связь? ${
          deleteDialogState.plotUserDescription
            ? `(${deleteDialogState.plotUserDescription})`
            : ''
        }`}
        confirmLabel="Удалить"
        cancelLabel="Отмена"
        variant="danger"
      />
    </div>
  );
}
