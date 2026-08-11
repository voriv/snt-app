'use client';

import React from 'react';
import { ChatHeader } from '@/components/features/comms/ChatHeader';

/**
 * @component ChatLayout
 * @category features/comms
 * @description Единая обёртка для страниц чатов: фиксированный заголовок + скроллируемая зона + input
 *
 * @prop title - Название чата/диалога
 * @prop description - Описание (опционально — для групповых чатов)
 * @prop onBack - Callback возврата назад
 * @prop headerActions - Слот для действий в заголовке
 * @prop children - Зона сообщений + опционально error bar + input
 *
 * @spec B-024
 */
export interface ChatLayoutProps {
  /** Название чата/диалога */
  title: string;
  /** Описание (опционально — для групповых чатов) */
  description?: string;
  /** Callback возврата назад */
  onBack: () => void;
  /** Слот для действий в заголовке */
  headerActions?: React.ReactNode;
  /** Зона сообщений + опционально error bar + input */
  children: React.ReactNode;
}

export const ChatLayout: React.FC<ChatLayoutProps> = ({
  title,
  description,
  onBack,
  headerActions,
  children,
}) => {
  return (
    <div className="flex flex-col h-full w-full">
      {/* Заголовок — растягивается на всю ширину страницы (FR-10) */}
      <ChatHeader
        title={title}
        description={description}
        onBack={onBack}
        actions={headerActions}
      />

      {/* Зона сообщений + ErrorBar + Input.
          На широких экранах (≥lg/1024px) ограничена по ширине и центрирована.
          По бокам виден фон страницы --theme-bg-primary (FR-11).
          На мобильных (<1024px) — без ограничения, на всю ширину (FR-12). */}
      <div className="flex-1 min-h-0 w-full flex justify-center">
        <div className="w-full lg:max-w-4xl mx-auto flex flex-col h-full">
          {children}
        </div>
      </div>
    </div>
  );
};
