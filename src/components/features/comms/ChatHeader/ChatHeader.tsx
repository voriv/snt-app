'use client';

import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/shared/utils/cn';

/**
 * @component ChatHeader
 * @category features/comms
 * @description Единый компонент заголовка чата с кнопкой «Назад», названием, описанием и действиями
 *
 * @prop title - Название чата/диалога
 * @prop description - Дополнительное описание (опционально — для групповых чатов)
 * @prop onBack - Callback возврата назад
 * @prop actions - Слот для кнопок действий справа
 * @prop avatar - Аватар/иконка чата (опционально)
 *
 * @spec B-024
 * @todo Реализовать структуру заголовка: назад + аватар + info + действия
 */
export interface ChatHeaderProps {
  /** Название чата/диалога */
  title: string;
  /** Дополнительное описание (опционально — для групповых чатов) */
  description?: string;
  /** Callback возврата назад */
  onBack: () => void;
  /** Слот для кнопок действий справа */
  actions?: React.ReactNode;
  /** Аватар/иконка чата (опционально) */
  avatar?: React.ReactNode;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  title,
  description,
  onBack,
  actions,
  avatar,
}) => {
  return (
    <div
      className={cn(
        'flex-shrink-0',
        'px-4 py-3',
        'border-b border-[var(--theme-border-color)]',
        'bg-[var(--theme-bg-primary)]'
      )}
      role="banner"
    >
      <div className="flex items-center gap-3">
        {/* Кнопка "Назад" */}
        <button
          onClick={onBack}
          className="p-2 rounded-lg hover:bg-[var(--theme-bg-secondary)] transition-colors"
          aria-label="Вернуться к списку"
        >
          <ArrowLeft className="w-5 h-5 text-[var(--theme-text-secondary)]" />
        </button>

        {/* Аватар (опционально) */}
        {avatar}

        {/* Информация о чате */}
        <div className="flex-1 min-w-0">
          <h2 className="font-medium text-[var(--theme-text-primary)] truncate">
            {title}
          </h2>
          {description && (
            <p className="text-sm text-[var(--theme-text-secondary)] truncate">
              {description}
            </p>
          )}
        </div>

        {/* Действия */}
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
};
