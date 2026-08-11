'use client';

import React from 'react';

/**
 * @component DocumentPreview
 * @category documents
 * @description Компонент предпросмотра документа по MIME-типу
 *
 * @spec
 * - PDF → iframe/embed
 * - Изображение → img
 * - DOCX/другое → заглушка «Предпросмотр недоступен»
 *
 * @traces US-22-06 AC-2, AC-3
 * @task DOCS-T4.2.6
 */
export function DocumentPreview({
  mimeType,
  downloadUrl,
}: {
  mimeType: string;
  downloadUrl: string;
}) {
  const isPdf = mimeType === 'application/pdf';
  const isImage = mimeType.startsWith('image/');

  if (isPdf) {
    return (
      <div className="flex items-center justify-center overflow-hidden rounded-lg border border-gray-200" role="region" aria-label="Предпросмотр PDF">
        <iframe
          title="Предпросмотр PDF документа"
          src={downloadUrl}
          className="h-[600px] w-full"
        />
      </div>
    );
  }

  if (isImage) {
    return (
      <div className="flex items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-gray-50" role="region" aria-label="Предпросмотр изображения">
        <img
          src={downloadUrl}
          alt="Предпросмотр изображения"
          className="max-h-[600px] w-auto object-contain"
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 p-12" role="region" aria-label="Предпросмотр недоступен">
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
          d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
        />
      </svg>
      <p className="mt-4 text-sm font-medium text-gray-700">Предпросмотр недоступен</p>
      <p className="mt-1 text-sm text-gray-500">
        Предпросмотр недоступен для данного типа файла. Скачайте файл для просмотра.
      </p>
    </div>
  );
}
