/**
 * @page /dashboard/roles
 * @auth required
 * @description Страница управления ролями, страницами, API endpoints и участниками
 *
 * @spec
 * - Client Component с 'use client'
 * - Четыре вкладки: «Роли», «Страницы», «API», «Участники»
 * - Неавторизованные пользователи → redirect на /login
 * - Проверка прав будет реализована в US-9
 * - Загрузка данных через apiClient
 * - Состояния: loading, error, data
 * - EmptyState для пустых списков
 *
 * @data-flow
 * - useSession() → проверка доступа
 * - apiClient.get('/roles') → RoleList
 * - apiClient.get('/pages') → PageList
 * - apiClient.get('/api-endpoints') → ApiEndpointList
 *
 * @see docs/user-stories/US-8-roles-management.md — FR-1, AC-1
 */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  RoleList,
  RoleForm,
  RoleUsersManager,
  RolePagesManager,
  RoleApiEndpointsManager,
  PageList,
  PageForm,
  ApiEndpointList,
  ApiEndpointForm,
  UserSearch,
} from '@/components/features/roles';
import { ConfirmDialog } from '@/components/ui';
import { Button, Card, CardHeader, CardTitle, CardBody } from '@/components/ui';
import { apiClient } from '@/lib/api-client';
import type { ApiResponse } from '@/shared/types';
import type { Role, Page, ApiEndpoint, CreateApiEndpointInput } from '@/domains/roles';

type Tab = 'roles' | 'pages' | 'api' | 'users';

