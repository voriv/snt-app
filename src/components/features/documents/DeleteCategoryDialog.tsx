'use client';

import React from 'react';

/**
 * @component DeleteCategoryDialog
 * @category documents
 * @description Модальный диалог подтверждения удаления категории
 *
 * @spec
 * - Предупреждение о переносе документов в родительскую категорию
 * - Текст на русском
 *
 * @traces US-22-02 AC-1..5
 * @task DOCS-T4.2.12
 */
export function DeleteCategoryDialog({
  isOpen,
  categoryName,
  hasDocuments,
  onConfirm,
  onCancel,
}: {
  isOpen: boolean;
  categoryName: string;
  hasDocuments: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" role="dialog" aria-modal="true" aria-label="Подтверждение удаления категории">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        {/* Иконка предупреждения */}
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--theme-badge-danger-bg)]">
          <svg
            className="h-6 w-6 text-red-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        {/* Заголовок */}
        <h2 className="mt-4 text-center text-lg font-semibold text-gray-900">
          Удалить категорию?
        </h2>

        {/* Описание */}
        <div className="mt-4 space-y-3">
          <p className="text-sm text-gray-700 text-center">
            Вы уверены, что хотите удалить категорию <strong>«{categoryName}»</strong>?
          </p>

          {hasDocuments && (
            <div className="rounded-md bg-yellow-50 p-3">
              <p className="text-sm text-yellow-800">
                ⚠️ Документы в этой категории будут перенесены в родительскую категорию. Если родительская категория отсутствует, документы останутся без категории.
              </p>
            </div>
          )}

          <p className="text-xs text-gray-500 text-center">
            Подкатегории будут перепривязаны к родительской категории.
          </p>
        </div>

        {/* Кнопки */}
        <div className="mt-6 flex justify-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
          >
            Удалить
          </button>
        </div>
      </div>
    </div>
  );
}
