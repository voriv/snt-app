/**
 * @component UserSelectorList
 * @category features/comms
 * @description Список пользователей для выбора собеседника с поиском
 *
 * @example
 * ```tsx
 * <UserSelectorList onSelectUser={(id) => console.log(id)} />
 * ```
 *
 * @spec
 * - Поле поиска с debounce 300ms
 * - Загрузка данных через apiClient GET /users/search?q=...
 * - Отображение: аватар, имя, email для каждого пользователя
 * - Пустые состояния: "Нет доступных пользователей" / "Пользователь не найден"
 * - Клик по пользователю вызывает onSelectUser с ID
 * - Клавиатурная навигация (стрелки + Enter)
 */
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { apiClient } from '@/lib/api-client';

/**
 * @type UserSearchResult
 * @description Результат поиска пользователя
 */
interface UserSearchResult {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
}

/**
 * @interface UserSelectorListProps
 * @description Props для компонента UserSelectorList
 */
export interface UserSelectorListProps {
  /** Callback при выборе пользователя */
  onSelectUser: (userId: string) => void;
  /** Загружен ли компонент (блокировка поиска) */
  isLoading?: boolean;
}

export function UserSelectorList({
  onSelectUser,
  isLoading: externalLoading,
}: UserSelectorListProps): React.JSX.Element {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<UserSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * Выполнить поиск пользователей
   */
  const searchUsers = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setUsers([]);
      setHasSearched(false);
      setError(null);
      return;
    }

    setIsSearching(true);
    setError(null);
    setHasSearched(true);

    try {
      const response = await apiClient.get<UserSearchResult[]>(
        `/users/search?q=${encodeURIComponent(searchQuery)}`
      );
      if (response.success && response.data) {
        setUsers(response.data ?? []);
      }
    } catch {
      setError('Не удалось найти пользователей');
      setUsers([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  /**
   * Обработчик изменения поискового запроса с debounce
   */
  const handleQueryChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setQuery(value);

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        searchUsers(value);
      }, 300);
    },
    [searchUsers]
  );

  /**
   * Обработчик клавиатурной навигации
   */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightedIndex((prev) => (prev < users.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : users.length - 1));
      } else if (e.key === 'Enter' && highlightedIndex >= 0 && highlightedIndex < users.length) {
        e.preventDefault();
        onSelectUser(users[highlightedIndex].id);
      }
    },
    [users, highlightedIndex, onSelectUser]
  );

  /**
   * Очистка debounce timer
   */
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const isDisabled = externalLoading || isSearching;

  return (
    <div className="flex flex-col" role="listbox" aria-label="Выбор собеседника">
      {/* Поле поиска */}
      <div className="mb-4">
        <label
          htmlFor="user-search"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Найти пользователя
        </label>
        <input
          id="user-search"
          type="text"
          value={query}
          onChange={handleQueryChange}
          onKeyDown={handleKeyDown}
          placeholder="Введите имя или email..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          disabled={isDisabled}
          aria-autocomplete="list"
          aria-expanded={users.length > 0}
          aria-activedescendant={
            highlightedIndex >= 0 ? `user-item-${highlightedIndex}` : undefined
          }
        />
      </div>

      {/* Ошибка */}
      {error && (
        <div className="text-sm text-red-600 mb-4" role="alert">
          {error}
        </div>
      )}

      {/* Индикатор загрузки */}
      {isSearching && (
        <div className="flex justify-center py-8">
          <svg
            className="animate-spin h-8 w-8 text-indigo-600"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </div>
      )}

      {/* Пустые состояния */}
      {!isSearching && hasSearched && users.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
            <svg
              className="h-8 w-8 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
              />
            </svg>
          </div>
          <h3 className="mt-4 text-lg font-semibold text-gray-900">
            Пользователь не найден
          </h3>
          <p className="mt-2 text-sm text-gray-500">
            Попробуйте изменить поисковый запрос
          </p>
        </div>
      )}

      {!hasSearched && !isSearching && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
            <svg
              className="h-8 w-8 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
              />
            </svg>
          </div>
          <h3 className="mt-4 text-lg font-semibold text-gray-900">
            Начните вводить имя или email
          </h3>
          <p className="mt-2 text-sm text-gray-500">
            Минимум 2 символа для поиска
          </p>
        </div>
      )}

      {/* Список пользователей */}
      {!isSearching && users.length > 0 && (
        <ul className="divide-y divide-gray-200 max-h-96 overflow-y-auto" role="list">
          {users.map((user, index) => (
            <li
              key={user.id}
              id={`user-item-${index}`}
              role="option"
              aria-selected={index === highlightedIndex}
              tabIndex={-1}
              className={`flex items-center gap-3 p-4 cursor-pointer transition-colors ${
                index === highlightedIndex
                  ? 'bg-indigo-50'
                  : 'hover:bg-gray-50'
              }`}
              onClick={() => onSelectUser(user.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectUser(user.id);
                }
              }}
            >
              {/* Аватар */}
              <div className="flex-shrink-0">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={`${user.name} аватар`}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                    <span className="text-indigo-600 font-medium text-sm">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>

              {/* Информация о пользователе */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user.name}
                </p>
                <p className="text-sm text-gray-500 truncate">{user.email}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