export default function RolesPage(): React.JSX.Element {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('roles');
  const [roles, setRoles] = useState<Role[]>([]);
  const [pages, setPages] = useState<Page[]>([]);
  const [endpoints, setEndpoints] = useState<ApiEndpoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRoleForm, setShowRoleForm] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);

  // Проверка авторизации и загрузка данных
  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push('/login');
      return;
    }

    // Проверка прав доступа будет реализована в US-9
    loadData();
  }, [status, session, router]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [rolesRes, pagesRes, endpointsRes] = await Promise.all([
        apiClient.get<ApiResponse<Role[]>>('/roles'),
        apiClient.get<ApiResponse<Page[]>>('/pages'),
        apiClient.get<ApiResponse<ApiEndpoint[]>>('/api-endpoints'),
      ]);

      if (rolesRes.success && rolesRes.data) {
        setRoles(rolesRes.data as unknown as Role[]);
      }
      if (pagesRes.success && pagesRes.data) {
        setPages(pagesRes.data as unknown as Page[]);
      }
      if (endpointsRes.success && endpointsRes.data) {
        setEndpoints(endpointsRes.data as unknown as ApiEndpoint[]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRoleSubmit = async (data: { name: string; description?: string }) => {
    setLoading(true);
    setError(null);

    try {
      if (editingRole) {
        await apiClient.patch<ApiResponse<Role>>(`/roles/${editingRole.id}`, data);
      } else {
        await apiClient.post<ApiResponse<Role>>('/roles', data);
      }
      setShowRoleForm(false);
      setEditingRole(null);
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при сохранении роли');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRole = async (role: Role) => {
    setLoading(true);
    setError(null);

    try {
      await apiClient.delete<ApiResponse<void>>(`/roles/${role.id}`);
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при удалении роли');
    } finally {
      setLoading(false);
    }
  };

  // Обработчики ролей
  const handleEditRole = (role: Role) => {
    setEditingRole(role);
    setShowRoleForm(true);
  };

  // Заглушки для страниц
  const handleEditPage = (page: Page) => {
    alert(`Редактирование страницы: ${page.path}`);
  };

  const handleDeletePage = async (page: Page) => {
    if (confirm(`Вы уверены, что хотите удалить страницу «${page.title}»?`)) {
      try {
        await apiClient.delete<ApiResponse<void>>(`/pages/${page.id}`);
        setPages(prev => prev.filter(p => p.id !== page.id));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ошибка при удалении страницы');
      }
    }
  };

  const handlePageCreate = async (data: { path: string; title: string; groupName?: string; sortOrder?: number }) => {
    setLoading(true);
    try {
      await apiClient.post<ApiResponse<Page>>('/pages', data);
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка создания страницы');
    } finally {
      setLoading(false);
    }
  };

  const handleEditEndpoint = (endpoint: ApiEndpoint) => {
    alert(`Редактирование endpoint: ${endpoint.method} ${endpoint.path}`);
  };

  const handleDeleteEndpoint = async (endpoint: ApiEndpoint) => {
    if (confirm(`Вы уверены, что хотите удалить endpoint ${endpoint.method} ${endpoint.path}?`)) {
      try {
        await apiClient.delete<ApiResponse<void>>(`/api-endpoints/${endpoint.id}`);
        setEndpoints(prev => prev.filter(e => e.id !== endpoint.id));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ошибка при удалении endpoint');
      }
    }
  };

  const handleEndpointCreate = async (data: any) => {
    setLoading(true);
    try {
      await apiClient.post<ApiResponse<ApiEndpoint>>('/api-endpoints', data);
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка создания endpoint');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Загрузка...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Управление ролями</h1>
        <p className="text-gray-600 mt-2">
          Управление ролями, страницами, API endpoints и участниками
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {(['roles', 'pages', 'api', 'users'] as Tab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  if (tab !== 'users') {
                    setSelectedRoleId(null);
                  }
                }}
                className={`
                  whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                  ${
                    activeTab === tab
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                {tab === 'roles' && 'Роли'}
                {tab === 'pages' && 'Страницы'}
                {tab === 'api' && 'API endpoints'}
                {tab === 'users' && 'Участники'}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Role Management Tab */}
      {activeTab === 'roles' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Управление ролями</CardTitle>
              {(!loading && !error && roles.length > 0) && (
                <Button
                  variant="primary"
                  onClick={() => {
                    setShowRoleForm(true);
                    setEditingRole(null);
                  }}
                  isLoading={loading}
                >
                  Создать роль
                </Button>
              )}
            </CardHeader>
            <CardBody>
              {loading ? (
                <div className="text-center py-8">Загрузка...</div>
              ) : error ? (
                <div className="text-center py-8 text-red-600">{error}</div>
              ) : roles.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>Роли не найдены</p>
                  <button
                    type="button"
                    onClick={() => {
                      setShowRoleForm(true);
                      setEditingRole(null);
                    }}
                    className="mt-4 text-indigo-600 hover:text-indigo-900 font-medium"
                  >
                    Создать первую роль
                  </button>
                </div>
              ) : (
                <RoleList
                  roles={roles}
                  onEdit={handleEditRole}
                  onManagePages={(role: Role) => {
                    setSelectedRoleId(role.id);
                    setActiveTab('users');
                  }}
                  onManageApiEndpoints={(role: Role) => {
                    setSelectedRoleId(role.id);
                    setActiveTab('users');
                  }}
                  onManageUsers={(role: Role) => {
                    setSelectedRoleId(role.id);
                    setActiveTab('users');
                  }}
                  onDelete={handleDeleteRole}
                  isLoading={loading}
                />
              )}
            </CardBody>
          </Card>

          {showRoleForm && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>{editingRole ? 'Редактировать роль' : 'Создать роль'}</CardTitle>
              </CardHeader>
              <CardBody>
                <RoleForm
                  role={editingRole}
                  onSubmit={handleRoleSubmit}
                  onCancel={() => {
                    setShowRoleForm(false);
                    setEditingRole(null);
                  }}
                  isLoading={loading}
                />
              </CardBody>
            </Card>
          )}
        </div>
      )}

      {/* Pages Management Tab */}
      {activeTab === 'pages' && (
        <Card>
          <CardHeader>
            <CardTitle>Управление страницами</CardTitle>
          </CardHeader>
          <CardBody>
            {loading ? (
              <div className="text-center py-8">Загрузка...</div>
            ) : error ? (
              <div className="text-center py-8 text-red-600">{error}</div>
            ) : pages.length === 0 ? (
              <div className="text-center py-8 text-gray-500">Страницы не найдены</div>
            ) : (
              <>
                <PageList
                  pages={pages}
                  onDelete={handleDeletePage}
                  onEdit={handleEditPage}
                  isLoading={loading}
                />
                <div className="mt-6">
                  <PageForm
                    onSubmit={handlePageCreate}
                    onCancel={() => {}}
                    isLoading={loading}
                  />
                </div>
              </>
            )}
          </CardBody>
        </Card>
      )}

      {/* API Endpoints Management Tab */}
      {activeTab === 'api' && (
        <Card>
          <CardHeader>
            <CardTitle>Управление API endpoints</CardTitle>
          </CardHeader>
          <CardBody>
            {loading ? (
              <div className="text-center py-8">Загрузка...</div>
            ) : error ? (
              <div className="text-center py-8 text-red-600">{error}</div>
            ) : endpoints.length === 0 ? (
              <div className="text-center py-8 text-gray-500">API endpoints не найдены</div>
            ) : (
              <>
                <ApiEndpointList
                  endpoints={endpoints}
                  onDelete={handleDeleteEndpoint}
                  onEdit={handleEditEndpoint}
                  isLoading={loading}
                />
                <div className="mt-6">
                  <ApiEndpointForm
                    onSubmit={async (data: any) => handleEndpointCreate(data as any)}
                    onCancel={() => {}}
                    isLoading={loading}
                  />
                </div>
              </>
            )}
          </CardBody>
        </Card>
      )}

      {/* Users Management Tab */}
      {activeTab === 'users' && selectedRoleId && (
        <Card>
          <CardHeader>
            <CardTitle>Управление участниками роли</CardTitle>
          </CardHeader>
          <CardBody>
            {selectedRoleId && (
              <RoleUsersManager
                role={{ id: selectedRoleId } as Role}
                onRemoveUser={() => loadData()}
              />
            )}
          </CardBody>
        </Card>
      )}

      {/* Back button for Users tab */}
      {activeTab === 'users' && selectedRoleId && (
        <div className="mt-6">
          <Button variant="secondary" onClick={() => {
            setActiveTab('roles');
            setSelectedRoleId(null);
          }}>
            ← Назад к ролям
          </Button>
        </div>
      )}
    </div>
  );
}
