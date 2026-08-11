/**
 * @component SidebarItem
 * @description Пункт бокового меню (и drawer). Рендерит Link с иконкой Lucide,
 * активным состоянием и поддержкой onClick для закрытия drawer.
 *
 * @spec docs/specs/nav/component-spec.md → 3.3.1
 * @task NAV-05-T1
 *
 * @covers AC-NAV-05-3 — Активное состояние пункта sidebar
 * @covers AC-NAV-05-4 — Иконки у пунктов sidebar
 */

'use client';

import Link from 'next/link';
import { cn } from '@/shared/utils';
import type { NavItem } from '@/components/features/navigation/nav-items.config';

export interface SidebarItemProps {
  /** Данные пункта меню */
  item: NavItem;
  /** Активное состояние пункта */
  isActive: boolean;
  /** Callback при клике (для drawer — закрытие) */
  onClick?: () => void;
  /** Бейдж (например, счётчик непрочитанных) */
  badge?: number;
}

/**
 * Пункт sidebar с иконкой, активным состоянием и обрезкой текста.
 *
 * @example
 * ```tsx
 * <SidebarItem item={item} isActive={isActive} onClick={() => setDrawerOpen(false)} />
 * ```
 */
export function SidebarItem({ item, isActive, onClick, badge }: SidebarItemProps) {
  const Icon = item.icon;

  return (
    <Link
      href={item.path}
      onClick={onClick}
      title={item.title}
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium',
        'truncate overflow-hidden text-ellipsis whitespace-nowrap',
        'focus:outline-none focus:ring-2 focus:ring-blue-500',
        isActive
          ? 'bg-gray-100 text-blue-600'
          : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50',
      )}
    >
      <Icon
        className={cn(
          'flex-shrink-0 w-5 h-5',
          isActive ? 'text-blue-600' : 'text-gray-400',
        )}
        aria-hidden="true"
      />
      <span className="truncate">{item.title}</span>
      {badge !== undefined && badge > 0 && (
        <span
          className="ml-auto inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-white bg-red-500 rounded-full"
          aria-label={`${badge} непрочитанных сообщений`}
        >
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </Link>
  );
}

export default SidebarItem;
