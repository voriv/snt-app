/**
 * @component ParticipantSelector
 * @category features/comms
 * @description Компонент для выбора участников группового чата с поиском и мульти-селектом
 *
 * @example
 * ```tsx
 * <ParticipantSelector
 *   selectedIds={['id1', 'id2']}
 *   onChange={(ids) => setSelectedIds(ids)}
 * />
 * ```
 *
 * @spec
 * - Поле поиска с debounce 300ms
 * - Загрузка данных через apiClient GET /users/search?q=...
 * - Мульти-селект: клик добавляет/удаляет пользователя из выбранного
 * - Отображение выбранных участников в виде тегов сверху
 * - Удаление тега кликом по X
 * - Пустые состояния: "Нет доступных пользователей" / "Пользователь не найден"
 * - Клавиатурная навигация (стрелки + Enter для подсветки, но выбор только кликом)
 */
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Badge } from '@/components/ui/Badge';

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
 * @interface ParticipantSelectorProps
 * @description Props для компонента ParticipantSelector
 */
export interface ParticipantSelectorProps {
  /** Массив ID выбранных участников */
  selectedIds: string[];
  /** Callback при изменении выбора участников */
  onChange: (ids: string[]) => void;
  /** Загружен ли компонент (блокировка поиска) */
  isLoading?: boolean;
}

