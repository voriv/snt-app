/**
 * @component AppLayout
 * @description Обёртка для страниц авторизованной зоны
 *
 * @spec
 * - Отображает контент страницы
 * - Контейнер для страниц авторизованной зоны
 * - Все страницы внутри dashboard/* используют этот layout
 * - Передаёт данные сессии и профиля в Navbar
 * - Управляет темой оформления (светлая/тёмная/зелёная)
 *
 * @data-flow
 * - DashboardLayout (SSR) → SessionWrapper (Client) → AppLayout (Client) → Navbar (Client) → children
 * - useEffect → apiClient.get('/profile') → profile data → Navbar
 * - useTheme в AppLayout → Navbar (ThemeToggle) → API PATCH /api/v1/profile/theme
 */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Navbar } from '@/components/layouts/Navbar';
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
    <div className="min-h-screen bg-gray-50">
      <Navbar
        session={session}
        profile={profile}
        isLoadingProfile={isLoadingProfile}
        currentTheme={currentTheme}
        onThemeChange={handleThemeChange}
      />
      <main className="py-6">
        {children}
      </main>
    </div>
  );
}
