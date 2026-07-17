/**
 * @component ConversationCard
 * @category features/comms
 * @description Карточка диалога в списке личных сообщений
 *
 * @example
 * ```tsx
 * <ConversationCard
 *   conversation={item}
 *   onClick={() => router.push(`/dashboard/messages/${item.conversationId}`)}
 * />
 * ```
 *
 * @spec
 * - Отображает аватар собеседника или заглушку с инициалами
 * - Отображает имя собеседника
 * - Отображает превью последнего сообщения (обрезка до 60 символов)
 * - Отображает время последнего сообщения в относительном формате
 * - Отображает счётчик непрочитанных (бейдж, если > 0)
 * - Кликабельная карточка с обработчиком onClick
 * - Доступность: role="link", tabIndex, aria-label
 */
'use client';

import { useCallback } from 'react';
import { cn } from '@/shared/utils';
import type { ConversationListItem } from '@/domains/comms/comms.types';

export interface ConversationCardProps {
  /** Объект диалога для отображения */
  conversation: ConversationListItem;
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
 * Получает инициалы из имени
 */
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return parts[0]?.slice(0, 2).toUpperCase() ?? '?';
}

/**
 * Карточка диалога в списке личных сообщений
 *
 * @param conversation - Объект диалога для отображения
 * @param onClick - Callback при клике на карточку
 * @returns Карточка диалога
 */
export function ConversationCard({ conversation, onClick }: ConversationCardProps): React.JSX.Element {
  const {
    conversationId,
    participantName,
    participantAvatar,
    lastMessagePreview,
    lastMessageAt,
    unreadCount,
  } = conversation;

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onClick();
      }
    },
    [onClick],
  );

  const displayTime = formatRelativeTime(new Date(lastMessageAt));
  const displayPreview = truncate(lastMessagePreview, 60);
  const displayInitials = getInitials(participantName);

  return (
    <div
      role="link"
      tabIndex={0}
      aria-label={`Диалог с ${participantName}. ${unreadCount > 0 ? `${unreadCount} непрочитанных` : 'Нет непрочитанных'}. Последнее сообщение: ${displayTime}`}
      className={cn(
        'flex items-center gap-3 p-4 rounded-lg cursor-pointer transition-colors',
        'hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500',
      )}
      onClick={onClick}
      onKeyDown={handleKeyDown}
    >
      {/* Аватар собеседника */}
      <div className="flex-shrink-0">
        {participantAvatar ? (
          <img
            src={participantAvatar}
            alt={`Аватар ${participantName}`}
            className="h-12 w-12 rounded-full object-cover"
          />
        ) : (
          <div className="h-12 w-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-semibold text-sm">
            {displayInitials}
          </div>
        )}
      </div>

      {/* Информация о диалоге */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-gray-900 truncate">
            {participantName}
          </p>
          <div className="flex items-center gap-2">
            <time className="text-xs text-gray-500 whitespace-nowrap">
              {displayTime}
            </time>
            {unreadCount > 0 && (
              <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-white bg-indigo-600 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
        </div>

        {/* Превью последнего сообщения */}
        <p className="text-sm text-gray-500 truncate mt-0.5">
          {displayPreview || <span className="text-gray-400 italic">Нет сообщений</span>}
        </p>
      </div>
    </div>
  );
}
