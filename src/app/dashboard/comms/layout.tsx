/**
 * @page CommsLayout
 * @auth required
 *
 * @covers AC-3 (US-21-36): Панель вкладок с 3-4 табами
 * @covers AC-4 (US-21-36): Переключение вкладок с URL синхронизацией
 * @covers AC-5 (US-21-36): Прямой переход по URL подраздела
 * @see docs/specs/comms/component-spec.md → 3.4.1
 *
 * @covers AC-5 (US-21-37): Обновление счётчика после прочтения
 * @covers AC-7 (US-21-37): Refetch после markAsRead (через refetchTrigger)
 *
 * @spec
 * - Client Component
 * - Определяет activeTab из pathname (usePathname)
 * - useSession() для получения userRoles
 * - Рендерит CommsTabs + children
 * - Адаптивный layout
 * - Инкрементирует refetchTrigger для CommsTabs при смене pathname → refetch счётчиков непрочитанных (B-026-T6-3)
 */
'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { CommsTabs } from '@/components/features/comms/CommsTabs';
import type { ReactNode } from 'react';

interface CommsLayoutProps {
  children: ReactNode;
}

/** Идентификатор активной вкладки раздела "Общение" */
type CommsTabId = 'messages' | 'chats' | 'announcements' | 'moderation';

/**
 * Layout-обёртка для /dashboard/comms/*
 *
 * Определяет активную вкладку по pathname и рендерит панель вкладок
 * над контентом дочерних страниц.
 *
 * @param props - Пропсы layout
 * @returns Layout с панелью вкладок и контентом
 */
export default function CommsLayout({ children }: CommsLayoutProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const userRoles = session?.user?.roles ?? [];

  // Триггер повторной загрузки счётчиков непрочитанных на вкладках.
  // Инкрементируется при каждой навигации внутри раздела (например, при открытии
  // диалога/чата, где useMarkAsRead отметил сообщения прочитанными) — AC-7 US-21-37.
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  useEffect(() => {
    setRefetchTrigger((prev) => prev + 1);
  }, [pathname]);

  const activeTab = determineActiveTab(pathname);

  return (
    <div className="flex-1 flex flex-col">
      <div className="border-b border-[var(--theme-border-color)]">
        <CommsTabs activeTab={activeTab} userRoles={userRoles} refetchTrigger={refetchTrigger} />
      </div>
      <main role="tabpanel" className="flex-1 p-6">
        {children}
      </main>
    </div>
  );
}

/**
 * Определить активную вкладку из pathname.
 *
 * Приоритет проверки: chats → announcements → moderation → messages (default).
 *
 * @param pathname - Текущий pathname из usePathname()
 * @returns Идентификатор активной вкладки
 */
function determineActiveTab(pathname: string | null): CommsTabId {
  if (pathname?.includes('/comms/chats')) {
    return 'chats';
  }
  if (pathname?.includes('/comms/announcements')) {
    return 'announcements';
  }
  if (pathname?.includes('/comms/moderation')) {
    return 'moderation';
  }
  return 'messages';
}
