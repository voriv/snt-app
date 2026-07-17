/**
 * @page /dashboard/chats/new
 * @auth required
 * @role MEMBER, ADMIN, SUPER_ADMIN
 * @description Страница создания нового группового чата
 *
 * @spec
 * - Client Component с директивой 'use client'
 * - Проверка авторизации через useSession()
 * - Редирект на /login при отсутствии сессии (setTimeout delay 100ms)
 * - Заголовок страницы: "Новый групповой чат"
 * - Кнопка «Назад» — переход на /dashboard/chats
 * - Форма создания чата:
 *   - Название чата (обязательное поле, 2-50 символов)
 *   - Описание чата (опциональное поле, до 500 символов)
 *   - Участники (минимум 1 пользователь)
 * - При отправке формы: POST /chats с { name, description, participantIds }
 * - После создания — редирект на /dashboard/chats
 * - Состояния: loading, error, success
 *
 * @data-flow
 * - Page → ParticipantSelector → apiClient GET /users/search → список пользователей
 * - Отправка формы → apiClient POST /chats → Conversation
 * - Редирект на /dashboard/chats
 */
'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { apiClient } from '@/lib/api-client';
import { ParticipantSelector } from '@/components/features/comms/ParticipantSelector';
import type { Conversation } from '@/domains/comms/comms.types';

export default function CreateChatPage(): React.JSX.Element {
  const { status } = useSession();
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [participantIds, setParticipantIds] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      const timer = setTimeout(() => {
        router.replace('/login');
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [status, router]);

  /**
   * Обработчик отправки формы — создание группового чата
   */
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);

      // Валидация на клиенте
      if (!name.trim()) {
        setError('Укажите название чата');
        return;
      }
      if (participantIds.length === 0) {
        setError('Добавьте хотя бы одного участника');
        return;
      }

      setIsCreating(true);
      try {
        const result = await apiClient.post<Conversation>('/chats', {
          name: name.trim(),
          description: description.trim() || null,
          participantIds,
        });

        if (result.success) {
          router.push('/dashboard/chats');
        } else {
          setError('Не удалось создать чат');
        }
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message || 'Произошла ошибка при создании чата');
        } else {
          setError('Произошла ошибка');
        }
      } finally {
        setIsCreating(false);
      }
    },
    [name, description, participantIds, router]
  );

  /**
   * Обработчик изменения названия
   */
  const handleNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setName(e.target.value);
    },
    []
  );

  /**
   * Обработчик изменения описания
   */
  const handleDescriptionChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setDescription(e.target.value);
    },
    []
  );

  /**
   * Обработчик изменения участников
   */
  const handleParticipantChange = useCallback((ids: string[]) => {
    setParticipantIds(ids);
  }, []);

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

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header with back button */}
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
          Новый групповой чат
        </h1>
      </div>

      {/* Error state */}
      {error && (
        <div
          role="alert"
          className="mb-4 p-4 rounded-lg bg-red-50 border border-red-200 text-red-800"
        >
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
        {/* Название чата */}
        <div>
          <label
            htmlFor="chat-name"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Название чата <span className="text-red-500">*</span>
          </label>
          <input
            id="chat-name"
            type="text"
            value={name}
            onChange={handleNameChange}
            placeholder="Введите название чата"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            maxLength={50}
            disabled={isCreating}
            required
          />
          <p className="mt-1 text-xs text-gray-500">
            От 2 до 50 символов
          </p>
        </div>

        {/* Описание чата */}
        <div>
          <label
            htmlFor="chat-description"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Описание
          </label>
          <textarea
            id="chat-description"
            value={description}
            onChange={handleDescriptionChange}
            placeholder="Опишите цель чата (необязательно)"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            rows={3}
            maxLength={500}
            disabled={isCreating}
          />
          <p className="mt-1 text-xs text-gray-500">
            {description.length}/500 символов
          </p>
        </div>

        {/* Участники */}
        <div>
          <ParticipantSelector
            selectedIds={participantIds}
            onChange={handleParticipantChange}
            isLoading={isCreating}
          />
        </div>

        {/* Кнопки */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={() => router.push('/dashboard/chats')}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            disabled={isCreating}
          >
            Отмена
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isCreating}
          >
            {isCreating ? (
              <span className="flex items-center gap-2">
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
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Создание...
              </span>
            ) : (
              'Создать чат'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
