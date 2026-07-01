/**
 * @component RolePagesManager
 * @category features
 * @description Назначение страниц роли через чекбоксы
 *
 * @spec
 * - Отображает список всех страниц из реестра с чекбоксами
 * - Отмеченные страницы назначены роли (запись в role_pages)
 * - Изменение чекбокса мгновенно добавляет/удаляет запись
 * - Для SUPER_ADMIN назначение не обязательно — доступ безусловен
 * - Состояние загрузки при операциях
 * - EmptyState если реестр страниц пуст
 *
 * @see docs/user-stories/US-8-roles-management.md — FR-6, AC-7
 */
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Role, Page } from '@/domains/roles';
import { apiClient } from '@/lib/api-client';
import type { ApiResponse } from '@/shared/types';
import { Badge } from '@/components/ui';

export interface RolePagesManagerProps {
  /** Роль, страницами которой управляем */
  role: Role;
  /** Список всех страниц (передаётся родителем для единой загрузки) */
  allPages: Page[];
}

export function RolePagesManager({
  role,
  allPages,
}: RolePagesManagerProps): React.JSX.Element {
  const [assignedPageIds, setAssignedPageIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [operatingId, setOperatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadAssigned = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.get<Page[]>(`/roles/${role.id}/pages`);
      if (response.success && response.data) {
        setAssignedPageIds(new Set(response.data.map(p => p.id)));
      } else if (response.error) {
        setError(response.error.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки');
    } finally {
      setIsLoading(false);
    }
  }, [role.id]);

  useEffect(() => {
    loadAssigned();
  }, [loadAssigned]);

  const handleToggle = async (page: Page) => {
    const isAssigned = assignedPageIds.has(page.id);
    setOperatingId(page.id);
    setError(null);
    try {
      if (isAssigned) {
        const response = await apiClient.delete(`/roles/${role.id}/pages/${page.id}`);
        if (response.success) {
          setAssignedPageIds(prev => {
            const next = new Set(prev);
            next.delete(page.id);
            return next;
          });
        } else if (response.error) {
          setError(response.error.message);
        }
      } else {
        const response = await apiClient.post<null>(`/roles/${role.id}/pages`, {
          pageId: page.id,
        });
        if (response.success) {
          setAssignedPageIds(prev => new Set(prev).add(page.id));
        } else if (response.error) {
          setError(response.error.message);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка операции');
    } finally {
      setOperatingId(null);
    }
  };

  if (allPages.length === 0) {
    return (
      <p className="text-sm text-gray-500 text-center py-6">
        Реестр страниц пуст. Добавьте страницы на вкладке «Страницы».
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {role.name === 'SUPER_ADMIN' && (
        <p className="text-xs text-gray-500">
          Для SUPER_ADMIN назначение страниц не обязательно — доступ безусловен.
        </p>
      )}
      {isLoading ? (
        <p className="text-sm text-gray-500">Загрузка...</p>
      ) : (
        <ul className="divide-y divide-gray-200 border border-gray-200 rounded-md">
          {allPages.map((page) => {
            const isAssigned = assignedPageIds.has(page.id);
            const isOperating = operatingId === page.id;
            return (
              <li key={page.id} className="flex items-center py-2 px-3 hover:bg-gray-50">
                <input
                  id={`page-${page.id}`}
                  type="checkbox"
                  checked={isAssigned}
                  onChange={() => handleToggle(page)}
                  disabled={isOperating}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded mr-3"
                />
                <label
                  htmlFor={`page-${page.id}`}
                  className="flex-1 min-w-0 cursor-pointer text-sm"
                >
                  <span className="font-medium text-gray-900">{page.title}</span>
                  <span className="text-gray-500 ml-2">{page.path}</span>
                </label>
                {!page.isActive && (
                  <Badge variant="default">Неактивна</Badge>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
