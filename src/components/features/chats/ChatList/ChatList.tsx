/**
 * @component ChatList
 * @category features/chats
 * @description Список групповых чатов с полем поиска и состояниями loading/error/empty
 *
 * @example
 * ```tsx
 * <ChatList />
 * ```
 *
 * @spec
 * - Загрузка чатов через apiClient.get('/chats')
 * - Состояния: isLoading, error, data (массив ChatListItem)
 * - Поиск по названию чата (debounce 300ms, фильтрация на клиенте)
 * - Пустое состояние: EmptyState, если список пуст
 * - Индикатор загрузки: "Загрузка чатов..."
 * - Обработка ошибок: сообщение + кнопка "Повторить"
 * - Сортировка: по lastMessageAt DESC (серверная)
 * - Клик по карточке → переход на /dashboard/chats/:chatId
 * - Чаты фильтруются: минимум 2 символа для поиска
 */
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { ChatCard } from '@/components/features/chats/ChatCard';
import { EmptyState } from '@/components/ui/EmptyState';
import type { ChatListItem } from '@/domains/comms/comms.types';

export function ChatList(): React.JSX.Element {
  const router = useRouter();

  const [items, setItems] = useState<ChatListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredItems, setFilteredItems] = useState<ChatListItem[]>([]);

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * Загрузить список чатов
   */
  const loadChats = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.get<{ items: ChatListItem[]; total: number }>('/chats');
      if (response.success && response.data) {
        const sorted = [...response.data.items].sort(
          (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime(),
        );
        setItems(sorted);
        setFilteredItems(sorted);
      } else {
        setItems([]);
        setFilteredItems([]);
        setError(response.error?.message || 'Ошибка загрузки данных');
      }
    } catch (err) {
      setItems([]);
      setFilteredItems([]);
      setError(err instanceof Error ? err.message : 'Ошибка загрузки списка чатов');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadChats();
  }, [loadChats]);

  /**
   * Обработчик изменения поискового запроса (с debounce 300ms)
   */
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      const trimmed = value.trim();
      if (trimmed.length < 2) {
        setFilteredItems(items);
        return;
      }

      const lowerQuery = trimmed.toLowerCase();
      const filtered = items.filter((item) =>
        item.name.toLowerCase().includes(lowerQuery),
      );
      setFilteredItems(filtered);
    }, 300);
  }, [items]);

  /**
   * Обработчик клика по карточке чата
   */
  const handleCardClick = useCallback(
    (chatId: string) => {
      router.push(`/dashboard/chats/${chatId}`);
    },
    [router],
  );

  /**
   * Обработчик создания нового чата
   */
  const handleCreateChat = useCallback(() => {
    router.push('/dashboard/chats/new');
  }, [router]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return (
    <div className="space-y-4">
      {/* Заголовок и поиск */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Групповые чаты</h2>
          <button
            type="button"
            onClick={handleCreateChat}
            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
          >
            <svg
              className="h-4 w-4 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Создать чат
          </button>
        </div>
        <input
          type="text"
          placeholder="Поиск по названию чата..."
          value={searchQuery}
          onChange={handleSearchChange}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm px-3 py-2 border"
          aria-label="Поиск по названию чата"
        />
      </div>

      {/* Состояние загрузки */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <svg
            className="animate-spin h-8 w-8 text-emerald-600"
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
          <p className="mt-3 text-sm text-gray-500">Загрузка чатов...</p>
        </div>
      )}

      {/* Состояние ошибки */}
      {error && !isLoading && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <svg
              className="h-8 w-8 text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
              />
            </svg>
          </div>
          <h3 className="mt-4 text-lg font-semibold text-gray-900">Ошибка загрузки</h3>
          <p className="mt-2 text-sm text-gray-500">{error}</p>
          <button
            type="button"
            onClick={loadChats}
            className="mt-4 inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
          >
            Повторить
          </button>
        </div>
      )}

      {/* Список чатов */}
      {!isLoading && !error && (
        <>
          {filteredItems.length === 0 ? (
            searchQuery.trim().length >= 2 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-sm text-gray-500">
                  Найдено чатов: 0
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Попробуйте изменить поисковый запрос
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <EmptyState
                  title="Нет групповых чатов"
                  description="У вас ещё нет групповых чатов. Создайте первый чат, чтобы начать общение с другими участниками СНТ."
                />
                <button
                  type="button"
                  onClick={handleCreateChat}
                  className="mt-4 inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                >
                  Создать чат
                </button>
              </div>
            )
          ) : (
            <div className="space-y-1">
              {filteredItems.map((item) => (
                <ChatCard
                  key={item.chatId}
                  chat={item}
                  onClick={() => handleCardClick(item.chatId)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
