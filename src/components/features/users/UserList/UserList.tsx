/**
 * @component UserList
 * @category features/users
 * @description Таблица списка пользователей с пагинацией, поиском и сортировкой.
 * Адаптирован под темы (light/dark/green) через CSS-переменные var(--theme-*) (B-013)
 *
 * @spec
 * - Загружает данные через apiClient.getWithQuery('/users', { page, limit, q, sort, order })
 * - Отображает таблицу с колонками: Email, Имя, Фамилия, Роли, Дата регистрации
 * - Состояния: loading, error, empty (через EmptyState)
 * - Пагинация (кнопки Назад/Вперёд)
 * - Поиск через UserSearch компонент с debounce
 * - Сортировка по клику на заголовки столбцов (email, firstName, lastName, createdAt)
 * - Иконки сортировки (▲/▼) для активного поля
 * - Сброс page=1 при изменении поиска
 * - Роли отображаются как список бейджей
 * - При 403 — сообщение об отсутствии доступа
 * - Клик по строке таблицы → навигация на /dashboard/users/{id} (US-20-03)
 *
 * @see docs/user-stories/US-20-02-поиск-и-сортировка-пользователей.md
 * @see docs/user-stories/US-20-03-просмотр-карточки-пользователя.md
 */
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { ReactElement } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { UserSearch } from '../UserSearch';

/**
 * @type UserListItem
 * @domain users
 * @description Строка пользователя в списке (клиентский тип)
 */
interface UserListItem {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  roles: string[];
  createdAt: string;
}

/**
 * @type UserListResponse
 * @domain users
 * @description Ответ API со списком пользователей
 */
interface UserListResponse {
  items: UserListItem[];
  total: number;
  page: number;
  limit: number;
}

/**
 * @type UserSortField
 * @domain users
 * @description Допустимые поля сортировки
 */
type UserSortField = 'email' | 'firstName' | 'lastName' | 'createdAt';

const LIMIT = 25;

/**
 * @type SortConfig
 * @domain users
 * @description Конфигурация сортировки
 */
interface SortConfig {
  field: UserSortField;
  order: 'asc' | 'desc';
}

/**
 * Маппинг полей сортировки на названия столбцов
 */
const COLUMN_LABELS: Record<UserSortField, string> = {
  email: 'Email',
  firstName: 'Имя',
  lastName: 'Фамилия',
  createdAt: 'Дата регистрации',
};

