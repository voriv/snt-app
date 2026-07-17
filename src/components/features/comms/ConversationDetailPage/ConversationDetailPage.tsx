'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { MessageWithSender } from '@/domains/comms/message.types';
import { ConversationMessagesList } from '@/components/features/comms/ConversationMessagesList';
import { MessageInput } from '@/components/features/comms/MessageInput';
import { EmptyState } from '@/components/ui/EmptyState';

/**
 * @component ConversationDetailPage
 * @category features/comms
 * @description Страница детального просмотра диалога с сообщениями
 *
 * @prop conversationId - ID диалога
 * @prop currentUserId - ID текущего пользователя
 * @prop onBack - Callback для возврата к списку диалогов
 * @prop conversationTitle - Заголовок диалога для отображения
 *
 * @spec
 * - Отображает заголовок диалога (название или имена участников)
 * - Список сообщений с автоскроллом к новому
 * - Поле ввода сообщения
 * - Управление состояниями: loading, error, success
 */
export interface ConversationDetailPageProps {
  /** ID диалога */
  conversationId: string;
  /** ID текущего пользователя */
  currentUserId: string;
  /** Callback для возврата к списку диалогов */
  onBack: () => void;
  /** Заголовок диалога для отображения */
  conversationTitle?: string;
}

const GetMessagesApiResponse = <T extends { data: unknown }>(data: T): T => data;
const CreateMessageApiResponse = <T extends { data: unknown }>(data: T): T => data;

export const ConversationDetailPage: React.FC<ConversationDetailPageProps> = ({
  conversationId,
  currentUserId,
  onBack,
  conversationTitle = 'Диалог',
}) => {
  const [messages, setMessages] = useState<MessageWithSender[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [lastMessageId, setLastMessageId] = useState<string | undefined>(undefined);

  // Загрузка сообщений
  const loadMessages = useCallback(
    async (limit = 50, beforeId?: string) => {
      try {
        setIsLoading(true);
        setError(null);

        const queryParams: Record<string, string | number | null> = {
          conversationId,
          limit,
        };

        if (beforeId) {
          queryParams.beforeId = beforeId;
        }

        const response = await apiClient.getWithQuery<{ data: MessageWithSender[] }>(
          '/conversations/messages',
          queryParams
        );

        const messagesData = response.data?.data || [];
        const newMessages = beforeId
          ? [...messagesData, ...messages]
          : messagesData;
        setMessages(newMessages);
        setHasMore(messagesData.length === limit && !!beforeId);
        
        // Устанавливаем ID последнего сообщения для автопрокрутки
        if (!beforeId && messagesData.length > 0) {
          setLastMessageId(messagesData[messagesData.length - 1].id);
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Ошибка сети'));
        setMessages([]);
      } finally {
        setIsLoading(false);
      }
    },
    [conversationId, messages]
  );

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // Обработчик отправки сообщения
  const handleSendMessage = useCallback(
    async (content: string) => {
      try {
        setIsSending(true);
        setError(null);

        const body: Record<string, unknown> = { content };

        const response = await apiClient.post<{ data: MessageWithSender }>(
          '/conversations/messages',
          body
        );

        const newMessage = response.data?.data;
        if (newMessage) {
          // Добавляем новое сообщение в конец списка
          setMessages((prev) => [...prev, newMessage]);
          // Отправляем событие для автоскролла
          setLastMessageId(newMessage.id);
        } else {
          setError(new Error('Не удалось отправить сообщение'));
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Ошибка сети'));
      } finally {
        setIsSending(false);
      }
    },
    []
  );

  // Обработчик удаления сообщения
  const handleDelete = useCallback(
    async (messageId: string) => {
      try {
        await apiClient.delete(`/conversations/messages/${messageId}`);
        // Удаляем сообщение из списка
        setMessages((prev) => prev.filter((m) => m.id !== messageId));
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Ошибка сети'));
      }
    },
    []
  );

  // Обработчик загрузки дополнительных сообщений
  const handleLoadMore = useCallback(() => {
    if (messages.length > 0 && !isLoading) {
      const lastMessage = messages[0];
      loadMessages(50, lastMessage.id);
    }
  }, [messages, isLoading, loadMessages]);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Заголовок */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Вернуться к списку диалогов"
          >
            <svg
              className="w-5 h-5 text-gray-600 dark:text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          <div className="flex-1 min-w-0">
            <h2 className="font-medium text-gray-900 dark:text-gray-100 truncate">
              {conversationTitle}
            </h2>
          </div>
        </div>
      </div>

      {/* Список сообщений */}
      <ConversationMessagesList
        messages={messages}
        currentUserId={currentUserId}
        isLoading={isLoading}
        hasMore={hasMore}
        onLoadMore={handleLoadMore}
        lastMessageId={lastMessageId}
      />

      {/* Индикатор ошибки */}
      {error && (
        <div className="flex-shrink-0 px-4 py-3 bg-red-50 dark:bg-red-900/20 border-t border-red-200 dark:border-red-800">
          <div className="flex items-center justify-between">
            <p className="text-sm text-red-700 dark:text-red-400">{error.message}</p>
            <button
              onClick={() => loadMessages()}
              className="px-3 py-1 text-sm font-medium text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
            >
              Повторить
            </button>
          </div>
        </div>
      )}

      {/* Поле ввода */}
      <MessageInput
        onSendMessage={handleSendMessage}
        isLoading={isSending}
        disabled={error !== null}
      />
    </div>
  );
};
