'use client';

import { FC } from 'react';

/**
 * @component PublicLayout
 * @category ui
 * @description Компонент layout публичной зоны с шапкой и подвалом
 *
 * @example
 * ```tsx
 * <PublicLayout>
 *   <LandingPage />
 * </PublicLayout>
 * ```
 *
 * @spec
 * - Шапка: название приложения СНТ Берёзки-НТ, выровнено по левому краю
 * - Подвал: текст копирайта — текущий год, название организации
 * - Children рендерится между шапкой и подвалом
 * - min-h-screen + flex: шапка и подвал всегда видны, контент заполняет оставшееся пространство
 * - Адаптивная верстка: мобильные и десктоп
 * - Login-страница внутри PublicLayout: форма центрирована по вертикали и горизонтали
 */
export interface PublicLayoutProps {
  /** Содержимое страницы между шапкой и подвалом */
  children: React.ReactNode;
}

/**
 * Создаёт текущий год для копирайта
 * @returns Текущий год в формате YYYY
 */
function getCurrentYear(): string {
  return new Date().getFullYear().toString();
}

/**
 * Создаёт строку копирайта
 * @param year - Год для копирайта
 * @returns Строка копирайта
 */
function getCopyrightText(year: string): string {
  return `© ${year} СНТ Берёзки-НТ. Все права защищены.`;
}

/**
 * Компонент layout публичной зоны с шапкой и подвалом
 * @param props - Props компонента
 * @returns Элемент React
 */
export const PublicLayout: FC<PublicLayoutProps> = ({ children }) => {
  const year = getCurrentYear();
  const copyright = getCopyrightText(year);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center">
          <h1 className="text-xl font-bold text-gray-900">СНТ Берёзки-НТ</h1>
        </div>
      </header>

      <main className="flex-1">
        {children}
      </main>

      <footer className="bg-white border-t mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-sm text-center text-gray-500">{copyright}</p>
        </div>
      </footer>
    </div>
  );
};
