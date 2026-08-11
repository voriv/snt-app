/**
 * @component CommsTab
 * @category comms
 * @description Отдельная вкладка панели "Общение" с Link, иконкой и опциональным бейджем
 *
 * @example
 * ```tsx
 * <CommsTab
 *   href="/dashboard/comms/messages"
 *   label="Личные сообщения"
 *   icon={<MessageSquare />}
 *   active={true}
 *   badgeCount={3}
 * />
 * ```
 *
 * @covers AC-3 (US-21-36): Панель вкладок с 3-4 табами
 * @covers AC-4 (US-21-36): Переключение вкладок с URL синхронизацией
 * @see component-spec.md → 3.3.1
 *
 * @spec
 * - Использует Link для навигации
 * - Подчёркивание при active=true (color.accent.default)
 * - Бейдж скрыт при badgeCount === 0
 * - Бейдж показывает "99+" при badgeCount > 99
 * - ARIA: role="tab", aria-selected
 */
'use client';

import React from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/shared/utils';
import type { ReactNode } from 'react';

interface CommsTabProps {
  /** Маршрут вкладки */
  href: string;
  /** Текст вкладки */
  label: string;
  /** Иконка вкладки */
  icon: ReactNode;
  /** Активна ли вкладка */
  active: boolean;
  /** Количество непрочитанных (опционально) */
  badgeCount?: number;
}

/**
 * Отрисовать вкладку
 *
 * @param props - Пропсы вкладки
 * @returns Элемент вкладки
 */
export function CommsTab({ href, label, icon, active, badgeCount }: CommsTabProps) {
  // Бейдж отображается только при заданном badgeCount > 0
  const showBadge = typeof badgeCount === 'number' && badgeCount > 0;
  // "99+" при превышении лимита
  const badgeLabel = (badgeCount ?? 0) > 99 ? '99+' : String(badgeCount);

  return (
    <Link
      href={href}
      role="tab"
      aria-selected={active}
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 transition-colors',
        active
          ? 'border-[var(--theme-accent)] text-[var(--theme-text-primary)]'
          : 'border-transparent text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:border-[var(--theme-border-color)]',
      )}
    >
      {icon}
      {label}
      {showBadge && <Badge variant="danger">{badgeLabel}</Badge>}
    </Link>
  );
}
