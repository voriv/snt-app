/**
 * @component Breadcrumbs
 * @description Хлебные крошки с авто-генерацией из pathname. Кликабельные уровни
 * (кроме последнего), разделитель `›`, семантика nav + ol + li, aria-current.
 *
 * @spec docs/specs/nav/component-spec.md → 3.3.3
 * @task NAV-06-T2
 *
 * @covers AC-NAV-06-1 — Breadcrumbs на страницах
 * @covers AC-NAV-06-2 — Авто-генерация по пути
 * @covers AC-NAV-06-3 — Кликабельные ссылки
 * @covers AC-NAV-06-4 — Последний уровень не кликабелен
 * @covers AC-NAV-06-5 — Разделитель между уровнями
 * @covers AC-NAV-06-6 — Максимальная глубина
 */

'use client';

import { type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/shared/utils';
import { generateBreadcrumbs } from '@/lib/nav-utils';

export interface BreadcrumbsProps {
  /** Альтернативный pathname (если не использовать usePathname()) */
  pathname?: string;
  /** Максимальная глубина (4 по умолчанию) */
  maxDepth?: number;
  /** Разделитель (`›` по умолчанию) */
  separator?: ReactNode;
  /** Доп. классы */
  className?: string;
}

/**
 * Хлебные крошки с авто-генерацией.
 *
 * @example
 * ```tsx
 * <Breadcrumbs />
 * <Breadcrumbs pathname="/dashboard/plots/123/edit" maxDepth={4} />
 * ```
 */
export function Breadcrumbs({
  pathname,
  maxDepth = 4,
  separator = '›',
  className,
}: BreadcrumbsProps) {
  const currentPathname = usePathname();
  const resolvedPath = pathname ?? currentPathname ?? '';
  const items = generateBreadcrumbs(resolvedPath, maxDepth);

  if (items.length === 0) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      role="navigation"
      className={cn('hidden md:flex items-center gap-1 text-xs text-[var(--theme-text-secondary)] px-4 py-2', className)}
    >
      <ol className="flex items-center gap-1 flex-wrap">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.href}-${index}`} className="flex items-center gap-1">
              {isLast ? (
                <span
                  aria-current="page"
                  className="text-[var(--theme-text-primary)] font-medium truncate max-w-[40ch]"
                  title={item.label}
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="hover:text-[var(--theme-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent)] rounded truncate max-w-[30ch]"
                  title={item.label}
                >
                  {item.label}
                </Link>
              )}
              {!isLast && (
                <span className="text-[var(--theme-text-secondary)] select-none" aria-hidden="true">
                  {separator}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export default Breadcrumbs;
