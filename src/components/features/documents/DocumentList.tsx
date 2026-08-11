'use client';

import React, { useState, useCallback } from 'react';
import { DocumentCard } from './DocumentCard';
import { DocumentFilters } from './DocumentFilters';
import { DocumentSearch } from './DocumentSearch';
import { useDocuments } from '@/hooks/useDocuments';
import type { DocumentFilter } from '@/domains/documents';

/**
 * @component DocumentList
 * @category documents
 * @description Компонент списка документов с фильтрацией и пагинацией
 *
 * @example
 * ```tsx
 * <DocumentList onCardClick={(id) => router.push(`/dashboard/documents/${id}`)} />
 * ```
 *
 * @spec
 * - Загружает данные при mount через useDocuments(filter)
 * - Обработаны состояния: loading, error, empty, data
 * - Клик по карточке → onCardClick(doc.id)
 * - Сортировка по createdAt DESC
 *
 * @traces US-22-05 AC-1..9
 * @task DOCS-T4.2.1
 */
export function DocumentList({
  onCardClick,
}: {
  onCardClick?: (id: string) => void;
}) {
  const [filters, setFilters] = useState<DocumentFilter>({});
  const { documents, loading, error, total, page, setPage, handleSearch } = useDocuments(filters);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12" role="status" aria-label="Загрузка">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
        <span className="sr-only">Загрузка документов...</span>
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

  if (!documents || documents.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 p-12 text-center" role="status" aria-label="Нет документов">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
          />
        </svg>
        <h3 className="mt-4 text-sm font-medium text-gray-900">Документы не найдены</h3>
        <p className="mt-2 text-sm text-gray-500">Попробуйте изменить фильтры или загрузить новый документ</p>
      </div>
    );
  }

  const totalPages = Math.ceil(total / (filters.limit ?? 20));

  return (
    <div role="region" aria-label="Список документов" className="space-y-4">
      <DocumentFilters onFilterChange={setFilters} />
      <DocumentSearch onSearch={handleSearch} />

      {/* Список документов */}
      <div className="space-y-2">
        {documents.map((doc) => (
          <DocumentCard
            key={doc.id}
            document={doc}
            onClick={() => onCardClick?.(doc.id)}
          />
        ))}
      </div>

      {/* Пагинация */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2" role="navigation" aria-label="Пагинация">
          <button
            type="button"
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Назад
          </button>
          <span className="text-sm text-gray-600">
            Страница {page} из {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Далее
          </button>
        </div>
      )}
    </div>
  );
}
