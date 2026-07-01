/**
 * @component PageList
 * @category features
 * @description Таблица страниц с действиями
 *
 * @spec
 * - Колонки: путь, заголовок, группа, статус, действия
 * - Статус отображается в виде Badge
 * - Действия: Редактировать, Удалить
 * - Подтверждение удаления через ConfirmDialog
 * - EmptyState если pages.length === 0
 *
 * @see docs/user-stories/US-8-roles-management.md
 */
'use client';

import { useState } from 'react';
import type { Page } from '@/domains/roles';
import { Badge, Button, ConfirmDialog } from '@/components/ui';

export interface PageListProps {
  /** Список страниц для отображения */
  pages: Page[];
  /** Колбэк при нажатии «Редактировать» */
  onEdit?: (page: Page) => void;
  /** Колбэк при подтверждении удаления страницы */
  onDelete?: (page: Page) => void;
  /** Состояние загрузки */
  isLoading?: boolean;
}

export function PageList({
  pages,
  onEdit,
  onDelete,
  isLoading = false,
}: PageListProps): React.JSX.Element {
  const [pageToDelete, setPageToDelete] = useState<Page | null>(null);

  if (pages.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Страницы не найдены</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
        <table className="min-w-full divide-y divide-gray-300">
          <thead className="bg-gray-50">
            <tr>
              <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                Путь
              </th>
              <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                Заголовок
              </th>
              <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                Группа
              </th>
              <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                Статус
              </th>
              <th className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                <span className="sr-only">Действия</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {pages.map((page) => (
              <tr key={page.id}>
                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                  {page.path}
                </td>
                <td className="px-3 py-4 text-sm text-gray-900">
                  {page.title}
                </td>
                <td className="px-3 py-4 text-sm text-gray-500">
                  {page.groupName || '-'}
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm">
                  {page.isActive ? (
                    <Badge variant="success">Активен</Badge>
                  ) : (
                    <Badge variant="info">Неактивен</Badge>
                  )}
                </td>
                <td className="whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6 space-x-2">
                  {onEdit && (
                    <button
                      type="button"
                      onClick={() => onEdit?.(page)}
                      disabled={isLoading}
                      className="text-indigo-600 hover:text-indigo-900 disabled:opacity-50"
                    >
                      Редактировать
                    </button>
                  )}
                  {onDelete && (
                    <button
                      type="button"
                      onClick={() => setPageToDelete(page)}
                      disabled={isLoading}
                      className="text-red-600 hover:text-red-900 disabled:opacity-50"
                    >
                      Удалить
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        isOpen={pageToDelete !== null}
        onClose={() => setPageToDelete(null)}
        title="Удаление страницы"
        message={`Вы действительно хотите удалить страницу «${pageToDelete?.title}» (${pageToDelete?.path})?`}
        confirmLabel="Удалить"
        variant="danger"
        isLoading={isLoading}
        onConfirm={() => {
          if (pageToDelete && onDelete) {
            onDelete(pageToDelete);
          }
          setPageToDelete(null);
        }}
      />
    </>
  );
}
