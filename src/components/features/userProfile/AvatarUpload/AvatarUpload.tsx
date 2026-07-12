'use client';

/**
 * @component AvatarUpload
 * @category features/userProfile
 * @description Компонент загрузки аватара с drag-and-drop поддержкой
 *
 * @example
 * ```tsx
 * <AvatarUpload
 *   currentAvatar={profile.avatar}
 *   onDelete={handleDeleteAvatar}
 *   onUpload={handleUploadAvatar}
 *   isDeleting={isDeletingAvatar}
 *   isUploading={isUploadingAvatar}
 * />
 * ```
 *
 * @spec
 * - Поддерживает drag-and-drop и клик для выбора файла
 * - Клиентская валидация: размер ≤5 МБ, форматы JPG/PNG/GIF
 * - Показывает превью выбранного файла
 * - Индикатор загрузки при отправке
 * - Обработка ошибок с уведомлениями
 * - Блокировка UI при загрузке
 * - ARIA-метки для доступности
 *
 * @see US-19-03: Загрузка аватара
 */

import { useState, useCallback, useRef, DragEvent, ChangeEvent } from 'react';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/Button';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { ErrorMessage } from '@/components/ui/ErrorMessage';

/** Props для AvatarUpload */
export interface AvatarUploadProps {
  /** Текущий URL аватара (null если нет) */
  currentAvatar: string | null;
  /** Callback при успешной загрузке */
  onUpload: (file: File) => void;
  /** Callback при удалении аватара */
  onDelete: () => void;
  /** Флаг загрузки */
  isUploading: boolean;
  /** Флаг удаления */
  isDeleting: boolean;
  /** Классы для обёртки */
  className?: string;
}

/** Максимальный размер файла 5 МБ */
const MAX_FILE_SIZE = 5 * 1024 * 1024;

/** Поддерживаемые MIME типы */
const ACCEPTED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
];

/** Поддерживаемые расширения */
const ACCEPTED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif'];

/**
 * @component
 */
export function AvatarUpload({
  currentAvatar,
  onUpload,
  onDelete,
  isUploading,
  isDeleting,
  className = '',
}: AvatarUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Валидация файла
   */
  const validateFile = useCallback((file: File): string | null => {
    // Проверка размера
    if (file.size > MAX_FILE_SIZE) {
      return 'Размер файла превышает 5 МБ';
    }

    // Проверка формата
    if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
      return 'Поддерживаемые форматы: JPG, PNG, GIF';
    }

    // Проверка размера файла (нулевой размер)
    if (file.size === 0) {
      return 'Файл не может быть пустым';
    }

    return null;
  }, []);

  /**
   * Обработка выбора файла через input
   */
  const handleFileSelect = useCallback(
    (file: File) => {
      setError(null);

      // Валидация файла
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }

      // Создание превью
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);

      // Вызываем callback для загрузки
      onUpload(file);
    },
    [validateFile, onUpload]
  );

  /**
   * Обработка dragenter
   */
  const handleDragEnter = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  /**
   * Обработка dragleave
   */
  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  /**
   * Обработка drop
   */
  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        handleFileSelect(files[0]);
      }
    },
    [handleFileSelect]
  );

  /**
   * Обработка dragover (необходим для drop)
   */
  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  /**
   * Обработка клика по области загрузки
   */
  const handleAreaClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  /**
   * Обработка изменения input (через onChange)
   */
  const handleInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleFileSelect(files[0]);
      }
      // Сброс значения input для возможности загрузки того же файла повторно
      e.target.value = '';
    },
    [handleFileSelect]
  );

  /**
   * Удаление аватара
   */
  const handleDeleteClick = useCallback(() => {
    setShowDeleteModal(true);
  }, []);

  /**
   * Подтверждение удаления аватара
   */
  const handleDeleteConfirm = useCallback(async () => {
    setShowDeleteModal(false);
    await onDelete();
    setPreviewUrl(null);
  }, [onDelete]);

  /**
   * Отмена удаления
   */
  const handleDeleteCancel = useCallback(() => {
    setShowDeleteModal(false);
  }, []);

  // Текущий аватар (предпочитаем превью, если оно есть)
  const displayAvatarUrl = previewUrl || currentAvatar || null;

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center gap-4">
        {/* Область загрузки аватара */}
        <div
          onClick={handleAreaClick}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className={`
            relative w-32 h-32 rounded-full overflow-hidden border-2 border-dashed cursor-pointer
            transition-colors duration-200
            ${
              isDragging
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
            }
            ${isUploading ? 'opacity-70' : ''}
          `}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleAreaClick();
            }
          }}
          aria-label="Загрузить аватар. Нажмите для выбора файла или перетащите изображение сюда."
          aria-disabled={isUploading}
        >
          {/* Изображение аватара */}
          <img
            src={displayAvatarUrl}
            alt="Аватар пользователя"
            className="w-full h-full object-cover"
          />

          {/* Оверлей с текстом при наведении или драг-н-дроп */}
          <div
            className={`
              absolute inset-0 flex items-center justify-center
              bg-black/50 transition-opacity duration-200
              ${isDragging || !currentAvatar ? 'opacity-100' : 'opacity-0 hover:opacity-100'}
            `}
          >
            <span className="text-white text-sm font-medium px-3 py-1 rounded bg-black/50">
              {isUploading ? 'Загрузка...' : 'Загрузить'}
            </span>
          </div>

          {/* Индикатор загрузки */}
          {isUploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}

          {/* Кнопка удаления */}
          {!isUploading && currentAvatar && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteClick();
              }}
              className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
              aria-label="Удалить аватар"
              disabled={isDeleting}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          )}

          {/* Скрытый input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.gif,image/jpeg,image/png,image/gif"
            onChange={handleInputChange}
            className="hidden"
            aria-hidden="true"
            disabled={isUploading}
          />
        </div>

        {/* Информация об аватаре */}
        <div className="flex-1">
          <h3 className="text-lg font-semibold mb-2">Аватар</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Загрузите изображение в формате JPG, PNG или GIF размером не более 5 МБ.
          </p>

          {error && (
            <ErrorMessage message={error} />
          )}

          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleAreaClick}
              disabled={isUploading || isDeleting}
            >
              Выбрать файл
            </Button>

            {currentAvatar && (
              <Button
                variant="danger"
                size="sm"
                onClick={handleDeleteClick}
                disabled={isDeleting || isUploading}
              >
                {isDeleting ? 'Удаление...' : 'Удалить'}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Модальное окно подтверждения удаления */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={handleDeleteCancel}
        title="Удаление аватара"
        message="Вы уверены, что хотите удалить аватар? Это действие необратимо."
        confirmText="Удалить"
        onConfirm={handleDeleteConfirm}
        cancelText="Отмена"
      />
    </div>
  );
}
