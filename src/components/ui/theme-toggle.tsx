'use client';

import React, { useState } from 'react';
import { useTheme, type Theme } from '@/components/providers/theme-wrapper';

/**
 * Конфигурация тем для отображения.
 *
 * @public
 */
const THEMES_CONFIG: Record<Theme, { label: string; icon: string }> = {
  light: { label: 'Светлая', icon: '☀️' },
  dark: { label: 'Тёмная', icon: '🌙' },
  garden: { label: 'Садовая', icon: '🌿' },
};

/**
 * Компонент переключения темы оформления.
 *
 * @remarks
 * Отображает кнопку с текущей темой и выпадающее меню с 3 вариантами:
 * Светлая (☀️), Тёмная (🌙), Садовая (🌿).
 *
 * Не принимает props — использует ThemeContext внутри.
 *
 * @example
 * ```tsx
 * <ThemeToggle />
 * ```
 */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const currentConfig = THEMES_CONFIG[theme];

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    setIsDropdownOpen(false);
  };

  return (
    <div className="relative inline-block">
      {/* Кнопка переключения темы */}
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        aria-label="Переключить тему"
        aria-expanded={isDropdownOpen}
        className="flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-3 py-2 text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)] transition-colors"
      >
        <span>{currentConfig.icon}</span>
        <span className="hidden sm:inline">{currentConfig.label}</span>
      </button>

      {/* Выпадающее меню */}
      {isDropdownOpen && (
        <>
          {/* Overlay для закрытия по клику вне */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsDropdownOpen(false)}
          />

          <ul
            role="menu"
            className="absolute right-0 z-50 mt-2 w-40 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] shadow-lg"
          >
            {(Object.keys(THEMES_CONFIG) as Theme[]).map((t) => {
              const config = THEMES_CONFIG[t];
              const isActive = theme === t;

              return (
                <li key={t} role="none">
                  <button
                    role="menuitem"
                    onClick={() => handleThemeChange(t)}
                    className={`flex w-full items-center justify-between px-4 py-2 text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)] transition-colors ${
                      isActive ? 'font-semibold' : ''
                    }`}
                  >
                    <span>
                      {config.icon} {config.label}
                    </span>
                    {isActive && <span className="text-[var(--color-accent)]">✓</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
