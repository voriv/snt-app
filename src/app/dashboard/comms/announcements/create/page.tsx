/**
 * @page /dashboard/comms/announcements/create
 * @auth required
 * @role ADMIN, MODERATOR
 * @description Страница создания нового объявления
 *
 * @covers AC-5 (US-21-36): Прямой переход по URL подраздела
 *
 * @spec
 * - Требует авторизации (редирект на /login если нет сессии)
 * - Требует роли ADMIN или MODERATOR
 * - Отображает форму создания объявления
 * - После успешного создания редирект на /dashboard/comms/announcements
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
  const { status } = useSession();
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
        <div className="text-[var(--theme-text-secondary)]">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Заголовок страницы */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--theme-text-primary)]">Создание объявления</h1>
        <p className="mt-1 text-sm text-[var(--theme-text-secondary)]">
          Заполните форму для создания нового объявления
        </p>
      </div>

      {/* Форма создания */}
      <div className="rounded-lg border border-[var(--theme-border-color)] bg-[var(--theme-bg-primary)] p-6">
        <AnnouncementForm />
      </div>
    </div>
  );
}
