/**
 * @file src/app/dashboard/error.tsx
 * @component DashboardErrorBoundary
 * @category pages
 * @description Next.js Error Boundary для страниц дашборда. Перехватывает
 * рантайм-ошибки, возникшие в дочерних маршрутах `/dashboard/*`, и отображает
 * пользовательский интерфейс с кнопкой «Повторить».
 *
 * @spec
 * - Client Component ('use client') — обязательно для Next.js error boundary
 * - Props: { error: Error & { digest?: string }; reset: () => void }
 * - Кнопка «Повторить» вызывает `reset()` для повторной попытки рендера
 * - Логирование ошибки в dev-окружении через console.error
 * - A11y: role="alert" на контейнере
 * - Tailwind: центрирование, отступы
 *
 * @covers AC-NAV-01-7
 * @see docs/specs/nav/component-spec.md — §3.5.2 ErrorPage
 * @see docs/user-stories/US-NAV-01-защита-маршрутов-и-редиректы.md
 */
'use client';

import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface DashboardErrorProps {
  /** Объект ошибки, инициировавший boundary. */
  error: Error & { digest?: string };
  /** Callback Next.js для повторной попытки рендера сегмента. */
  reset: () => void;
}

/**
 * DashboardErrorBoundary — UI ошибки в дашборде.
 *
 * @spec
 * - Отображает иконку AlertTriangle, заголовок, описание и кнопку «Повторить»
 * - Логирует ошибку в dev-окружении
 * - При нажатии на кнопку вызывает `reset()`
 *
 * @covers AC-NAV-01-7
 */
export default function DashboardError({ error, reset }: DashboardErrorProps) {
  useEffect(() => {
    // Логирование ошибки в dev-окружении
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.error('[DashboardErrorBoundary]', error);
    }
  }, [error]);

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="flex flex-col items-center justify-center min-h-[50vh] text-center p-8"
    >
      <AlertTriangle
        className="text-4xl text-[var(--theme-danger)] mb-4"
        aria-hidden="true"
      />
      <h2 className="text-xl font-semibold text-[var(--theme-text-primary)] mb-2">
        Произошла ошибка при загрузке страницы
      </h2>
      <p className="text-[var(--theme-text-secondary)] mb-6 max-w-md">
        Не удалось загрузить содержимое страницы. Попробуйте повторить попытку.
        {error.digest ? (
          <span className="block mt-2 text-xs text-[var(--theme-text-secondary)]">
            Код ошибки: {error.digest}
          </span>
        ) : null}
      </p>
      <Button
        variant="primary"
        onClick={reset}
        aria-label="Повторить попытку загрузки"
      >
        Повторить
      </Button>
    </div>
  );
}
