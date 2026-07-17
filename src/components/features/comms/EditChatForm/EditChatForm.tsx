/**
 * @component EditChatForm
 * @category features/comms
 * @description Форма редактирования информации о групповом чате (название, описание)
 *
 * @example
 * ```tsx
 * <EditChatForm
 *   initialName="Название чата"
 *   initialDescription="Описание чата"
 *   chatId="chat-123"
 *   onSaved={(updated) => console.log(updated)}
 *   onCancel={() => router.back()}
 * />
 * ```
 *
 * @spec
 * - Поля: название (обязательное, 2-100 символов), описание (опциональное, 0-500 символов)
 * - Валидация на клиенте перед отправкой
 * - При isLoading=true: кнопка «Сохранить» блокируется, показывается спиннер
 * - Отправка через apiClient.patch('/chats/:id', { name, description })
 * - При дублировании названия (409) показывает ошибку
 * - При отсутствии прав (403) показывает ошибку
 * - При отсутствии чата (404) показывает ошибку
 * - Кнопка «Отмена» вызывает callback onCancel
 */
'use client';

import { useCallback, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import type { Conversation } from '@/domains/comms/comms.types';

export interface EditChatFormProps {
  /** ID чата для обновления */
  chatId: string;
  /** Начальное название чата */
  initialName: string;
  /** Начальное описание чата (null если отсутствует) */
  initialDescription: string | null;
  /** Callback при успешном сохранении — передаёт обновлённый объект Conversation */
  onSaved: (updated: Conversation) => void;
  /** Callback при нажатии «Отмена» */
  onCancel: () => void;
}

export function EditChatForm({
  chatId,
  initialName,
  initialDescription,
  onSaved,
  onCancel,
}: EditChatFormProps): React.JSX.Element {
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Обработчик отправки формы — PATCH запрос к API
   */
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);

      // Валидация на клиенте
      const trimmedName = name.trim();
      if (trimmedName.length < 2) {
        setError('Название чата должно содержать минимум 2 символа');
        return;
      }
      if (trimmedName.length > 100) {
        setError('Название чата не может превышать 100 символов');
        return;
      }

      setIsSaving(true);
      try {
        const result = await apiClient.patch<Conversation>(
          `/chats/${chatId}`,
          {
            name: trimmedName,
            description: description.trim() || null,
          }
        );

        if (result.success && result.data) {
          onSaved(result.data);
        } else {
          setError(result.error?.message ?? 'Не удалось сохранить изменения');
        }
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message || 'Произошла ошибка при сохранении');
        } else {
          setError('Произошла ошибка');
        }
      } finally {
        setIsSaving(false);
      }
    },
    [name, description, chatId, onSaved]
  );

  const handleNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setName(e.target.value);
    },
    []
  );

  const handleDescriptionChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setDescription(e.target.value);
    },
    []
  );

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
      {/* Error state */}
      {error && (
        <div
          role="alert"
          className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-800"
        >
          {error}
        </div>
      )}

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
          maxLength={100}
          disabled={isSaving}
          required
          aria-required="true"
        />
        <p className="mt-1 text-xs text-gray-500">
          От 2 до 100 символов
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
          disabled={isSaving}
        />
        <p className="mt-1 text-xs text-gray-500">
          {description.length}/500 символов
        </p>
      </div>

      {/* Кнопки */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isSaving}
        >
          Отмена
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isSaving}
        >
          {isSaving ? (
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
              Сохранение...
            </span>
          ) : (
            'Сохранить'
          )}
        </button>
      </div>
    </form>
  );
}
