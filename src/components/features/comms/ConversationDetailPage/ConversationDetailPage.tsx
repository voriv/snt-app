'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { MessageWithSender } from '@/domains/comms/message.types';
import { ConversationMessagesList } from '@/components/features/comms/ConversationMessagesList';
import { MessageInput } from '@/components/features/comms/MessageInput';
import { ChatLayout } from '@/components/features/comms/ChatLayout';
import { Button } from '@/components/ui/Button';
import { ErrorMessage } from '@/components/ui/ErrorMessage';

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

  // Реф для отслеживания текущих сообщений без триггера ре-рендера
  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  // Загрузка сообщений
  const loadMessages = useCallback(
    async (limit = 50, beforeId?: string) => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await apiClient.getWithQuery<MessageWithSender[]>(
          `/conversations/${encodeURIComponent(conversationId)}/messages`,
          { limit, beforeId: beforeId || undefined }
        );

        const messagesData = Array.isArray(response.data) ? response.data : [];
        const currentMessages = messagesRef.current;
        const newMessages = beforeId
          ? [...messagesData, ...currentMessages]
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
    [conversationId]
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

        const response = await apiClient.post<MessageWithSender>(
          `/conversations/${encodeURIComponent(conversationId)}/messages`,
          body
        );

        const newMessage = response.data;
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
        await apiClient.delete(`/messages/${encodeURIComponent(messageId)}`);
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
    const currentMessages = messagesRef.current;
    if (currentMessages.length > 0 && !isLoading) {
      const lastMessage = currentMessages[0];
      loadMessages(50, lastMessage.id);
    }
  }, [isLoading, loadMessages]);

  return (
    <ChatLayout title={conversationTitle} onBack={onBack}>
      {/* Список сообщений */}
      <ConversationMessagesList
        messages={messages}
        currentUserId={currentUserId}
        isLoading={isLoading}
        hasMore={hasMore}
        onLoadMore={handleLoadMore}
        lastMessageId={lastMessageId}
        onDelete={handleDelete}
      />

      {/* Индикатор ошибки */}
      {error && (
        <div className="flex-shrink-0 flex flex-col gap-3 px-4 py-3">
          <ErrorMessage message={error?.message ?? ''} />
          <Button variant="ghost" size="sm" type="button" onClick={() => loadMessages()}>
            Повторить
          </Button>
        </div>
      )}

      {/* Поле ввода */}
      <MessageInput
        onSendMessage={handleSendMessage}
        isLoading={isSending}
        disabled={error !== null}
      />
    </ChatLayout>
  );
};
