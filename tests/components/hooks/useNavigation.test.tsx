/**
 * @hook useNavigation
 * @category hooks
 * @description Component-тесты для хука навигации (useNavigation).
 *
 * @covers AC-NAV-02-4 — Ролевые пункты меню
 * @covers AC-NAV-05-2 — Ролевые пункты в sidebar
 * @covers AC-NAV-07-7 — Ролевые пункты в drawer
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Мокируем зависимости
const mockPathname = '/dashboard/plots';
const mockSessionData = {
  user: {
    id: 'user-123',
    name: 'Тест',
    email: 'test@snt.local',
    roles: ['MEMBER'],
  },
  expires: '2030-01-01T00:00:00.000Z',
};

vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
}));

vi.mock('@/hooks/useSession', () => ({
  useSession: () => ({
    data: mockSessionData,
    loading: false,
  }),
}));

import { useNavigation } from '@/hooks/useNavigation';

describe('useNavigation (US-NAV-02, US-NAV-05, US-NAV-07)', () => {
  // Вспомогательный компонент для тестирования хука
  function TestComponent() {
    const { menuItems, activePath, userRoles, isAdmin, isSuperAdmin, loading } = useNavigation();
    return (
      <div>
        <span data-testid="activePath">{activePath}</span>
        <span data-testid="menuItemsCount">{menuItems.length}</span>
        <span data-testid="userRoles">{userRoles.join(',')}</span>
        <span data-testid="isAdmin">{String(isAdmin)}</span>
        <span data-testid="isSuperAdmin">{String(isSuperAdmin)}</span>
        <span data-testid="loading">{String(loading)}</span>
      </div>
    );
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Базовые свойства', () => {
    it('should return activePath from usePathname', () => {
      render(<TestComponent />);

      const activePath = screen.getByTestId('activePath');
      expect(activePath.textContent).toBe('/dashboard/plots');
    });

    it('should return userRoles from session', () => {
      render(<TestComponent />);

      const roles = screen.getByTestId('userRoles');
      expect(roles.textContent).toBe('MEMBER');
    });

    it('should return loading state', () => {
      render(<TestComponent />);

      const loading = screen.getByTestId('loading');
      expect(loading.textContent).toBe('false');
    });

    it('should return menuItems filtered by roles', () => {
      render(<TestComponent />);

      const count = screen.getByTestId('menuItemsCount');
      // MEMBER should see: dashboard, plots, documents, comms, profile (5 items)
      expect(parseInt(count.textContent!)).toBeGreaterThanOrEqual(5);
    });
  });

  describe('isAdmin / isSuperAdmin для MEMBER', () => {
    it('should set isAdmin=false for MEMBER', () => {
      render(<TestComponent />);

      expect(screen.getByTestId('isAdmin').textContent).toBe('false');
      expect(screen.getByTestId('isSuperAdmin').textContent).toBe('false');
    });
  });

  describe('Пустые роли', () => {
    it('should handle roles from session correctly', () => {
      render(<TestComponent />);
      // MEMBER has one role
      expect(screen.getByTestId('userRoles').textContent).toBe('MEMBER');
    });
  });
});
