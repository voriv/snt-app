/**
 * @component ConversationList skeleton
 * @category features/comms
 * @description Component-тесты для скелетона списка диалогов (B-020-T1, R-14)
 *
 * @covers AC-R14-1: при isLoading — 4 блока animate-pulse с аватаром + строками + временем
 * @covers AC-R14-5: animate-pulse класс присутствует
 * @covers AC-R14-6: нет bg-gray-*, bg-white, text-indigo-* в скелетоне
 * @covers AC-R14-7: role="status" aria-live="polite" на контейнере
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ConversationList } from '@/components/features/comms/ConversationList';

// Апи не запрашиваем — данные не нужны для проверки скелетона
vi.mock('@/lib/api-client', () => ({
  apiClient: {
    get: vi.fn(() => new Promise(() => {})), // никогда не резолвится → isLoading=true
  },
}));

// useRouter
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  })),
}));

describe('ConversationList — скелетон (R-14, B-020-T1)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // AC-R14-1: isLoading -> 4 pulsing-блока
  it('AC-R14-1: при isLoading отображает 4 скелетон-блока', () => {
    const { container } = render(<ConversationList />);

    // Контейнер со статусом доступности
    const status = screen.getByRole('status');
    expect(status).toBeInTheDocument();

    // 4 pulsing-блока
    const pulseBlocks = container.querySelectorAll('.animate-pulse');
    expect(pulseBlocks.length).toBe(4);
  });

  // AC-R14-7: role="status" aria-live="polite"
  it('AC-R14-7: контейнер скелетона имеет role="status" и aria-live="polite"', () => {
    render(<ConversationList />);

    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-live', 'polite');
  });

  // AC-R14-5: animate-pulse
  it('AC-R14-5: скелетон использует animate-pulse', () => {
    const { container } = render(<ConversationList />);
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
  });

  // AC-R14-6: нет запрещённых классов в скелетоне
  it('AC-R14-6: скелетон использует CSS-токены и не содержит bg-gray-*/bg-white', () => {
    const { container } = render(<ConversationList />);

    const skeletonBlocks = container.querySelectorAll('.animate-pulse');
    for (const block of Array.from(skeletonBlocks)) {
      const html = block.outerHTML;
      expect(html).not.toMatch(/bg-gray-/);
      expect(html).not.toMatch(/bg-white/);
      expect(html).not.toMatch(/text-indigo-/);
    }

    // токены присутствуют
    expect(container.querySelector('[class*="theme-bg-secondary"]')).toBeInTheDocument();
  });
});
