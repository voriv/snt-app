import React from 'react';
import { MessageWithSender } from '@/domains/comms/message.types';
import { cn } from '@/shared/utils/cn';

/**
 * @component MessageItem
 * @category features/comms
 * @description Компонент для отображения отдельного сообщения в диалоге
 *
 * @prop message - Объект сообщения с данными отправителя для отображения
 * @prop currentUserId - ID текущего пользователя для определения, является ли сообщение его
 * @prop isLastMessage - Флаг, является ли сообщение последним (для автопрокрутки)
 *
 * @spec
 * - Отображает сообщение в зависимости от того, отправлено ли оно текущим пользователем
 * - Сообщения текущего пользователя отображаются справа, других - слева
 * - Отображение отправителя:
 *   - Для текущего пользователя: "ВЫ"
 *   - Для собеседника с именем: "Имя Фамилия"
 *   - Для собеседника без имени: email
 *   - Для удалённого пользователя: "Удалённый пользователь"
 * - Показывается аватар, имя пользователя, время отправки и контент
 * - Сообщение с `isLastMessage=true` получает визуальный акцент
 *
 * @see docs/user-stories/US-21-03-отправка-личных-сообщений.md — FR-REQ-COMMS-001-04
 */
export interface MessageItemProps {
  message: MessageWithSender;
  currentUserId: string;
  isLastMessage?: boolean;
}

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  currentUserId,
  isLastMessage = false
}) => {
  const isCurrentUser = message.senderId === currentUserId;

  // Вычисление displayLabel согласно бизнес-правилам
  // AC-1.9: Для текущего пользователя всегда "ВЫ"
  // AC-1.10: Для собеседника — имя/фамилия
  // AC-1.11: Fallback на email при отсутствии имени
  // AC-1.12: "Удалённый пользователь" если отправитель удалён
  const displayLabel = isCurrentUser
    ? 'ВЫ'
    : message.senderName
    ? message.senderName
    : message.senderEmail
    ? message.senderEmail
    : 'Удалённый пользователь';

  const formatTime = (date: Date): string => {
    return new Date(date).toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div
      className={cn(
        'flex gap-3 mb-4 animate-fade-in',
        isCurrentUser ? 'flex-row-reverse' : 'flex-row',
        isLastMessage && 'bg-blue-50 dark:bg-blue-900/20 -mx-2 px-2 py-1 rounded-lg'
      )}
      role="article"
      aria-label={`Сообщение от ${displayLabel}, отправлено ${formatTime(message.createdAt)}`}
    >
      {/* Аватар пользователя */}
      <div className={cn(
        'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center',
        isCurrentUser
          ? 'bg-primary text-white ml-3'
          : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 mr-3'
      )}>
        {isCurrentUser ? (
          'ВЫ'
        ) : message.senderName ? (
          message.senderName.length > 2 ? (
            message.senderName.split(' ').map(name => name[0].toUpperCase()).join('')
          ) : (
            message.senderName.charAt(0).toUpperCase()
          )
        ) : message.senderEmail ? (
          message.senderEmail.charAt(0).toUpperCase()
        ) : 'U'}
      </div>

      {/* Контент сообщения */}
      <div className={cn(
        'flex flex-col max-w-[70%]',
        isCurrentUser ? 'items-end' : 'items-start'
      )}>
        {/* Имя отправителя и время */}
        <div className={cn(
          'flex items-center gap-2 mb-1',
          isCurrentUser ? 'flex-row-reverse' : 'flex-row'
        )}>
          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {displayLabel}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {formatTime(message.createdAt)}
          </span>
        </div>

        {/* Тело сообщения */}
        <div
          className={cn(
            'rounded-lg px-4 py-2 shadow-sm',
            isCurrentUser
              ? 'bg-primary text-white rounded-tr-none'
              : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-tl-none'
          )}
        >
          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
            {message.content}
          </p>
        </div>

        {/* Статус сообщения */}
        {isCurrentUser && message.status && (
          <div className="mt-1 flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
            {message.status === 'sent' && (
              <>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Отправлено</span>
              </>
            )}
            {message.status === 'delivered' && (
              <>
                <svg className="w-3 h-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-green-600 dark:text-green-400">Доставлено</span>
              </>
            )}
            {message.status === 'read' && (
              <>
                <svg className="w-3 h-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-blue-600 dark:text-blue-400">Прочитано</span>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
