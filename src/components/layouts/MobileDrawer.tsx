/**
 * @component MobileDrawer
 * @description Выезжающее слева мобильное меню с overlay, закрытием по Escape/overlay/пункту,
 * focus trap и возвратом фокуса на trigger. Содержит те же пункты, что и Sidebar
 * (через useNavigation), с группировкой по `group`.
 *
 * @spec docs/specs/nav/component-spec.md → 3.3.4
 * @task NAV-07-T1
 *
 * @covers AC-NAV-07-2 — Открытие drawer
 * @covers AC-NAV-07-3 — Закрытие по клику на пункт
 * @covers AC-NAV-07-4 — Закрытие по overlay
 * @covers AC-NAV-07-5 — Закрытие по Escape
 * @covers AC-NAV-07-6 — Плавная анимация (300ms transition)
 * @covers AC-NAV-07-7 — Ролевые пункты
 */

'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import { cn } from '@/shared/utils';
import { useNavigation } from '@/hooks/useNavigation';
import { isActivePath } from '@/lib/nav-utils';
import {
  navGroupOrder,
  navGroupLabels,
  type NavGroup,
  type NavItem,
} from '@/components/features/navigation/nav-items.config';
import { SidebarItem } from '@/components/layouts/SidebarItem';

export interface MobileDrawerProps {
  /** Открыт ли drawer */
  isOpen: boolean;
  /** Callback закрытия */
  onClose: () => void;
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
 * Мобильный drawer.
 *
 * @example
 * ```tsx
 * <MobileDrawer isOpen={isOpen} onClose={() => setIsOpen(false)} />
 * ```
 */
export function MobileDrawer({ isOpen, onClose }: MobileDrawerProps) {
  const router = useRouter();
  const { menuItems, activePath, loading } = useNavigation();
  const panelRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  // Сохраняем фокус на trigger при открытии, возвращаем при закрытии
  useEffect(() => {
    if (isOpen) {
      triggerRef.current = document.activeElement as HTMLElement | null;
      // Перенос фокуса в панель после отрисовки
      const id = window.setTimeout(() => {
        panelRef.current?.focus();
      }, 50);
      return () => window.clearTimeout(id);
    }
    return () => {
      // Возврат фокуса на trigger при закрытии
      triggerRef.current?.focus();
    };
  }, [isOpen]);

  // Закрытие по Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    // Блокируем прокрутку body при открытом drawer
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, onClose]);

  // Авто-закрытие при достижении desktop-ширины (≥768px)
  useEffect(() => {
    if (!isOpen) return;
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        onClose();
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isOpen, onClose]);

  const handleItemClick = (item: NavItem) => {
    router.push(item.path);
    onClose();
  };

  const grouped = loading ? null : groupItems(menuItems);

  return (
    <>
      {/* Overlay */}
      <div
        className={cn(
          'fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 md:hidden',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none',
        )}
        aria-hidden={!isOpen}
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div
        id="mobile-drawer"
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Мобильное меню навигации"
        tabIndex={-1}
        className={cn(
          'fixed inset-y-0 left-0 w-60 bg-white shadow-lg z-50 md:hidden',
          'transform transition-transform duration-300 ease-in-out',
          'overflow-y-auto p-4 focus:outline-none',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Кнопка закрытия */}
        <div className="flex justify-end mb-2">
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть меню"
            className="p-2 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {loading ? (
          <div className="space-y-2" aria-hidden="true">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-9 bg-gray-200 animate-pulse rounded-md" />
            ))}
            <span className="sr-only">Загрузка навигации…</span>
          </div>
        ) : menuItems.length === 0 ? (
          <p className="text-sm text-gray-400 italic">(нет доступных разделов)</p>
        ) : (
          <nav aria-label="Мобильная навигация" role="navigation">
            {navGroupOrder.map((group: NavGroup, groupIndex: number) => {
              const items = grouped?.[group] ?? [];
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
                          onClick={() => handleItemClick(item)}
                        />
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </nav>
        )}
      </div>
    </>
  );
}

export default MobileDrawer;
