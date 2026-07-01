/**
 * @component UserSearch
 * @category features
 * @description Поиск пользователя по email/имени для добавления в роль
 *
 * @spec
 * - Поле ввода для поиска по email или имени
 * - Поиск по частичному совпадению, case-insensitive (допущение US-8, вопрос 4)
 * - Отображает результаты поиска с кнопкой «Добавить»
 * - Debounce ввода (300мс) для оптимизации запросов
 * - Состояние загрузки при поиске
 * - EmptyState если результаты пусты
 * - При добавлении создаётся запись в user_roles через onAddUser
 *
 * @see docs/user-stories/US-8-roles-management.md — FR-8, AC-10
 */
'use client';

import { useState, useEffect, useRef } from 'react';
import type { UserData } from '@/domains/auth/auth.types';
import { apiClient } from '@/lib/api-client';
import type { ApiResponse } from '@/shared/types';
import { Button, Input } from '@/components/ui';

export interface UserSearchProps {
  /** Колбэк при добавлении пользователя */
  onAddUser: (user: UserData) => void;
  /** ID роли, в которую добавляется пользователь (для проверки существования) */
  roleId: string;
  /** Список уже добавленных userId (для исключения из результатов) */
  excludeUserIds?: string[];
}

export function UserSearch({
  onAddUser,
  roleId,
  excludeUserIds = [],
}: UserSearchProps): React.JSX.Element {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    setIsLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const response = await apiClient.get<UserData[]>(`/users?q=${encodeURIComponent(trimmed)}`);
        if (response.success && response.data) {
          setResults(response.data.filter(u => !excludeUserIds.includes(u.id)));
        } else {
          setResults([]);
        }
      } catch {
        setResults([]);
      } finally {
        setIsLoading(false);
        setHasSearched(true);
      }
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, excludeUserIds]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-3">
      <Input
        label="Поиск пользователя"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Введите email или имя (минимум 2 символа)"
        disabled={isLoading}
      />
      {isLoading && (
        <p className="text-sm text-gray-500">Поиск...</p>
      )}
      {!isLoading && hasSearched && results.length === 0 && (
        <p className="text-sm text-gray-500 text-center py-4">
          Пользователи не найдены
        </p>
      )}
      {results.length > 0 && (
        <ul className="divide-y divide-gray-200 border border-gray-200 rounded-md">
          {results.map((user) => (
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
                variant="secondary"
                onClick={() => {
                  onAddUser(user);
                  setQuery('');
                  setResults([]);
                  setHasSearched(false);
                }}
              >
                Добавить
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
