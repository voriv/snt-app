'use client';

import { cn } from '@/shared/utils/cn';
import type { Theme } from '@/domains/userProfile/userProfile.types';

/**
 * @component ThemeToggle
 * @category features
 * @description Кнопка быстрого переключения темы оформления в навбаре
 *
 * @example
 * ```tsx
 * <ThemeToggle currentTheme={currentTheme} onThemeChange={setTheme} />
 * ```
 *
 * @spec
 * - Отображает текущую тему и иконку
 * - При клике переключает на следующую тему (light -> dark -> green -> light)
 * - Показывает tooltip с названием темы при наведении
 * - Доступность: aria-label с текущей темой, role="button"
 * - Блокируется во время загрузки
 *
 * @param currentTheme - Текущая активная тема
 * @param onThemeChange - Функция для обновления темы
 * @param isLoading - Состояние загрузки
 */
export interface ThemeToggleProps {
  /** Текущая тема */
  currentTheme: Theme;
  /** Функция для обновления темы */
  onThemeChange: (theme: Theme) => void;
  /** Состояние загрузки */
  isLoading?: boolean;
}

/**
 * Конфигурация тем для отображения
 */
const THEMES_CONFIG: Record<Theme, { label: string; icon: React.ReactNode }> = {
  light: {
    label: 'Светлая тема',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
  },
  dark: {
    label: 'Темная тема',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
      </svg>
    ),
  },
  green: {
    label: 'Зеленая тема',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
      </svg>
    ),
  },
};

export function ThemeToggle({ currentTheme, onThemeChange, isLoading = false }: ThemeToggleProps) {
  const config = THEMES_CONFIG[currentTheme];

  const handleToggle = () => {
    const themes: Theme[] = ['light', 'dark', 'green'];
    const currentIndex = themes.indexOf(currentTheme);
    const nextTheme = themes[(currentIndex + 1) % themes.length];
    onThemeChange(nextTheme);
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isLoading}
      aria-label={config.label}
      title={config.label}
      className={cn(
        'p-2 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
        'hover:bg-gray-100 dark:hover:bg-gray-800',
        isLoading && 'opacity-50 cursor-not-allowed'
      )}
    >
      {config.icon}
    </button>
  );
}
