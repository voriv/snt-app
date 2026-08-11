/**
 * @page /dashboard/comms/chats/:chatId
 * @auth required
 * @role MEMBER, ADMIN, SUPER_ADMIN
 * @description Страница просмотра группового чата
 *
 * @covers AC-1 (US-38-01): Единая структура страниц чатов
 * @covers AC-2 (US-38-01): Единый компонент-обёртка ChatLayout
 * @covers AC-5 (US-38-01): Пагинация в групповом чате
 * @covers AC-5 (US-21-36): Прямой переход по URL подраздела
 * @covers AC-2 (US-39-01): Отметка прочитанных при открытии группового чата
 * @covers AC-4 (US-39-01): Идемпотентность вызова API
 * @covers AC-6 (US-39-01): Ошибка сети не блокирует интерфейс
 *
 * @spec B-026-T6-2
 * - При открытии чата вызывает useMarkAsRead(chatId, 'GROUP')
 *   → PATCH /api/v1/chats/:id/read (silent fail, не блокирует рендер)
 * - После markAsRead хук обновляет счётчики непрочитанных (AC-7 US-21-37)
 *
 * @spec B-024-T9-1
 * - Client Component с директивой 'use client'
 * - Проверка авторизации через useSession()
 * - Редирект на /login при отсутствии сессии
 * - Загрузка данных чата через GET /conversations/:id
 * - Загрузка сообщений через GET /conversations/:id/messages (с пагинацией)
 * - Отправка сообщений через POST /conversations/:id/messages
 * - Удаление сообщений через DELETE /messages/:messageId
 * - Состояния: loading, error, not found
 * - Навигация: кнопка «Назад» (в ChatHeader) на /dashboard/comms/chats
 * - Навигация: кнопка «Редактировать» на /dashboard/comms/chats/:chatId/edit
 *
 * @data-flow
 * - Page → apiClient GET /conversations/:id → данные чата
 * - Page → apiClient.getWithQuery GET /conversations/:id/messages → сообщения (limit + beforeId)
 * - Page → apiClient POST /conversations/:id/messages → отправка
 * - Page → apiClient DELETE /messages/:messageId → удаление
 */
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Pencil } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { ChatLayout } from '@/components/features/comms/ChatLayout';
import { Breadcrumbs } from '@/components/layouts/Breadcrumbs';
import { ConversationMessagesList } from '@/components/features/comms/ConversationMessagesList';
import { MessageInput } from '@/components/features/comms/MessageInput';
import { useMarkAsRead } from '@/hooks/useMarkAsRead';
import type { MessageWithSender } from '@/domains/comms/message.types';
import type { Conversation } from '@/domains/comms/comms.types';

