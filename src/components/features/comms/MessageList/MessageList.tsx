/**
 * @file MessageList.tsx
 * @description Компонент списка сообщений в диалоге
 */
'use client';

import { useRef, useEffect } from 'react';
import { MessageItem } from '@/components/features/comms/MessageItem';
import { EmptyState } from '@/components/ui/EmptyState';
import type { MessageWithSender } from '@/domains/comms/message.types';

/**
 * Props компонента MessageList
 */
export interface MessageListProps {
  /** Массив сообщений */
  messages: MessageWithSender[];
  /** ID текущего пользователя */
  currentUserId: string;
  /** Имя собеседника */
  participantName: string;
  /** Callback для удаления сообщения */
  onDelete?: (messageId: string) => void;
}

/**
 * @component MessageList
 * @category features/comms
 * @description Отображение списка сообщений в хронологическом порядке
 *
 * @prop messages - Массив сообщений
 * @prop currentUserId - ID текущего пользователя
 * @prop participantName - Имя собеседника
 * @prop onDelete - Callback для удаления сообщения
 *
 * @spec
 * - Сообщения отсортированы по createdAt (ASC)
 * - При пустом списке показывается EmptyState
 * - Автопрокрутка к последнему сообщению при загрузке
 */
export function MessageList({
  messages,
  currentUserId,
  participantName,
  onDelete,
}: MessageListProps): React.JSX.Element {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (messages.length === 0) {
    return (
      <EmptyState
        icon={
          <svg
            className="w-12 h-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        }
        title="Нет сообщений"
        description="Начните общение, отправив первое сообщение"
      />
    );
  }

  return (
    <div className="flex flex-col">
      {messages.map((message) => (
        <MessageItem
          key={message.id}
          message={message}
          currentUserId={currentUserId}
        />
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
}
