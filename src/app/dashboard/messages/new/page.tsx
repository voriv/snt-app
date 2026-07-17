/**
 * @file messages/new/page.tsx
 * @description Страница создания нового личного диалога
 * @page /dashboard/messages/new
 * @auth required
 * @role MEMBER, ADMIN, SUPER_ADMIN
 * @description Страница выбора собеседника для начала нового личного диалога
 *
 * @spec
 * - Клиентская страница с использованием useSession()
 * - Редирект на /login если нет сессии
 * - Отображение UserSelectorList для поиска и выбора собеседника
 * - При выборе пользователя: POST /api/v1/conversations
 * - Редирект на диалог после создания/поиска
 *
 * @data-flow
 * - useSession() → check auth → render NewConversationPage
 * - UserSelectorList → onSelectUser → POST /conversations → router.replace(/dashboard/messages/[id])
 */
'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { apiClient } from '@/lib/api-client';

/**
 * @type CreateConversationResult
 * @description Результат создания/поиска диалога
 */
interface CreateConversationResult {
  conversationId: string;
  isNew: boolean;
}

/**
 * @description Страница создания нового личного диалога
 */
export default function NewConversationPage(): React.JSX.Element {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Редирект если нет сессии
  useEffect(() => {
    if (status === 'unauthenticated') {
      setTimeout(() => {
        router.replace('/login');
      }, 100);
    }
  }, [status, router]);

  /**
   * Обработчик выбора пользователя
   */
  const handleSelectUser = async (participantId: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.post<CreateConversationResult>(
        '/conversations',
        { participantId }
      );

      if (response.success && response.data?.conversationId) {
        // Редирект в диалог
        router.replace(`/dashboard/messages/${response.data.conversationId}`);
      } else {
        setError(response.error?.message || 'Не удалось начать диалог');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка');
    } finally {
      setIsLoading(false);
    }
  };

  // Показываем индикатор загрузки во время проверки сессии
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Загрузка...</div>
      </div>
    );
  }

  // Показываем ошибку если нет сессии
  if (status === 'unauthenticated') {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-red-500">Требуется авторизация</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Новый диалог</h1>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      <UserSelectorList onSelectUser={handleSelectUser} isLoading={isLoading} />
    </div>
  );
}

/**
 * @component UserSelectorList
 * @description Список пользователей для выбора собеседника с поиском
 */
function UserSelectorList({
  onSelectUser,
  isLoading,
}: {
  onSelectUser: (userId: string) => void;
  isLoading: boolean;
}): React.JSX.Element {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<
    | {
        id: string;
        email: string;
        name: string;
        avatar: string | null;
      }[]
    | undefined
  >(undefined);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
      const response = await apiClient.get<{ id: string; email: string; name: string; avatar: string | null }[]>(
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
   * Обработчик выбора пользователя
   */
  const handleUserSelect = useCallback(
    (userId: string) => {
      onSelectUser(userId);
    },
    [onSelectUser]
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

  const isDisabled = isLoading || isSearching;

  return (
    <div className="flex flex-col">
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
          disabled={isDisabled}
          placeholder="Введите имя или email (минимум 2 символа)"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
          aria-describedby="search-help"
        />
        <p
          id="search-help"
          className="mt-1 text-sm text-gray-500"
        >
          Введите минимум 2 символа для поиска
        </p>
      </div>

      {/* Индикатор загрузки */}
      {isSearching && (
        <div className="mb-4 text-gray-500">
          <div className="flex items-center space-x-2">
            <svg
              className="animate-spin h-4 w-4"
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

      {/* Ошибка */}
      {error && !isSearching && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Список результатов */}
      {hasSearched && !isSearching && (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          {users === undefined || users.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              {query.length < 2 ? (
                <p>Введите имя или email для поиска</p>
              ) : (
                <p>Пользователи не найдены</p>
              )}
            </div>
          ) : (
            <ul role="listbox" aria-label="Результаты поиска">
              {users.map((user) => (
                <li key={user.id}>
                  <button
                    type="button"
                    onClick={() => handleUserSelect(user.id)}
                    disabled={isLoading}
                    className="w-full flex items-center space-x-3 p-3 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label={`Выбрать ${user.name || user.email}`}
                  >
                    {/* Аватар */}
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt=""
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                        {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || '?'}
                      </div>
                    )}

                    {/* Информация */}
                    <div className="flex-1 text-left">
                      <p className="font-medium text-gray-900">
                        {user.name || 'Без имени'}
                      </p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Индикатор загрузки кнопки */}
      {isLoading && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <svg
              className="animate-spin h-5 w-5 text-blue-600"
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
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <span className="text-blue-700 font-medium">
              Создание диалога...
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
