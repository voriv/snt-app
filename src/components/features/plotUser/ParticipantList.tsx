'use client';

/**
 * @component ParticipantList
 * @category features
 * @description Список участников участка с фильтрами и поиском
 *
 * @example
 * ```tsx
 * <ParticipantList
 *   plotId="clx..."
 *   onAddParticipant={handleAdd}
 *   onEditParticipant={handleEdit}
 *   onDeleteParticipant={handleDelete}
 *   isAdmin={true}
 * />
 * ```
 *
 * @spec
 * - Загружает данные через apiClient при монтировании
 * - Отображает таблицу с фильтрами и поиском
 * - Обрабатывает пустое состояние (EmptyState)
 * - Индикатор загрузки (skeleton)
 * - Обработка ошибок (alert)
 * - Debounce поиска 300ms
 * - forwardRef для вызова метода перезагрузки извне
 *
 * @see US-19-2 AC-1.1 (открытие списка участников)
 * @see US-19-2 AC-5.2 (поиск моментальный)
 */

import { useState, useEffect, useCallback, useRef, forwardRef, useImperativeHandle } from 'react';
import { apiClient } from '@/lib/api-client';
import type {
  PlotUserRoleParticipant,
  PlotUserRoleParticipantFilter,
} from '@/domains/plotUser/plotUser.types';
import { ParticipantTable } from './ParticipantTable';
import { ParticipantFilters } from './ParticipantFilters';
import { ParticipantSearch } from './ParticipantSearch';
import { EmptyState } from '@/components/ui/EmptyState';

/**
 * Интерфейс для синтетического ref, который можно использовать из родителя
 */
export interface ParticipantListRef {
  /** Метод для перезагрузки данных из родительского компонента */
  refetch: () => void;
}

/** Props для ParticipantList */
export interface ParticipantListProps {
  /** ID участка */
  plotId: string;
  /** Callback при добавлении участника */
  onAddParticipant?: () => void;
  /** Callback при редактировании участника */
  onEditParticipant?: (participant: PlotUserRoleParticipant) => void;
  /** Callback при удалении участника */
  onDeleteParticipant?: (participant: PlotUserRoleParticipant) => void;
  /** Флаг администратора (для кнопок редактирования/удаления) */
  isAdmin?: boolean;
}

/**
 * @component
 */
