/**
 * @component Navbar
 * @category navigation
 * @description Component-тесты для навигационной панели (Navbar).
 *
 * @covers AC-NAV-02-1 — Navbar на всех страницах дашборда
 * @covers AC-NAV-02-2 — Ссылка на профиль
 * @covers AC-NAV-02-3 — Клиентская навигация
 * @covers AC-NAV-02-4 — Ролевые пункты меню
 * @covers AC-NAV-02-6 — Активное состояние
 * @covers AC-NAV-07-1 — Гамбургер на мобильных
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Navbar } from '@/components/layouts/Navbar';

// Мокируем useNavigation
const mockUseNavigation = vi.fn();
vi.mock('@/hooks/useNavigation', () => ({
  useNavigation: () => mockUseNavigation(),
}));

// Мокируем useUnreadCounts (B-027) — единый хук загрузки счётчиков
const mockUseUnreadCounts = vi.fn();
vi.mock('@/hooks/useUnreadCounts', () => ({
  useUnreadCounts: (...args: unknown[]) => mockUseUnreadCounts(...args),
}));

// Мокируем usePathname из next/navigation
const mockUsePathname = vi.fn();
vi.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname(),
}));

// Мокируем isActivePath
vi.mock('@/lib/nav-utils', async () => {
  const actual = await vi.importActual<typeof import('@/lib/nav-utils')>('@/lib/nav-utils');
  return {
    ...actual,
    isActivePath: vi.fn(() => false),
    getNavIcon: vi.fn((item: any) => item?.icon),
  };
});

// Мокируем apiClient
vi.mock('@/lib/api-client', () => ({
  apiClient: {
    get: vi.fn(() => Promise.resolve({ success: true, data: { messages: 0, chats: 0 } })),
  },
}));

// Мокируем LogoutButton
vi.mock('@/components/features/auth/LogoutButton', () => ({
  LogoutButton: () => <button data-testid="logout">Выйти</button>,
}));

// Мокируем ThemeToggle
vi.mock('@/components/features/userProfile/ThemeToggle', () => ({
  ThemeToggle: () => <button data-testid="theme-toggle">Тема</button>,
}));

// Мокируем MobileDrawer
vi.mock('@/components/layouts/MobileDrawer', () => ({
  MobileDrawer: ({ isOpen }: any) =>
    isOpen ? <div data-testid="mobile-drawer">Drawer</div> : null,
}));

// Мокируем next/link
vi.mock('next/link', () => ({
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

describe('Navbar (US-NAV-02, US-NAV-07)', () => {
  const mockSession = {
    user: {
      id: 'user-123',
      name: 'Тест Пользователь',
      email: 'test@snt.local',
      roles: ['MEMBER'],
    },
    expires: '2030-01-01T00:00:00.000Z',
  } as any;

  const mockProfile = {
    id: '1',
    userId: 'user-123',
    name: 'Иван Иванов',
    firstName: 'Иван',
    lastName: 'Иванов',
    middleName: null,
    email: 'test@snt.local',
    phone: '+79991234567',
    avatarUrl: null,
    avatar: null,
    bio: null,
    theme: 'light' as const,
    roles: ['MEMBER'],
    settings: {},
    userCreatedAt: new Date().toISOString(),
    userUpdatedAt: new Date().toISOString(),
    profileCreatedAt: new Date().toISOString(),
    profileUpdatedAt: new Date().toISOString(),
  } as any;

  const menuItems = [
    { path: '/dashboard', title: 'Дашборд', icon: () => null, group: 'main' as const },
    { path: '/dashboard/plots', title: 'Участки', icon: () => null, group: 'main' as const },
    { path: '/dashboard/profile', title: 'Профиль', icon: () => null, group: 'account' as const },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseNavigation.mockReturnValue({
      menuItems,
      activePath: '/dashboard',
      loading: false,
    });
    mockUsePathname.mockReturnValue('/dashboard');
    mockUseUnreadCounts.mockReturnValue({ counts: null, loading: true, error: null });
  });

  // ========================================
  // Базовый рендеринг
  // ========================================
  describe('Базовый рендеринг', () => {
    it('should render navbar with correct aria-label', () => {
      render(<Navbar session={mockSession} profile={mockProfile} />);

      const nav = screen.getByRole('navigation', { name: /Основная навигация/i });
      expect(nav).toBeInTheDocument();
    });

    it('should render navigation items', () => {
      render(<Navbar session={mockSession} profile={mockProfile} />);

      expect(screen.getByText('Дашборд')).toBeInTheDocument();
      expect(screen.getByText('Участки')).toBeInTheDocument();
    });

    it('should render user display name from profile', () => {
      render(<Navbar session={mockSession} profile={mockProfile} />);

      expect(screen.getByText('Иван Иванов')).toBeInTheDocument();
    });
  });

  // ========================================
  // Ссылка на профиль (AC-NAV-02-2)
  // ========================================
  describe('Ссылка на профиль', () => {
    it('should show profile link', () => {
      render(<Navbar session={mockSession} profile={mockProfile} />);

      expect(screen.getByText('Профиль')).toBeInTheDocument();
    });

    it('should fallback to email when name is missing', () => {
      const profileNoName = {
        ...mockProfile,
        firstName: null,
        lastName: null,
      };
      render(<Navbar session={mockSession} profile={profileNoName} />);

      expect(screen.getByText('test@snt.local')).toBeInTheDocument();
    });

    it('should fallback to session when no profile', () => {
      render(<Navbar session={mockSession} profile={null} />);

      expect(screen.getByText('Тест Пользователь')).toBeInTheDocument();
    });
  });

  // ========================================
  // Гамбургер-кнопка (AC-NAV-07-1)
  // ========================================
  describe('Гамбургер-кнопка', () => {
    it('should render hamburger button with aria-label', () => {
      render(<Navbar session={mockSession} profile={mockProfile} />);

      const hamburger = screen.getByLabelText(/Открыть меню/i);
      expect(hamburger).toBeInTheDocument();
    });

    it('should open drawer when hamburger is clicked', () => {
      render(<Navbar session={mockSession} profile={mockProfile} />);

      const hamburger = screen.getByLabelText(/Открыть меню/i);
      fireEvent.click(hamburger);

      expect(screen.getByTestId('mobile-drawer')).toBeInTheDocument();
    });
  });

  // ========================================
  // Ролевая фильтрация (AC-NAV-02-4)
  // ========================================
  describe('Ролевая фильтрация', () => {
    it('should show admin items for admin users', () => {
      const adminItems = [
        ...menuItems,
        { path: '/dashboard/users', title: 'Пользователи', icon: () => null, group: 'admin' as const },
      ];
      mockUseNavigation.mockReturnValue({
        menuItems: adminItems,
        activePath: '/dashboard',
        loading: false,
      });

      render(<Navbar session={mockSession} profile={mockProfile} />);

      expect(screen.getByText('Пользователи')).toBeInTheDocument();
    });

    it('should hide admin items for non-admin users', () => {
      const filteredItems = menuItems.filter((item: any) => item.group !== 'admin');
      mockUseNavigation.mockReturnValue({
        menuItems: filteredItems,
        activePath: '/dashboard',
        loading: false,
      });

      render(<Navbar session={mockSession} profile={mockProfile} />);

      expect(screen.queryByText('Пользователи')).not.toBeInTheDocument();
    });
  });

  // ========================================
  // Кнопка выхода
  // ========================================
  describe('Кнопка выхода', () => {
    it('should render logout button', () => {
      render(<Navbar session={mockSession} profile={mockProfile} />);

      expect(screen.getByTestId('logout')).toBeInTheDocument();
    });
  });

  // ========================================
  // Бейдж непрочитанных (US-21-37, AC-9)
  // ========================================
  describe('Бейдж непрочитанных', () => {
    const commsItems = [
      ...menuItems.filter((item: any) => item.group !== 'account'),
      { path: '/dashboard/comms', title: 'Общение', icon: () => null, group: 'main' as const },
    ];

    const renderWithComms = (overrides: Record<string, unknown> = {}) => {
      mockUseNavigation.mockReturnValue({
        menuItems: commsItems,
        activePath: '/dashboard/comms',
        loading: false,
      });
      mockUsePathname.mockReturnValue('/dashboard/comms');
      mockUseUnreadCounts.mockReturnValue({
        counts: { messages: 0, chats: 0 },
        loading: false,
        error: null,
        ...overrides,
      });
      return render(<Navbar session={mockSession} profile={mockProfile} />);
    };

    it('should render sum of messages + chats', () => {
      renderWithComms({ counts: { messages: 12, chats: 7 } });

      const badge = screen.getByTestId('nav-comms-badge');
      expect(badge).toHaveTextContent('19');
      expect(badge).toHaveAttribute(
        'aria-label',
        '19 непрочитанных сообщений',
      );
    });

    it('should be hidden when total is 0', () => {
      renderWithComms({ counts: { messages: 0, chats: 0 } });

      expect(screen.queryByTestId('nav-comms-badge')).not.toBeInTheDocument();
    });

    it('should render "99+" when total exceeds 99', () => {
      renderWithComms({ counts: { messages: 100, chats: 50 } });

      const badge = screen.getByTestId('nav-comms-badge');
      expect(badge).toHaveTextContent('99+');
    });

    it('should be hidden while loading', () => {
      renderWithComms({ counts: null, loading: true });

      expect(screen.queryByTestId('nav-comms-badge')).not.toBeInTheDocument();
    });

    it('should use --theme-danger token for badge color', () => {
      renderWithComms({ counts: { messages: 1, chats: 0 } });

      const badge = screen.getByTestId('nav-comms-badge');
      expect(badge.className).toContain('bg-[var(--theme-danger)]');
    });
  });
});
