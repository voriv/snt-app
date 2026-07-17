/**
 * @page /dashboard/messages/[id]
 * @auth required
 * @role MEMBER, ADMIN, SUPER_ADMIN
 * @description Страница просмотра личного диалога
 *
 * @spec
 * - Client Component с директивой 'use client'
 * - Проверка авторизации через useSession()
 * - Редирект на /login при отсутствии сессии
 * - Загрузка данных диалога через API
 * - Отображение сообщений в хронологическом порядке
 * - Форма отправки сообщения
 * - Состояния: loading, error, not found
 *
 * @data-flow
 * - Page → apiClient GET /conversations → данные диалога
 * - Page → apiClient GET /conversations/:id/messages → сообщения
 * - Форма → apiClient POST /conversations/:id/messages → отправка сообщения
 */
'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { apiClient } from '@/lib/api-client';
import { MessageList } from '@/components/features/comms/MessageList';
import { MessageInput } from '@/components/features/comms/MessageInput';
import type { MessageWithSender } from '@/domains/comms/message.types';

interface Conversation {
  id: string;
  type: string;
  participantName: string;
  participantEmail: string;
  participantAvatar: string | null;
}

export default function ConversationPage(): React.JSX.Element {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const conversationId = params?.id as string;

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<MessageWithSender[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ID текущего пользователя берётся из сессии NextAuth
  const currentUserId = session?.user?.id ?? '';

  /**
   * Загрузить данные диалога
   */
  const loadConversation = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Загрузка списка диалогов для поиска нужного
      const convResponse = await apiClient.get<{ items: Array<{ conversationId: string; participantName: string; participantEmail: string | null; participantAvatar: string | null }>; total: number }>(
        '/conversations'
      );

      if (convResponse.success && convResponse.data?.items) {
        const currentConversation = convResponse.data.items.find(
          (c) => c.conversationId === conversationId
        );

        if (currentConversation) {
          setConversation({
            id: currentConversation.conversationId,
            type: 'DIRECT',
            participantName: currentConversation.participantName ?? 'Участник',
            participantEmail: currentConversation.participantEmail ?? '',
            participantAvatar: currentConversation.participantAvatar ?? null,
          });
        } else {
          setError('Диалог не найден');
        }
      }
    } catch {
      setError('Не удалось загрузить диалог');
    } finally {
      setIsLoading(false);
    }
  }, [conversationId]);

  /**
   * Загрузить сообщения диалога
   */
  const loadMessages = useCallback(async () => {
    try {
      const response = await apiClient.get<MessageWithSender[]>(
        `/conversations/${encodeURIComponent(conversationId)}/messages`
      );
      if (response.success && Array.isArray(response.data)) {
        setMessages(response.data);
      }
    } catch {
      // Игнорируем ошибку загрузки сообщений
    }
  }, [conversationId]);

  /**
   * Удалить сообщение
   */
  const handleDeleteMessage = useCallback(
    async (messageId: string) => {
      if (isDeleting) return;

      setIsDeleting(true);
      try {
        await apiClient.delete(`/messages/${encodeURIComponent(messageId)}`);
        await loadMessages();
      } catch {
        // Игнорируем ошибку удаления
      } finally {
        setIsDeleting(false);
      }
    },
    [conversationId, isDeleting, loadMessages]
  );

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
          `/conversations/${encodeURIComponent(conversationId)}/messages`,
          { content: content.trim() }
        );
  
        // Проверяем, был ли запрос успешным
        if (!response.success) {
          const errorMessage = response.error?.message || 'Ошибка отправки сообщения';
          console.error('Ошибка отправки сообщения:', errorMessage);
          throw new Error(errorMessage);
        }
  
        // Проверка, что сообщение возвращено (структура ответа: { success, data: message })
        if (!response.data) {
          const errorMessage = 'Сервер вернул некорректные данные';
          console.error(errorMessage);
          throw new Error(errorMessage);
        }
  
        // После успешной отправки обновляем список с сервера
        // Это гарантирует согласованность данных и отображение нового сообщения
        await loadMessages();
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка';
        console.error('Ошибка отправки сообщения:', errorMessage);
        setError(`Не удалось отправить сообщение: ${errorMessage}`);
      } finally {
        setIsSending(false);
      }
    },
    [conversationId, isSending, loadMessages]
  );

  useEffect(() => {
    if (status === 'unauthenticated') {
      const timer = setTimeout(() => {
        router.replace('/login');
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated' && conversationId) {
      loadConversation();
      loadMessages();
    }
  }, [status, conversationId, loadConversation, loadMessages]);

  // Отдельный useEffect для загрузки сообщений, когда conversation загружен
  useEffect(() => {
    if (conversation && conversationId) {
      loadMessages();
    }
  }, [conversation?.id, conversationId, loadMessages]);

  if (status === 'loading' || status === 'unauthenticated') {
    return (
      <div className="flex items-center justify-center py-12">
        <svg
          className="animate-spin h-8 w-8 text-indigo-600"
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <svg
          className="animate-spin h-8 w-8 text-indigo-600"
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

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.push('/dashboard/messages')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
            aria-label="Назад к списку диалогов"
          >
            <svg
              className="h-6 w-6 text-gray-600 dark:text-gray-400"
              style={{ color: 'var(--theme-text-secondary)' }}
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100" style={{ color: 'var(--theme-text-primary)' }}>Диалог</h1>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-600 dark:text-red-400" role="alert">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-[calc(100vh-4rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 mb-4">
        <button
          onClick={() => router.push('/dashboard/messages')}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
          aria-label="Назад к списку диалогов"
        >
          <svg
            className="h-6 w-6 text-gray-600 dark:text-gray-400"
            style={{ color: 'var(--theme-text-secondary)' }}
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
        <div className="flex items-center gap-3 flex-1">
          {conversation?.participantAvatar ? (
            <img
              src={conversation.participantAvatar}
              alt="Аватар собеседника"
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : (
            <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
              <span className="text-indigo-600 dark:text-indigo-400 font-medium text-sm">
                {conversation?.participantName?.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100" style={{ color: 'var(--theme-text-primary)' }}>
              {conversation?.participantName}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400" style={{ color: 'var(--theme-text-secondary)' }}>
              {conversation?.participantEmail || 'Личный диалог'}
            </p>
          </div>
        </div>
      </div>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto mb-4">
        <MessageList
          messages={messages}
          currentUserId={currentUserId}
          onDelete={handleDeleteMessage}
          participantName={conversation?.participantName ?? 'Участник'}
        />
      </div>

      {/* Message Input */}
      <MessageInput
        onSendMessage={handleSendMessage}
        isLoading={isSending}
      />
    </div>
  );
}