export const ParticipantList = forwardRef<ParticipantListRef, ParticipantListProps>(
  ({ plotId, onAddParticipant, onEditParticipant, onDeleteParticipant, isAdmin }, ref) => {
    const [participants, setParticipants] = useState<PlotUserRoleParticipant[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Пагинация
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const limit = 25;

    // Фильтры
    const [roleFilter, setRoleFilter] = useState<PlotUserRoleParticipantFilter['role']>(undefined);
    const [statusFilter, setStatusFilter] = useState<PlotUserRoleParticipantFilter['status']>(undefined);

    // Поиск
    const [searchQuery, setSearchQuery] = useState('');

    // Ref для отмены предыдущего запроса при изменении параметров
    const abortControllerRef = useRef<AbortController | null>(null);

    /**
     * Загрузка данных участников
     */
    const loadParticipants = useCallback(async () => {
      // Отменяем предыдущий запрос
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      setIsLoading(true);
      setError(null);

      try {
        const filter: PlotUserRoleParticipantFilter = {
          page: currentPage,
          limit,
        };

        if (roleFilter !== undefined) {
          filter.role = roleFilter;
        }

        if (statusFilter !== undefined) {
          filter.status = statusFilter;
        }

        if (searchQuery) {
          filter.search = searchQuery;
        }

        const queryParams: Record<string, string | number | boolean | null | undefined> = {};
        if (filter.role) queryParams.role = String(filter.role);
        if (filter.status) queryParams.status = filter.status;
        if (filter.search) queryParams.search = filter.search;
        queryParams.page = filter.page;
        queryParams.limit = filter.limit;

        const response = await apiClient.getWithQuery<{
          data: PlotUserRoleParticipant[];
          total: number;
          page: number;
          limit: number;
          totalPages: number;
        }>(`/plots/${plotId}/participants`, queryParams, {
          signal: controller.signal,
        });

        if (!controller.signal.aborted) {
          console.log('[ParticipantList] API response:', response);
          console.log('[ParticipantList] response.data:', response.data);
          // getWithQuery возвращает ответ напрямую, не обёрнутый в ApiResponse
          // ответ имеет структуру: { success, data: [], total, page, limit, totalPages }
          setParticipants((response as any).data || []);
          setTotal((response as any).total || 0);
          setCurrentPage((response as any).page || 1);
          setTotalPages((response as any).totalPages || 1);
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          // AbortError игнорируем - это нормальное поведение при отмене запроса
          if (err instanceof DOMException && err.name === 'AbortError') {
            return;
          }

          setError(
            err instanceof Error ? err.message : 'Произошла ошибка при загрузке данных'
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }, [plotId, currentPage, limit, roleFilter, statusFilter, searchQuery]);

    // Экспортируем метод refetch через useImperativeHandle
    useImperativeHandle(
      ref,
      () => ({
        refetch: loadParticipants,
      }),
      [loadParticipants]
    );

    /**
     * Загрузка при монтировании и изменении параметров
     */
    useEffect(() => {
      loadParticipants();
    }, [loadParticipants]);

    /**
     * Обработчик сброса фильтров
     */
    const handleResetFilters = useCallback(() => {
      setRoleFilter(undefined);
      setStatusFilter(undefined);
      setSearchQuery('');
      setCurrentPage(1);
    }, []);

    /**
     * Обработчик смены страницы
     */
    const handlePageChange = useCallback((page: number) => {
      setCurrentPage(page);
    }, []);

    /**
     * Обработчик редактирования
     */
    const handleEdit = useCallback(
      (participant: PlotUserRoleParticipant) => {
        onEditParticipant?.(participant);
      },
      [onEditParticipant],
    );

    /**
     * Обработчик удаления
     */
 const handleDelete = useCallback(
   (participant: PlotUserRoleParticipant) => {
     // Передаём управление родительскому компоненту для обработки удаления
     // Подтверждение будет запрошено в родительском компоненте через ConfirmModal
     onDeleteParticipant?.(participant);
   },
   [onDeleteParticipant],
 );

    // Определяем сообщение для пустого состояния
    const getEmptyStateMessage = () => {
      const hasActiveFilters = roleFilter !== undefined || statusFilter !== undefined || searchQuery;

      if (hasActiveFilters) {
        return {
          title: 'Ничего не найдено',
          description:
            'Не удалось найти участников с указанными фильтрами. Попробуйте изменить параметры поиска или сбросить фильтры.',
        };
      }

      return {
        title: 'Участники не найдены',
        description:
          'У этого участка ещё нет участников. Добавьте первого участника, чтобы начать работу.',
      };
    };

    const emptyState = getEmptyStateMessage();

    return (
      <div className="space-y-4">
        {/* Заголовок и кнопки */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-gray-900">Участники участка</h2>
          {onAddParticipant && (
            <button
              type="button"
              onClick={onAddParticipant}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Добавить участника
            </button>
          )}
        </div>

        {/* Ошибка */}
        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Ошибка</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={loadParticipants}
                    className="text-sm font-medium text-red-800 hover:text-red-700"
                  >
                    Попробовать снова
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Фильтры и поиск */}
        <div className="flex flex-col gap-4">
          <ParticipantFilters
            roleFilter={roleFilter}
            statusFilter={statusFilter}
            onRoleChange={setRoleFilter}
            onStatusChange={setStatusFilter}
            onReset={handleResetFilters}
          />
          <ParticipantSearch
            value={searchQuery}
            onChange={setSearchQuery}
            debounceMs={300}
          />
        </div>

        {/* Таблица */}
        {isLoading || participants.length > 0 ? (
          <ParticipantTable
            data={participants}
            isLoading={isLoading}
            currentPage={currentPage}
            totalPages={totalPages}
            isAdmin={isAdmin}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onPageChange={handlePageChange}
          />
        ) : (
          <EmptyState title={emptyState.title} description={emptyState.description} />
        )}

        {/* Итого */}
        {!isLoading && participants.length > 0 && (
          <p className="text-sm text-gray-500 text-center">
            Всего найдено: {total} участник(ов)
          </p>
        )}
      </div>
    );
  }
);
