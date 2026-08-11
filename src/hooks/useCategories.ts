'use client';

import { useState, useEffect, useCallback } from 'react';
import type {
  DocumentCategory,
  CreateCategoryData,
  CategoryTreeItem,
} from '@/domains/documents';

/**
 * @hook useCategories
 * @domain documents
 * @description Хук для работы с категориями документов
 *
 * @spec
 * - Загрузка дерева категорий
 * - createCategory: POST /api/v1/documents/categories
 * - deleteCategory: DELETE /api/v1/documents/categories/:id
 *
 * @returns Состояние и функции управления категориями
 *
 * @traces US-22-01 AC-1..5, US-22-02 AC-1..5
 * @task DOCS-T4.1.3
 */
export function useCategories() {
  const [categories, setCategories] = useState<DocumentCategory[]>([]);
  const [tree, setTree] = useState<CategoryTreeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/v1/documents/categories');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || 'Ошибка загрузки категорий');
      }
      const data = await response.json();
      setTree(data.data as CategoryTreeItem[]);
      // Преобразуем дерево в плоский список
      const flatten = (items: CategoryTreeItem[]): DocumentCategory[] => {
        return items.flatMap((item) => [
          {
            id: item.id,
            name: item.name,
            description: item.description,
            parentId: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          ...flatten(item.children),
        ]);
      };
      setCategories(flatten(data.data as CategoryTreeItem[]));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки категорий');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const createCategory = useCallback(
    async (data: CreateCategoryData): Promise<DocumentCategory | null> => {
      try {
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
        await refetch();
        return responseData.data as DocumentCategory;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ошибка создания категории');
        return null;
      }
    },
    [refetch],
  );

  const deleteCategory = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        const response = await fetch(`/api/v1/documents/categories/${id}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error?.message || 'Ошибка удаления категории');
        }

        await refetch();
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ошибка удаления категории');
        return false;
      }
    },
    [refetch],
  );

  return {
    categories,
    tree,
    loading,
    error,
    createCategory,
    deleteCategory,
    refetch,
  };
}
