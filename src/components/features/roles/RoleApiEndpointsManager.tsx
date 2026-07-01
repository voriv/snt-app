/**
 * @component RoleApiEndpointsManager
 * @category features
 * @description Назначение API endpoints роли через чекбоксы
 *
 * @spec
 * - Отображает список всех endpoints из реестра с чекбоксами
 * - Отмеченные endpoints назначены роли (запись в role_api_endpoints)
 * - Назначение имеет значение только для endpoints с access_type=role
 *   (для public/owner/super_admin чекбокс отключён)
 * - Для SUPER_ADMIN назначение не обязательно — доступ безусловен
 * - Состояние загрузки при операциях
 * - EmptyState если реестр endpoints пуст
 *
 * @see docs/user-stories/US-8-roles-management.md — FR-14, AC-19
 */
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Role, ApiEndpoint } from '@/domains/roles';
import { apiClient } from '@/lib/api-client';
import type { ApiResponse } from '@/shared/types';
import { Badge } from '@/components/ui';

const ACCESS_TYPE_VARIANT: Record<string, 'success' | 'info' | 'warning' | 'danger'> = {
  public: 'success',
  owner: 'info',
  role: 'warning',
  super_admin: 'danger',
};

const ACCESS_TYPE_LABEL: Record<string, string> = {
  public: 'public',
  owner: 'owner',
  role: 'role',
  super_admin: 'super_admin',
};

export interface RoleApiEndpointsManagerProps {
  /** Роль, endpoints которой управляем */
  role: Role;
  /** Список всех endpoints (передаётся родителем) */
  allEndpoints: ApiEndpoint[];
}

export function RoleApiEndpointsManager({
  role,
  allEndpoints,
}: RoleApiEndpointsManagerProps): React.JSX.Element {
  const [assignedIds, setAssignedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [operatingId, setOperatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadAssigned = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.get<ApiEndpoint[]>(`/roles/${role.id}/api-endpoints`);
      if (response.success && response.data) {
        setAssignedIds(new Set(response.data.map(e => e.id)));
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

  const handleToggle = async (endpoint: ApiEndpoint) => {
    const isAssigned = assignedIds.has(endpoint.id);
    setOperatingId(endpoint.id);
    setError(null);
    try {
      if (isAssigned) {
        const response = await apiClient.delete(`/roles/${role.id}/api-endpoints/${endpoint.id}`);
        if (response.success) {
          setAssignedIds(prev => {
            const next = new Set(prev);
            next.delete(endpoint.id);
            return next;
          });
        } else if (response.error) {
          setError(response.error.message);
        }
      } else {
        const response = await apiClient.post<null>(`/roles/${role.id}/api-endpoints`, {
          apiEndpointId: endpoint.id,
        });
        if (response.success) {
          setAssignedIds(prev => new Set(prev).add(endpoint.id));
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

  if (allEndpoints.length === 0) {
    return (
      <p className="text-sm text-gray-500 text-center py-6">
        Реестр API endpoints пуст. Добавьте endpoints на вкладке «API».
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {role.name === 'SUPER_ADMIN' && (
        <p className="text-xs text-gray-500">
          Для SUPER_ADMIN назначение endpoints не обязательно — доступ безусловен.
        </p>
      )}
      {isLoading ? (
        <p className="text-sm text-gray-500">Загрузка...</p>
      ) : (
        <ul className="divide-y divide-gray-200 border border-gray-200 rounded-md">
          {allEndpoints.map((endpoint) => {
            const isAssigned = assignedIds.has(endpoint.id);
            const isOperating = operatingId === endpoint.id;
            const isRoleType = endpoint.accessType === 'role';
            return (
              <li key={endpoint.id} className="flex items-center py-2 px-3 hover:bg-gray-50">
                <input
                  id={`endpoint-${endpoint.id}`}
                  type="checkbox"
                  checked={isAssigned}
                  onChange={() => handleToggle(endpoint)}
                  disabled={isOperating || !isRoleType}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded mr-3 disabled:opacity-40"
                />
                <label
                  htmlFor={`endpoint-${endpoint.id}`}
                  className="flex-1 min-w-0 cursor-pointer text-sm flex items-center gap-2"
                >
                  <Badge variant="default">{endpoint.method}</Badge>
                  <span className="font-mono text-gray-900 truncate">{endpoint.path}</span>
                </label>
                <Badge variant={ACCESS_TYPE_VARIANT[endpoint.accessType]}>
                  {ACCESS_TYPE_LABEL[endpoint.accessType]}
                </Badge>
                {!endpoint.isActive && (
                  <Badge variant="default">Неактивен</Badge>
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
