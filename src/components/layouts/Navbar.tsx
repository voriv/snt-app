/**
 * @component Navbar
 * @description Навигационный компонент с меню, кнопкой переключения темы и выхода.
 *
 * @spec docs/specs/nav/component-spec.md → 3.4.1
 * @task NAV-02-T2, NAV-07-T2
 *
 * @covers AC-NAV-02-1 — Navbar на всех страницах дашборда
 * @covers AC-NAV-02-2 — Ссылка на профиль
 * @covers AC-NAV-02-3 — Клиентская навигация
 * @covers AC-NAV-02-4 — Ролевые пункты меню
 * @covers AC-NAV-02-5 — Не отображается для неавторизованных
 * @covers AC-NAV-02-6 — Активное состояние
 * @covers AC-NAV-07-1 — Гамбургер на мобильных
 * @covers AC-NAV-07-2 — Открытие drawer
 *
 * @covers AC-1 (US-21-36): Пункт «Общение» в навбаре
 * @covers AC-1 (US-21-37): Суммарный бейдж непрочитанных (messages + chats)
 * @see docs/specs/comms/component-spec.md → 3.4.4
 *
 * @see src/components/layouts/AppLayout.tsx
 */

'use client';

import { useState } from 'react';
import { Session } from 'next-auth';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';
import { cn } from '@/shared/utils';
import { LogoutButton } from '@/components/features/auth/LogoutButton';
import { ThemeToggle } from '@/components/features/userProfile/ThemeToggle';
import { useNavigation } from '@/hooks/useNavigation';
import { useUnreadCounts } from '@/hooks/useUnreadCounts';
import { isActivePath, getNavIcon } from '@/lib/nav-utils';
import { MobileDrawer } from '@/components/layouts/MobileDrawer';
import type { Theme, UserProfileFull } from '@/domains/userProfile/userProfile.types';

interface NavbarProps {
  session: Session | null;
  profile: UserProfileFull | null;
  isLoadingProfile?: boolean;
  currentTheme?: Theme;
  onThemeChange?: (theme: Theme) => void;
}

export function Navbar({ session, profile, isLoadingProfile = false, currentTheme = 'light', onThemeChange }: NavbarProps) {
  const { menuItems, activePath } = useNavigation();

  // Состояние мобильного drawer
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // US-21-37 AC-9: Суммарный счётчик непрочитанных (messages + chats)
  // pathname — триггер: хук перезагружает счётчики при каждой навигации,
  // чтобы глобальный бейдж оставался актуальным после markAsRead (причина #1).
  const pathname = usePathname();
  const { counts } = useUnreadCounts(pathname);
  const unreadCount = counts ? (counts.messages ?? 0) + (counts.chats ?? 0) : 0;

  // AC-6.1: Отображать имя пользователя из профиля (firstName + lastName)
  // AC-6.2: Если имя null/пустое, отображать email
  const userDisplayName = profile
    ? (profile.firstName || profile.lastName
        ? `${profile.firstName || ''} ${profile.lastName || ''}`.trim()
        : profile.email)
    : session?.user?.name ?? session?.user?.email;

  const isProfilePage = activePath === '/dashboard/profile';

  // Разделяем пункты: основное меню (main + admin + finance) и аккаунт (Профиль)
  const mainNavItems = menuItems.filter((item) => item.group !== 'account');
  const profileItem = menuItems.find((item) => item.group === 'account');

  return (
    <>
      <nav className="bg-white shadow-sm border-b" role="navigation" aria-label="Основная навигация">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              {/* Гамбургер (mobile) */}
              <button
                type="button"
                onClick={() => setIsDrawerOpen(true)}
                aria-label="Открыть меню"
                aria-expanded={isDrawerOpen}
                aria-controls="mobile-drawer"
                className="md:hidden p-2 -ml-2 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <Menu className="w-6 h-6" aria-hidden="true" />
              </button>

              <div className="flex-shrink-0 flex items-center ml-2 md:ml-0">
                <h1 className="text-xl font-bold text-gray-900">
                  {process.env.NEXT_PUBLIC_APP_NAME || 'СНТ Берёзки-НТ'}
                </h1>
              </div>

              {/* Desktop nav items */}
              <div className="hidden md:ml-6 md:flex md:space-x-4">
                {mainNavItems.map((item) => {
                  const Icon = getNavIcon(item);
                  const isActive = isActivePath(item.path, activePath);
                  const isComms = item.path === '/dashboard/comms';
                  const badge = isComms ? unreadCount : undefined;
                  return (
                    <Link
                      key={item.path}
                      href={item.path}
                      aria-current={isActive ? 'page' : undefined}
                      className={cn(
                        'inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-sm font-medium',
                        'focus:outline-none focus:ring-2 focus:ring-blue-500',
                        isActive
                          ? 'bg-gray-100 text-blue-600'
                          : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50',
                      )}
                    >
                      {Icon && <Icon className="w-4 h-4" aria-hidden="true" />}
                      <span>{item.title}</span>
                      {badge !== undefined && badge > 0 && (
                        <span
                          data-testid="nav-comms-badge"
                          className="ml-1 inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-white rounded-full bg-[var(--theme-danger)]"
                          aria-label={`${badge} непрочитанных сообщений`}
                        >
                          {badge > 99 ? '99+' : badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
                {profileItem && (() => {
                  const ProfileIcon = profileItem.icon;
                  return (
                    <Link
                      href={profileItem.path}
                      aria-current={isProfilePage ? 'page' : undefined}
                      className={cn(
                        'inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-sm font-medium',
                        'focus:outline-none focus:ring-2 focus:ring-blue-500',
                        isProfilePage
                          ? 'bg-gray-100 text-blue-600'
                          : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50',
                      )}
                    >
                      <ProfileIcon className="w-4 h-4" aria-hidden="true" />
                      <span>{profileItem.title}</span>
                    </Link>
                  );
                })()}
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
                  {isLoadingProfile ? (
                    <span
                      className="inline-block w-10 h-4 bg-gray-200 animate-pulse rounded"
                      aria-hidden="true"
                    />
                  ) : (
                    userDisplayName
                  )}
                </Link>
              )}
              <LogoutButton />
            </div>
          </div>
        </div>
      </nav>

      {/* Мобильный drawer */}
      <MobileDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
    </>
  );
}
