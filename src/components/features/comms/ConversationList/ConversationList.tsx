/**
 * @component ConversationList
 * @category features/comms
 * @description Список диалогов с полем поиска и состояниями loading/error/empty
 *
 * @example
 * ```tsx
 * <ConversationList />
 * ```
 *
 * @spec
 * - Загрузка диалогов через apiClient.get('/conversations')
 * - Состояния: isLoading, error, data (массив ConversationListItem)
 * - Поиск по имени собеседника (debounce 300ms, фильтрация на клиенте)
 * - Пустое состояние: ConversationEmptyState, если список пуст
 * - Индикатор загрузки: "Загрузка диалогов..."
 * - Обработка ошибок: сообщение + кнопка "Повторить"
 * - Сортировка: по lastMessageAt DESC (серверная)
 * - Клик по карточке → переход на /dashboard/comms/messages/:conversationId
 * - Диалоги фильтруются: минимум 2 символа для поиска
 */
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { ConversationCard } from '@/components/features/comms/ConversationCard';
import { ConversationEmptyState } from '@/components/features/comms/ConversationEmptyState';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import type { ConversationListItem } from '@/domains/comms/comms.types';

export function ConversationList(): React.JSX.Element {
  const router = useRouter();

  const [items, setItems] = useState<ConversationListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredItems, setFilteredItems] = useState<ConversationListItem[]>([]);

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * Загрузить список диалогов
   */
  const loadConversations = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.get<{ items: ConversationListItem[]; total: number }>('/conversations');
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
      setError(err instanceof Error ? err.message : 'Ошибка загрузки списка диалогов');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  /**
   * Обработчик изменения поискового запроса (с debounce 300ms)
   */
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
        item.participantName.toLowerCase().includes(lowerQuery),
      );
      setFilteredItems(filtered);
    }, 300);
  }, [items]);

  /**
   * Обработчик клика по карточке диалога
   */
  const handleCardClick = useCallback(
    (conversationId: string) => {
      router.push(`/dashboard/comms/messages/${conversationId}`);
    },
    [router],
  );

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
          <h2 className="text-lg font-semibold text-[var(--theme-text-primary)]">Личные диалоги</h2>
          <Button
            variant="primary"
            size="sm"
            type="button"
            onClick={() => router.push('/dashboard/comms/messages/new')}
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
                d="M12 4.5v15m7.5-7.5h-15"
              />
            </svg>
            Новый диалог
          </Button>
        </div>
        <Input
          type="text"
          placeholder="Поиск по имени собеседника..."
          value={searchQuery}
          onChange={handleSearchChange}
          aria-label="Поиск по имени собеседника"
        />
      </div>

      {/* Состояние загрузки — скелетон-карточки диалогов (R-14, T1) */}
      {isLoading && (
        <div
          className="divide-y divide-[var(--theme-border-color)]"
          role="status"
          aria-live="polite"
        >
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 p-4 animate-pulse">
              {/* Аватар */}
              <div className="w-10 h-10 rounded-full bg-[var(--theme-bg-secondary)]" />
              {/* Контент */}
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-[var(--theme-bg-secondary)] rounded w-1/3" />
                <div className="h-3 bg-[var(--theme-bg-secondary)] rounded w-2/3" />
              </div>
              {/* Время */}
              <div className="h-3 bg-[var(--theme-bg-secondary)] rounded w-12" />
            </div>
          ))}
        </div>
      )}

      {/* Состояние ошибки */}
      {error && !isLoading && (
        <div className="flex flex-col items-center gap-3 py-8">
          <ErrorMessage message={error} />
          <Button variant="ghost" size="sm" type="button" onClick={loadConversations}>
            Повторить
          </Button>
        </div>
      )}

      {/* Список диалогов */}
      {!isLoading && !error && (
        <>
          {filteredItems.length === 0 ? (
            searchQuery.trim().length >= 2 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-sm text-[var(--theme-text-secondary)]">
                  Найдено диалогов: 0
                </p>
                <p className="text-xs text-[var(--theme-text-secondary)] mt-1">
                  Попробуйте изменить поисковый запрос
                </p>
              </div>
            ) : (
              <ConversationEmptyState />
            )
          ) : (
            <div className="space-y-1">
              {filteredItems.map((item) => (
                <ConversationCard
                  key={item.conversationId}
                  conversation={item}
                  onClick={() => handleCardClick(item.conversationId)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
