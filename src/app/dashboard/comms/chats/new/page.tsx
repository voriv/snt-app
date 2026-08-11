/**
 * @page /dashboard/comms/chats/new
 * @auth required
 * @role MEMBER, ADMIN, SUPER_ADMIN
 * @description Страница создания нового группового чата
 *
 * @covers AC-5 (US-21-36): Прямой переход по URL подраздела
 *
 * @spec
 * - Client Component с директивой 'use client'
 * - Проверка авторизации через useSession()
 * - Редирект на /login при отсутствии сессии (setTimeout delay 100ms)
 * - Заголовок страницы: "Новый групповой чат"
 * - Кнопка «Назад» — переход на /dashboard/comms/chats
 * - Форма создания чата:
 *   - Название чата (обязательное поле, 2-50 символов)
 *   - Описание чата (опциональное поле, до 500 символов)
 *   - Участники (минимум 1 пользователь)
 * - При отправке формы: POST /chats с { name, description, participantIds }
 * - После создания — редирект на /dashboard/comms/chats/:chatId
 * - Состояния: loading, error, success
 *
 * @data-flow
 * - Page → ParticipantSelector → apiClient GET /users/search → список пользователей
 * - Отправка формы → apiClient POST /chats → Conversation
 * - Редирект на /dashboard/comms/chats/:chatId
 */
'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { apiClient } from '@/lib/api-client';
import { ParticipantSelector } from '@/components/features/comms/ParticipantSelector';
import { Breadcrumbs } from '@/components/layouts/Breadcrumbs';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
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

        if (result.success && result.data) {
          router.push(`/dashboard/comms/chats/${result.data.id}`);
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
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setName(e.target.value);
    },
    []
  );

  /**
   * Обработчик изменения описания
   */
  const handleDescriptionChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumbs />
      {/* Header with back button */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          type="button"
          onClick={() => router.push('/dashboard/comms/chats')}
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
        </Button>
        <h1 className="text-2xl font-bold text-[var(--theme-text-primary)]">
          Новый групповой чат
        </h1>
      </div>

      {/* Error state */}
      {error && <ErrorMessage message={error} />}

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-[var(--theme-bg-primary)] rounded-lg shadow p-6 space-y-6">
        {/* Название чата */}
        <div>
          <Input
            id="chat-name"
            label="Название чата"
            type="text"
            value={name}
            onChange={handleNameChange}
            placeholder="Введите название чата"
            maxLength={50}
            disabled={isCreating}
            required
          />
          <p className="mt-1 text-xs text-[var(--theme-text-secondary)]">
            От 2 до 50 символов
          </p>
        </div>

        {/* Описание чата */}
        <div>
          <Input
            id="chat-description"
            as="textarea"
            label="Описание"
            value={description}
            onChange={handleDescriptionChange}
            placeholder="Опишите цель чата (необязательно)"
            rows={3}
            maxLength={500}
            disabled={isCreating}
          />
          <p className="mt-1 text-xs text-[var(--theme-text-secondary)]">
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
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--theme-border-color)]">
          <Button
            variant="secondary"
            type="button"
            onClick={() => router.push('/dashboard/comms/chats')}
            disabled={isCreating}
          >
            Отмена
          </Button>
          <Button variant="primary" type="submit" isLoading={isCreating}>
            {isCreating ? 'Создание...' : 'Создать чат'}
          </Button>
        </div>
      </form>
    </div>
  );
}
