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
 *
 * @see src/components/layouts/AppLayout.tsx
 */
'use client';

import { usePathname } from 'next/navigation';
import { Session } from 'next-auth';
import Link from 'next/link';
import { cn } from '@/shared/utils';
import { LogoutButton } from '@/components/features/auth/LogoutButton';
import { Button } from '@/components/ui';
import { ThemeToggle } from '@/components/features/userProfile/ThemeToggle';
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

  const navigation = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Участки', href: '/dashboard/plots' },
  ];

  const adminNavigation = [
    { name: 'Роли', href: '/dashboard/roles' },
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
