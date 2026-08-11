/**
 * @page comms pages skeleton
 * @category features/comms
 * @description Component-тесты для скелетонов страниц COMMS (B-020-T3/T4, R-14) и
 * наличия Breadcrumbs на страницах (B-020-T5, R-15).
 *
 * @covers AC-R14-3: messages/page.tsx скелетон при loading (role="status" aria-live="polite")
 * @covers AC-R14-4: chats/page.tsx скелетон при loading
 * @covers AC-R14-5..7: animate-pulse + токены + доступность
 * @covers AC-R15-1: <Breadcrumbs /> присутствует на странице (после авторизации)
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import MessagesPage from '@/app/dashboard/comms/messages/page';
import ChatsPage from '@/app/dashboard/comms/chats/page';

// Скелетон страниц рендерится из useSession({status})
let MOCK_STATUS = 'loading';
vi.mock('next-auth/react', () => ({
  useSession: () => ({ status: MOCK_STATUS, data: null }),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), forward: vi.fn(), refresh: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => '/dashboard/comms/messages',
}));

vi.mock('@/components/layouts/Breadcrumbs', () => ({
  Breadcrumbs: () => <nav aria-label="Breadcrumb" role="navigation">breadcrumbs</nav>,
}));

// Mock дочерних списков
vi.mock('@/components/features/comms/ConversationList', () => ({
  ConversationList: () => <div data-testid="conversation-list" />,
}));
vi.mock('@/components/features/comms/ChatList', () => ({
  ChatList: () => <div data-testid="chat-list" />,
}));

describe('COMMS страницы — скелетоны (B-020-T3/T4, R-14)', () => {
  beforeEach(() => {
    MOCK_STATUS = 'loading';
    vi.clearAllMocks();
  });

  // AC-R14-3: messages page при loading показывает скелетон
  it('AC-R14-3: messages/page показывает скелетон при status=loading', () => {
    const { container } = render(<MessagesPage />);

    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-live', 'polite');
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
    // скелетон, а не реальный список
    expect(screen.queryByTestId('conversation-list')).not.toBeInTheDocument();
  });

  // AC-R14-4: chats page при loading показывает скелетон
  it('AC-R14-4: chats/page показывает скелетон при status=loading', () => {
    const { container } = render(<ChatsPage />);

    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-live', 'polite');
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
    expect(screen.queryByTestId('chat-list')).not.toBeInTheDocument();
  });

  // AC-R15-1: при authenticated страницы рендерят Breadcrumbs
  it('AC-R15-1: messages/page рендерит <Breadcrumbs /> при authenticated', () => {
    MOCK_STATUS = 'authenticated';
    render(<MessagesPage />);
    expect(screen.getByRole('navigation', { name: /Breadcrumb/i })).toBeInTheDocument();
    expect(screen.getByTestId('conversation-list')).toBeInTheDocument();
  });

  it('AC-R15-1: chats/page рендерит <Breadcrumbs /> при authenticated', () => {
    MOCK_STATUS = 'authenticated';
    render(<ChatsPage />);
    expect(screen.getByRole('navigation', { name: /Breadcrumb/i })).toBeInTheDocument();
    expect(screen.getByTestId('chat-list')).toBeInTheDocument();
  });
});
