/**
 * @page CommsModerationPage
 * @auth required (ADMIN/SUPER_ADMIN)
 *
 * @covers AC-6 (US-21-36): Скрытие «Модерация» для MEMBER
 * @covers AC-7 (US-21-36): «Модерация» для ADMIN/SUPER_ADMIN
 * @see docs/specs/comms/component-spec.md → 3.4.3
 *
 * @spec
 * - Client Component
 * - Проверка роли через useSession()
 * - Для MEMBER — редирект на /dashboard/comms/messages
 * - Для ADMIN/SUPER_ADMIN — EmptyState с placeholder текстом
 * - Заголовок "Панель модерации"
 */
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { EmptyState } from '@/components/ui/EmptyState';

/**
 * Заглушка страницы модерации.
 *
 * Доступна только для ролей ADMIN и SUPER_ADMIN.
 * Для остальных ролей выполняется редирект на /dashboard/comms/messages.
 *
 * @returns EmptyState для администратора или null во время редиректа
 */
export default function CommsModerationPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const userRoles = session?.user?.roles ?? [];
  const isAdmin = userRoles.includes('ADMIN') || userRoles.includes('SUPER_ADMIN');

  // Редирект для не-администраторов после загрузки сессии
  useEffect(() => {
    if (status === 'authenticated' && !isAdmin) {
      router.replace('/dashboard/comms/messages');
    }
  }, [status, isAdmin, router]);

  // Пока сессия загружается — ничего не рендерим
  if (status === 'loading') {
    return null;
  }

  // Для не-администраторов — null (идёт редирект)
  if (!isAdmin) {
    return null;
  }

  return (
    <div className="flex flex-col items-center justify-center py-12">
      <h2 className="text-xl font-semibold text-[var(--theme-text-primary)] mb-6">
        Панель модерации
      </h2>
      <EmptyState
        title="В разработке"
        description="Функции модерации будут добавлены в ближайшем обновлении"
      />
    </div>
  );
}
