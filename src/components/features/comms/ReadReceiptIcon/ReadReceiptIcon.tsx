'use client';

import React from 'react';
import type { ConversationType } from '@/domains/comms/comms.types';
import { cn } from '@/shared/utils/cn';

/**
 * @component ReadReceiptIcon
 * @category features/comms
 * @description Индикатор статуса прочтения под отправленными сообщениями
 *
 * Состояния:
 *   - S-1: Одна серая галочка (доставлено) — DIRECT, !isRead
 *   - S-2: Две акцентные галочки (прочитано) — DIRECT, isRead
 *   - S-3: Текст "Прочитано: N из M" — GROUP
 *
 * @prop isRead — прочитано ли сообщение (для DIRECT)
 * @prop readByCount — количество прочитавших (для GROUP)
 * @prop totalParticipants — всего получателей кроме автора (для GROUP)
 * @prop conversationType — тип беседы
 * @prop className — дополнительные CSS-классы
 *
 * @spec
 * - inline SVG (без lucide), w-3 h-3
 * - aria-label для скринридеров (AC-7)
 * - role="img" на контейнере, aria-hidden на SVG
 * - Цвета через CSS-переменные var(--theme-*)
 * - Отображается только под сообщениями текущего пользователя
 *
 * @traces US-39-02 AC-1, AC-2, AC-3, AC-6, AC-7
 * @task B-026-T5-2
 *
 * @see docs/design/layouts/comms/read-receipts-layout.md
 * @see docs/user-stories/US-39-02-read-receipts.md
 */
export interface ReadReceiptIconProps {
  /** Прочитано ли сообщение (для DIRECT) */
  isRead?: boolean;
  /** Количество прочитавших (для GROUP) */
  readByCount?: number;
  /** Всего получателей кроме автора (для GROUP) */
  totalParticipants?: number;
  /** Тип беседы @default 'DIRECT' */
  conversationType?: ConversationType;
  /** Дополнительные CSS-классы */
  className?: string;
}

/**
 * Одиночная галочка (check) — inline SVG, aria-hidden.
 */
const SingleCheck = ({ className }: { className?: string }): React.ReactElement => (
  <svg
    className={cn('w-3 h-3', className)}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2.5}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M5 13l4 4L19 7" />
  </svg>
);

/**
 * Индикатор статуса прочтения сообщения.
 *
 * @param props - Пропсы компонента
 * @returns Индикатор read receipt
 */
export function ReadReceiptIcon({
  isRead = false,
  readByCount = 0,
  totalParticipants = 0,
  conversationType = 'DIRECT',
  className,
}: ReadReceiptIconProps): React.ReactElement | null {
  // GROUP: счётчик "Прочитано: N из M" (включая "0 из M" — AC-6)
  if (conversationType === 'GROUP') {
    const label = `Прочитано: ${readByCount} из ${totalParticipants}`;
    return (
      <span
        role="img"
        aria-label={label}
        className={cn(
          'mt-1 self-end text-xs leading-tight text-[var(--theme-text-secondary)]',
          className,
        )}
      >
        {label}
      </span>
    );
  }

  // DIRECT: одна галочка (S-1, серая — доставлено) или две акцентные (S-2 — прочитано)
  // @covers AC-1 (US-39-02): одна галочка — доставлено
  // @covers AC-2 (US-39-02): две галочки — прочитано
  if (isRead) {
    return (
      <span
        role="img"
        aria-label="Прочитано"
        className={cn('mt-1 flex items-end justify-end gap-0.5 self-end', className)}
      >
        <SingleCheck className="text-[var(--theme-accent)]" />
        <SingleCheck className="-ml-1 text-[var(--theme-accent)]" />
      </span>
    );
  }

  return (
    <span
      role="img"
      aria-label="Доставлено"
      className={cn('mt-1 flex items-end justify-end self-end', className)}
    >
      <SingleCheck className="text-[var(--theme-text-secondary)]" />
    </span>
  );
}

export default ReadReceiptIcon;
