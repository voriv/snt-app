import React, { useState } from 'react';
import { MessageWithSender } from '@/domains/comms/message.types';
import type { ConversationType, MessageWithReadStatus } from '@/domains/comms/comms.types';
import { ReadReceiptIcon } from '@/components/features/comms/ReadReceiptIcon';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { cn } from '@/shared/utils/cn';

/**
 * @component MessageItem
 * @category features/comms
 * @description Компонент для отображения отдельного сообщения в диалоге
 *
 * @prop message - Объект сообщения с данными отправителя для отображения
 * @prop currentUserId - ID текущего пользователя для определения, является ли сообщение его
 * @prop isLastMessage - Флаг, является ли сообщение последним (для автопрокрутки)
 * @prop readStatus - Статус прочтения сообщения (read receipts)
 * @prop conversationType - Тип беседы (DIRECT | GROUP)
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
 * - Read receipts (ReadReceiptIcon) отображаются только для сообщений текущего пользователя
 *
 * @traces US-39-02 AC-1, AC-2, AC-3, AC-5, AC-6
 * @task B-026-T5-3
 *
 * @see docs/user-stories/US-21-03-отправка-личных-сообщений.md — FR-REQ-COMMS-001-04
 * @see docs/user-stories/US-39-02-read-receipts.md
 */
export interface ReadStatus {
  isReadByRecipient: boolean;
  readByCount?: number;
  totalParticipants?: number;
}

export interface MessageItemProps {
  /**
   * Данные сообщения. Тип `MessageWithReadStatus` расширяет `MessageWithSender`
   * и содержит read receipts статус (US-39-02).
   */
  message: MessageWithSender | MessageWithReadStatus;
  currentUserId: string;
  isLastMessage?: boolean;
  /**
   * Callback удаления сообщения.
   * @covers AC-7 (B-024-T10-1) — прокидывается из ConversationMessagesList.
   */
  onDelete?: (messageId: string) => void;
  /**
   * Статус прочтения сообщения (для read receipts).
   * @covers US-39-02 AC-1, AC-2, AC-3, AC-5, AC-6
   */
  readStatus?: ReadStatus;
  /** Тип беседы для определения визуала ReadReceiptIcon */
  conversationType?: ConversationType;
}

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  currentUserId,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- сохраняется как scroll-якорь (AC-R24-3, AC-NEG-01)
  isLastMessage = false,
  onDelete,
  readStatus,
  conversationType = 'DIRECT'
}) => {
  const isCurrentUser = message.senderId === currentUserId;

  // R-19 (B-020-T6, P-01b): состояние подтверждения удаления — открытие/закрытие ConfirmDialog
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Вычисление displayLabel согласно бизнес-правилам (BR-39)
  // AC-1.9: Для текущего пользователя всегда "ВЫ"
  // AC-1.10: Для собеседника — имя/фамилия (senderName из репозитория)
  // AC-1.11: Fallback на User.name при отсутствии профиля (репозиторий)
  // AC-1.12: Fallback на email при отсутствии имени
  // AC-1.13: "Удалённый пользователь" если отправитель удалён (sender=null)
  const displayLabel = isCurrentUser
    ? 'ВЫ'
    : message.senderName
    ? message.senderName
    : message.senderEmail
    ? message.senderEmail
    : 'Удалённый пользователь';

  const formatTime = (date: Date | string): string => {
    return new Date(date).toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <>
    <div
      className={cn(
        'flex gap-3 mb-4 animate-fade-in',
        isCurrentUser ? 'flex-row-reverse' : 'flex-row',
      )}
      role="article"
      aria-label={`Сообщение от ${displayLabel}, отправлено ${formatTime(message.createdAt)}`}
    >
      {/* Аватар пользователя */}
      <div className={cn(
        'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center',
        isCurrentUser
          ? 'bg-[var(--chat-bubble-own-bg)] text-[var(--chat-bubble-own-color)] ml-3'
          : 'bg-[var(--chat-bubble-other-bg)] text-[var(--chat-bubble-other-color)] mr-3'
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
          <span className="text-sm font-semibold text-[var(--theme-text-primary)]">
            {displayLabel}
          </span>
          <span className="text-xs text-[var(--theme-text-secondary)]">
            {formatTime(message.createdAt)}
          </span>
        </div>

        {/* Тело сообщения */}
        <div
          className={cn(
            'rounded-lg px-4 py-2 shadow-sm',
            isCurrentUser
              ? 'bg-[var(--chat-bubble-own-bg)] text-[var(--chat-bubble-own-color)] rounded-tr-none'
              : 'bg-[var(--chat-bubble-other-bg)] text-[var(--chat-bubble-other-color)] rounded-tl-none'
          )}
        >
          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
            {message.content}
          </p>

          {/* Кнопка удаления сообщения (B-024-T10-1 / @covers AC-7) */}
          {onDelete && isCurrentUser && (
            <Button
              variant="ghost"
              size="sm"
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              aria-label="Удалить сообщение"
            >
              Удалить
            </Button>
          )}
        </div>

        {/* Read receipts — индикатор статуса прочтения (B-026-T5-3)
            Отображается ТОЛЬКО для сообщений текущего пользователя (AC-5 US-39-02) */}
        {isCurrentUser && readStatus && (
          <ReadReceiptIcon
            isRead={readStatus.isReadByRecipient}
            readByCount={readStatus.readByCount}
            totalParticipants={readStatus.totalParticipants}
            conversationType={conversationType}
          />
        )}
      </div>
    </div>

    {/* ConfirmDialog — всегда в JSX (isOpen контролирует видимость) (R-19 P-01b) */}
    <ConfirmDialog
      isOpen={showDeleteConfirm}
      onClose={() => setShowDeleteConfirm(false)}
      title="Удаление сообщения"
      message="Вы действительно хотите удалить это сообщение? Это действие нельзя отменить."
      confirmLabel="Удалить"
      cancelLabel="Отмена"
      variant="danger"
      onConfirm={() => {
        onDelete!(message.id);
        setShowDeleteConfirm(false);
      }}
    />
    </>
  );
};