export default function ChatPage(): React.JSX.Element {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const chatId = params?.chatId as string;
  const { markAsRead } = useMarkAsRead();

  const [chat, setChat] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<MessageWithSender[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [lastMessageId, setLastMessageId] = useState<string | undefined>(undefined);

  const currentUserId = session?.user?.id ?? '';

  // Реф для отслеживания текущих сообщений без триггера ре-рендера
  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  const MESSAGES_PAGE_SIZE = 20;

  /**
   * Загрузить данные группового чата
   */
  const loadChat = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await apiClient.get<Conversation>(
        `/conversations/${encodeURIComponent(chatId)}`
      );

      if (response.success && response.data) {
        setChat(response.data);
      } else {
        setError('Чат не найден или у вас нет доступа');
      }
    } catch {
      setError('Не удалось загрузить чат');
    } finally {
      setIsLoading(false);
    }
  }, [chatId]);

  /**
   * Загрузить сообщения с поддержкой пагинации (beforeId)
   *
   * @param limit - Количество сообщений на страницу
   * @param beforeId - ID сообщения, предшествующего загружаемой странице (для пагинации)
   */
  const loadMessages = useCallback(
    async (limit = MESSAGES_PAGE_SIZE, beforeId?: string) => {
      try {
        if (beforeId) {
          setIsLoadingMessages(true);
        }

        const response = await apiClient.getWithQuery<MessageWithSender[]>(
          `/conversations/${encodeURIComponent(chatId)}/messages`,
          { limit, beforeId: beforeId || undefined }
        );

        if (response.success && Array.isArray(response.data)) {
          const messagesData = response.data;
          const currentMessages = messagesRef.current;
          // При пагинации prepend старых сообщений, иначе replace
          const newMessages = beforeId
            ? [...messagesData, ...currentMessages]
            : messagesData;
          setMessages(newMessages);
          // Если вернулось меньше лимита — больше нет страниц
          setHasMore(beforeId ? messagesData.length === limit : messagesData.length >= limit);

          // Устанавливаем ID последнего сообщения для автопрокрутки (только при первичной загрузке)
          if (!beforeId && messagesData.length > 0) {
            setLastMessageId(messagesData[messagesData.length - 1].id);
          }
        }
      } catch {
        // Игнорируем ошибку загрузки сообщений
      } finally {
        setIsLoadingMessages(false);
      }
    },
    [chatId]
  );

  /**
   * Обработчик подгрузки предыдущих сообщений (бесконечный скролл вверх)
   */
  const handleLoadMore = useCallback(() => {
    const currentMessages = messagesRef.current;
    if (currentMessages.length > 0 && !isLoadingMessages) {
      const firstMessage = currentMessages[0];
      loadMessages(MESSAGES_PAGE_SIZE, firstMessage.id);
    }
  }, [isLoadingMessages, loadMessages]);

  /**
   * Отправить сообщение
   */
  const handleSendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isSending) return;

      setIsSending(true);
      setError(null);
      try {
        const response = await apiClient.post<MessageWithSender>(
          `/conversations/${encodeURIComponent(chatId)}/messages`,
          { content: content.trim() }
        );

        if (!response.success) {
          const errorMessage = response.error?.message || 'Ошибка отправки сообщения';
          throw new Error(errorMessage);
        }

        if (!response.data) {
          throw new Error('Сервер вернул некорректные данные');
        }

        // Добавляем новое сообщение в конец списка + триггер автоскролла
        const newMessage = response.data;
        setMessages((prev) => [...prev, newMessage]);
        setLastMessageId(newMessage.id);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка';
        setError(`Не удалось отправить сообщение: ${errorMessage}`);
      } finally {
        setIsSending(false);
      }
    },
    [chatId, isSending]
  );

  /**
   * Удалить сообщение
   */
  const handleDeleteMessage = useCallback(
    async (messageId: string) => {
      if (isDeleting) return;

      setIsDeleting(true);
      try {
        await apiClient.delete(`/messages/${encodeURIComponent(messageId)}`);
        // Удаляем сообщение из списка
        setMessages((prev) => prev.filter((m) => m.id !== messageId));
      } catch {
        // Игнорируем ошибку удаления
      } finally {
        setIsDeleting(false);
      }
    },
    [isDeleting]
  );

  // Редирект при отсутствии сессии
  useEffect(() => {
    if (status === 'unauthenticated') {
      const timer = setTimeout(() => {
        router.replace('/login');
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [status, router]);

  // Автоматическая отметка прочитанных при открытии группового чата (AC-2 US-39-01)
  // Хук useMarkAsRead выполняет silent fail при ошибке (AC-6) и сам refetch-ит счётчики непрочитанных.
  useEffect(() => {
    if (status === 'authenticated' && chatId) {
      markAsRead(chatId, 'GROUP');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, chatId]);

  // Первичная загрузка чата + сообщений
  useEffect(() => {
    if (status === 'authenticated' && chatId) {
      loadChat();
      loadMessages();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, chatId]);

  // Состояние загрузки сессии / неавторизован
  if (status === 'loading' || status === 'unauthenticated') {
    return (
      <div className="flex items-center justify-center py-12" role="status" aria-live="polite">
        <svg
          className="animate-spin h-8 w-8 text-[var(--theme-accent)]"
          aria-hidden="true"
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
    );
  }

  // Состояние загрузки чата
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12" role="status" aria-live="polite">
        <svg
          className="animate-spin h-8 w-8 text-[var(--theme-accent)]"
          aria-hidden="true"
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
    );
  }

  // Состояние ошибки (чат не найден, нет доступа)
  if (error) {
    return (
      <div className="h-full flex flex-col bg-[var(--chat-bg)]">
        <div className="flex items-center gap-4 p-4 border-b border-[var(--theme-border-color)] bg-[var(--theme-bg-primary)]">
          <button
            onClick={() => router.push('/dashboard/comms/chats')}
            className="p-2 rounded-lg hover:bg-[var(--theme-bg-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent)] focus:ring-offset-2"
            aria-label="Назад к списку чатов"
          >
            <svg
              className="h-5 w-5 text-[var(--theme-text-secondary)]"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
              />
            </svg>
          </button>
          <h1 className="text-lg font-semibold text-[var(--theme-text-primary)]">Групповой чат</h1>
        </div>
        <Breadcrumbs />
        <div className="flex-1 flex items-center justify-center p-4">
          <div
            role="alert"
            className="rounded-md bg-[var(--theme-danger)]/10 p-4 text-sm text-[var(--theme-danger)] border border-[var(--theme-danger)]/20"
          >
            {error}
          </div>
        </div>
      </div>
    );
  }

  // Чат не найден
  if (!chat) {
    return (
      <div className="h-full flex flex-col bg-[var(--chat-bg)]">
        <div className="flex items-center gap-4 p-4 border-b border-[var(--theme-border-color)] bg-[var(--theme-bg-primary)]">
          <button
            onClick={() => router.push('/dashboard/comms/chats')}
            className="p-2 rounded-lg hover:bg-[var(--theme-bg-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent)] focus:ring-offset-2"
            aria-label="Назад к списку чатов"
          >
            <svg
              className="h-5 w-5 text-[var(--theme-text-secondary)]"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
              />
            </svg>
          </button>
          <h1 className="text-lg font-semibold text-[var(--theme-text-primary)]">Групповой чат</h1>
        </div>
        <Breadcrumbs />
        <div className="flex-1 flex items-center justify-center p-4">
          <p className="text-[var(--theme-text-secondary)]">Чат не найден</p>
        </div>
      </div>
    );
  }

  return (
    <ChatLayout
      title={chat.title || 'Групповой чат'}
      description={chat.description ?? undefined}
      onBack={() => router.push('/dashboard/comms/chats')}
      headerActions={
        <button
          onClick={() => router.push(`/dashboard/comms/chats/${chatId}/edit`)}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-[var(--theme-text-primary)] bg-[var(--theme-bg-primary)] border border-[var(--theme-input-border)] rounded-md shadow-sm hover:bg-[var(--theme-bg-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent)] focus:ring-offset-2"
          aria-label="Редактировать чат"
        >
          <Pencil className="h-4 w-4" />
          Редактировать
        </button>
      }
    >
      {/* Список сообщений с пагинацией и бесконечным скроллом */}
      <ConversationMessagesList
        messages={messages}
        currentUserId={currentUserId}
        isLoading={isLoadingMessages}
        hasMore={hasMore}
        onLoadMore={handleLoadMore}
        lastMessageId={lastMessageId}
        onDelete={handleDeleteMessage}
      />

      {/* Индикатор ошибки отправки */}
      {error && (
        <div className="flex-shrink-0 px-4 py-3 bg-[var(--theme-danger)]/10 border-t border-[var(--theme-danger)]/20">
          <div className="flex items-center justify-between">
            <p className="text-sm text-[var(--theme-danger)]">{error}</p>
            <button
              onClick={() => {
                setError(null);
                loadMessages();
              }}
              className="px-3 py-1 text-sm font-medium text-[var(--theme-danger)] hover:bg-[var(--theme-danger)]/20 rounded-lg transition-colors"
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
    </ChatLayout>
  );
}
