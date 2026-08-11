/**
 * @module nav-utils
 * @description Утилиты навигации: фильтрация пунктов по ролям, определение активного пути,
 * генерация breadcrumbs и получение иконки по пути.
 *
 * @spec docs/specs/nav/component-spec.md → 3.1.2
 * @task NAV-02-T1, NAV-06-T1
 *
 * @covers AC-NAV-02-6 — Активное состояние пункта меню
 * @covers AC-NAV-05-3 — Активное состояние пункта sidebar
 * @covers AC-NAV-06-2 — Авто-генерация breadcrumbs по пути
 * @covers AC-NAV-06-6 — Максимальная глубина breadcrumbs
 */

import type { LucideIcon } from 'lucide-react';
import { navItems, breadcrumbMap, type NavItem } from '@/components/features/navigation/nav-items.config';

/**
 * Элемент хлебных крошек.
 */
export interface BreadcrumbItem {
  /** Отображаемая подпись (с эмодзи) */
  label: string;
  /** Кумулятивный href до этого сегмента */
  href: string;
  /** Является ли текущим (последний элемент) */
  isCurrent: boolean;
}

/**
 * Фильтрует пункты навигации по ролям пользователя.
 *
 * Пункт без `roles` доступен всем. Пункт с `roles` доступен, если пересечение
 * ролей пользователя и разрешённых ролей непустое.
 *
 * @param roles - Роли пользователя (из сессии)
 * @returns Отфильтрованный список NavItem
 *
 * @covers AC-NAV-02-4, AC-NAV-05-2, AC-NAV-07-7
 */
export function getMenuItems(roles: string[]): NavItem[] {
  if (!roles || roles.length === 0) {
    return navItems.filter((item) => !item.roles);
  }
  return navItems.filter((item) => {
    if (!item.roles) return true;
    return item.roles.some((role) => roles.includes(role));
  });
}

/**
 * Алиас для совместимости с заданием (filterNavItemsByRole).
 */
export const filterNavItemsByRole = getMenuItems;

/**
 * Возвращает иконку Lucide по пути пункта навигации.
 *
 * @param path - Маршрут (например `/dashboard/plots`)
 * @returns LucideIcon или undefined, если пункт не найден
 *
 * @covers AC-NAV-05-4
 */
export function getIconByPath(path: string): LucideIcon | undefined {
  return navItems.find((item) => item.path === path)?.icon;
}

/**
 * Возвращает иконку для произвольного пункта (обёртка над item.icon).
 *
 * @param item - NavItem
 * @returns LucideIcon
 */
export function getNavIcon(item: NavItem): LucideIcon {
  return item.icon;
}

/**
 * Определяет, активен ли пункт навигации для текущего пути.
 *
 * Правила:
 * - `/dashboard` — точное совпадение (не подсвечивается на вложенных страницах)
 * - остальные пути — префиксное совпадение (`currentPath.startsWith(itemPath)`)
 *
 * @param itemPath   - Маршрут пункта меню
 * @param currentPath - Текущий pathname
 *
 * @covers AC-NAV-02-6, AC-NAV-05-3
 */
export function isActivePath(itemPath: string, currentPath: string | null | undefined): boolean {
  if (!currentPath) return false;
  // Отсекаем query-параметры
  const path = currentPath.split('?')[0];

  if (itemPath === '/dashboard') {
    return path === '/dashboard';
  }
  // Префиксное совпадение: `/dashboard/plots` активен и на `/dashboard/plots/123`
  return path === itemPath || path.startsWith(`${itemPath}/`);
}

/**
 * Генерирует хлебные крошки из pathname.
 *
 * @param pathname - Текущий pathname (с или без query)
 * @param maxDepth - Максимальная глубина (по умолчанию 4). Если глубже —
 *                   показываются первые 3 + последний.
 * @returns Массив BreadcrumbItem
 *
 * @spec
 * - Разбивает pathname на сегменты
 * - Для каждого сегмента ищет label в breadcrumbMap (fallback — сам сегмент)
 * - Строит cumulative href: `/dashboard` → `/dashboard/plots` → …
 * - Численные сегменты (regex `^\d+$`): добавляет как `#N` к предыдущему label
 * - Игнорирует query-параметры
 * - Последний элемент: `isCurrent: true`
 * - Первый элемент (root): `href: '/dashboard'`, `label: '🏠 Дашборд'`
 *
 * @covers AC-NAV-06-2, AC-NAV-06-6
 */
export function generateBreadcrumbs(pathname: string | null | undefined, maxDepth = 4): BreadcrumbItem[] {
  if (!pathname) return [];

  // Убираем query-параметры
  const cleanPath = pathname.split('?')[0];
  const segments = cleanPath.split('/').filter(Boolean);

  if (segments.length === 0) {
    return [{ label: '🏠 Дашборд', href: '/dashboard', isCurrent: true }];
  }

  const items: BreadcrumbItem[] = [];
  let cumulativeHref = '';

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    cumulativeHref += `/${segment}`;

    // Сначала пробуем составной ключ (текущий + следующий сегмент)
    let label: string;
    const nextSegment = segments[i + 1];
    const compoundKey = nextSegment ? `${segment}/${nextSegment}` : segment;

    if (breadcrumbMap[compoundKey]) {
      label = breadcrumbMap[compoundKey];
    } else if (breadcrumbMap[segment]) {
      label = breadcrumbMap[segment];
    } else if (/^\d+$/.test(segment)) {
      // Числовой ID — «Участок #N» (используем предыдущий label)
      const prevLabel = items.length > 0 ? items[items.length - 1].label : '';
      label = `${prevLabel} #${segment}`.trim();
    } else {
      // Fallback — сам сегмент с заглавной буквы
      label = segment.charAt(0).toUpperCase() + segment.slice(1);
    }

    items.push({
      label,
      href: cumulativeHref,
      isCurrent: i === segments.length - 1,
    });
  }

  // Ограничение глубины: первые (maxDepth - 1) + последний
  if (items.length > maxDepth) {
    const head = items.slice(0, maxDepth - 1);
    const tail = items[items.length - 1];
    return [...head, tail];
  }

  return items;
}
