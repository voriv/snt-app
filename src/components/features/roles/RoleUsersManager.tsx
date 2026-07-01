/**
 * @component RoleUsersManager
 * @category features
 * @description Управление участниками роли: список назначенных + исключение + поиск/добавление
 *
 * @spec
 * - Отображает список пользователей, назначенных роли
 * - Кнопка «Исключить» с подтверждением через ConfirmDialog
 * - Содержит UserSearch для поиска/добавления пользователей
 * - При добавлении создаётся запись в user_roles
 * - При исключении удаляется, с защитой последнего SUPER_ADMIN
 * - Состояние загрузки при операциях
 * - EmptyState если список участников пуст
 *
 * @see docs/user-stories/US-8-roles-management.md — FR-8, AC-10, AC-11, AC-12
 */
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Role } from '@/domains/roles';
import type { UserData } from '@/domains/auth/auth.types';
import { apiClient } from '@/lib/api-client';
import type { ApiResponse } from '@/shared/types';
import { Button, ConfirmDialog } from '@/components/ui';
import { UserSearch } from './UserSearch';

export interface RoleUsersManagerProps {
  /** Роль, участниками которой управляем */
  role: Role;
  /** Колбэк при исключении пользователя */
  onRemoveUser?: (userId: string) => void;
}

export function RoleUsersManager({
  role,
  onRemoveUser,
}: RoleUsersManagerProps): React.JSX.Element {
  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOperating, setIsOperating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userToRemove, setUserToRemove] = useState<UserData | null>(null);

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.get<UserData[]>(`/roles/${role.id}/users`);
      if (response.success && response.data) {
        setUsers(response.data);
      } else if (response.error) {
        setError(response.error.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки участников');
    } finally {
      setIsLoading(false);
    }
  }, [role.id]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleAddUser = async (user: UserData) => {
    setIsOperating(true);
    setError(null);
    try {
      const response = await apiClient.post<null>(`/roles/${role.id}/users`, {
        userId: user.id,
      });
      if (response.success) {
        setUsers(prev =>
          prev.some(u => u.id === user.id) ? prev : [...prev, user],
        );
      } else if (response.error) {
        setError(response.error.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка добавления');
    } finally {
      setIsOperating(false);
    }
  };

  const handleRemoveUser = async (userId: string) => {
    setIsOperating(true);
    setError(null);
    try {
      const response = await apiClient.delete(`/roles/${role.id}/users/${userId}`);
      if (response.success) {
        setUsers(prev => prev.filter(u => u.id !== userId));
        if (onRemoveUser) {
          onRemoveUser(userId);
        }
      } else if (response.error) {
        setError(response.error.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка исключения');
    } finally {
      setIsOperating(false);
      setUserToRemove(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-3">
          Добавить участника
        </h4>
        <UserSearch
          onAddUser={handleAddUser}
          roleId={role.id}
          excludeUserIds={users.map(u => u.id)}
        />
      </div>

      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-3">
          Участники роли ({users.length})
        </h4>
        {isLoading ? (
          <p className="text-sm text-gray-500">Загрузка...</p>
        ) : users.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-6">
            У роли нет участников
          </p>
        ) : (
          <ul className="divide-y divide-gray-200 border border-gray-200 rounded-md">
            {users.map((user) => (
              <li
                key={user.id}
                className="flex items-center justify-between py-2 px-3 hover:bg-gray-50"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user.email}
                  </p>
                  {user.name && (
                    <p className="text-xs text-gray-500 truncate">{user.name}</p>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => setUserToRemove(user)}
                  disabled={isOperating}
                >
                  Исключить
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      <ConfirmDialog
        isOpen={userToRemove !== null}
        onClose={() => setUserToRemove(null)}
        title="Исключение участника"
        message={`Исключить пользователя «${userToRemove?.email}» из роли «${role.name}»?`}
        confirmLabel="Исключить"
        variant="danger"
        isLoading={isOperating}
        onConfirm={() => {
          if (userToRemove) {
            handleRemoveUser(userToRemove.id);
          }
        }}
      />
    </div>
  );
}
