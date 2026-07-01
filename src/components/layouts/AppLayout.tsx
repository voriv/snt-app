/**
 * @component AppLayout
 * @description Обёртка для страниц авторизованной зоны
 *
 * @spec
 * - Отображает контент страницы
 * - Контейнер для страниц авторизованной зоны
 * - Все страницы внутри dashboard/* используют этот layout
 * - Передаёт данные сессии в Navbar
 * - Управляет темой оформления (светлая/тёмная/зелёная)
 *
 * @data-flow
 * - DashboardLayout (SSR) → SessionWrapper (Client) → AppLayout (Client) → Navbar (Client) → children
 * - useTheme в AppLayout → Navbar (ThemeToggle) → API PATCH /api/v1/profile/theme
 */
'use client';

import { Navbar } from '@/components/layouts/Navbar';
import { Session } from 'next-auth';
import { useTheme } from '@/hooks/useTheme';
import type { Theme } from '@/domains/userProfile/userProfile.types';
import { apiClient } from '@/lib/api-client';

export interface AppLayoutProps {
  children: React.ReactNode;
  session: Session | null;
}

export function AppLayout({ children, session }: AppLayoutProps) {
  const { currentTheme, setTheme } = useTheme();

  const handleThemeChange = async (theme: Theme) => {
    try {
      await apiClient.patch('/profile/theme', { theme });
    } catch {
      console.error('Failed to update theme');
    }
    setTheme(theme);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar
        session={session}
        currentTheme={currentTheme}
        onThemeChange={handleThemeChange}
      />
      <main className="py-6">
        {children}
      </main>
    </div>
  );
}
