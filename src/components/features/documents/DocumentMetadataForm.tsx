'use client';

import React, { useState, useCallback } from 'react';
import { TagInput } from './TagInput';
import { RoleVisibilitySelector } from './RoleVisibilitySelector';
import type { Document, DocumentCategory, CreateCategoryData } from '@/domains/documents';

/**
 * @component DocumentMetadataForm
 * @category documents
 * @description Форма назначения метаданных при загрузке документа
 *
 * @spec
 * - Поля: название, описание, категория, тип, теги, видимость
 * - Inline-валидация с сообщениями на русском
 * - PUT /api/v1/documents/:id/metadata
 *
 * @traces US-22-04 AC-1..5
 * @task DOCS-T4.2.8
 */
export function DocumentMetadataForm({
  documentId,
  categories,
  onSuccess,
}: {
  documentId: string;
  categories: DocumentCategory[];
  onSuccess?: (doc: Document) => void;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [documentType, setDocumentType] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [visibleRoles, setVisibleRoles] = useState<string[]>(['ADMIN']);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [typeError, setTypeError] = useState<string | null>(null);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setSaving(true);
      setError(null);
      setTitleError(null);
      setTypeError(null);

      // Inline валидация
      if (!title.trim()) {
        setTitleError('Название документа обязательно');
        setSaving(false);
        return;
      }

      if (!documentType.trim()) {
        setTypeError('Тип документа обязателен');
        setSaving(false);
        return;
      }

      try {
        const response = await fetch(`/api/v1/documents/${documentId}/metadata`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: title.trim(),
            description: description.trim() || null,
            categoryId: categoryId,
            documentType: documentType.trim(),
            visibleRoles,
            tags: tags.length > 0 ? tags : undefined,
            status: 'published',
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error?.message || 'Ошибка сохранения');
        }

        const data = await response.json();
        onSuccess?.(data.data as Document);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ошибка сохранения');
      } finally {
        setSaving(false);
      }
    },
    [documentId, title, description, categoryId, documentType, visibleRoles, tags, onSuccess],
  );

  // Flatten categories для select
  const flattenCategories = (items: DocumentCategory[], parent: string | null = null): { id: string; name: string }[] => {
    const result: { id: string; name: string }[] = [];
    for (const cat of items) {
      result.push({ id: cat.id, name: cat.name });
    }
    return result;
  };

  const flatCategories = flattenCategories(categories);

  return (
    <form onSubmit={handleSubmit} className="space-y-6" role="form" aria-label="Форма метаданных документа">
      {/* Название */}
      <div>
        <label htmlFor="doc-title" className="block text-sm font-medium text-gray-700">
          Название документа <span className="text-red-500">*</span>
        </label>
        <input
          id="doc-title"
          type="text"
          value={title}
          onChange={(e) => { setTitle(e.target.value); setTitleError(null); }}
          required
          maxLength={255}
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Введите название документа"
        />
        {titleError && <p className="mt-1 text-xs text-red-600">{titleError}</p>}
      </div>

      {/* Описание */}
      <div>
        <label htmlFor="doc-description" className="block text-sm font-medium text-gray-700">
          Описание
        </label>
        <textarea
          id="doc-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Краткое описание содержимого документа"
        />
      </div>

      {/* Категория */}
      <div>
        <label htmlFor="doc-category" className="block text-sm font-medium text-gray-700">
          Категория
        </label>
        <select
          id="doc-category"
          value={categoryId ?? ''}
          onChange={(e) => setCategoryId(e.target.value || null)}
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">Без категории</option>
          {flatCategories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* Тип документа */}
      <div>
        <label htmlFor="doc-type" className="block text-sm font-medium text-gray-700">
          Тип документа <span className="text-red-500">*</span>
        </label>
        <select
          id="doc-type"
          value={documentType}
          onChange={(e) => { setDocumentType(e.target.value); setTypeError(null); }}
          required
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">Выберите тип</option>
          <option value="protocol">Протокол</option>
          <option value="resolution">Решение</option>
          <option value="contract">Договор</option>
          <option value="report">Отчёт</option>
          <option value="application">Заявление</option>
          <option value="other">Другое</option>
        </select>
        {typeError && <p className="mt-1 text-xs text-red-600">{typeError}</p>}
      </div>

      {/* Теги */}
      <TagInput value={tags} onChange={setTags} maxTags={10} />

      {/* Видимость по ролям */}
      <RoleVisibilitySelector value={visibleRoles} onChange={setVisibleRoles} />

      {/* Ошибка */}
      {error && (
        <div className="rounded-md bg-red-50 p-3" role="alert">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Кнопка */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? 'Сохранение...' : 'Сохранить и опубликовать'}
        </button>
      </div>
    </form>
  );
}