export function UserList(): ReactElement {
  const [items, setItems] = useState<UserListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [sort, setSort] = useState<SortConfig>({ field: 'createdAt', order: 'desc' });

  const loadUsers = useCallback(
    async (currentPage: number, query: string, sortField: UserSortField, sortOrder: 'asc' | 'desc') => {
      setIsLoading(true);
      setError(null);
      try {
        const params: Record<string, string | number> = {
          page: currentPage,
          limit: LIMIT,
          sort: sortField,
          order: sortOrder,
        };
        if (query) {
          params.q = query;
        }
        const response = await apiClient.getWithQuery<UserListResponse>('/users', params);
        if (response.success && response.data) {
          setItems(response.data.items);
          setTotal(response.data.total);
        } else {
          setError('Не удалось загрузить список пользователей');
        }
      } catch (err) {
        if (err instanceof Error && err.message.includes('403')) {
          setError('Доступ запрещен. Только супер-администратор может просматривать список пользователей.');
        } else {
          setError(err instanceof Error ? err.message : 'Произошла ошибка при загрузке данных');
        }
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    loadUsers(page, searchQuery, sort.field, sort.order);
  }, [page, searchQuery, sort.field, sort.order, loadUsers]);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setPage(1);
  }, []);

  const handleSort = useCallback(
    (field: UserSortField) => {
      setSort(prev => ({
        field,
        order: prev.field === field && prev.order === 'asc' ? 'desc' : 'asc',
      }));
    },
    [],
  );

  const handlePrevPage = useCallback(() => {
    if (page > 1) {
      setPage(p => p - 1);
    }
  }, [page]);

  const handleNextPage = useCallback(() => {
    const totalPages = Math.ceil(total / LIMIT);
    if (page < totalPages) {
      setPage(p => p + 1);
    }
  }, [page, total]);

  /**
   * Рендер иконки сортировки для заголовка столбца
   */
  const renderSortIcon = (field: UserSortField) => {
    if (sort.field !== field) {
      return <span className="text-[var(--theme-text-secondary)] ml-1">↕</span>;
    }
    return <span className="text-[var(--theme-accent)] ml-1">{sort.order === 'asc' ? '▲' : '▼'}</span>;
  };

  if (isLoading && !searchQuery) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
          <p className="mt-4 text-sm text-[var(--theme-text-secondary)]">Загрузка данных...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--theme-badge-danger-bg)]">
            <svg className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <h3 className="mt-4 text-lg font-semibold text-[var(--theme-text-primary)]">Ошибка</h3>
          <p className="mt-2 text-sm text-[var(--theme-text-secondary)] max-w-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Поиск */}
      <UserSearch onSearch={handleSearch} />

      {/* Таблица */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-[var(--theme-border-color)]">
          <thead className="bg-[var(--theme-bg-secondary)]">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-[var(--theme-text-secondary)] uppercase tracking-wider">
                <button
                  type="button"
                  onClick={() => handleSort('email')}
                  className="flex items-center hover:text-[var(--theme-text-primary)] focus:outline-none"
                  aria-label={`Сортировать по ${COLUMN_LABELS.email}`}
                >
                  {COLUMN_LABELS.email}
                  {renderSortIcon('email')}
                </button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[var(--theme-text-secondary)] uppercase tracking-wider">
                <button
                  type="button"
                  onClick={() => handleSort('firstName')}
                  className="flex items-center hover:text-[var(--theme-text-primary)] focus:outline-none"
                  aria-label={`Сортировать по ${COLUMN_LABELS.firstName}`}
                >
                  {COLUMN_LABELS.firstName}
                  {renderSortIcon('firstName')}
                </button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[var(--theme-text-secondary)] uppercase tracking-wider">
                <button
                  type="button"
                  onClick={() => handleSort('lastName')}
                  className="flex items-center hover:text-[var(--theme-text-primary)] focus:outline-none"
                  aria-label={`Сортировать по ${COLUMN_LABELS.lastName}`}
                >
                  {COLUMN_LABELS.lastName}
                  {renderSortIcon('lastName')}
                </button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[var(--theme-text-secondary)] uppercase tracking-wider">
                Роли
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[var(--theme-text-secondary)] uppercase tracking-wider">
                <button
                  type="button"
                  onClick={() => handleSort('createdAt')}
                  className="flex items-center hover:text-[var(--theme-text-primary)] focus:outline-none"
                  aria-label={`Сортировать по ${COLUMN_LABELS.createdAt}`}
                >
                  {COLUMN_LABELS.createdAt}
                  {renderSortIcon('createdAt')}
                </button>
              </th>
            </tr>
          </thead>
          <tbody className="bg-[var(--theme-bg-primary)] divide-y divide-[var(--theme-border-color)]">
            {items.map(user => {
              const router = useRouter();
              return (
                <tr
                  key={user.id}
                  className="cursor-pointer hover:bg-[var(--theme-hover-bg)] transition-colors"
                  onClick={() => router.push(`/dashboard/users/${user.id}`)}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--theme-text-primary)]">{user.email}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--theme-text-primary)]">{user.firstName ?? '—'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--theme-text-primary)]">{user.lastName ?? '—'}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-wrap gap-1">
                    {user.roles.length > 0 ? (
                      user.roles.map(role => (
                        <Badge key={role} variant="info">
                          {role}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-[var(--theme-text-secondary)] text-sm">—</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--theme-text-secondary)]">
                  {new Date(user.createdAt).toLocaleDateString('ru-RU')}
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Пустое состояние */}
      {items.length === 0 && !isLoading && (
        <EmptyState
          title={searchQuery ? 'Ничего не найдено' : 'Пользователи не найдены'}
          description={searchQuery ? 'Попробуйте изменить параметры поиска' : 'Список пользователей пуст'}
        />
      )}

      {/* Пагинация */}
      {items.length > 0 && (
        <div className="flex items-center justify-between px-6 py-3 bg-[var(--theme-bg-primary)] border-t border-[var(--theme-border-color)]">
          <div className="text-sm text-[var(--theme-text-primary)]">
            Страница {page} из {Math.max(1, Math.ceil(total / LIMIT))} (всего: {total})
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handlePrevPage}
              disabled={page <= 1}
              className="px-4 py-2 text-sm font-medium text-[var(--theme-text-primary)] bg-[var(--theme-bg-primary)] border border-[var(--theme-border-color)] rounded-md hover:bg-[var(--theme-hover-bg)] disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Предыдущая страница"
            >
              Назад
            </button>
            <button
              type="button"
              onClick={handleNextPage}
              disabled={page >= Math.ceil(total / LIMIT)}
              className="px-4 py-2 text-sm font-medium text-[var(--theme-text-primary)] bg-[var(--theme-bg-primary)] border border-[var(--theme-border-color)] rounded-md hover:bg-[var(--theme-hover-bg)] disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Следующая страница"
            >
              Вперёд
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
