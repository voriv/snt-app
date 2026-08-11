'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import { MessageWithSender } from '@/domains/comms/message.types';
import type { ConversationType, MessageWithReadStatus } from '@/domains/comms/comms.types';
import type { ReadStatus } from '@/components/features/comms/MessageItem';
import { MessageItem } from '@/components/features/comms/MessageItem';
import { EmptyState } from '@/components/ui/EmptyState';
import { cn } from '@/shared/utils/cn';

/**
 * @component ConversationMessagesList
 * @category features/comms
 * @description Компонент для отображения списка сообщений в диалоге с поддержкой пагинации и read receipts
 *
 * @prop messages - Список сообщений типа MessageWithReadStatus для отображения
 * @prop currentUserId - ID текущего пользователя для определения своих сообщений
 * @prop isLoading - Флаг загрузки данных
 * @prop hasMore - Есть ли еще сообщения для загрузки
 * @prop onLoadMore - Callback для загрузки дополнительных сообщений
 * @prop onScroll - Callback для отслеживания прокрутки
 * @prop lastMessageId - ID последнего сообщения (для автопрокрутки)
 * @prop conversationType - Тип беседы (DIRECT | GROUP) для ReadReceiptIcon
 *
 * @spec
 * - Автоматически прокручивает к последнему сообщению при загрузке
 * - При скролле вверх выше порога (100px) загружает предыдущие сообщения
 * - Отображает EmptyState если сообщений нет
 * - Показывает индикатор загрузки при подгрузке сообщений
 * - Прокидывает readStatus и conversationType в MessageItem для read receipts
 *
 * @traces US-39-02 AC-1, AC-2, AC-3, AC-6
 * @task B-026-T5-4
 *
 * @see docs/user-stories/US-39-02-read-receipts.md
 */
export interface ConversationMessagesListProps {
  /**
   * Список сообщений. Поддерживает `MessageWithReadStatus[]` (с read receipts, US-39-02)
   * и `MessageWithSender[]` (backward-compatible). ReadStatus извлекается, если присутствует.
   */
  messages: (MessageWithReadStatus | MessageWithSender)[];
  currentUserId: string;
  isLoading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  lastMessageId?: string;
  /**
   * Callback удаления сообщения. Прокидывается в MessageItem.
   * @covers AC-7 (B-024-T10-1)
   */
  onDelete?: (messageId: string) => void;
  /** Тип беседы для ReadReceiptIcon */
  conversationType?: ConversationType;
}

export const ConversationMessagesList: React.FC<ConversationMessagesListProps> = ({
  messages,
  currentUserId,
  isLoading = false,
  hasMore = false,
  onLoadMore,
  lastMessageId,
  onDelete,
  conversationType = 'DIRECT'
}) => {
  const getReadStatus = (
    message: MessageWithReadStatus | MessageWithSender,
  ): ReadStatus | undefined => {
    if ('isReadByRecipient' in message) {
      return {
        isReadByRecipient: message.isReadByRecipient,
        readByCount: message.readByCount,
        totalParticipants: message.totalParticipants,
      };
    }
    return undefined;
  };
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
        'bg-[var(--chat-bg)]',
        '[overflow-anchor:none]',
        'scrollbar-thin scrollbar-thumb-[var(--theme-border-color)]',
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
              className="w-12 h-12 text-[var(--theme-text-secondary)]"
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
              onDelete={onDelete}
              readStatus={getReadStatus(message)}
              conversationType={conversationType}
            />
          ))}
          
          {/* Загрузочный индикатор — скелетон-сообщения (R-14, T2) */}
          {isLoading && (
            <div role="status" aria-live="polite">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex gap-3 mb-4 animate-pulse">
                  {/* Аватар */}
                  <div className="w-10 h-10 rounded-full bg-[var(--theme-bg-secondary)] flex-shrink-0" />
                  {/* Пузырёк */}
                  <div className="flex flex-col max-w-[70%] space-y-2">
                    <div className="h-3 bg-[var(--theme-bg-secondary)] rounded w-20" />
                    <div className="h-10 bg-[var(--theme-bg-secondary)] rounded-lg w-48" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};
