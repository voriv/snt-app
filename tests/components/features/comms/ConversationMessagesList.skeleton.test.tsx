/**
 * @component ConversationMessagesList skeleton
 * @category features/comms
 * @description Component-тесты для скелетона сообщений (B-020-T2, R-14)
 *
 * @covers AC-R14-2: при isLoading — 3 блока animate-pulse с аватаром + пузырьком
 * @covers AC-R14-5: animate-pulse класс присутствует
 * @covers AC-R14-6: нет bg-gray-*, bg-white, text-indigo-* в скелетоне
 * @covers AC-R14-7: role="status" aria-live="polite" на контейнере
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { ConversationMessagesList } from '@/components/features/comms/ConversationMessagesList';

// IntersectionObserver не реализован в jsdom
class MockIntersectionObserver {
  root = null;
  rootMargin = '';
  thresholds = [];
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  takeRecords = vi.fn(() => []);
}
vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);

// Мок MessageItem — не нужен для проверки скелетона
vi.mock('@/components/features/comms/MessageItem', () => ({
  MessageItem: () => <div data-testid="msg-item" />,
}));

const CURRENT_USER = 'user-1';

describe('ConversationMessagesList — скелетон (R-14, B-020-T2)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cleanup();
  });

  // AC-R14-2: isLoading=true -> 3 pulsing-блока
  it('AC-R14-2: при isLoading отображает 3 скелетон-блока', () => {
    const { container } = render(
      <ConversationMessagesList
        messages={[{ id: 'm1' } as any]}
        currentUserId={CURRENT_USER}
        isLoading
      />
    );

    const status = screen.getByRole('status');
    expect(status).toBeInTheDocument();
    expect(container.querySelectorAll('.animate-pulse').length).toBe(3);
  });

  // AC-R14-7
  it('AC-R14-7: контейнер скелетона имеет role="status" aria-live="polite"', () => {
    render(
      <ConversationMessagesList
        messages={[{ id: 'm1' } as any]}
        currentUserId={CURRENT_USER}
        isLoading
      />
    );
    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-live', 'polite');
  });

  // AC-R14-5
  it('AC-R14-5: скелетон использует animate-pulse', () => {
    const { container } = render(
      <ConversationMessagesList
        messages={[{ id: 'm1' } as any]}
        currentUserId={CURRENT_USER}
        isLoading
      />
    );
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
  });

  // AC-R14-6: нет запрещённых классов
  it('AC-R14-6: скелетон использует CSS-токены и не содержит bg-gray-*/bg-white', () => {
    const { container } = render(
      <ConversationMessagesList
        messages={[{ id: 'm1' } as any]}
        currentUserId={CURRENT_USER}
        isLoading
      />
    );

    const blocks = container.querySelectorAll('.animate-pulse');
    for (const block of Array.from(blocks)) {
      const html = block.outerHTML;
      expect(html).not.toMatch(/bg-gray-/);
      expect(html).not.toMatch(/bg-white/);
      expect(html).not.toMatch(/text-indigo-/);
    }
  });
});
