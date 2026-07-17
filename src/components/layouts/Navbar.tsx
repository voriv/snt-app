/**
 * @component Navbar
 * @description Навигационный компонент с меню, кнопкой переключения темы и выхода
 *
 * @spec
 * - Отображает список навигационных ссылок
 * - Отображает кнопку переключения темы (ThemeToggle)
 * - Отображает имя пользователя из профиля (firstName + lastName) или email (AC-6.1, AC-6.2)
 * - Отображает аватар пользователя, если он есть
 * - Отображает кнопку выхода с подтверждением
 * - Активное состояние ссылки на странице профиля (AC-6.5)
 * - Ссылка «Сообщения» с бейджем непрочитанных (US-21-01, AC-1.6)
 * - Ссылка «Групповые чаты» (US-21-04)
 *
 * @see src/components/layouts/AppLayout.tsx
 */
'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Session } from 'next-auth';
import Link from 'next/link';
import { cn } from '@/shared/utils';
import { LogoutButton } from '@/components/features/auth/LogoutButton';
import { ThemeToggle } from '@/components/features/userProfile/ThemeToggle';
import { apiClient } from '@/lib/api-client';
import type { Theme, UserProfileFull } from '@/domains/userProfile/userProfile.types';

interface NavbarProps {
  session: Session | null;
  profile: UserProfileFull | null;
  isLoadingProfile?: boolean;
  currentTheme?: Theme;
  onThemeChange?: (theme: Theme) => void;
}

export function Navbar({ session, profile, isLoadingProfile = false, currentTheme = 'light', onThemeChange }: NavbarProps) {
  const pathname = usePathname();
  const userRoles = session?.user?.roles ?? [];

  // AC-1.6: Загрузка счётчика непрочитанных сообщений
  const [unreadCount, setUnreadCount] = useState<number>(0);

  useEffect(() => {
    let aborted = false;
    const loadUnread = async () => {
      try {
        const response = await apiClient.get<{ items: { unreadCount: number }[]; total: number }>('/conversations');
        if (!aborted && response.success && response.data) {
          const total = response.data.items.reduce((sum, item) => sum + item.unreadCount, 0);
          setUnreadCount(total);
        }
      } catch {
        // Игнорируем ошибку загрузки счётчика
      }
    };
    loadUnread();
    return () => { aborted = true; };
  }, []);

  // Сброс счётчика при входе на страницу сообщений
  useEffect(() => {
    if (pathname === '/dashboard/messages') {
      setUnreadCount(0);
    }
  }, [pathname]);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Участки', href: '/dashboard/plots' },
    { name: 'Сообщения', href: '/dashboard/messages', badge: unreadCount > 0 ? unreadCount : undefined },
    { name: 'Групповые чаты', href: '/dashboard/chats' },
  ];

  const adminNavigation = [
    { name: 'Роли', href: '/dashboard/roles' },
    { name: 'Пользователи', href: '/dashboard/users' },
  ];

  const profileLink = { name: 'Профиль', href: '/dashboard/profile' };

  // AC-6.1: Отображать имя пользователя из профиля (firstName + lastName)
  // AC-6.2: Если имя null/пустое, отображать email
  const userDisplayName = profile
    ? (profile.firstName || profile.lastName
        ? `${profile.firstName || ''} ${profile.lastName || ''}`.trim()
        : profile.email)
    : session?.user?.name ?? session?.user?.email;

  const isProfilePage = pathname === '/dashboard/profile';

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <h1 className="text-xl font-bold text-gray-900">
                {process.env.NEXT_PUBLIC_APP_NAME || 'СНТ Берёзки-НТ'}
              </h1>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      'inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium',
                      isActive
                        ? 'border-indigo-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700',
                    )}
                  >
                    {item.name}
                    {'badge' in item && item.badge && (
                      <span
                        className="ml-1.5 inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-white bg-red-500 rounded-full"
                        aria-label={`${item.badge} непрочитанных сообщений`}
                      >
                        {item.badge > 99 ? '99+' : item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
              {userRoles.includes('SUPER_ADMIN') && adminNavigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      'inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium',
                      isActive
                        ? 'border-indigo-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700',
                    )}
                  >
                    {item.name}
                  </Link>
                );
              })}
              <Link
                href={profileLink.href}
                className={cn(
                  'inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium',
                  pathname === profileLink.href
                    ? 'border-indigo-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700',
                )}
              >
                {profileLink.name}
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle
              currentTheme={currentTheme}
              onThemeChange={onThemeChange ?? (() => {})}
            />
            {userDisplayName && (
              <Link
                href="/dashboard/profile"
                aria-label="Перейти в профиль"
                aria-current={isProfilePage ? 'page' : undefined}
                className={cn(
                  'text-sm truncate max-w-[20ch] sm:max-w-[15ch] lg:max-w-[20ch] focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded px-1',
                  isProfilePage
                    ? 'text-indigo-600 font-medium'
                    : 'text-gray-700 hover:text-gray-900'
                )}
                title={userDisplayName}
              >
                {isLoadingProfile ? 'Загрузка...' : userDisplayName}
              </Link>
            )}
            <LogoutButton />
          </div>
        </div>
      </div>
    </nav>
  );
}
