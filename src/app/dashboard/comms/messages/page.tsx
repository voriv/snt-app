/**
 * @page /dashboard/comms/messages
 * @auth required
 * @role MEMBER, ADMIN, SUPER_ADMIN
 * @description Страница списка личных диалогов пользователя
 *
 * @covers AC-5 (US-21-36): Прямой переход по URL подраздела
 * @covers AC-R14-3 (B-020-T3): Скелетон страницы при загрузке
 * @covers AC-R15-1 (B-020-T5): Breadcrumbs на странице
 *
 * @spec
 * - Client Component с директивой 'use client'
 * - Проверка авторизации через useSession()
 * - Редирект на /login при отсутствии сессии (setTimeout delay 100ms)
 * - Заголовок страницы: "Сообщения"
 * - Рендер компонента ConversationList
 * - Breadcrumbs перед заголовком
 *
 * @data-flow
 * - Page → ConversationList → apiClient GET /conversations → ConversationCard[]
 * - Клик по карточке → router.push('/dashboard/comms/messages/:conversationId')
 */
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Breadcrumbs } from '@/components/layouts/Breadcrumbs';
import { ConversationList } from '@/components/features/comms/ConversationList';

export default function MessagesPage(): React.JSX.Element {
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

  // Скелетон страницы при загрузке сессии (R-14, T3) — вместо спиннера
  if (status === 'loading' || status === 'unauthenticated') {
    return (
      <div
        className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
        role="status"
        aria-live="polite"
      >
        {/* Заголовок */}
        <div className="h-8 bg-[var(--theme-bg-secondary)] rounded w-48 mb-6 animate-pulse" />
        {/* Карточка со списком диалогов */}
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
      <h1 className="text-2xl font-bold text-[var(--theme-text-primary)] mb-6">
        Сообщения
      </h1>
      <div className="bg-[var(--theme-bg-primary)] rounded-lg shadow">
        <ConversationList />
      </div>
    </div>
  );
}
