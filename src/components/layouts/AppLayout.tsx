/**
 * @component AppLayout
 * @description Обёртка для страниц авторизованной зоны.
 *
 * @spec docs/specs/nav/component-spec.md → 3.4.2
 * @task NAV-05-T3, NAV-06-T3
 *
 * @covers AC-NAV-05-1 — Sidebar на дашборде
 * @covers AC-NAV-05-5 — Скрытие sidebar на мобильных
 * @covers AC-NAV-06-1 — Breadcrumbs на страницах дашборда
 *
 * - Отображает контент страницы
 * - Контейнер для страниц авторизованной зоны
 * - Все страницы внутри dashboard/* используют этот layout
 * - Передаёт данные сессии и профиля в Navbar
 * - Управляет темой оформления (светлая/тёмная/зелёная)
 * - Интегрирует Sidebar (desktop) и Breadcrumbs (desktop)
 *
 * @data-flow
 * - DashboardLayout (SSR) → SessionWrapper (Client) → AppLayout (Client) → Navbar (Client) → children
 * - useEffect → apiClient.get('/profile') → profile data → Navbar
 * - useTheme в AppLayout → Navbar (ThemeToggle) → API PATCH /api/v1/profile/theme
 */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Navbar } from '@/components/layouts/Navbar';
import { Sidebar } from '@/components/layouts/Sidebar';
import { Breadcrumbs } from '@/components/layouts/Breadcrumbs';
import { Session } from 'next-auth';
import { useTheme } from '@/hooks/useTheme';
import type { Theme, UserProfileFull } from '@/domains/userProfile/userProfile.types';
import { apiClient } from '@/lib/api-client';

export interface AppLayoutProps {
  children: React.ReactNode;
  session: Session | null;
}

export function AppLayout({ children, session }: AppLayoutProps) {
  const { currentTheme, setTheme } = useTheme();
  const [profile, setProfile] = useState<UserProfileFull | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  // AC-6.1: Загрузка профиля для отображения имени в навигации
  useEffect(() => {
    const loadProfile = async () => {
      if (!session?.user?.id) return;

      setIsLoadingProfile(true);
      try {
        const response = await apiClient.get<UserProfileFull>('/profile');
        if (response.success && response.data) {
          setProfile(response.data);
          // AC-5.3: Применяем тему с сервера
          setTheme(response.data.theme);
        }
      } catch {
        console.error('Failed to load profile');
      } finally {
        setIsLoadingProfile(false);
      }
    };

    loadProfile();
  }, [session?.user?.id, setTheme]);

  const handleThemeChange = useCallback(async (theme: Theme) => {
    try {
      const response = await apiClient.patch<{ theme: Theme }>('/profile/theme', { theme });
      if (response.success && response.data?.theme) {
        setTheme(theme);
      }
    } catch {
      console.error('Failed to update theme');
      // Оптимистичное обновление: применяем тему локально даже при ошибке
      setTheme(theme);
    }
  }, [setTheme]);

  return (
    // B-023: flex-цепочка для sticky-низа контрола ввода сообщений.
    // .h-dvh-full (100vh → 100dvh fallback) фиксирует высоту корня, flex flex-col
    // передаёт высоту вниз, min-h-0 на контейнерах предотвращает переполнение flex-детей.
    <div className="h-dvh-full bg-gray-50 flex flex-col">
      <Navbar
        session={session}
        profile={profile}
        isLoadingProfile={isLoadingProfile}
        currentTheme={currentTheme}
        onThemeChange={handleThemeChange}
      />
      <div className="flex flex-1 min-h-0">
        <Sidebar />
        <div className="flex-1 min-w-0 flex flex-col">
          <Breadcrumbs />
          <main className="flex-1 min-h-0 flex flex-col py-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
