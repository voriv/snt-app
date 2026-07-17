'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import { MessageWithSender } from '@/domains/comms/message.types';
import { MessageItem } from '@/components/features/comms/MessageItem';
import { EmptyState } from '@/components/ui/EmptyState';
import { cn } from '@/shared/utils/cn';

/**
 * @component ConversationMessagesList
 * @category features/comms
 * @description Компонент для отображения списка сообщений в диалоге с поддержкой пагинации
 *
 * @prop messages - Список сообщений для отображения
 * @prop currentUserId - ID текущего пользователя для определения своих сообщений
 * @prop isLoading - Флаг загрузки данных
 * @prop hasMore - Есть ли еще сообщения для загрузки
 * @prop onLoadMore - Callback для загрузки дополнительных сообщений
 * @prop onScroll - Callback для отслеживания прокрутки
 * @prop lastMessageId - ID последнего сообщения (для автопрокрутки)
 *
 * @spec
 * - Автоматически прокручивает к последнему сообщению при загрузке
 * - При скролле вверх выше порога (100px) загружает предыдущие сообщения
 * - Отображает EmptyState если сообщений нет
 * - Показывает индикатор загрузки при подгрузке сообщений
 */
export interface ConversationMessagesListProps {
  messages: MessageWithSender[];
  currentUserId: string;
  isLoading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  lastMessageId?: string;
}

export const ConversationMessagesList: React.FC<ConversationMessagesListProps> = ({
  messages,
  currentUserId,
  isLoading = false,
  hasMore = false,
  onLoadMore,
  lastMessageId
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Автопрокрутка к последнему сообщению
  useEffect(() => {
    if (lastMessageId && scrollContainerRef.current) {
      const lastMessageElement = scrollContainerRef.current.querySelector(
        `[data-message-id="${lastMessageId}"]`
      );

      if (lastMessageElement) {
        lastMessageElement.scrollIntoView({
          behavior: 'smooth',
          block: 'end'
        });
      } else {
        // Если последнее сообщение еще не в DOM, прокручиваем вниз
        scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
      }
    }
  }, [lastMessageId]);

  // Наблюдатель для бесконечного скролла
  useEffect(() => {
    if (!onLoadMore || !hasMore) return;

    const container = scrollContainerRef.current;
    if (!container) return;

    // Создаем наблюдателя
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && onLoadMore) {
            onLoadMore();
          }
        });
      },
      {
        root: container,
        rootMargin: '100px',
        threshold: 0
      }
    );

    // Находим последний элемент
    const lastElement = container.lastElementChild;
    if (lastElement) {
      observerRef.current.observe(lastElement);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [onLoadMore, hasMore]);

  // Обработчик прокрутки
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container || !onLoadMore || !hasMore) return;

    const scrollTop = container.scrollTop;
    const scrollHeight = container.scrollHeight;
    const clientHeight = container.clientHeight;

    // Если прокрутили выше 100px от верха, загружаем предыдущие сообщения
    if (scrollTop < 100) {
      onLoadMore();
    }
  }, [onLoadMore, hasMore]);

  return (
    <div
      ref={scrollContainerRef}
      className={cn(
        'flex-1 overflow-y-auto px-4 py-6',
        'scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600',
        'scrollbar-track-transparent'
      )}
      onScroll={handleScroll}
      role="log"
      aria-live="polite"
      aria-label="История сообщений"
    >
      {messages.length === 0 ? (
        <EmptyState
          icon={
            <svg
              className="w-12 h-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          }
          title="Нет сообщений"
          description="Начните диалог, отправив первое сообщение"
        />
      ) : (
        <>
          {messages.map((message, index) => (
            <MessageItem
              key={message.id}
              message={message}
              currentUserId={currentUserId}
              isLastMessage={index === messages.length - 1}
            />
          ))}
          
          {/* Загрузочный индикатор */}
          {isLoading && (
            <div className="flex justify-center py-4">
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                <svg
                  className="w-5 h-5 animate-spin"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                <span className="text-sm">Загрузка...</span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
