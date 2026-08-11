/**
 * @component Sidebar
 * @description Боковое меню для desktop. Скрыто на мобильных (`hidden md:block`),
 * ролевая фильтрация через useNavigation, группировка по `group`,
 * активное состояние через isActivePath. Skeleton при загрузке сессии.
 *
 * @spec docs/specs/nav/component-spec.md → 3.3.2
 * @task NAV-05-T2
 *
 * @covers AC-NAV-05-1 — Sidebar на дашборде
 * @covers AC-NAV-05-2 — Ролевые пункты в sidebar
 * @covers AC-NAV-05-3 — Активное состояние пункта
 * @covers AC-NAV-05-4 — Иконки у пунктов
 * @covers AC-NAV-05-5 — Скрытие на мобильных
 */

'use client';

import { useNavigation } from '@/hooks/useNavigation';
import { isActivePath } from '@/lib/nav-utils';
import {
  navGroupOrder,
  navGroupLabels,
  type NavGroup,
  type NavItem,
} from '@/components/features/navigation/nav-items.config';
import { SidebarItem } from '@/components/layouts/SidebarItem';

export interface SidebarProps {
  /** Состояние коллапса (опционально, зарезервировано) */
  isCollapsed?: boolean;
  /** Переключение коллапса (опционально, зарезервировано) */
  onCollapseToggle?: () => void;
}

/**
 * Skeleton-блок при загрузке сессии — 6 пульсирующих строк.
 */
function SidebarSkeleton() {
  return (
    <nav aria-label="Sidebar" className="hidden md:block w-60 flex-shrink-0 border-r border-gray-200 bg-white overflow-y-auto p-4">
      <div className="space-y-2" aria-hidden="true">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-9 bg-gray-200 animate-pulse rounded-md"
          />
        ))}
      </div>
      <span className="sr-only">Загрузка навигации…</span>
    </nav>
  );
}

/**
 * Группирует пункты по полю `group` с сохранением порядка групп.
 */
function groupItems(items: NavItem[]): Record<NavGroup, NavItem[]> {
  const grouped: Record<NavGroup, NavItem[]> = {
    main: [],
    account: [],
    admin: [],
    finance: [],
  };
  for (const item of items) {
    grouped[item.group].push(item);
  }
  return grouped;
}

/**
 * Боковое меню с ролевой фильтрацией и группировкой.
 *
 * @example
 * ```tsx
 * <Sidebar />
 * ```
 */
export function Sidebar({ isCollapsed, onCollapseToggle }: SidebarProps) {
  // Параметры зарезервированы для будущего коллапса;suppress unused warnings
  void isCollapsed;
  void onCollapseToggle;

  const { menuItems, activePath, loading } = useNavigation();

  if (loading) {
    return <SidebarSkeleton />;
  }

  if (menuItems.length === 0) {
    return (
      <nav
        aria-label="Sidebar"
        className="hidden md:block w-60 flex-shrink-0 border-r border-gray-200 bg-white overflow-y-auto p-4"
      >
        <p className="text-sm text-gray-400 italic">(нет доступных разделов)</p>
      </nav>
    );
  }

  const grouped = groupItems(menuItems);

  return (
    <nav
      aria-label="Sidebar"
      role="navigation"
      className="hidden md:block w-60 flex-shrink-0 border-r border-gray-200 bg-white overflow-y-auto p-4"
    >
      {navGroupOrder.map((group: NavGroup, groupIndex: number) => {
        const items = grouped[group];
        if (items.length === 0) return null;
        return (
          <div key={group}>
            {groupIndex > 0 && (
              <div
                className="border-t border-gray-200 my-2"
                role="separator"
                aria-hidden="true"
              />
            )}
            <p
              className="px-3 pt-2 pb-1 text-xs font-semibold uppercase tracking-wide text-gray-400"
              aria-hidden="true"
            >
              {navGroupLabels[group]}
            </p>
            <ul className="space-y-1">
              {items.map((item) => (
                <li key={item.path}>
                  <SidebarItem
                    item={item}
                    isActive={isActivePath(item.path, activePath)}
                  />
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}

export default Sidebar;
