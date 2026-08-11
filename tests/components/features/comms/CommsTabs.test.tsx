/**
 * @component CommsTabs
 * @category comms
 * @description Component-тесты для панели вкладок CommsTabs (US-21-36, US-21-37)
 *
 * @covers AC-3 (US-21-36): Панель вкладок с 3-4 табами
 * @covers AC-4 (US-21-36): Переключение вкладок с URL синхронизацией
 * @covers AC-6 (US-21-36): Скрытие «Модерация» для MEMBER
 * @covers AC-7 (US-21-36): «Модерация» для ADMIN/SUPER_ADMIN
 * @covers AC-1 (US-21-37): Бейдж на «Личные сообщения»
 * @covers AC-2 (US-21-37): Бейдж на «Групповые чаты»
 * @covers AC-3 (US-21-37): Скрытие бейджа при 0
 * @covers AC-4 (US-21-37): Нет бейджа на «Объявления»
 *
 * @spec
 * - 4 вкладки для ADMIN (messages, chats, announcements, moderation)
 * - 3 вкладки для MEMBER (без moderation)
 * - tablist ARIA
 * - Бейджи на messages и chats
 * - Нет бейджа на announcements и moderation
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CommsTabs } from '@/components/features/comms/CommsTabs';

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

// Мокируем useUnreadCounts (B-027) — единый хук загрузки счётчиков вместо inline useEffect
const mockUseUnreadCounts = vi.fn();
vi.mock('@/hooks/useUnreadCounts', () => ({
  useUnreadCounts: (...args: unknown[]) => mockUseUnreadCounts(...args),
}));

function defaultUnreadHook() {
  return { counts: null, loading: true, error: null };
}

function mockUnreadCounts(counts: { messages: number; chats: number } | null, loading = false) {
  mockUseUnreadCounts.mockReturnValue({
    counts,
    loading,
    error: null,
  });
}

function renderCommsTabs(props: any = {}) {
  const defaultProps = {
    activeTab: 'messages',
    userRoles: ['MEMBER'],
    ...props,
  };
  return render(<CommsTabs {...defaultProps} />);
}

describe('CommsTabs (US-21-36, US-21-37)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseUnreadCounts.mockImplementation(() => defaultUnreadHook());
  });

  // AC-3 (US-21-36): Панель вкладок
  describe('AC-3: Панель вкладок', () => {
    it('should render tablist', () => {
      renderCommsTabs();
      expect(screen.getByRole('tablist')).toBeInTheDocument();
    });

    it('should render 3 tabs for MEMBER', () => {
      renderCommsTabs({ userRoles: ['MEMBER'] });
      const tabs = screen.getAllByRole('tab');
      expect(tabs).toHaveLength(3);
    });

    it('AC-7: should render 4 tabs for ADMIN', () => {
      renderCommsTabs({ userRoles: ['ADMIN'] });
      const tabs = screen.getAllByRole('tab');
      expect(tabs).toHaveLength(4);
    });

    it('AC-7: should render 4 tabs for SUPER_ADMIN', () => {
      renderCommsTabs({ userRoles: ['SUPER_ADMIN'] });
      const tabs = screen.getAllByRole('tab');
      expect(tabs).toHaveLength(4);
    });

    it('AC-6: should not render moderation tab for MEMBER', () => {
      renderCommsTabs({ userRoles: ['MEMBER'] });
      expect(screen.queryByText('Модерация')).not.toBeInTheDocument();
    });

    it('AC-7: should render moderation tab for ADMIN', () => {
      renderCommsTabs({ userRoles: ['ADMIN'] });
      expect(screen.getByText('Модерация')).toBeInTheDocument();
    });

    it('should render all tab labels', () => {
      renderCommsTabs();
      expect(screen.getByText('Личные сообщения')).toBeInTheDocument();
      expect(screen.getByText('Групповые чаты')).toBeInTheDocument();
      expect(screen.getByText('Объявления')).toBeInTheDocument();
    });
  });

  // AC-4 (US-21-36): Active tab
  describe('AC-4: Активная вкладка', () => {
    it('should mark messages tab as active when activeTab is messages', () => {
      renderCommsTabs({ activeTab: 'messages' });
      const messagesTab = screen.getByRole('tab', { name: /Личные сообщения/i });
      expect(messagesTab).toHaveAttribute('aria-selected', 'true');
    });

    it('should mark chats tab as active when activeTab is chats', () => {
      renderCommsTabs({ activeTab: 'chats' });
      const chatsTab = screen.getByRole('tab', { name: /Групповые чаты/i });
      expect(chatsTab).toHaveAttribute('aria-selected', 'true');
    });

    it('should mark announcements tab as active when activeTab is announcements', () => {
      renderCommsTabs({ activeTab: 'announcements' });
      const announcementsTab = screen.getByRole('tab', { name: /Объявления/i });
      expect(announcementsTab).toHaveAttribute('aria-selected', 'true');
    });
  });

  // AC-1, AC-2 (US-21-37): Бейджи
  describe('Badges (US-21-37)', () => {
    it('AC-1: should show badge on messages tab when counts loaded', () => {
      mockUnreadCounts({ messages: 5, chats: 3 });
      renderCommsTabs();
      const messagesTab = screen.getByRole('tab', { name: /Личные сообщения/i });
      expect(messagesTab).toHaveTextContent('5');
    });

    it('AC-2: should show badge on chats tab when counts loaded', () => {
      mockUnreadCounts({ messages: 5, chats: 3 });
      renderCommsTabs();
      const chatsTab = screen.getByRole('tab', { name: /Групповые чаты/i });
      expect(chatsTab).toHaveTextContent('3');
    });

    it('AC-3: should hide badge when count is 0', () => {
      mockUnreadCounts({ messages: 0, chats: 0 });
      renderCommsTabs();
      const messagesTab = screen.getByRole('tab', { name: /Личные сообщения/i });
      expect(messagesTab).not.toHaveTextContent('0');
    });

    it('AC-4: should not show badge on announcements tab', () => {
      mockUnreadCounts({ messages: 5, chats: 3 });
      renderCommsTabs();
      const announcementsLink = screen.getByRole('tab', { name: /Объявления/i });
      expect(announcementsLink).not.toHaveTextContent('5');
      expect(announcementsLink).not.toHaveTextContent('3');
    });
  });

  // URL навигация
  describe('URL navigation', () => {
    it('should have correct href for messages tab', () => {
      renderCommsTabs();
      const messagesTab = screen.getByRole('tab', { name: /Личные сообщения/i });
      expect(messagesTab).toHaveAttribute('href', '/dashboard/comms/messages');
    });

    it('should have correct href for chats tab', () => {
      renderCommsTabs();
      const chatsTab = screen.getByRole('tab', { name: /Групповые чаты/i });
      expect(chatsTab).toHaveAttribute('href', '/dashboard/comms/chats');
    });

    it('should have correct href for announcements tab', () => {
      renderCommsTabs();
      const announcementsTab = screen.getByRole('tab', { name: /Объявления/i });
      expect(announcementsTab).toHaveAttribute('href', '/dashboard/comms/announcements');
    });
  });
});
