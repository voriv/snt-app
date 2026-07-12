'use client';

import { cn } from '@/shared/utils/cn';
import type { Theme } from '@/domains/userProfile/userProfile.types';

/**
 * @component ThemeSelector
 * @category features/userProfile
 * @description Компонент выбора темы оформления (светлая/тёмная/зелёная) для страницы профиля
 *
 * @example
 * ```tsx
 * <ThemeSelector
 *   currentTheme={profile.theme}
 *   onSave={handleThemeSave}
 * />
 * ```
 *
 * @spec
 * - Отображает 3 варианта тем в виде карточек с превью
 * - При выборе темы вызывает onSave с новой темой
 * - Отображает индикатор загрузки при сохранении
 * - Доступность: aria-label для каждой карточки, фокус через Tab, активный вариант обозначен border
 *
 * @param currentTheme - Текущая активная тема
 * @param onSave - Callback при выборе темы
 */
export interface ThemeSelectorProps {
  /** Текущая активная тема */
  currentTheme: Theme;
  /** Callback при выборе темы */
  onSave: (theme: Theme) => void;
}

/**
 * Конфигурация тем для отображения
 */
const THEMES_CONFIG: Record<Theme, { label: string; description: string; colors: string[] }> = {
  light: {
    label: 'Светлая тема',
    description: 'Классическая светлая схема с высоким контрастом',
    colors: ['bg-white', 'bg-gray-100', 'text-gray-900'],
  },
  dark: {
    label: 'Тёмная тема',
    description: 'Комфортная тёмная схема для работы в темноте',
    colors: ['bg-gray-900', 'bg-gray-800', 'text-gray-100'],
  },
  green: {
    label: 'Зелёная тема',
    description: 'Приятная зелёная схема для снижения нагрузки на глаза',
    colors: ['bg-green-50', 'bg-green-100', 'text-green-900'],
  },
};

export function ThemeSelector({ currentTheme, onSave }: ThemeSelectorProps) {
  const handleThemeChange = async (theme: Theme) => {
    await onSave(theme);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Оформление</h3>
        <div className="text-sm text-gray-500">
          Текущая тема: <span className="font-medium">{THEMES_CONFIG[currentTheme].label}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(Object.keys(THEMES_CONFIG) as Theme[]).map((theme) => {
          const config = THEMES_CONFIG[theme];
          const isActive = currentTheme === theme;

          return (
            <button
              key={theme}
              type="button"
              onClick={() => handleThemeChange(theme)}
              aria-label={`Выбрать ${config.label}`}
              aria-pressed={isActive}
              className={cn(
                'relative p-4 rounded-lg border-2 transition-all duration-200 text-left',
                'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2',
                isActive
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                  : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
              )}
            >
              {isActive && (
                <div className="absolute top-2 right-2">
                  <svg
                    className="w-5 h-5 text-indigo-600 dark:text-indigo-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}

              {/* Превью темы */}
              <div className="flex items-center gap-3 mb-3">
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center',
                    config.colors[0]
                  )}
                >
                  <div
                    className={cn(
                      'w-6 h-6 rounded',
                      config.colors[1]
                    )}
                  />
                </div>
                <div>
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    {config.label}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {config.description}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
