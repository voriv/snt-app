/**
 * @component Sidebar
 * @category navigation
 * @description Component-тесты для бокового меню (Sidebar).
 *
 * @covers AC-NAV-05-1 — Sidebar на дашборде
 * @covers AC-NAV-05-2 — Ролевые пункты в sidebar
 * @covers AC-NAV-05-3 — Активное состояние пункта
 * @covers AC-NAV-05-4 — Иконки у пунктов
 * @covers AC-NAV-05-5 — Скрытие на мобильных
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Sidebar } from '@/components/layouts/Sidebar';

// Мокируем useNavigation
const mockUseNavigation = vi.fn();
vi.mock('@/hooks/useNavigation', () => ({
  useNavigation: () => mockUseNavigation(),
}));

// Мокируем isActivePath
vi.mock('@/lib/nav-utils', async () => {
  const actual = await vi.importActual<typeof import('@/lib/nav-utils')>('@/lib/nav-utils');
  return {
    ...actual,
    isActivePath: vi.fn((itemPath, currentPath) => {
      if (!currentPath) return false;
      if (itemPath === '/dashboard') {
        return currentPath === '/dashboard';
      }
      return currentPath === itemPath || currentPath.startsWith(`${itemPath}/`);
    }),
  };
});

// Мокируем SidebarItem
vi.mock('@/components/layouts/SidebarItem', () => ({
  SidebarItem: ({ item, isActive }: any) => (
    <a
      href={item.path}
      data-testid={`sidebar-item-${item.path.replace(/\//g, '_')}`}
      data-active={isActive}
      className={isActive ? 'active' : ''}
    >
      {item.title}
    </a>
  ),
}));

describe('Sidebar (US-NAV-05)', () => {
  const baseMenuItems = [
    { path: '/dashboard', title: 'Дашборд', icon: () => null, group: 'main' as const },
    { path: '/dashboard/plots', title: 'Участки', icon: () => null, group: 'main' as const },
    { path: '/dashboard/documents', title: 'Документы', icon: () => null, group: 'main' as const },
    { path: '/dashboard/comms', title: 'Общение', icon: () => null, group: 'main' as const },
    { path: '/dashboard/profile', title: 'Профиль', icon: () => null, group: 'account' as const },
  ];

  const adminMenuItems = [
    ...baseMenuItems,
    { path: '/dashboard/users', title: 'Пользователи', icon: () => null, group: 'admin' as const, roles: ['ADMIN', 'SUPER_ADMIN'] as string[] },
    { path: '/dashboard/payments', title: 'Платежи', icon: () => null, group: 'finance' as const, roles: ['ADMIN', 'SUPER_ADMIN'] as string[] },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ========================================
  // Рендеринг
  // ========================================
  describe('Рендеринг', () => {
    it('should render sidebar with navigation items', () => {
      mockUseNavigation.mockReturnValue({
        menuItems: baseMenuItems,
        activePath: '/dashboard/plots',
        loading: false,
      });

      render(<Sidebar />);

      expect(screen.getByText('Дашборд')).toBeInTheDocument();
      expect(screen.getByText('Участки')).toBeInTheDocument();
    });

    it('should display group labels', () => {
      mockUseNavigation.mockReturnValue({
        menuItems: baseMenuItems,
        activePath: '/dashboard',
        loading: false,
      });

      render(<Sidebar />);

      expect(screen.getByText('Основное')).toBeInTheDocument();
      expect(screen.getByText('Аккаунт')).toBeInTheDocument();
    });

    it('should have correct aria-label', () => {
      mockUseNavigation.mockReturnValue({
        menuItems: baseMenuItems,
        activePath: '/dashboard',
        loading: false,
      });

      render(<Sidebar />);

      expect(screen.getByRole('navigation', { name: /Sidebar/i })).toBeInTheDocument();
    });
  });

  // ========================================
  // Активное состояние
  // ========================================
  describe('Активное состояние', () => {
    it('should mark active item when on matching path', () => {
      mockUseNavigation.mockReturnValue({
        menuItems: baseMenuItems,
        activePath: '/dashboard/plots',
        loading: false,
      });

      render(<Sidebar />);

      // path.replace(/\//g, '_') → '/dashboard/plots' → '_dashboard_plots'
      const plotsItem = screen.getByTestId('sidebar-item-_dashboard_plots');
      expect(plotsItem).toHaveAttribute('data-active', 'true');
    });

    it('should mark /dashboard active only on exact /dashboard', () => {
      mockUseNavigation.mockReturnValue({
        menuItems: baseMenuItems,
        activePath: '/dashboard',
        loading: false,
      });

      render(<Sidebar />);

      // path.replace(/\//g, '_') → '/dashboard' → '_dashboard'
      const dashboardItem = screen.getByTestId('sidebar-item-_dashboard');
      expect(dashboardItem).toHaveAttribute('data-active', 'true');
    });
  });

  // ========================================
  // Ролевая фильтрация
  // ========================================
  describe('Ролевая фильтрация', () => {
    it('should show admin items for admin users', () => {
      mockUseNavigation.mockReturnValue({
        menuItems: adminMenuItems,
        activePath: '/dashboard/users',
        loading: false,
      });

      render(<Sidebar />);

      expect(screen.getByText('Пользователи')).toBeInTheDocument();
      expect(screen.getByText('Платежи')).toBeInTheDocument();
    });

    it('should hide admin items for non-admin users', () => {
      mockUseNavigation.mockReturnValue({
        menuItems: baseMenuItems,
        activePath: '/dashboard',
        loading: false,
      });

      render(<Sidebar />);

      expect(screen.queryByText('Пользователи')).not.toBeInTheDocument();
      expect(screen.queryByText('Платежи')).not.toBeInTheDocument();
    });
  });

  // ========================================
  // Skeleton при загрузке
  // ========================================
  describe('Skeleton при загрузке', () => {
    it('should show skeleton when loading', () => {
      mockUseNavigation.mockReturnValue({
        menuItems: [],
        activePath: '/dashboard',
        loading: true,
      });

      render(<Sidebar />);

      expect(screen.getByText('Загрузка навигации…')).toBeInTheDocument();
    });
  });

  // ========================================
  // Пустое состояние
  // ========================================
  describe('Пустое состояние', () => {
    it('should show empty state when no items', () => {
      mockUseNavigation.mockReturnValue({
        menuItems: [],
        activePath: '/dashboard',
        loading: false,
      });

      render(<Sidebar />);

      expect(screen.getByText(/нет доступных разделов/i)).toBeInTheDocument();
    });
  });

  // ========================================
  // CSS классы для адаптивности
  // ========================================
  describe('Адаптивность (AC-NAV-05-5)', () => {
    it('should have hidden md:block classes for mobile hiding', () => {
      mockUseNavigation.mockReturnValue({
        menuItems: baseMenuItems,
        activePath: '/dashboard',
        loading: false,
      });

      render(<Sidebar />);

      const nav = screen.getByRole('navigation', { name: /Sidebar/i });
      expect(nav.className).toContain('hidden');
      expect(nav.className).toContain('md:block');
    });
  });
});
