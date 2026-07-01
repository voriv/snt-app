/**
 * @component AvatarUpload
 * @category features
 * @description Компонент загрузки и отображения аватара пользователя
 *
 * @example
 * ```tsx
 * <AvatarUpload
 *   currentAvatar="/avatars/123.jpg"
 *   onDelete={handleDelete}
 * />
 * ```
 *
 * @spec
 * - Отображает текущий аватар или дефолтную заглушку
 * - Кнопка "Загрузить аватар" открывает диалог выбора файла
 * - Валидация на клиенте: max 5MB, accepted types: JPEG, PNG, GIF
 * - Показывает предпросмотр выбранного файла
 * - Индикатор загрузки при загрузке
 * - Сообщение об ошибке при превышении размера/неподдерживаемом формате
 * - Кнопка "Удалить аватар" с подтверждением
 * - После загрузки обновляет текущий аватар (через вызов onDelete с new URL)
 * - Доступность: aria-label для кнопок, role="img" для аватара
 */
'use client';

import { useState, useRef, useCallback } from 'react';
import { Button, Card, CardBody } from '@/components/ui';
import { apiClient } from '@/lib/api-client';
import { cn } from '@/shared/utils';

export interface AvatarUploadProps {
  /** Текущий URL аватара (опционально) */
  currentAvatar?: string | null;
  /** Обработчик удаления аватара */
  onDelete: () => Promise<void>;
  /** Обработчик загрузки аватара */
  onUpload: (file: File) => Promise<void>;
  /** Показывать ли индикатор удаления */
  isDeleting?: boolean;
  /** Показывать ли индикатор загрузки */
  isUploading?: boolean;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/gif'];
const DEFAULT_AVATAR_URL = '/images/default-avatar.png';

export function AvatarUpload({
  currentAvatar,
  onDelete,
  onUpload,
  isDeleting = false,
  isUploading = false,
}: AvatarUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback((file: File): string | null => {
    if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
      return 'Поддерживаются только форматы JPG, PNG, GIF';
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'Размер файла не должен превышать 5MB';
    }
    return null;
  }, []);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload file
    try {
      await onUpload(file);
      setPreviewUrl(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при загрузке файла');
      setPreviewUrl(null);
    }
  }, [onUpload, validateFile]);

  const handleDeleteClick = useCallback(async () => {
    if (window.confirm('Вы уверены, что хотите удалить аватар?')) {
      try {
        await onDelete();
        setPreviewUrl(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ошибка при удалении аватара');
      }
    }
  }, [onDelete]);

  const displayUrl = previewUrl || currentAvatar;

  return (
    <Card>
      <CardBody>
        <div className="flex items-center space-x-6">
          <div className="shrink-0">
            {displayUrl ? (
              <img
                src={displayUrl}
                alt="Аватар пользователя"
                className="h-24 w-24 rounded-full object-cover border-2 border-gray-200"
                role="img"
              />
            ) : (
              <div
                className="h-24 w-24 rounded-full bg-indigo-100 flex items-center justify-center border-2 border-gray-200"
                role="img"
                aria-label="Аватар пользователя (дефолтный)"
              >
                <svg
                  className="h-12 w-12 text-indigo-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
            )}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Аватар</h3>
            <p className="text-sm text-gray-500 mb-4">
              JPG, PNG или GIF. Максимальный размер 5MB.
            </p>
            <div className="flex items-center space-x-3">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept={ACCEPTED_FILE_TYPES.join(',')}
                className="hidden"
                aria-label="Загрузить аватар"
              />
              <Button
                variant="secondary"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading || isDeleting}
              >
                Загрузить аватар
              </Button>
              {currentAvatar && (
                <Button
                  variant="danger"
                  onClick={handleDeleteClick}
                  isLoading={isDeleting}
                  disabled={isUploading}
                >
                  Удалить
                </Button>
              )}
            </div>
          </div>
        </div>
        {error && (
          <p className="mt-4 text-sm text-red-600" role="alert">{error}</p>
        )}
        {isUploading && (
          <div className="mt-4 flex items-center space-x-2">
            <svg
              className="animate-spin h-4 w-4 text-indigo-600"
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
            <span className="text-sm text-gray-500">Загрузка...</span>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
