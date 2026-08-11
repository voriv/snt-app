'use client';

import React, { useState, useCallback } from 'react';
import type { CategoryTreeItem } from '@/domains/documents';

/**
 * @component CategoryTree
 * @category documents
 * @description Дерево категорий документов с возможностью раскрытия/сворачивания
 *
 * @spec
 * - Рекурсивный рендер children
 * - Expand/collapse состояние
 * - Каждый узел: название, кнопка «Добавить подкатегорию», кнопка «Удалить»
 *
 * @traces US-22-01 AC-1, AC-2
 * @task DOCS-T4.2.10
 */
export function CategoryTree({
  tree,
  onAddChild,
  onDelete,
}: {
  tree: CategoryTreeItem[];
  onAddChild?: (parentId: string | null) => void;
  onDelete?: (id: string) => void;
}) {
  return (
    <div className="space-y-1" role="tree" aria-label="Дерево категорий">
      {tree.map((item) => (
        <CategoryTreeNode
          key={item.id}
          item={item}
          onAddChild={onAddChild}
          onDelete={onDelete}
        />
      ))}
      {tree.length === 0 && (
        <p className="text-sm text-gray-500">Категории не созданы</p>
      )}
    </div>
  );
}

function CategoryTreeNode({
  item,
  onAddChild,
  onDelete,
}: {
  item: CategoryTreeItem;
  onAddChild?: (parentId: string | null) => void;
  onDelete?: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const hasChildren = item.children.length > 0;

  const toggleExpand = useCallback(() => {
    setExpanded((prev) => !prev);
  }, []);

  return (
    <div role="treeitem" aria-expanded={expanded} className="rounded-lg">
      <div className="flex items-center gap-2 py-1.5">
        {/* Expand/Collapse */}
        {hasChildren ? (
          <button
            type="button"
            onClick={toggleExpand}
            className="flex h-6 w-6 items-center justify-center rounded hover:bg-gray-200"
            aria-label={expanded ? 'Свернуть' : 'Развернуть'}
          >
            <svg
              className={`h-4 w-4 text-gray-500 transition-transform ${expanded ? 'rotate-90' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        ) : (
          <div className="h-6 w-6" />
        )}

        {/* Название категории */}
        <div className="flex-1">
          <span className="text-sm font-medium text-gray-900">{item.name}</span>
          {item.description && (
            <p className="text-xs text-gray-500">{item.description}</p>
          )}
        </div>

        {/* Действия */}
        <div className="flex gap-1">
          {onAddChild && (
            <button
              type="button"
              onClick={() => onAddChild(item.id)}
              className="rounded-md px-2 py-1 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-50"
              aria-label={`Добавить подкатегорию к "${item.name}"`}
            >
              + Подкатегория
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(item.id)}
              className="rounded-md px-2 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
              aria-label={`Удалить категорию "${item.name}"`}
            >
              Удалить
            </button>
          )}
        </div>
      </div>

      {/* Дочерние категории */}
      {expanded && hasChildren && (
        <div className="ml-6 border-l border-gray-200 pl-4" role="group" aria-label="Подкатегории">
          {item.children.map((child) => (
            <CategoryTreeNode
              key={child.id}
              item={child}
              onAddChild={onAddChild}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
