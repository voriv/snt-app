'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { MAX_FILE_SIZE, ALLOWED_MIME_TYPES } from '@/domains/documents/document.validators';

/**
 * @component DocumentUploadZone
 * @category documents
 * @description Drag-and-drop зона для загрузки файлов документов
 *
 * @spec
 * - Drag-and-drop + кнопка «Выбрать файл»
 * - Валидация: тип (белый список), размер (<= 100MB), не пустой
 * - Прогресс-бар
 * - Список поддерживаемых форматов
 *
 * @traces US-22-03 AC-1..6
 * @task DOCS-T4.2.7
 */
export function DocumentUploadZone({
  onUpload,
}: {
  onUpload: (file: File) => Promise<void>;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback((file: File): string | null => {
    // Проверка пустого файла
    if (file.size === 0) {
      return 'Файл не может быть пустым';
    }

    // Проверка размера
    if (file.size > MAX_FILE_SIZE) {
      return `Размер файла превышает допустимый лимит (${MAX_FILE_SIZE / 1_048_576} МБ)`;
    }

    // Проверка MIME типа
    if (!(ALLOWED_MIME_TYPES as readonly string[]).includes(file.type)) {
      return 'Файлы этого типа не поддерживаются. Допустимые типы: PDF, DOCX, JPG, PNG, GIF, BMP, WEBP';
    }

    return null;
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      setError(null);

      const file = e.dataTransfer.files[0];
      if (!file) return;

      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }

      setSelectedFile(file);
      setProgress(0);
    },
    [validateFile],
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setError(null);
      const file = e.target.files?.[0];
      if (!file) return;

      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }

      setSelectedFile(file);
      setProgress(0);
    },
    [validateFile],
  );

  const handleUpload = useCallback(async () => {
    if (!selectedFile) return;
    setError(null);
    setUploading(true);
    setProgress(30);

    try {
      await onUpload(selectedFile);
      setProgress(100);
      setSelectedFile(null);
      setUploading(false);
      setProgress(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки');
      setUploading(false);
      setProgress(0);
    }
  }, [selectedFile, onUpload]);

  const handleCancel = useCallback(() => {
    setSelectedFile(null);
    setError(null);
    setProgress(0);
    setUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      setIsDragging(false);
    };
  }, []);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Б';
    const k = 1024;
    const sizes = ['Б', 'КБ', 'МБ', 'ГБ'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4" role="region" aria-label="Область загрузки файлов">
      {/* Drag-and-drop зона */}
      {!selectedFile && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 transition-colors ${
            isDragging
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 bg-gray-50 hover:border-gray-400'
          }`}
        >
          <svg
            className="h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
            />
          </svg>
          <p className="mt-4 text-sm font-medium text-gray-700">
            Перетащите файл сюда, или{' '}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-blue-600 hover:underline"
            >
              выберите файл
            </button>
          </p>
          <p className="mt-2 text-xs text-gray-500">
            PDF, DOCX, JPG, PNG, GIF, BMP, WEBP до {MAX_FILE_SIZE / 1_048_576} МБ
          </p>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept=".pdf,.docx,.jpg,.jpeg,.png,.gif,.bmp,.webp"
            className="hidden"
          />
        </div>
      )}

      {/* Информация о выбранном файле */}
      {selectedFile && !uploading && (
        <div className="rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-lg">
                📄
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                <p className="text-xs text-gray-500">{formatFileSize(selectedFile.size)}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCancel}
                className="rounded-md px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleUpload}
                className="rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
              >
                Загрузить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Прогресс-бар */}
      {uploading && selectedFile && (
        <div className="rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
            <span className="text-sm text-gray-500">{progress}%</span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full rounded-full bg-blue-600 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Ошибка */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4" role="alert" aria-label="Ошибка загрузки">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Поддерживаемые форматы */}
      {!selectedFile && (
        <div className="text-center text-xs text-gray-500">
          <p>Поддерживаемые форматы: PDF, DOCX, JPG, PNG, GIF, BMP, WEBP</p>
        </div>
      )}
    </div>
  );
}
