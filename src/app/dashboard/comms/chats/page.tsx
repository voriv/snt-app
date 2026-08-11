/**
 * @page /dashboard/comms/chats
 * @auth required
 * @role MEMBER, ADMIN, SUPER_ADMIN
 * @description Страница списка групповых чатов пользователя
 *
 * @covers AC-5 (US-21-36): Прямой переход по URL подраздела
 * @covers AC-R14-4 (B-020-T4): Скелетон страницы при загрузке
 * @covers AC-R15-1 (B-020-T5): Breadcrumbs на странице
 *
 * @spec
 * - Client Component с директивой 'use client'
 * - Проверка авторизации через useSession()
 * - Редирект на /login при отсутствии сессии (setTimeout delay 100ms)
 * - Заголовок страницы: "Групповые чаты"
 * - Кнопка "Создать чат" — переход на /dashboard/comms/chats/new
 * - Рендер компонента ChatList
 * - Breadcrumbs перед заголовком
 *
 * @data-flow
 * - Page → ChatList → apiClient GET /chats → ChatCard[]
 * - Клик по карточке → router.push('/dashboard/comms/chats/:chatId')
 * - Кнопка "Создать чат" → router.push('/dashboard/comms/chats/new')
 */
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ChatList } from '@/components/features/comms/ChatList';
import { Button } from '@/components/ui/Button';
import { Breadcrumbs } from '@/components/layouts/Breadcrumbs';

export default function ChatsPage(): React.JSX.Element {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      const timer = setTimeout(() => {
        router.replace('/login');
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [status, router]);

  // Скелетон страницы при загрузке сессии (R-14, T4) — вместо спиннера
  if (status === 'loading' || status === 'unauthenticated') {
    return (
      <div
        className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
        role="status"
        aria-live="polite"
      >
        {/* Заголовок + кнопка «Создать чат» */}
        <div className="flex items-center justify-between mb-6">
          <div className="h-8 bg-[var(--theme-bg-secondary)] rounded w-48 animate-pulse" />
          <div className="h-10 bg-[var(--theme-bg-secondary)] rounded-lg w-32 animate-pulse" />
        </div>
        {/* Карточка со списком чатов */}
        <div className="bg-[var(--theme-bg-primary)] rounded-lg shadow p-4 space-y-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="w-10 h-10 rounded-full bg-[var(--theme-bg-secondary)]" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-[var(--theme-bg-secondary)] rounded w-1/3" />
                <div className="h-3 bg-[var(--theme-bg-secondary)] rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumbs />
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[var(--theme-text-primary)]">Групповые чаты</h1>
        <Button
          variant="primary"
          type="button"
          onClick={() => router.push('/dashboard/comms/chats/new')}
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4.5v15m7.5-7.5h-15"
            />
          </svg>
          Создать чат
        </Button>
      </div>

      <div className="bg-[var(--theme-bg-primary)] rounded-lg shadow">
        <ChatList />
      </div>
    </div>
  );
}
