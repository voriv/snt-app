/**
 * @component ChatCard
 * @category features/comms
 * @description Карточка группового чата в списке чатов
 *
 * @example
 * ```tsx
 * <ChatCard
 *   chat={item}
 *   onClick={() => router.push(`/dashboard/comms/chats/${item.chatId}`)}
 * />
 * ```
 *
 * @spec
 * - Отображает название чата
 * - Отображает превью последнего сообщения (обрезка до 60 символов)
 * - Отображает время последнего сообщения в относительном формате
 * - Отображает количество участников (иконка + число)
 * - Отображает счётчик непрочитанных (бейдж, если > 0)
 * - Кликабельная карточка с обработчиком onClick
 * - Доступность: role="link", tabIndex, aria-label
 *
 * @covers AC-R21-2 (B-022-T2): Перенос компонента в features/comms (визуально без изменений)
 * @task B-022-T2 (R-21)
 */
'use client';

import { useCallback } from 'react';
import { cn } from '@/shared/utils';
import type { ChatListItem } from '@/domains/comms/comms.types';

export interface ChatCardProps {
  /** Объект чата для отображения */
  chat: ChatListItem;
  /** Callback при клике на карточку */
  onClick: () => void;
}

/**
 * Форматирует дату в относительный формат: "5 мин", "10:30", "вчера"
 */
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const target = new Date(date);
  const diffMs = now.getTime() - target.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'только что';
  if (diffMin < 60) return `${diffMin} мин`;
  if (diffHour < 24) {
    const hours = target.getHours().toString().padStart(2, '0');
    const minutes = target.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }
  if (diffDay === 1) return 'вчера';
  if (diffDay < 7) {
    const day = target.getDate();
    const month = target.getMonth() + 1;
    return `${day}.${month}`;
  }
  const day = target.getDate().toString().padStart(2, '0');
  const month = (target.getMonth() + 1).toString().padStart(2, '0');
  const year = target.getFullYear();
  return `${day}.${month}.${year}`;
}

/**
 * Обрезает текст до указанной длины, добавляя многоточие
 */
function truncate(text: string | null | undefined, maxLength: number): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}…`;
}

/**
 * Получает инициалы из названия чата
 */
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return parts[0]?.slice(0, 2).toUpperCase() ?? '?';
}

/**
 * Карточка группового чата в списке чатов
 *
 * @param chat - Объект чата для отображения
 * @param onClick - Callback при клике на карточку
 * @returns Карточка чата
 */
export function ChatCard({ chat, onClick }: ChatCardProps): React.JSX.Element {
  const {
    chatId,
    name,
    lastMessagePreview,
    lastMessageAt,
    participantCount,
    unreadCount,
  } = chat;

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onClick();
      }
    },
    [onClick],
  );

  const displayTime = lastMessageAt ? formatRelativeTime(new Date(lastMessageAt)) : '';
  const displayPreview = truncate(lastMessagePreview, 60);
  const displayInitials = getInitials(name);

  return (
    <div
      role="link"
      tabIndex={0}
      aria-label={`Чат ${name}. ${unreadCount > 0 ? `${unreadCount} непрочитанных` : 'Нет непрочитанных'}${lastMessageAt ? `. Последнее сообщение: ${displayTime}` : ''}. Участников: ${participantCount}`}
      className={cn(
        'flex items-center gap-3 p-4 rounded-lg cursor-pointer transition-colors',
        'hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500',
      )}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      data-chat-id={chatId}
    >
      {/* Аватар чата (заглушка с инициалами) */}
      <div className="flex-shrink-0">
        <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-semibold text-sm">
          {displayInitials}
        </div>
      </div>

      {/* Информация о чате */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-gray-900 truncate">
            {name}
          </p>
          <div className="flex items-center gap-2">
            {lastMessageAt && (
              <time className="text-xs text-gray-500 whitespace-nowrap">
                {displayTime}
              </time>
            )}
            {unreadCount > 0 && (
              <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-white bg-indigo-600 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 mt-0.5">
          {/* Количество участников */}
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <span>{participantCount}</span>
          </div>

          {/* Превью последнего сообщения */}
          <p className="text-sm text-gray-500 truncate flex-1">
            {displayPreview || <span className="text-gray-400 italic">Нет сообщений</span>}
          </p>
        </div>
      </div>
    </div>
  );
}
