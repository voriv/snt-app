/**
 * @component Navbar
 * @description Навигационный компонент с меню, кнопкой переключения темы и выхода
 *
 * @spec
 * - Отображает список навигационных ссылок
 * - Отображает кнопку переключения темы (ThemeToggle)
 * - Отображает имя пользователя или email
 * - Отображает кнопку выхода с подтверждением
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
import type { Theme } from '@/domains/userProfile/userProfile.types';

interface NavbarProps {
  session: Session | null;
  currentTheme?: Theme;
  onThemeChange?: (theme: Theme) => void;
}

export function Navbar({ session, currentTheme = 'light', onThemeChange }: NavbarProps) {
  const pathname = usePathname();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Члены СНТ', href: '/dashboard/members' },
    { name: 'Участки', href: '/dashboard/plots' },
    { name: 'Голосования', href: '/dashboard/votes' },
    { name: 'Документы', href: '/dashboard/documents' },
    { name: 'Счета', href: '/dashboard/bills' },
  ];

  const profileLink = { name: 'Профиль', href: '/profile' };

  const userDisplayName = session?.user?.name ?? session?.user?.email;

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <h1 className="text-xl font-bold text-gray-900">
                СНТ Берёнки-НТ
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
              <span className="text-sm text-gray-700">
                {userDisplayName}
              </span>
            )}
            <LogoutButton />
          </div>
        </div>
      </div>
    </nav>
  );
}
