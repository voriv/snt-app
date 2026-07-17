/**
 * @page /dashboard/announcements/[id]
 * @auth required
 * @role MEMBER, ADMIN, SUPER_ADMIN
 * @description Страница деталей одного объявления
 *
 * @spec
 * - Client Component с директивой 'use client'
 * - Проверка авторизации через useSession()
 * - Редирект на /login при отсутствии сессии (setTimeout delay 100ms)
 * - Загрузка деталей объявления по ID из URL параметров
 * - Отображение полного содержания объявления
 * - Отображение автора, даты публикации, статуса, просмотров
 * - Кнопка "Назад к списку"
 *
 * @data-flow
 * - Page → apiClient GET /announcements/:id → AnnouncementWithAuthor
 * - Отображение всех полей объявления
 */
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import type { AnnouncementWithAuthor } from '@/domains/announcement/announcement.types';
import { apiClient } from '@/lib/api-client';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

/**
 * Форматирует дату в читаемый формат
 */
function formatDate(date: Date | null): string {
  if (!date) return 'Не опубликовано';
  const d = new Date(date);
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  return `${day}.${month}.${year} в ${hours}:${minutes}`;
}

/**
 * Возвращает текст статуса для бейджа
 */
function getStatusText(status: string): string {
  switch (status) {
    case 'PUBLISHED':
      return 'Опубликовано';
    case 'ARCHIVED':
      return 'Архив';
    case 'DRAFT':
      return 'Черновик';
    default:
      return status;
  }
}

/**
 * Возвращает класс бейджа в зависимости от статуса
 */
function getStatusVariant(status: string): 'success' | 'default' | 'info' {
  switch (status) {
    case 'PUBLISHED':
      return 'success';
    case 'ARCHIVED':
      return 'default';
    case 'DRAFT':
      return 'info';
    default:
      return 'default';
  }
}

export default function AnnouncementDetailPage(): React.JSX.Element {
  const { status } = useSession();
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [announcement, setAnnouncement] = useState<AnnouncementWithAuthor | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Загрузка деталей объявления
  const loadAnnouncement = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.get<AnnouncementWithAuthor>(`/announcements/${id}`);

      if (response.success && response.data) {
        setAnnouncement(response.data);
      } else {
        setError('Объявление не найдено');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки объявления');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  // Загрузка при монтировании
  useEffect(() => {
    if (status === 'authenticated' && id) {
      loadAnnouncement();
    }
  }, [status, id, loadAnnouncement]);

  // Проверка авторизации
  useEffect(() => {
    if (status === 'unauthenticated') {
      const timer = setTimeout(() => {
        router.replace('/login');
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [status, router]);

  // Обработчик возврата к списку
  const handleBack = useCallback(() => {
    router.push('/dashboard/announcements');
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

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          <p className="font-medium">Ошибка</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
        <div className="mt-4">
          <Button variant="secondary" onClick={handleBack}>
            ← Назад к списку
          </Button>
        </div>
      </div>
    );
  }

  if (!announcement) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-700">
          <p className="font-medium">Объявление не найдено</p>
        </div>
        <div className="mt-4">
          <Button variant="secondary" onClick={handleBack}>
            ← Назад к списку
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Кнопка назад */}
      <div className="mb-4">
        <Button variant="ghost" onClick={handleBack}>
          ← Назад к списку
        </Button>
      </div>

      {/* Карточка объявления */}
      <div className="bg-white rounded-lg shadow border border-border">
        {/* Заголовок */}
        <div className="p-6 border-b border-border">
          <div className="flex items-start justify-between gap-4 mb-4">
            <h1 className="text-2xl font-bold text-foreground">
              {announcement.title}
            </h1>
            <Badge variant={getStatusVariant(announcement.status)}>
              {getStatusText(announcement.status)}
            </Badge>
          </div>

          {/* Мета-информация */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            {announcement.author?.name && (
              <div className="flex items-center gap-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-4 h-4"
                >
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <span>{announcement.author.name}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-4 h-4"
              >
                <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <time dateTime={announcement.publishedAt?.toISOString()}>
                {formatDate(announcement.publishedAt)}
              </time>
            </div>
            <div className="flex items-center gap-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-4 h-4"
              >
                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              <span>{announcement.viewCount} просмотров</span>
            </div>
          </div>
        </div>

        {/* Содержание */}
        <div className="p-6 prose prose-gray max-w-none">
          {announcement.content.split('\n').map((paragraph, index) => (
            <p key={index} className="text-foreground mb-4 last:mb-0">
              {paragraph}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
