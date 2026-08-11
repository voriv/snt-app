/**
 * @file src/app/dashboard/template.tsx
 * @component DashboardTemplate
 * @category pages
 * @description Next.js template — перерендеривается при каждой навигации между
 * страницами дашборда. Используется как контейнер для индикатора загрузки
 * страницы (ProgressBar).
 *
 * @spec
 * - Client Component ('use client')
 * - Next.js App Router: `template.tsx` создаётся заново при каждой навигации,
 *   что позволяет запускать анимацию progress-bar на каждой смене маршрута.
 * - Состояния:
 *   - idle:    progress-bar скрыт (opacity-0, width 0%)
 *   - loading: opacity-100, ширина анимируется 0% → 30% → 80%
 *   - complete: ширина 100%, затем opacity-0 через 300мс
 * - A11y: role="progressbar", aria-label="Загрузка страницы"
 * - Скрывается после завершения навигации (через setTimeout 300мс)
 *
 * @covers AC-NAV-01-6
 * @see docs/specs/nav/component-spec.md — §3.5.1 ProgressBar
 * @see docs/user-stories/US-NAV-01-защита-маршрутов-и-редиректы.md
 */
'use client';

import { useEffect, useState } from 'react';

/**
 * Тип стадии анимации progress-bar.
 */
type ProgressPhase = 'loading' | 'complete' | 'hidden';

interface DashboardTemplateProps {
  children: React.ReactNode;
}

/**
 * DashboardTemplate — обёртка дашборда с индикатором загрузки.
 *
 * @spec
 * - При mount (Next.js пересоздаёт template при каждой навигации) запускает
 *   CSS transition ширины progress-bar: 30% → 80% → 100%
 * - После 300мс от состояния complete — progress-bar скрывается
 *
 * @covers AC-NAV-01-6
 */
export default function DashboardTemplate({ children }: DashboardTemplateProps) {
  const [phase, setPhase] = useState<ProgressPhase>('loading');

  useEffect(() => {
    // Стадия loading: width анимируется до 80% (через CSS transition)
    const loadingTimer = window.setTimeout(() => {
      setPhase('complete');
    }, 200);

    // Стадия complete: width 100% → скрываем через 300мс
    const hideTimer = window.setTimeout(() => {
      setPhase('hidden');
    }, 500);

    return () => {
      window.clearTimeout(loadingTimer);
      window.clearTimeout(hideTimer);
    };
  }, []);

  const widthClass =
    phase === 'loading'
      ? 'w-1/3'
      : phase === 'complete'
        ? 'w-full'
        : 'w-0';

  const opacityClass = phase === 'hidden' ? 'opacity-0' : 'opacity-100';

  return (
    <>
      <div
        role="progressbar"
        aria-label="Загрузка страницы"
        aria-busy={phase !== 'hidden'}
        aria-valuetext={phase === 'complete' ? 'Завершено' : 'Загрузка'}
        className={`fixed top-0 left-0 z-50 h-1 bg-[var(--theme-accent)] transition-all duration-300 ease-out ${widthClass} ${opacityClass}`}
      />
      {children}
    </>
  );
}
