/**
 * @hook useNavigation
 * @description Хук навигации: объединяет данные сессии (роли) и текущий pathname,
 * предоставляя отфильтрованные по ролям пункты меню и флаги admin/superAdmin.
 *
 * @spec docs/specs/nav/component-spec.md → 3.2.1
 * @task NAV-02-T2
 *
 * @covers AC-NAV-02-4 — Ролевые пункты меню
 * @covers AC-NAV-05-2 — Ролевые пункты в sidebar
 * @covers AC-NAV-07-7 — Ролевые пункты в drawer
 */

'use client';

import { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { useSession } from '@/hooks/useSession';
import { getMenuItems } from '@/lib/nav-utils';
import type { NavItem } from '@/components/features/navigation/nav-items.config';

/**
 * Возвращаемое значение хука useNavigation.
 */
export interface UseNavigationReturn {
  /** Пункты меню, отфильтрованные по ролям пользователя */
  menuItems: NavItem[];
  /** Текущий pathname */
  activePath: string;
  /** Роли пользователя из сессии */
  userRoles: string[];
  /** true, если пользователь ADMIN или SUPER_ADMIN */
  isAdmin: boolean;
  /** true, если пользователь SUPER_ADMIN */
  isSuperAdmin: boolean;
  /** Сессия загружается */
  loading: boolean;
}

/**
 * Хук навигации.
 *
 * - Использует `useSession()` для получения ролей пользователя
 * - Использует `usePathname()` для текущего пути
 * - Фильтрует пункты меню через `getMenuItems(userRoles)`
 * - `isAdmin` / `isSuperAdmin` — memoized
 *
 * @example
 * ```tsx
 * const { menuItems, activePath, isAdmin } = useNavigation();
 * ```
 */
export function useNavigation(): UseNavigationReturn {
  const pathname = usePathname();
  const { data: session, loading } = useSession();

  const userRoles = useMemo<string[]>(() => {
    return session?.user?.roles ?? [];
  }, [session?.user?.roles]);

  const menuItems = useMemo<NavItem[]>(() => {
    return getMenuItems(userRoles);
  }, [userRoles]);

  const isAdmin = useMemo<boolean>(() => {
    return userRoles.includes('ADMIN') || userRoles.includes('SUPER_ADMIN');
  }, [userRoles]);

  const isSuperAdmin = useMemo<boolean>(() => {
    return userRoles.includes('SUPER_ADMIN');
  }, [userRoles]);

  return {
    menuItems,
    activePath: pathname ?? '',
    userRoles,
    isAdmin,
    isSuperAdmin,
    loading,
  };
}

export default useNavigation;
