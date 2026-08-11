'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { TagInput } from './TagInput';
import { RoleVisibilitySelector } from './RoleVisibilitySelector';
import { useDocumentDetail } from '@/hooks/useDocumentDetail';
import type { Document, DocumentCategory } from '@/domains/documents';

/**
 * @component DocumentEditForm
 * @category documents
 * @description Форма редактирования метаданных документа
 *
 * @spec
 * - Предзаполнение из useDocumentDetail
 * - Поля: название, описание, категория, тип, статус, теги, видимость
 * - PUT /api/v1/documents/:id
 * - Подтверждение архивации
 *
 * @traces US-22-07 AC-1..8
 * @task DOCS-T4.2.9
 */
export function DocumentEditForm({
  documentId,
  categories,
  onSuccess,
}: {
  documentId: string;
  categories: DocumentCategory[];
  onSuccess?: () => void;
}) {
  const { document, loading, error: loadError, updateDocument } = useDocumentDetail(documentId);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [documentType, setDocumentType] = useState('');
  const [status, setStatus] = useState<'draft' | 'published' | 'archived'>('published');
  const [tags, setTags] = useState<string[]>([]);
  const [visibleRoles, setVisibleRoles] = useState<string[]>(['ADMIN']);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (document) {
      setTitle(document.title);
      setDescription(document.description ?? '');
      setCategoryId(document.categoryId);
      setDocumentType(document.documentType);
      setStatus(document.status);
      setTags(document.tags.map((t) => t.name));
      setVisibleRoles(document.visibleRoles);
    }
  }, [document]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!document) return;

      setSaving(true);
      setError(null);
      try {
        await updateDocument({
          title: title.trim(),
          description: description.trim() || null,
          categoryId,
          documentType: documentType.trim(),
          status,
          visibleRoles,
          tags,
        });
        onSuccess?.();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ошибка сохранения');
      } finally {
        setSaving(false);
      }
    },
    [document, title, description, categoryId, documentType, status, visibleRoles, tags, updateDocument, onSuccess],
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12" role="status" aria-label="Загрузка">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
        <span className="sr-only">Загрузка...</span>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4" role="alert">
        <p className="text-sm text-red-800">{loadError}</p>
      </div>
    );
  }

  if (document?.status === 'archived') {
    return (
      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-6" role="alert">
        <p className="text-sm font-medium text-yellow-800">
          ⚠️ Архивированные документы недоступны для редактирования
        </p>
      </div>
    );
  }

  // Flatten categories
  const flattenCategories = (items: DocumentCategory[]): { id: string; name: string }[] => {
    const result: { id: string; name: string }[] = [];
    for (const cat of items) {
      result.push({ id: cat.id, name: cat.name });
    }
    return result;
  };

  const flatCategories = flattenCategories(categories);

  return (
    <form onSubmit={handleSubmit} className="space-y-6" role="form" aria-label="Форма редактирования документа">
      {/* Название */}
      <div>
        <label htmlFor="edit-title" className="block text-sm font-medium text-gray-700">
          Название документа <span className="text-red-500">*</span>
        </label>
        <input
          id="edit-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          maxLength={255}
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Описание */}
      <div>
        <label htmlFor="edit-description" className="block text-sm font-medium text-gray-700">
          Описание
        </label>
        <textarea
          id="edit-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Категория */}
      <div>
        <label htmlFor="edit-category" className="block text-sm font-medium text-gray-700">
          Категория
        </label>
        <select
          id="edit-category"
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

      {/* Тип */}
      <div>
        <label htmlFor="edit-type" className="block text-sm font-medium text-gray-700">
          Тип документа <span className="text-red-500">*</span>
        </label>
        <select
          id="edit-type"
          value={documentType}
          onChange={(e) => setDocumentType(e.target.value)}
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
      </div>

      {/* Статус */}
      <div>
        <label htmlFor="edit-status" className="block text-sm font-medium text-gray-700">
          Статус
        </label>
        <select
          id="edit-status"
          value={status}
          onChange={(e) => setStatus(e.target.value as 'draft' | 'published' | 'archived')}
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="draft">Черновик</option>
          <option value="published">Опубликован</option>
          <option value="archived">Архивирован</option>
        </select>
        {status === 'archived' && (
          <p className="mt-1 text-xs text-yellow-600">
            ⚠️ После архивации документ будет доступен только для просмотра
          </p>
        )}
      </div>

      {/* Теги */}
      <TagInput value={tags} onChange={setTags} maxTags={10} />

      {/* Видимость */}
      <RoleVisibilitySelector value={visibleRoles} onChange={setVisibleRoles} />

      {/* Ошибка */}
      {error && (
        <div className="rounded-md bg-red-50 p-3" role="alert">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Кнопки */}
      <div className="flex justify-end gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? 'Сохранение...' : 'Сохранить изменения'}
        </button>
      </div>
    </form>
  );
}
