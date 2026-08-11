/**
 * @file src/app/not-found.tsx
 * @component NotFoundPage
 * @category pages
 * @description Кастомная 404-страница с контекстными ссылками в зависимости
 * от статуса авторизации пользователя.
 *
 * @spec
 * - Client Component ('use client')
 * - Состояния:
 *   - loading:        сессия загружается → skeleton кнопки
 *   - authenticated:  ссылка «Вернуться на дашборд» → /dashboard
 *   - unauthenticated: ссылка «На главную» → /
 * - A11y: role="alert", aria-label="Страница не найдена"
 * - Tailwind: центрирование на весь экран
 * - Иконка: lucide-react SearchX
 *
 * @covers AC-NAV-03-1
 * @covers AC-NAV-03-2
 * @covers AC-NAV-03-3
 * @see docs/specs/nav/component-spec.md — §3.5.3 NotFoundPage
 * @see docs/user-stories/US-NAV-03-страница-404-и-обработка-несуществующих-маршрутов.md
 */
'use client';

import Link from 'next/link';
import { SearchX } from 'lucide-react';
import { useSession } from '@/hooks/useSession';
import { Button } from '@/components/ui/Button';

/**
 * NotFoundPage — контекстная 404-страница.
 *
 * @spec
 * - Использует useSession() для выбора целевой ссылки навигации
 * - При loading — skeleton-плейсхолдер кнопки
 * - При authenticated — «Вернуться на дашборд» → /dashboard
 * - При unauthenticated/error — «На главную» → /
 *
 * @covers AC-NAV-03-1
 * @covers AC-NAV-03-2
 * @covers AC-NAV-03-3
 */
export default function NotFound() {
  const { data: session, loading } = useSession();

  const isAuthenticated = Boolean(session);

  return (
    <div
      role="alert"
      aria-label="Страница не найдена"
      className="flex flex-col items-center justify-center min-h-screen bg-[var(--theme-bg-primary)] text-center p-8"
    >
      <SearchX
        className="text-6xl text-[var(--theme-text-secondary)] mb-6"
        aria-hidden="true"
      />
      <h1 className="text-3xl font-bold text-[var(--theme-text-primary)] mb-2">
        404 — Страница не найдена
      </h1>
      <p className="text-[var(--theme-text-secondary)] mb-8 max-w-md">
        Извините, запрошенная страница не существует или была перемещена.
      </p>

      {loading ? (
        // Skeleton-плейсхолдер кнопки при загрузке сессии
        <div
          className="w-48 h-10 bg-[var(--theme-bg-secondary)] animate-pulse rounded-md"
          aria-hidden="true"
        />
      ) : isAuthenticated ? (
        <Link
          href="/dashboard"
          aria-label="Вернуться на дашборд"
        >
          <Button variant="primary" aria-label="Вернуться на дашборд">
            Вернуться на дашборд
          </Button>
        </Link>
      ) : (
        <Link href="/" aria-label="На главную">
          <Button variant="primary" aria-label="На главную">
            На главную
          </Button>
        </Link>
      )}
    </div>
  );
}
