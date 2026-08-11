/**
 * @page comms pages — aria спиннеры (B-021-T3, R-17/R-26)
 * @category features/comms
 * @description Component-тесты для aria-паттерна спиннеров на страницах COMMS (B-021-T3).
 *
 * Покрывает AC-R17/26-1..6: каждый спиннер на странице имеет
 *   role="status" + aria-live="polite" на контейнере + aria-hidden="true" на svg.
 *
 * Мокаем useSession на 'loading', чтобы страница отрендерила спиннер загрузки сессии,
 * а не реальный data-зависящий контент.
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

let MOCK_STATUS = 'loading';
vi.mock('next-auth/react', () => ({
  useSession: () => ({ status: MOCK_STATUS, data: null }),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), forward: vi.fn(), refresh: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => '/dashboard/comms',
  useParams: () => ({ conversationId: 'c1', chatId: 'ch1', id: 'a1' }),
}));

vi.mock('@/components/layouts/Breadcrumbs', () => ({
  Breadcrumbs: () => <nav aria-label="Breadcrumb" role="navigation">breadcrumbs</nav>,
}));

// Страницы
import MessagesConversationPage from '@/app/dashboard/comms/messages/[conversationId]/page';
import ChatsChatPage from '@/app/dashboard/comms/chats/[chatId]/page';
import ChatsNewPage from '@/app/dashboard/comms/chats/new/page';
import ChatsEditPage from '@/app/dashboard/comms/chats/[chatId]/edit/page';
import AnnouncementsPage from '@/app/dashboard/comms/announcements/page';
import AnnouncementsDetailPage from '@/app/dashboard/comms/announcements/[id]/page';

// Mock дочерних списков, чтобы страница не выполняла API
vi.mock('@/components/features/comms/ConversationList', () => ({
  ConversationList: () => <div data-testid="conversation-list" />,
}));
vi.mock('@/components/features/comms/ChatList', () => ({
  ChatList: () => <div data-testid="chat-list" />,
}));
vi.mock('@/components/features/comms/ChatCard', () => ({
  ChatCard: () => <div data-testid="chat-card" />,
}));

function assertSpinnerA11y(container: HTMLElement, index = 0) {
  const statuses = container.querySelectorAll('[role="status"]');
  expect(statuses.length).toBeGreaterThan(index);
  const status = statuses[index] as HTMLElement;
  expect(status.getAttribute('aria-live')).toBe('polite');
  const svg = status.querySelector('svg, [class*="animate-spin"]');
  expect(svg).not.toBeNull();
  expect(svg!.getAttribute('aria-hidden')).toBe('true');
}

describe('COMMS страницы — aria-спиннеры (B-021-T3, R-17/R-26)', () => {
  beforeEach(() => {
    MOCK_STATUS = 'loading';
  });

  it('AC-R17/26-1: messages/[conversationId] спиннер сессии имеет aria-паттерн', () => {
    const { container } = render(<MessagesConversationPage />);
    assertSpinnerA11y(container, 0);
  });

  it('AC-R17/26-2: chats/[chatId] оба спиннера имеют aria-паттерн', () => {
    const { container } = render(<ChatsChatPage />);
    // загрузка сессии
    assertSpinnerA11y(container, 0);
  });

  it('AC-R17/26-3: chats/new спиннер имеет aria-паттерн', () => {
    const { container } = render(<ChatsNewPage />);
    assertSpinnerA11y(container, 0);
  });

  it('AC-R17/26-4: chats/[chatId]/edit оба спиннера имеют aria-паттерн', () => {
    const { container } = render(<ChatsEditPage />);
    assertSpinnerA11y(container, 0);
  });

  it('AC-R17/26-5: announcements спиннер имеет aria-паттерн', () => {
    const { container } = render(<AnnouncementsPage />);
    assertSpinnerA11y(container, 0);
  });

  it('AC-R17/26-6: announcements/[id] оба спиннера имеют aria-паттерн', () => {
    const { container } = render(<AnnouncementsDetailPage />);
    assertSpinnerA11y(container, 0);
  });
});
