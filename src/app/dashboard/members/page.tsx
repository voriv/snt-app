/**
 * @page /dashboard/members
 * @auth required
 * @description Страница списка членов СНТ
 *
 * @spec
 * - Отображает список всех членов СНТ
 * - Кнопка обновления списка
 * - Отображает состояние загрузки и ошибки
 * - Доступно только авторизованным пользователям
 *
 * @data-flow
 * - Client Component с Fetch данными
 * - useEffect для загрузки данных при монтировании
 * - apiClient.get('/members') для получения данных
 * - Обработка состояний: loading, error, data
 */
'use client';

import { useState, useEffect } from 'react';
import { Button, Card, CardHeader, CardTitle, CardBody } from '@/components/ui';
import { MemberList } from '@/components/features/members';
import { apiClient } from '@/lib/api-client';
import type { ApiResponse } from '@/shared/types';
import type { Member } from '@/domains/members';

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    try {
      setLoading(true);
      const response: ApiResponse<Member[]> = await apiClient.get('/members');
      setMembers(response.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load members');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Члены товарищества
          </h1>
          <p className="mt-2 text-sm text-gray-700">
            Полный список всех членов СНТ
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Button onClick={loadMembers}>Обновить список</Button>
        </div>
      </div>

      {loading && (
        <div className="mt-6 text-center">Загрузка...</div>
      )}

      {error && (
        <div className="mt-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Список членов</CardTitle>
            </CardHeader>
            <CardBody>
              <MemberList members={members} />
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
}
