/**
 * @component CommsTabs
 * @category comms
 * @description Панель вкладок для раздела "Общение" с бейджами непрочитанных
 *
 * @example
 * ```tsx
 * <CommsTabs activeTab="messages" userRoles={['MEMBER']} />
 * ```
 *
 * @covers AC-3 (US-21-36): Панель вкладок с 3-4 табами
 * @covers AC-4 (US-21-36): Переключение вкладок с URL синхронизацией
 * @covers AC-5 (US-21-36): Прямой переход по URL подраздела
 * @covers AC-6 (US-21-36): Скрытие «Модерация» для MEMBER
 * @covers AC-7 (US-21-36): «Модерация» для ADMIN/SUPER_ADMIN
 * @covers AC-1 (US-21-37): Бейдж на «Личные сообщения»
 * @covers AC-2 (US-21-37): Бейдж на «Групповые чаты»
 * @covers AC-3 (US-21-37): Скрытие бейджа при 0
 * @covers AC-4 (US-21-37): Нет бейджа на «Объявления»
 * @covers AC-5 (US-21-37): Обновление счётчика
 * @covers AC-7 (US-21-37): Refetch после markAsRead (через refetchTrigger)
 * @see component-spec.md → 3.3.2
 *
 * @spec
 * - 4 вкладки: messages, chats, announcements, moderation
 * - moderation скрыта для не-ADMIN/SUPER_ADMIN
 * - useEffect для загрузки /api/v1/comms/unread-counts
 * - Обновление счётчиков при activeTab change
 * - Бейдж "99+" при count > 99
 * - ARIA: role="tablist"
 * - Состояния: loading (бейджи скрыты), error (бейджи скрыты), data (бейджи видны)
 */
'use client';

import type { ReactNode } from 'react';
import { CommsTab } from '../CommsTab';
import { useUnreadCounts } from '@/hooks/useUnreadCounts';

/**
 * Inline SVG-иконки (зависимость lucide-react не установлена в проекте)
 */
const MessageSquareIcon = (): ReactNode => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);
const UsersIcon = (): ReactNode => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);
const MegaphoneIcon = (): ReactNode => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m3 11 18-5v12L3 14v-3z" />
    <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
  </svg>
);
const ShieldIcon = (): ReactNode => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

export interface CommsTabsProps {
  /** Активная вкладка */
  activeTab: 'messages' | 'chats' | 'announcements' | 'moderation';
  /** Роли пользователя */
  userRoles: string[];
  /** Триггер повторной загрузки счётчиков (инкрементируется извне после markAsRead).
   *  При изменении значения компонент refetch-ит счётчики непрочитанных. */
  refetchTrigger?: number;
}

/**
 * Тип счётчиков непрочитанных
 */
export interface UnreadCounts {
  messages: number;
  chats: number;
}

/**
 * Панель вкладок "Общение"
 *
 * @param props - Пропсы компонента
 * @returns Панель вкладок
 */
export function CommsTabs({ activeTab, userRoles, refetchTrigger = 0 }: CommsTabsProps) {
  const isAdmin = userRoles.includes('ADMIN') || userRoles.includes('SUPER_ADMIN');

  // Единый хук загрузки счётчиков. refetchTrigger — триггер после markAsRead (AC-7, AC-5, AC-5b, AC-5c).
  // activeTab намеренно НЕ является зависимостью: эндпоинт возвращает общие { messages, chats } для всех вкладок,
  // перезагрузка при смене activeTab была избыточной (лишний запрос).
  const { counts: unreadCounts, loading, error } = useUnreadCounts(refetchTrigger);

  // Скрыть бейджи при loading или error
  const showBadges = !loading && !error && unreadCounts !== null;

  return (
    <div
      role="tablist"
      className="flex gap-0 border-b border-[var(--theme-border-color)]"
    >
      <CommsTab
        href="/dashboard/comms/messages"
        label="Личные сообщения"
        icon={<MessageSquareIcon />}
        active={activeTab === 'messages'}
        badgeCount={showBadges ? unreadCounts?.messages : undefined}
      />
      <CommsTab
        href="/dashboard/comms/chats"
        label="Групповые чаты"
        icon={<UsersIcon />}
        active={activeTab === 'chats'}
        badgeCount={showBadges ? unreadCounts?.chats : undefined}
      />
      <CommsTab
        href="/dashboard/comms/announcements"
        label="Объявления"
        icon={<MegaphoneIcon />}
        active={activeTab === 'announcements'}
      />
      {isAdmin && (
        <CommsTab
          href="/dashboard/comms/moderation"
          label="Модерация"
          icon={<ShieldIcon />}
          active={activeTab === 'moderation'}
        />
      )}
    </div>
  );
}
