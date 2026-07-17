/**
 * @page /dashboard/chats/:chatId/edit
 * @auth required
 * @role MEMBER, ADMIN, SUPER_ADMIN
 * @description Страница редактирования информации о групповом чате
 *
 * @spec
 * - Client Component с директивой 'use client'
 * - Проверка авторизации через useSession()
 * - Редирект на /login при отсутствии сессии (setTimeout delay 100ms)
 * - Загрузка данных чата через apiClient.get('/conversations/:chatId')
 * - Заголовок страницы: "Редактирование чата"
 * - Кнопка «Назад» — переход к чату
 * - Форма редактирования (EditChatForm):
 *   - Название чата (обязательное, 2-100 символов)
 *   - Описание чата (опциональное, 0-500 символов)
 * - При отправке формы: PATCH /chats/:chatId
 * - После сохранения — редирект к чату
 * - При отсутствии прав (403) — отображение ошибки
 * - Состояния: loading, error, success
 *
 * @data-flow
 * - Page → apiClient GET /conversations/:id → загрузка данных
 * - Page → EditChatForm → apiClient PATCH /chats/:id → Conversation
 * - Редирект на /dashboard/messages/:chatId
 */
'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { apiClient } from '@/lib/api-client';
import { EditChatForm } from '@/components/features/comms/EditChatForm';
import type { Conversation } from '@/domains/comms/comms.types';

export default function EditChatPage(): React.JSX.Element {
  const { status } = useSession();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const chatId = params?.id ?? '';

  const [chat, setChat] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      const timer = setTimeout(() => {
        router.replace('/login');
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [status, router]);

  /**
   * Загрузка данных чата
   */
  useEffect(() => {
    if (status !== 'authenticated' || !chatId) return;

    const loadChat = async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const result = await apiClient.get<Conversation>(
          `/conversations/${chatId}`
        );

        if (result.success && result.data) {
          setChat(result.data);
        } else {
          setLoadError(result.error?.message ?? 'Чат не найден');
        }
      } catch (err) {
        if (err instanceof Error) {
          setLoadError(err.message || 'Не удалось загрузить чат');
        } else {
          setLoadError('Произошла ошибка при загрузке чата');
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadChat();
  }, [status, chatId]);

  /**
   * Обработчик успешного сохранения — редирект к чату
   */
  const handleSaved = useCallback(
    (_updated: Conversation) => {
      router.push(`/dashboard/messages/${chatId}`);
    },
    [router, chatId]
  );

  /**
   * Обработчик отмены — возврат к чату
   */
  const handleCancel = useCallback(() => {
    router.push(`/dashboard/messages/${chatId}`);
  }, [router, chatId]);

  if (status === 'loading' || (status === 'authenticated' && isLoading)) {
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

  if (status === 'unauthenticated') {
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

  // Ошибка загрузки чата (404, 403, сетевые ошибки)
  if (loadError) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-4 mb-6">
          <button
            type="button"
            onClick={() => router.push('/dashboard/chats')}
            className="p-2 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            aria-label="Назад к списку чатов"
          >
            <svg
              className="h-5 w-5 text-gray-600"
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
          <h1 className="text-2xl font-bold text-gray-900">
            Редактирование чата
          </h1>
        </div>
        <div
          role="alert"
          className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-800"
        >
          {loadError}
        </div>
      </div>
    );
  }

  // Чат не найден
  if (!chat) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <p className="text-gray-500">Чат не найден</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header with back button */}
      <div className="flex items-center gap-4 mb-6">
        <button
          type="button"
          onClick={() => router.push(`/dashboard/messages/${chatId}`)}
          className="p-2 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          aria-label="Назад к чату"
        >
          <svg
            className="h-5 w-5 text-gray-600"
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
        <h1 className="text-2xl font-bold text-gray-900">
          Редактирование чата
        </h1>
      </div>

      {/* Форма редактирования */}
      <EditChatForm
        chatId={chatId}
        initialName={chat.title ?? ''}
        initialDescription={chat.description}
        onSaved={handleSaved}
        onCancel={handleCancel}
      />
    </div>
  );
}
