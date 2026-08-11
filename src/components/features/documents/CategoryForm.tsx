'use client';

import React, { useState, useCallback } from 'react';
import type { DocumentCategory, CreateCategoryData } from '@/domains/documents';

/**
 * @component CategoryForm
 * @category documents
 * @description Форма создания категории документа
 *
 * @spec
 * - Поля: название (обязательно), описание, родительская категория
 * - POST /api/v1/documents/categories
 * - Inline-валидация
 *
 * @traces US-22-01 AC-1..5
 * @task DOCS-T4.2.11
 */
export function CategoryForm({
  parentCategoryId,
  onSuccess,
  onCancel,
}: {
  parentCategoryId?: string | null;
  onSuccess?: (category: DocumentCategory) => void;
  onCancel?: () => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setSaving(true);
      setError(null);
      setNameError(null);

      // Inline валидация
      if (!name.trim()) {
        setNameError('Название категории обязательно');
        setSaving(false);
        return;
      }

      try {
        const data: CreateCategoryData = {
          name: name.trim(),
          description: description.trim() || undefined,
          parentId: parentCategoryId || undefined,
        };

        const response = await fetch('/api/v1/documents/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error?.message || 'Ошибка создания категории');
        }

        const responseData = await response.json();
        setName('');
        setDescription('');
        onSuccess?.(responseData.data as DocumentCategory);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ошибка создания категории');
      } finally {
        setSaving(false);
      }
    },
    [name, description, parentCategoryId, onSuccess],
  );

  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setName(value);
    if (value.trim()) {
      setNameError(null);
    }
  }, []);

  return (
    <form onSubmit={handleSubmit} className="space-y-4" role="form" aria-label="Форма создания категории">
      {/* Название */}
      <div>
        <label htmlFor="category-name" className="block text-sm font-medium text-gray-700">
          Название категории <span className="text-red-500">*</span>
        </label>
        <input
          id="category-name"
          type="text"
          value={name}
          onChange={handleNameChange}
          required
          maxLength={100}
          aria-required="true"
          aria-invalid={!!nameError}
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Введите название категории"
        />
        {nameError && (
          <p className="mt-1 text-xs text-red-600" role="alert">
            {nameError}
          </p>
        )}
        <p className="mt-1 text-xs text-gray-500">{name.length}/100 символов</p>
      </div>

      {/* Описание */}
      <div>
        <label htmlFor="category-description" className="block text-sm font-medium text-gray-700">
          Описание (опционально)
        </label>
        <textarea
          id="category-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={500}
          rows={3}
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Краткое описание категории"
        />
        <p className="mt-1 text-xs text-gray-500">{description.length}/500 символов</p>
      </div>

      {/* Информация о родительской категории */}
      {parentCategoryId && (
        <div className="rounded-md bg-blue-50 p-3">
          <p className="text-sm text-blue-800">
            Категория будет создана как подкатегория существующей.
          </p>
        </div>
      )}

      {/* Ошибка */}
      {error && (
        <div className="rounded-md bg-red-50 p-3" role="alert">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Кнопки */}
      <div className="flex justify-end gap-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Отмена
          </button>
        )}
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? 'Сохранение...' : 'Сохранить'}
        </button>
      </div>
    </form>
  );
}
