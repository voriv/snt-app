/**
 * @component CommsTab
 * @category comms
 * @description Component-тесты для вкладки CommsTab (US-21-36, US-21-37)
 *
 * @covers AC-3 (US-21-36): Панель вкладок с 3-4 табами
 * @covers AC-3 (US-21-37): Скрытие бейджа при 0
 * @covers AC-4 (US-21-37): Нет бейджа на «Объявления»
 *
 * @spec
 * - Рендер вкладки с label и icon
 * - Ссылка href корректна
 * - АRIA role="tab" и aria-selected
 * - Бейдж скрыт при badgeCount=0
 * - Бейдж показывает число при badgeCount > 0
 * - Бейдж показывает "99+" при badgeCount > 99
 * - Активная вкладка выделена
 */
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CommsTab } from '@/components/features/comms/CommsTab';

// Мокируем Next.js Link
vi.mock('next/link', () => ({
  default: ({ children, href, role, 'aria-selected': ariaSelected, className }: any) => {
    return (
      <a href={href} role={role} aria-selected={ariaSelected} className={className} data-href={href}>
        {children}
      </a>
    );
  },
}));

function renderCommsTab(props: any = {}) {
  const defaultProps = {
    href: '/dashboard/comms/messages',
    label: 'Личные сообщения',
    icon: <span data-testid="tab-icon">📩</span>,
    active: false,
    ...props,
  };
  return render(<CommsTab {...defaultProps} />);
}

describe('CommsTab (US-21-36, US-21-37)', () => {
  // Рендеринг
  describe('Рендеринг', () => {
    it('should render tab with label', () => {
      renderCommsTab();
      expect(screen.getByText('Личные сообщения')).toBeInTheDocument();
    });

    it('should render tab with icon', () => {
      renderCommsTab();
      expect(screen.getByTestId('tab-icon')).toBeInTheDocument();
    });

    it('should render link with correct href', () => {
      renderCommsTab({ href: '/dashboard/comms/chats' });
      expect(screen.getByRole('tab', { name: /Личные сообщения/i })).toHaveAttribute('href', '/dashboard/comms/chats');
    });
  });

  // ARIA атрибуты
  describe('ARIA', () => {
    it('should have role=tab', () => {
      renderCommsTab();
      expect(screen.getByRole('tab')).toHaveAttribute('role', 'tab');
    });

    it('should have aria-selected=false when inactive', () => {
      renderCommsTab({ active: false });
      expect(screen.getByRole('tab')).toHaveAttribute('aria-selected', 'false');
    });

    it('should have aria-selected=true when active', () => {
      renderCommsTab({ active: true });
      expect(screen.getByRole('tab')).toHaveAttribute('aria-selected', 'true');
    });
  });

  // AC-3 (US-21-37): Скрытие бейджа при 0
  describe('Badge (US-21-37)', () => {
    it('AC-3: should not show badge when badgeCount is 0', () => {
      renderCommsTab({ badgeCount: 0 });
      // Проверяем что нет бейджа (числа в круглом бейдже)
      expect(screen.queryByText('0')).not.toBeInTheDocument();
    });

    it('AC-3: should not show badge when badgeCount is undefined', () => {
      renderCommsTab({ badgeCount: undefined });
      expect(screen.queryByText('0')).not.toBeInTheDocument();
    });

    it('AC-1: should show badge with count when badgeCount > 0', () => {
      renderCommsTab({ badgeCount: 5 });
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('AC-2: should show badge with count for chats tab', () => {
      renderCommsTab({ label: 'Групповые чаты', badgeCount: 3 });
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('EC-1: should show 99+ when badgeCount > 99', () => {
      renderCommsTab({ badgeCount: 150 });
      expect(screen.getByText('99+')).toBeInTheDocument();
    });

    it('EC-1: should show 99+ when badgeCount is exactly 100', () => {
      renderCommsTab({ badgeCount: 100 });
      expect(screen.getByText('99+')).toBeInTheDocument();
    });

    it('should show exact count when badgeCount is 99', () => {
      renderCommsTab({ badgeCount: 99 });
      expect(screen.getByText('99')).toBeInTheDocument();
    });

    it('AC-4: should not show badge on announcements tab', () => {
      renderCommsTab({ label: 'Объявления', badgeCount: undefined });
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });
  });
});
