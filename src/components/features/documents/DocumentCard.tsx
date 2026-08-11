'use client';

import React from 'react';
import Link from 'next/link';
import type { DocumentWithDetails } from '@/domains/documents';

/**
 * @component DocumentCard
 * @category documents
 * @description Мини-карточка документа для списка
 *
 * @spec
 * - Иконка по mimeType (PDF, DOCX, IMG)
 * - Название, дата создания, статус-бейдж
 * - Клик → Link / onCardClick
 *
 * @traces US-22-05 AC-9
 * @task DOCS-T4.2.4
 */
export function DocumentCard({
  document,
  onClick,
}: {
  document: DocumentWithDetails;
  onClick?: () => void;
}) {
  const getFileIcon = () => {
    const mime = document.mimeType;
    if (mime === 'application/pdf') return '📄';
    if (mime.includes('wordprocessingml')) return '📝';
    if (mime.startsWith('image/')) return '🖼️';
    return '📎';
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

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
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

  const content = (
    <div
      className="flex items-center gap-4 rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50"
    >
      {/* Иконка файла */}
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-2xl">
        {getFileIcon()}
      </div>

      {/* Основная информация */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate text-sm font-medium text-gray-900">{document.title}</h3>
          {getStatusBadge()}
        </div>
        <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
          <span>{formatFileSize(document.fileSize)}</span>
          <span>•</span>
          <span>{formatDate(document.createdAt)}</span>
          {document.category && <span>• {document.category.name}</span>}
        </div>
        {document.tags.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {document.tags.map((tag) => (
              <span
                key={tag.id}
                className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700"
              >
                {tag.name}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Стрелка */}
      <svg
        className="h-5 w-5 shrink-0 text-gray-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </div>
  );

  if (onClick) {
    return (
      <div
        role="button"
        tabIndex={0}
        aria-label={`Документ: ${document.title}`}
        onClick={onClick}
        onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
        className="cursor-pointer"
      >
        {content}
      </div>
    );
  }

  return (
    <Link href={`/dashboard/documents/${document.id}`} aria-label={`Документ: ${document.title}`}>
      {content}
    </Link>
  );
}
