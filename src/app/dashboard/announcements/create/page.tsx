/**
 * @page /dashboard/announcements/create
 * @auth required
 * @role ADMIN, MODERATOR
 * @description Страница создания нового объявления
 *
 * @spec
 * - Требует авторизации (редирект на /login если нет сессии)
 * - Требует роли ADMIN или MODERATOR
 * - Отображает форму создания объявления
 * - После успешного создания редирект на /dashboard/announcements
 *
 * @data-flow
 * - Client Component → useSession() → apiClient.post('/announcements') → редирект
 */
'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { AnnouncementForm } from '@/components/features/announcements/AnnouncementForm';

/**
 * @component CreateAnnouncementPage
 * @description Страница создания объявления
 */
export default function CreateAnnouncementPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Проверка авторизации
  useEffect(() => {
    if (status === 'unauthenticated') {
      // Задержка перед редиректом
      const timeout = setTimeout(() => router.replace('/login'), 100);
      return () => clearTimeout(timeout);
    }
  }, [status, router]);

  // Показ loading состояния
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Заголовок страницы */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Создание объявления</h1>
        <p className="mt-1 text-sm text-gray-600">
          Заполните форму для создания нового объявления
        </p>
      </div>

      {/* Форма создания */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <AnnouncementForm />
      </div>
    </div>
  );
}
