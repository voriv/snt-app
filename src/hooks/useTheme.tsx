'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { Theme } from '@/domains/userProfile/userProfile.types';

/**
 * @typedef {Object} ThemeContextValue
 * @property {Theme} currentTheme - Текущая активная тема
 * @property {Theme[]} availableThemes - Доступные темы
 * @property {(theme: Theme) => void} setTheme - Функция для установки темы
 * @property {() => void} toggleTheme - Функция для переключения темы (light -> dark -> green -> light)
 */
interface ThemeContextValue {
  currentTheme: Theme;
  availableThemes: Theme[];
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const AVAILABLE_THEMES: Theme[] = ['light', 'dark', 'green'];

/**
 * @component ThemeProvider
 * @description Провайдер контекста темы — единый источник истины для состояния темы
 *
 * @spec
 * - Создаёт React Context для разделения состояния темы между всеми компонентами
 * - При инициализации загружает тему из localStorage или системных настроек
 * - Применяет CSS-переменные (data-theme атрибут) к document.documentElement
 * - Сохраняет выбранную тему в localStorage
 *
 * @example
 * ```tsx
 * <ThemeProvider>
 *   <AppLayout session={session}>{children}</AppLayout>
 * </ThemeProvider>
 * ```
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [currentTheme, setCurrentTheme] = useState<Theme>('light');

  /**
   * Применить тему к DOM
   * @param theme - Тема для применения
   */
  const applyTheme = useCallback((theme: Theme) => {
    const html = document.documentElement;
    html.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, []);

  /**
   * Инициализация темы при монтировании
   * - Проверяет localStorage
   * - Если нет сохраненной темы, использует системные настройки
   */
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as Theme | null;

    if (savedTheme && AVAILABLE_THEMES.includes(savedTheme)) {
      setCurrentTheme(savedTheme);
      applyTheme(savedTheme);
      return;
    }

    // Проверяем системные настройки
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = prefersDark ? 'dark' : 'light';
    setCurrentTheme(initialTheme);
    applyTheme(initialTheme);
  }, [applyTheme]);

  /**
   * Установить тему
   * @param theme - Тема для установки
   */
  const setTheme = useCallback((theme: Theme) => {
    setCurrentTheme(theme);
    applyTheme(theme);
  }, [applyTheme]);

  /**
   * Переключить тему на следующую
   * Порядок: light -> dark -> green -> light
   */
  const toggleTheme = useCallback(() => {
    setCurrentTheme((prev) => {
      const currentIndex = AVAILABLE_THEMES.indexOf(prev);
      const nextIndex = (currentIndex + 1) % AVAILABLE_THEMES.length;
      const nextTheme = AVAILABLE_THEMES[nextIndex];
      applyTheme(nextTheme);
      return nextTheme;
    });
  }, [applyTheme]);

  const value: ThemeContextValue = {
    currentTheme,
    availableThemes: AVAILABLE_THEMES,
    setTheme,
    toggleTheme,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/**
 * @hook useTheme
 * @description Хук для управления темой оформления приложения
 *
 * @spec
 * - Читает состояние темы из ThemeContext (единственный источник истины)
 * - Возвращает методы для управления темой: setTheme, toggleTheme
 * - Должен использоваться только внутри ThemeProvider
 *
 * @returns {ThemeContextValue} - Объект с состоянием и методами управления темой
 * @property {Theme} currentTheme - Текущая активная тема
 * @property {Theme[]} availableThemes - Доступные темы
 * @property {(theme: Theme) => void} setTheme - Функция для установки темы
 * @property {() => void} toggleTheme - Функция для переключения темы
 *
 * @throws {Error} если использован вне ThemeProvider
 */
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme должен использоваться внутри ThemeProvider');
  }
  return context;
}
