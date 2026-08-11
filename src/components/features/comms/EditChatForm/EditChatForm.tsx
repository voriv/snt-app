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
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
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
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setName(e.target.value);
    },
    []
  );

  const handleDescriptionChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setDescription(e.target.value);
    },
    []
  );

  return (
    <form onSubmit={handleSubmit} className="bg-[var(--theme-bg-primary)] rounded-lg shadow p-6 space-y-6">
      {/* Error state */}
      {error && <ErrorMessage message={error} />}

      {/* Название чата */}
      <div>
        <Input
          id="chat-name"
          label="Название чата"
          type="text"
          value={name}
          onChange={handleNameChange}
          placeholder="Введите название чата"
          maxLength={100}
          disabled={isSaving}
          required
          aria-required="true"
        />
        <p className="mt-1 text-xs text-[var(--theme-text-secondary)]">
          От 2 до 100 символов
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
          disabled={isSaving}
        />
        <p className="mt-1 text-xs text-[var(--theme-text-secondary)]">
          {description.length}/500 символов
        </p>
      </div>

      {/* Кнопки */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--theme-border-color)]">
        <Button variant="secondary" type="button" onClick={onCancel} disabled={isSaving}>
          Отмена
        </Button>
        <Button variant="primary" type="submit" isLoading={isSaving}>
          {isSaving ? 'Сохранение...' : 'Сохранить'}
        </Button>
      </div>
    </form>
  );
}
