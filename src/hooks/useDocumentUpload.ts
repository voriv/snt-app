'use client';

import { useState, useCallback } from 'react';
import type { Document } from '@/domains/documents';
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE } from '@/domains/documents/document.validators';

/**
 * @hook useDocumentUpload
 * @domain documents
 * @description Хук для загрузки файлов документов
 *
 * @spec
 * - FormData + fetch('/api/v1/documents/upload')
 * - Валидация на клиенте: тип, размер
 * - Обработка ошибок с русскими сообщениями
 *
 * @returns Состояние и функция загрузки файла
 *
 * @traces US-22-03 AC-1..6
 * @task DOCS-T4.1.2
 */
export function useDocumentUpload() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [uploadedDocument, setUploadedDocument] = useState<Document | null>(null);

  const uploadFile = useCallback(async (file: File): Promise<Document | null> => {
    setUploading(true);
    setError(null);
    setProgress(0);
    setUploadedDocument(null);

    try {
      // Клиентская валидация: размер
      if (file.size === 0) {
        throw new Error('Файл не может быть пустым');
      }

      if (file.size > MAX_FILE_SIZE) {
        throw new Error(`Размер файла превышает допустимый лимит (${MAX_FILE_SIZE / 1_048_576} МБ)`);
      }

      // Клиентская валидация: MIME тип
      if (!(ALLOWED_MIME_TYPES as readonly string[]).includes(file.type)) {
        throw new Error(
          'Файлы этого типа не поддерживаются. Допустимые типы: PDF, DOCX, JPG, PNG, GIF, BMP, WEBP',
        );
      }

      setProgress(20);

      const formData = new FormData();
      formData.append('file', file);

      setProgress(40);

      const response = await fetch('/api/v1/documents/upload', {
        method: 'POST',
        body: formData,
      });

      setProgress(80);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || 'Ошибка загрузки файла');
      }

      const data = await response.json();
      setUploadedDocument(data.data as Document);
      setProgress(100);

      return data.data as Document;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ошибка загрузки файла';
      setError(message);
      return null;
    } finally {
      setUploading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setUploading(false);
    setProgress(0);
    setError(null);
    setUploadedDocument(null);
  }, []);

  return {
    uploading,
    progress,
    error,
    uploadedDocument,
    uploadFile,
    reset,
  };
}
