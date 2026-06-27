'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

/**
 * Типы поддерживаемых тем.
 *
 * @public
 */
export type Theme = 'light' | 'dark' | 'garden';

/**
 * Значение контекста темы.
 *
 * @public
 */
export interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

/**
 * Контекст темы оформления.
 *
 * @public
 */
const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

/**
 * Provider для управления темой оформления.
 *
 * @remarks
 * Поддерживает 3 темы (light, dark, garden), сохраняет выбор в localStorage
 * и применяет CSS-класс к корневому элементу `<html>`.
 *
 * @param children - Дочерние компоненты
 * @param defaultTheme - Тема по умолчанию (по умолчанию 'light')
 *
 * @example
 * ```tsx
 * // В layout.tsx
 * <ThemeWrapper defaultTheme="light">
 *   {children}
 * </ThemeWrapper>
 * ```
 */
export function ThemeWrapper({
  children,
  defaultTheme = 'light',
}: {
  children: React.ReactNode;
  defaultTheme?: Theme;
}) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme);

  useEffect(() => {
    // Чтение из localStorage при монтировании
    const stored = localStorage.getItem('theme') as Theme | null;
    if (stored && ['light', 'dark', 'garden'].includes(stored)) {
      setThemeState(stored);
    } else {
      setThemeState(defaultTheme);
    }
  }, [defaultTheme]);

  useEffect(() => {
    // Применение CSS-класса к <html>
    const html = document.documentElement;
    html.classList.remove('theme-light', 'theme-dark', 'theme-garden');
    html.classList.add(`theme-${theme}`);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Хук для использования контекста темы.
 *
 * @returns Контекст темы (theme, setTheme)
 * @throws Error если используется вне ThemeWrapper
 *
 * @example
 * ```tsx
 * const { theme, setTheme } = useTheme();
 * ```
 */
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);

  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeWrapper');
  }

  return context;
}
