/**
 * @page /dashboard/announcements
 * @auth required
 * @role MEMBER, ADMIN, SUPER_ADMIN
 * @description Страница списка объявлений СНТ
 *
 * @spec
 * - Client Component с директивой 'use client'
 * - Проверка авторизации через useSession()
 * - Редирект на /login при отсутствии сессии (setTimeout delay 100ms)
 * - Заголовок страницы: "Объявления"
 * - Рендер компонента AnnouncementList
 * - Пагинация, фильтрация и поиск через AnnouncementList
 *
 * @data-flow
 * - Page → AnnouncementList → apiClient GET /announcements → AnnouncementCard[]
 * - Клик по карточке → router.push('/dashboard/announcements/:id')
 * - Фильтры → onFilterChange → refetch через apiClient
 */
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { AnnouncementList, AnnouncementFilters } from '@/components/features/announcements/AnnouncementList';
import type { AnnouncementWithAuthor } from '@/domains/announcement/announcement.types';
import { apiClient } from '@/lib/api-client';

export default function AnnouncementsPage(): React.JSX.Element {
  const { status } = useSession();
  const router = useRouter();

  const [announcements, setAnnouncements] = useState<AnnouncementWithAuthor[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Загрузка списка объявлений
  const loadAnnouncements = useCallback(async (filters: AnnouncementFilters) => {
    setIsLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams();
      queryParams.set('page', String(filters.page));
      queryParams.set('limit', String(filters.limit));
      if (filters.status) {
        queryParams.set('status', filters.status);
      }
      if (filters.search) {
        queryParams.set('search', filters.search);
      }

      const response = await apiClient.get<{
        items: AnnouncementWithAuthor[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      }>(`/announcements?${queryParams.toString()}`);

      if (response.success && response.data) {
        setAnnouncements(response.data.items);
        setTotal(response.data.total);
        setPage(response.data.page);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки объявлений');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Загрузка при монтировании
  useEffect(() => {
    if (status === 'authenticated') {
      loadAnnouncements({ page: 1, limit, status: undefined, search: undefined });
    }
  }, [status, loadAnnouncements, limit]);

  // Проверка авторизации
  useEffect(() => {
    if (status === 'unauthenticated') {
      const timer = setTimeout(() => {
        router.replace('/login');
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [status, router]);

  // Обработчик изменения фильтров
  const handleFilterChange = useCallback((filters: AnnouncementFilters) => {
    loadAnnouncements(filters);
  }, [loadAnnouncements]);

  // Обработчик клика на объявление
  const handleAnnouncementClick = useCallback((id: string) => {
    router.push(`/dashboard/announcements/${id}`);
  }, [router]);

  if (status === 'loading' || status === 'unauthenticated') {
    return (
      <div className="flex items-center justify-center py-12">
        <svg
          className="animate-spin h-8 w-8 text-indigo-600"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          <p className="font-medium">Ошибка загрузки</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Объявления
      </h1>
      <div className="bg-white rounded-lg shadow">
        <div className="p-4">
          <AnnouncementList
            announcements={isLoading ? [] : announcements}
            total={total}
            page={page}
            limit={limit}
            onFilterChange={handleFilterChange}
            onAnnouncementClick={handleAnnouncementClick}
          />
        </div>
      </div>
    </div>
  );
}
