'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useCategories } from '@/hooks/useCategories';
import { CategoryTree } from '@/components/features/documents/CategoryTree';
import { CategoryForm } from '@/components/features/documents/CategoryForm';
import { DeleteCategoryDialog } from '@/components/features/documents/DeleteCategoryDialog';
import type { DocumentCategory } from '@/domains/documents';

/**
 * @page /dashboard/documents/categories
 * @auth admin
 * @description Страница управления категориями документов
 *
 * @spec
 * - Дерево категорий с CategoryTree
 * - Кнопка «Создать категорию» → CategoryForm
 * - Удаление через DeleteCategoryDialog
 *
 * @traces US-22-01 AC-1..5, US-22-02 AC-1..5
 * @task DOCS-T4.3.3
 */
export default function CategoriesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { tree, loading, error, createCategory, deleteCategory, refetch } = useCategories();
  const [showForm, setShowForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string; hasDocs: boolean } | null>(null);

  if (status === 'loading') {
    return <div role="status">Загрузка...</div>;
  }

  if (status === 'unauthenticated' || !session?.user?.roles?.includes('ADMIN')) {
    router.push('/login');
    return null;
  }

  const handleCategoryCreated = () => {
    setShowForm(false);
    refetch();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteCategory(deleteTarget.id);
    setDeleteTarget(null);
    refetch();
  };

  return (
    <div role="region" aria-label="Управление категориями">
      <h1>Категории документов</h1>
      <button type="button" onClick={() => setShowForm(true)}>
        Создать категорию
      </button>

      {showForm && (
        <CategoryForm
          onSuccess={handleCategoryCreated}
          onCancel={() => setShowForm(false)}
        />
      )}

      {loading && <div role="status">Загрузка...</div>}
      {error && <div role="alert">{error}</div>}
      {!loading && !error && (
        <CategoryTree
          tree={tree}
          onAddChild={(parentId) => {
            setShowForm(true);
          }}
          onDelete={(id) => {
            // [TODO] Определить hasDocuments — DOCS-T4.3.3
            setDeleteTarget({ id, name: id, hasDocs: false });
          }}
        />
      )}

      {deleteTarget && (
        <DeleteCategoryDialog
          isOpen={!!deleteTarget}
          categoryName={deleteTarget.name}
          hasDocuments={deleteTarget.hasDocs}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
