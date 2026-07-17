/**
 * @component AnnouncementForm
 * @category features/announcements
 * @description Форма для создания нового объявления
 *
 * @example
 * ```tsx
 * <AnnouncementForm />
 * ```
 *
 * @spec
 * - Поля: заголовок (обязательный, max 200), содержание (опциональное, max 5000)
 * - Счётчик символов для обоих полей
 * - Кнопка "Сохранить как черновик"
 * - Состояния: loading, error, success
 * - Блокировка кнопки при isLoading
 * - Отправка через apiClient.post('/announcements', data)
 * - Редирект на список после успешного создания
 */
'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/Input/Input';
import { Button } from '@/components/ui/Button/Button';
import { apiClient } from '@/lib/api-client';

/**
 * @interface AnnouncementFormProps
 * @description Props для компонента AnnouncementForm
 */
export interface AnnouncementFormProps {
  /** Callback при успешном создании */
  onSuccess?: () => void;
}

/**
 * @component AnnouncementForm
 * @description Форма для создания нового объявления
 */
export function AnnouncementForm({ onSuccess }: AnnouncementFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [contentError, setContentError] = useState<string | null>(null);

  /**
   * Валидация формы перед отправкой
   */
  const validate = useCallback((): boolean => {
    let valid = true;

    // Валидация заголовка
    if (!title.trim()) {
      setTitleError('Заголовок обязателен');
      valid = false;
    } else if (title.length > 200) {
      setTitleError('Заголовок не может превышать 200 символов');
      valid = false;
    } else {
      setTitleError(null);
    }

    // Валидация содержания
    if (content.length > 5000) {
      setContentError('Содержание не может превышать 5000 символов');
      valid = false;
    } else {
      setContentError(null);
    }

    return valid;
  }, [title, content]);

  /**
   * Обработчик изменения заголовка
   */
  const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTitle(value);
    if (titleError) setTitleError(null);
  }, [titleError]);

  /**
   * Обработчик изменения содержания
   */
  const handleContentChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setContent(value);
    if (contentError) setContentError(null);
  }, [contentError]);

  /**
   * Обработчик отправки формы
   */
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = {
        title: title.trim(),
        content: content.trim() || null,
      };

      await apiClient.post('/announcements', data);

      onSuccess?.();
      router.push('/dashboard/announcements');
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message || 'Произошла ошибка при сохранении объявления');
      } else {
        setError('Произошла ошибка при сохранении объявления');
      }
    } finally {
      setIsLoading(false);
    }
  }, [title, content, validate, onSuccess, router]);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Заголовок */}
      <div>
        <Input
          label="Заголовок"
          id="announcement-title"
          value={title}
          onChange={handleTitleChange}
          error={titleError || undefined}
          placeholder="Введите заголовок объявления"
          maxLength={200}
          required
          aria-label="Заголовок объявления"
          disabled={isLoading}
        />
        <p className="mt-1 text-sm text-gray-500">
          {title.length} / 200 символов
        </p>
      </div>

      {/* Содержание */}
      <div>
        <label
          htmlFor="announcement-content"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Содержание
        </label>
        <textarea
          id="announcement-content"
          value={content}
          onChange={handleContentChange}
          placeholder="Введите содержание объявления (опционально)"
          className={`w-full rounded-md border ${
            contentError ? 'border-red-500' : 'border-gray-300'
          } px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500`}
          rows={10}
          maxLength={5000}
          disabled={isLoading}
          aria-label="Содержание объявления"
          aria-invalid={!!contentError}
        />
        {contentError && (
          <p className="mt-1 text-sm text-red-600">{contentError}</p>
        )}
        <p className="mt-1 text-sm text-gray-500">
          {content.length} / 5000 символов
        </p>
      </div>

      {/* Общая ошибка */}
      {error && (
        <div className="rounded-md bg-red-50 p-4" role="alert">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Кнопки */}
      <div className="flex justify-end space-x-3">
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.back()}
          disabled={isLoading}
        >
          Отмена
        </Button>
        <Button
          type="submit"
          variant="primary"
          isLoading={isLoading}
          disabled={isLoading}
        >
          Сохранить как черновик
        </Button>
      </div>
    </form>
  );
}
