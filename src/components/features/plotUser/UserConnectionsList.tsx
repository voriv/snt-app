/**
 * @component UserConnectionsList
 * @category features
 * @description Список связей пользователя с участками — основной контейнер US-19-3
 *
 * @example
 * ```tsx
 * <UserConnectionsList userId={session.user.id} />
 * <UserConnectionsList userId={session.user.id} limit={5} showViewAll />
 * ```
 *
 * @spec
 * - Загружает данные через apiClient.get('/plot-users/connections') при монтировании
 * - Передаёт фильтры (role, status) через query params
 * - Поиск через apiClient.post('/plot-users/connections/search') с debounce 300ms
 * - Состояния: loading (skeleton), error (alert), data (table), empty (EmptyState)
 * - EmptyState: "Вы пока не привязаны ни к одному участку" (AC-6.1)
 * - EmptyState фильтр: "По вашему запросу ничего не найдено" + кнопка "Сбросить" (AC-6.2)
 * - Пагинация: 25 элементов на страницу (Edge Case #3)
 * - Кнопка "Показать все" если limit задан (TV-2 dashboard)
 * - Оптимистичное обновление после US-19-1/4/5
 *
 * @see US-19-3 FR-1 (список связей)
 * @see US-19-3 FR-6 (пустое состояние)
 * @see US-19-3 AC-6.1, AC-6.2 (EmptyState)
 * @see US-19-3 Edge Case #3 (пагинация)
 */
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { apiClient } from '@/lib/api-client';
import type { PlotUserRoleConnection, PlotUserRoleConnectionFilter } from '@/domains/plotUser/plotUser.types';
import { ConnectionsFilters } from './ConnectionsFilters';
import type { ConnectionsFiltersValue } from './ConnectionsFilters';
import { ConnectionsSearch } from './ConnectionsSearch';
import { ConnectionsTable } from './ConnectionsTable';
import { ConnectionModal } from './ConnectionModal';
import { EmptyState } from '@/components/ui/EmptyState';

export interface UserConnectionsListProps {
  userId: string;
  limit?: number;
  showViewAll?: boolean;
}

const DEFAULT_LIMIT = 25;

export function UserConnectionsList({
  userId,
  limit,
  showViewAll,
}: UserConnectionsListProps) {
  const [connections, setConnections] = useState<PlotUserRoleConnection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ConnectionsFiltersValue>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedConnection, setSelectedConnection] = useState<PlotUserRoleConnection | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Загрузка данных
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const filterParams = new URLSearchParams();

      if (filters.role && filters.role !== 'all') {
        filterParams.set('role', filters.role.toString());
      }
      if (filters.status && filters.status !== 'all') {
        filterParams.set('status', filters.status);
      }
      if (limit) {
        filterParams.set('limit', limit.toString());
      }

      const queryString = filterParams.toString();
      const url = `/plot-users/connections${queryString ? `?${queryString}` : ''}`;

      const response = await apiClient.get<PlotUserRoleConnection[]>(url);

      if (response.success && response.data) {
        setConnections(response.data);
      } else {
        setError(response.error?.message || 'Не удалось загрузить связи');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки связей');
    } finally {
      setIsLoading(false);
    }
  }, [userId, filters, limit]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Поиск с debounce
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      if (!value.trim()) {
        loadData();
        return;
      }

      try {
        const response = await apiClient.post<PlotUserRoleConnection[]>('/plot-users/connections/search', {
          search: value,
        });

        if (response.success && response.data) {
          setConnections(response.data);
        }
      } catch (err) {
        console.error('Search error:', err);
      }
    }, 300); // OQ-6: debounce 300ms
  }, [loadData]);

  const handleSearchClear = useCallback(() => {
    setSearchQuery('');
  }, []);

  const handleFilterChange = useCallback((newFilters: ConnectionsFiltersValue) => {
    setFilters(newFilters);
  }, []);

  const handleFilterReset = useCallback(() => {
    setFilters({});
    setSearchQuery('');
  }, []);

  const handleShowDetails = useCallback((connection: PlotUserRoleConnection) => {
    setSelectedConnection(connection);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedConnection(null);
  }, []);

  // Empty state: пользователь не привязан ни к одному участку
  if (!isLoading && connections.length === 0 && !searchQuery && !filters.role && !filters.status) {
    return (
      <EmptyState
        title="Вы пока не привязаны ни к одному участку"
        description="Для привязки обратитесь к администратору"
      />
    );
  }

  // Empty state: фильтр не нашёл совпадений
  if (!isLoading && connections.length === 0 && (searchQuery || filters.role || filters.status)) {
    return (
      <div className="text-center py-12">
        <EmptyState
          title="По вашему запросу ничего не найдено"
          description="Попробуйте изменить фильтры или поисковый запрос"
        />
        <button
          type="button"
          onClick={handleFilterReset}
          className="mt-4 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
        >
          Сбросить фильтры
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center justify-between gap-4">
        <ConnectionsFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          onReset={handleFilterReset}
        />
        <ConnectionsSearch
          value={searchQuery}
          onChange={handleSearchChange}
          onClear={handleSearchClear}
        />
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          Загрузка...
        </div>
      )}

      {/* Table */}
      {!isLoading && (
        <ConnectionsTable
          connections={connections}
          onShowDetails={handleShowDetails}
          searchQuery={searchQuery}
        />
      )}

      {/* View all button */}
      {showViewAll && (
        <div className="text-center">
          <a
            href="/dashboard/my-connections"
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Показать все →
          </a>
        </div>
      )}

      {/* Modal */}
      <ConnectionModal
        connection={selectedConnection}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
}
