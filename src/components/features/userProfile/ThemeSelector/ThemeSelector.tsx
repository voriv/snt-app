'use client';

import { useState } from 'react';
import { cn } from '@/shared/utils/cn';
import type { Theme } from '@/domains/userProfile/userProfile.types';
import { apiClient } from '@/lib/api-client';

/**
 * @component ThemeSelector
 * @category features
 * @description Компонент выбора темы оформления профиля
 *
 * @example
 * ```tsx
 * <ThemeSelector currentTheme={profile.theme} onSave={handleThemeSave} />
 * ```
 *
 * @spec
 * - Отображает три варианта тем: light, dark, green
 * - Каждая тема имеет визуальный предпросмотр (preview)
 * - При выборе темы применяется превью
 * - При сохранении отправляется PATCH запрос на /api/v1/profile/theme
 * - Во время сохранения показывается индикатор загрузки
 * - При ошибке показывается сообщение об ошибке
 * - Доступность: aria-label для каждой темы, role="radiogroup"
 */
export interface ThemeSelectorProps {
  /** Текущая тема пользователя */
  currentTheme: Theme;
  /** Функция, вызываемая при успешном сохранении темы */
  onSave: (theme: Theme) => void;
}

/**
 * Конфигурация тем для визуального отображения
 */
const THEMES_CONFIG: Record<Theme, { label: string; preview: { bg: string; text: string; accent: string }; color: string }> = {
  light: {
    label: 'Светлая',
    preview: {
      bg: 'bg-white',
      text: 'text-gray-900',
      accent: 'bg-blue-500',
    },
    color: 'bg-blue-500',
  },
  dark: {
    label: 'Темная',
    preview: {
      bg: 'bg-gray-900',
      text: 'text-gray-100',
      accent: 'bg-violet-500',
    },
    color: 'bg-violet-500',
  },
  green: {
    label: 'Зеленая',
    preview: {
      bg: 'bg-emerald-900',
      text: 'text-emerald-50',
      accent: 'bg-emerald-500',
    },
    color: 'bg-emerald-500',
  },
};

export function ThemeSelector({ currentTheme, onSave }: ThemeSelectorProps) {
  const [selectedTheme, setSelectedTheme] = useState<Theme>(currentTheme);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Обработчик выбора темы
   */
  const handleThemeSelect = (theme: Theme) => {
    setSelectedTheme(theme);
    setError(null);
  };

  /**
   * Обработчик сохранения темы
   */
  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    try {
      await apiClient.patch('/profile/theme', { theme: selectedTheme });
      onSave(selectedTheme);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось сохранить тему');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
        Тема оформления
      </h3>

      <div role="radiogroup" aria-label="Выбор темы оформления" className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {(Object.keys(THEMES_CONFIG) as Theme[]).map((theme) => {
          const config = THEMES_CONFIG[theme];
          const isSelected = selectedTheme === theme;

          return (
            <button
              key={theme}
              type="button"
              onClick={() => handleThemeSelect(theme)}
              aria-checked={isSelected}
              role="radio"
              aria-label={`Тема: ${config.label}`}
              className={cn(
                'relative rounded-lg border-2 p-4 text-left transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                isSelected
                  ? 'border-blue-500 shadow-md'
                  : 'border-gray-200 hover:border-gray-300'
              )}
            >
              {/* Preview */}
              <div className={cn('rounded-md p-3 mb-3', config.preview.bg)}>
                <div className={cn('text-xs font-medium', config.preview.text)}>
                  Предпросмотр
                </div>
                <div className={cn('mt-2 h-2 w-8 rounded', config.preview.accent)} />
              </div>

              {/* Label */}
              <div className={cn('font-medium text-sm', config.preview.text)}>
                {config.label}
              </div>

              {/* Selected indicator */}
              {isSelected && (
                <div className="absolute top-2 right-2">
                  <svg
                    className="w-5 h-5 text-blue-500"
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
            </button>
          );
        })}
      </div>

      {/* Action buttons */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving || selectedTheme === currentTheme}
          className={cn(
            'px-4 py-2 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
            isSaving || selectedTheme === currentTheme
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-500 text-white hover:bg-blue-600'
          )}
        >
          {isSaving ? 'Сохранение...' : 'Сохранить'}
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div className="rounded-md bg-red-50 p-3" role="alert">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}
    </div>
  );
}