export function ParticipantSelector({
  selectedIds,
  onChange,
  isLoading: externalLoading,
}: ParticipantSelectorProps): React.JSX.Element {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<UserSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [selectedUsers, setSelectedUsers] = useState<UserSearchResult[]>([]);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /**
   * Ref для хранения актуального списка выбранных пользователей.
   * Используется в refreshSelectedUsers для избежания бесконечного цикла
   * ререндеринга (selectedUsers → refreshSelectedUsers → useEffect → setSelectedUsers).
   */
  const selectedUsersRef = useRef(selectedUsers);

  // Keep the ref in sync with state
  useEffect(() => {
    selectedUsersRef.current = selectedUsers;
  }, [selectedUsers]);

  /**
   * Обновить список выбранных пользователей по ID
   */
  const refreshSelectedUsers = useCallback(async (ids: string[]) => {
    const existing = [...selectedUsersRef.current];
    const newIds = ids.filter((id) => !existing.some((u) => u.id === id));

    if (newIds.length > 0) {
      try {
        for (const id of newIds) {
          const response = await apiClient.get<UserSearchResult>(`/users/${id}`);
          if (response.success && response.data) {
            existing.push(response.data);
          }
        }
        setSelectedUsers(existing);
      } catch {
        // Ignore error - user might not be accessible
      }
    } else {
      setSelectedUsers(existing.filter((u) => ids.includes(u.id)));
    }
  }, []);

  /**
   * Эффект для синхронизации выбранных пользователей при изменении selectedIds извне
   */
  useEffect(() => {
    refreshSelectedUsers(selectedIds);
  }, [selectedIds, refreshSelectedUsers]);

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
        // Filter out already selected users
        const filtered = response.data.filter(
          (u) => !selectedIds.includes(u.id)
        );
        setUsers(filtered ?? []);
      }
    } catch {
      setError('Не удалось найти пользователей');
      setUsers([]);
    } finally {
      setIsSearching(false);
    }
  }, [selectedIds]);

  /**
   * Обработчик изменения поискового запроса с debounce
   */
  const handleQueryChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
   * Обработчик выбора/снятия выбора пользователя
   */
  const handleToggleUser = useCallback(
    (userId: string) => {
      const newIds = selectedIds.includes(userId)
        ? selectedIds.filter((id) => id !== userId)
        : [...selectedIds, userId];
      onChange(newIds);
    },
    [selectedIds, onChange]
  );

  /**
   * Обработчик удаления пользователя из выбранных
   */
  const handleRemoveSelected = useCallback(
    (userId: string) => {
      const newIds = selectedIds.filter((id) => id !== userId);
      onChange(newIds);
    },
    [selectedIds, onChange]
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
      }
    },
    [users.length]
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
    <div className="flex flex-col" aria-label="Выбор участников чата">
      {/* Выбранные участники — теги */}
      {selectedUsers.length > 0 && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-[var(--theme-text-primary)] mb-2">
            Выбранные участники ({selectedUsers.length})
          </label>
          <div className="flex flex-wrap gap-2">
            {selectedUsers.map((user) => (
              <span key={user.id} className="inline-flex items-center gap-1">
                <Badge variant="info">
                  {user.name}
                  <Button
                    variant="ghost"
                    size="sm"
                    type="button"
                    onClick={() => handleRemoveSelected(user.id)}
                    className="ml-1 !p-0 h-auto"
                    aria-label={`Удалить ${user.name} из участников`}
                    disabled={isDisabled}
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </Button>
                </Badge>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Поле поиска */}
      <div className="mb-4">
        <label
          htmlFor="participant-search"
          className="block text-sm font-medium text-[var(--theme-text-primary)] mb-1"
        >
          Добавить участников
        </label>
        <Input
          id="participant-search"
          type="text"
          value={query}
          onChange={handleQueryChange}
          onKeyDown={handleKeyDown}
          placeholder="Введите имя или email..."
          disabled={isDisabled}
          aria-autocomplete="list"
          aria-expanded={users.length > 0}
          aria-activedescendant={
            highlightedIndex >= 0 ? `participant-item-${highlightedIndex}` : undefined
          }
        />
      </div>

      {/* Ошибка */}
      {error && <ErrorMessage message={error} />}

      {/* Индикатор загрузки */}
      {isSearching && (
        <div className="flex justify-center py-8" role="status" aria-live="polite">
          <svg
            className="animate-spin h-8 w-8 text-[var(--theme-accent)]"
            aria-hidden="true"
            xmlns="http://www.w.org/2000/svg"
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
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--theme-bg-secondary)]">
            <svg
              className="h-8 w-8 text-[var(--theme-text-secondary)]"
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
          <h3 className="mt-4 text-lg font-semibold text-[var(--theme-text-primary)]">
            Пользователь не найден
          </h3>
          <p className="mt-2 text-sm text-[var(--theme-text-secondary)]">
            Попробуйте изменить поисковый запрос
          </p>
        </div>
      )}

      {!hasSearched && !isSearching && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--theme-bg-secondary)]">
            <svg
              className="h-8 w-8 text-[var(--theme-text-secondary)]"
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
          <h3 className="mt-4 text-lg font-semibold text-[var(--theme-text-primary)]">
            Начните вводить имя или email
          </h3>
          <p className="mt-2 text-sm text-[var(--theme-text-secondary)]">
            Минимум 2 символа для поиска
          </p>
        </div>
      )}

      {/* Список пользователей */}
      {!isSearching && users.length > 0 && (
        <ul className="divide-y divide-gray-200 max-h-64 overflow-y-auto" role="list">
          {users.map((user, index) => (
            <li
              key={user.id}
              id={`participant-item-${index}`}
              role="option"
              aria-selected={index === highlightedIndex}
              tabIndex={-1}
              className={`flex items-center gap-3 p-4 cursor-pointer transition-colors ${
                index === highlightedIndex
                  ? 'bg-[var(--theme-bg-secondary)]'
                  : 'hover:bg-[var(--theme-bg-secondary)]'
              }`}
              onClick={() => handleToggleUser(user.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleToggleUser(user.id);
                }
              }}
            >
              {/* Чекбокс */}
              <div className="flex-shrink-0">
                <div
                  className={`h-5 w-5 rounded border-2 flex items-center justify-center transition-colors ${
                    selectedIds.includes(user.id)
                      ? 'bg-[var(--theme-accent)] border-[var(--theme-accent)]'
                      : 'border-[var(--theme-input-border)]'
                  }`}
                >
                  {selectedIds.includes(user.id) && (
                    <svg
                      className="h-3 w-3 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={3}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </div>
              </div>

              {/* Аватар */}
              <div className="flex-shrink-0">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={`${user.name} аватар`}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-[var(--theme-bg-secondary)] flex items-center justify-center">
                    <span className="text-[var(--theme-text-secondary)] font-medium text-sm">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>

              {/* Информация о пользователе */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--theme-text-primary)] truncate">
                  {user.name}
                </p>
                <p className="text-sm text-[var(--theme-text-secondary)] truncate">{user.email}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
