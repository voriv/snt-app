'use client';

import React from 'react';
import Link from 'next/link';
import { useDocumentDetail } from '@/hooks/useDocumentDetail';
import { DocumentPreview } from './DocumentPreview';

/**
 * @component DocumentDetail
 * @category documents
 * @description Компонент детального просмотра документа
 *
 * @spec
 * - Метаданные: название, описание, категория, тип, автор, дата
 * - Теги
 * - Предпросмотр (PDF / изображение)
 * - Кнопка «Скачать»
 * - Кнопка «Редактировать» (только ADMIN, не archived)
 *
 * @traces US-22-06 AC-1..7
 * @task DOCS-T4.2.5
 */
export function DocumentDetail({
  documentId,
}: {
  documentId: string;
}) {
  const { document, loading, error } = useDocumentDetail(documentId);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12" role="status" aria-label="Загрузка">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
        <span className="sr-only">Загрузка...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4" role="alert" aria-label="Ошибка">
        <p className="text-sm text-red-800">{error}</p>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="rounded-lg border border-gray-200 p-12 text-center" role="status" aria-label="Документ не найден">
        <p className="text-sm text-gray-500">Документ не найден</p>
      </div>
    );
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Б';
    const k = 1024;
    const sizes = ['Б', 'КБ', 'МБ', 'ГБ'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getStatusBadge = () => {
    switch (document.status) {
      case 'draft':
        return (
          <span className="inline-flex items-center rounded-full bg-[var(--theme-badge-default-bg)] px-2.5 py-0.5 text-xs font-medium text-[var(--theme-badge-default-color)]">
            Черновик
          </span>
        );
      case 'published':
        return (
          <span className="inline-flex items-center rounded-full bg-[var(--theme-badge-success-bg)] px-2.5 py-0.5 text-xs font-medium text-[var(--theme-badge-success-color)]">
            Опубликован
          </span>
        );
      case 'archived':
        return (
          <span className="inline-flex items-center rounded-full bg-[var(--theme-badge-warning-bg)] px-2.5 py-0.5 text-xs font-medium text-[var(--theme-badge-warning-color)]">
            Архив
          </span>
        );
    }
  };

  return (
    <div className="space-y-6" role="region" aria-label="Детали документа">
      {/* Заголовок и действия */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{document.title}</h1>
            {getStatusBadge()}
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Загружено {formatDate(document.createdAt)} • {document.uploader.name || document.uploader.email}
          </p>
        </div>
        <div className="flex gap-2">
          <a
            href={`/api/v1/documents/${document.id}/download`}
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Скачать
          </a>
          {document.status !== 'archived' && (
            <Link
              href={`/dashboard/documents/${document.id}/edit`}
              className="inline-flex items-center gap-2 rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
            >
              Редактировать
            </Link>
          )}
        </div>
      </div>

      {/* Метаданные */}
      <div className="rounded-lg border border-gray-200 p-4">
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <dt className="text-sm font-medium text-gray-500">Размер</dt>
            <dd className="mt-1 text-sm text-gray-900">{formatFileSize(document.fileSize)}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Тип файла</dt>
            <dd className="mt-1 text-sm text-gray-900">{document.mimeType.split('/')[1]?.toUpperCase() || document.mimeType}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Категория</dt>
            <dd className="mt-1 text-sm text-gray-900">{document.category?.name || '—'}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Доступ</dt>
            <dd className="mt-1 text-sm text-gray-900">{document.visibleRoles.join(', ')}</dd>
          </div>
        </dl>
      </div>

      {/* Описание */}
      {document.description && (
        <div>
          <h2 className="text-lg font-medium text-gray-900">Описание</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">{document.description}</p>
        </div>
      )}

      {/* Теги */}
      {document.tags.length > 0 && (
        <div>
          <h2 className="text-lg font-medium text-gray-900">Теги</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {document.tags.map((tag) => (
              <span
                key={tag.id}
                className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-sm text-blue-700"
              >
                {tag.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Предпросмотр */}
      <div>
        <h2 className="text-lg font-medium text-gray-900">Предпросмотр</h2>
        <div className="mt-2 overflow-hidden rounded-lg border border-gray-200">
          <DocumentPreview
            mimeType={document.mimeType}
            downloadUrl={`/api/v1/documents/${document.id}/download`}
          />
        </div>
      </div>
    </div>
  );
}
