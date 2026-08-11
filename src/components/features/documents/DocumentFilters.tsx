'use client';

import React, { useState, useEffect } from 'react';
import type { DocumentFilter } from '@/domains/documents';
import { useCategories } from '@/hooks/useCategories';

/**
 * @component DocumentFilters
 * @category documents
 * @description Компонент фильтров списка документов
 *
 * @spec
 * - Выпадающие списки: категория (с иерархией), тип, статус
 * - Кнопка «Сбросить»
 *
 * @traces US-22-05 AC-4, AC-5
 * @task DOCS-T4.2.2
 */
export function DocumentFilters({
  onFilterChange,
}: {
  onFilterChange: (filters: DocumentFilter) => void;
}) {
  const { tree: categories } = useCategories();
  const [categoryId, setCategoryId] = useState('');
  const [documentType, setDocumentType] = useState('');
  const [status, setStatus] = useState('');

  // Flatten categories для select
  const flattenCategories = (items: typeof categories, parent: string | null = null): { id: string; name: string; parent: string | null }[] => {
    const result: { id: string; name: string; parent: string | null }[] = [];
    for (const cat of items) {
      result.push({ id: cat.id, name: cat.name, parent });
      if (cat.children.length > 0) {
        result.push(...flattenCategories(cat.children, cat.id));
      }
    }
    return result;
  };

  const flatCategories = flattenCategories(categories);

  const applyFilters = () => {
    const filters: DocumentFilter = {};
    if (categoryId) filters.categoryId = categoryId;
    if (documentType) filters.documentType = documentType;
    if (status) filters.status = status as 'draft' | 'published' | 'archived';
    onFilterChange(filters);
  };

  const resetFilters = () => {
    setCategoryId('');
    setDocumentType('');
    setStatus('');
    onFilterChange({});
  };

  return (
    <div className="flex flex-wrap items-end gap-4 rounded-lg border border-gray-200 p-4">
      {/* Фильтр по категории */}
      <div className="flex flex-col gap-1">
        <label htmlFor="filter-category" className="text-sm font-medium text-gray-700">
          Категория
        </label>
        <select
          id="filter-category"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          onBlur={applyFilters}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">Все категории</option>
          {flatCategories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.parent ? '  ' : ''}{cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* Фильтр по типу */}
      <div className="flex flex-col gap-1">
        <label htmlFor="filter-type" className="text-sm font-medium text-gray-700">
          Тип файла
        </label>
        <select
          id="filter-type"
          value={documentType}
          onChange={(e) => setDocumentType(e.target.value)}
          onBlur={applyFilters}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">Все типы</option>
          <option value="pdf">PDF</option>
          <option value="docx">DOCX</option>
          <option value="image">Изображения</option>
          <option value="other">Другие</option>
        </select>
      </div>

      {/* Фильтр по статусу */}
      <div className="flex flex-col gap-1">
        <label htmlFor="filter-status" className="text-sm font-medium text-gray-700">
          Статус
        </label>
        <select
          id="filter-status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          onBlur={applyFilters}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">Все статусы</option>
          <option value="published">Опубликован</option>
          <option value="draft">Черновик</option>
          <option value="archived">Архив</option>
        </select>
      </div>

      {/* Кнопка сброса */}
      <button
        type="button"
        onClick={resetFilters}
        className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
      >
        Сбросить
      </button>
    </div>
  );
}
