/**
 * @component ConversationEmptyState
 * @category features/comms
 * @description Component-тесты для ConversationEmptyState после перевода на <EmptyState> DS (B-019-T8, R-22)
 *
 * @covers AC-6 (R-22): ConversationEmptyState использует <EmptyState> DS
 * @covers B-019-T8: CTA-кнопка «Написать сообщение» → /dashboard/comms/messages/new
 */
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConversationEmptyState } from '@/components/features/comms/ConversationEmptyState';

// Мокируем next/navigation useRouter
const pushMock = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}));

describe('ConversationEmptyState — EmptyState DS (B-019-T8)', () => {
  it('AC-6: отображает заголовок и описание EmptyState', () => {
    render(<ConversationEmptyState />);
    expect(screen.getByText('Нет личных диалогов')).toBeInTheDocument();
    expect(screen.getByText('Начните новый диалог')).toBeInTheDocument();
  });

  it('contains CTA button "Написать сообщение"', () => {
    render(<ConversationEmptyState />);
    expect(screen.getByRole('button', { name: 'Написать сообщение' })).toBeInTheDocument();
  });

  it('CTA navigates to /dashboard/comms/messages/new', () => {
    render(<ConversationEmptyState />);
    fireEvent.click(screen.getByRole('button', { name: 'Написать сообщение' }));
    expect(pushMock).toHaveBeenCalledWith('/dashboard/comms/messages/new');
  });
});
