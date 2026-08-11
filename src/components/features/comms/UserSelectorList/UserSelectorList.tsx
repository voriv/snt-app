/**
 * @component UserSelectorList
 * @category features/comms
 * @description Список пользователей для выбора собеседника с поиском.
 * Единственный источник (R-16): дедуплицирован из messages/new/page.tsx (T18).
 * Опциональные пропсы `existingConversations`/`conversationsLoaded` позволяют
 * показывать две кнопки («Открыть диалог» / «Написать») — см. B029/B031.
 *
 * @example
 * ```tsx
 * <UserSelectorList onSelectUser={(id) => console.log(id)} />
 * <UserSelectorList
 *   onSelectUser={(id, conversationId) => ...}
 *   existingConversations={map}
 *   conversationsLoaded={loaded}
 *   isLoading={posting}
 * />
 * ```
 *
 * @spec
 * - Поле поиска <Input> с debounce 300ms (R-13)
 * - Загрузка данных через apiClient GET /users/search?q=...
 * - Ошибка поиска → <ErrorMessage> (R-23)
 * - Пустые состояния через <EmptyState>
 * - Две кнопки через <Button>: «Открыть диалог» (secondary) / «Написать» (primary)
 * - Кнопки блокируются до завершения предзагрузки диалогов (EC-04)
 * - Клавиатурная навигация (стрелки + Enter)
 *
 * @covers AC-4 (R-23): кастомная ошибка → <ErrorMessage>
 * @covers AC-1 (R-13): кнопки действий → <Button>
 * @covers AC-2 (R-13): поле поиска → <Input>
 * @covers AC-7 (R-16): единственный источник UserSelectorList
 */
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { EmptyState } from '@/components/ui/EmptyState';

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
 * @description Props для компонента UserSelectorList.
 * `existingConversations`/`conversationsLoaded` — опциональны (backward compatibility, T18).
 */
export interface UserSelectorListProps {
  /** Callback при выборе пользователя. Вторым аргументом передаётся ID существующего диалога (опционально) */
  onSelectUser: (userId: string, conversationId?: string) => void;
  /** Идёт ли POST /conversations (блокировка) */
  isLoading?: boolean;
  /** Mapping существующих диалогов: participantId → conversationId (T18, FR-09) */
  existingConversations?: Map<string, string>;
  /** Флаг «предзагрузка диалогов завершена». Если не задан — считается true (backward compatible) */
  conversationsLoaded?: boolean;
}

export function UserSelectorList({
  onSelectUser,
  isLoading = false,
  existingConversations = new Map<string, string>(),
  conversationsLoaded = true,
}: UserSelectorListProps): React.JSX.Element {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<UserSearchResult[] | undefined>(undefined);
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
        setUsers(response.data);
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
   * Обработчик клавиатурной навигации
   */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < (users?.length ?? 0) - 1 ? prev + 1 : 0
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : (users?.length ?? 0) - 1
        );
      } else if (
        e.key === 'Enter' &&
        highlightedIndex >= 0 &&
        highlightedIndex < (users?.length ?? 0) &&
        users
      ) {
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

  // Блокировка поля поиска до завершения предзагрузки, а также во время POST/поиска
  const isDisabled = isLoading || isSearching || !conversationsLoaded;
  // Блокировка кнопок до завершения предзагрузки диалогов (EC-04)
  const isMappingLoading = !conversationsLoaded;

  return (
    <div className="flex flex-col">
      {/* Поле поиска */}
      <div className="mb-4">
        <Input
          id="user-search"
          type="text"
          value={query}
          onChange={handleQueryChange}
          onKeyDown={handleKeyDown}
          disabled={isDisabled}
          placeholder="Введите имя или email (минимум 2 символа)"
          aria-label="Найти пользователя"
          autoComplete="off"
          aria-describedby="search-help"
        />
        <p id="search-help" className="mt-1 text-sm text-[var(--theme-text-secondary)]">
          Введите минимум 2 символа для поиска
        </p>
      </div>

      {/* Индикатор загрузки поиска */}
      {isSearching && (
        <div
          role="status"
          aria-label="Загрузка"
          className="mb-4 text-[var(--theme-text-secondary)]"
        >
          <div className="flex items-center space-x-2">
            <svg
              className="animate-spin h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <span>Поиск...</span>
          </div>
        </div>
      )}

      {/* Ошибка поиска */}
      {error && !isSearching && <ErrorMessage message={error} />}

      {/* Список результатов */}
      {hasSearched && !isSearching && (
        <div className="border border-[var(--theme-border-color)] rounded-lg overflow-hidden">
          {users === undefined || users.length === 0 ? (
            query.length < 2 ? (
              <div className="p-6 text-center text-[var(--theme-text-secondary)]">
                <p>Введите имя или email для поиска</p>
              </div>
            ) : (
              <EmptyState
                title="Нет доступных пользователей"
                description="Попробуйте изменить параметры поиска"
              />
            )
          ) : (
            <ul role="listbox" aria-label="Результаты поиска">
              {users.map((user, index) => {
                const conversationId = existingConversations?.get(user.id);
                const displayName = user.name || user.email;

                return (
                  <li
                    key={user.id}
                    role="option"
                    aria-selected={index === highlightedIndex}
                    className={`flex items-center p-3 transition-colors ${
                      index === highlightedIndex
                        ? 'bg-[var(--theme-bg-secondary)]'
                        : 'hover:bg-[var(--theme-bg-secondary)]'
                    }`}
                  >
                    {/* Аватар */}
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt=""
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-[var(--theme-bg-secondary)] flex items-center justify-center text-[var(--theme-text-secondary)]">
                        {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || '?'}
                      </div>
                    )}

                    {/* Информация */}
                    <div className="flex-1 text-left ml-3">
                      <p className="font-medium text-[var(--theme-text-primary)]">
                        {user.name || 'Без имени'}
                      </p>
                      <p className="text-sm text-[var(--theme-text-secondary)]">{user.email}</p>
                    </div>

                    {/* Кнопка зависит от загрузки диалогов и наличия диалога */}
                    {isMappingLoading ? (
                      /* Loading: mapping ещё не загружен (EC-04) */
                      <Button variant="secondary" size="sm" isLoading disabled aria-label="Загрузка">
                        <span role="status" aria-label="Загрузка" className="sr-only">
                          Загрузка диалогов
                        </span>
                      </Button>
                    ) : conversationId ? (
                      /* AC-05, AC-06: Диалог существует → «Открыть диалог» (без API) */
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => onSelectUser(user.id, conversationId)}
                        aria-label={`Открыть диалог с ${displayName}`}
                      >
                        Открыть диалог
                      </Button>
                    ) : (
                      /* AC-05: Нет диалога → «Написать» (POST /conversations) */
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => onSelectUser(user.id)}
                        disabled={isLoading}
                        isLoading={isLoading}
                        aria-label={`Написать ${displayName}`}
                      >
                        {isLoading ? null : 'Написать'}
                      </Button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
