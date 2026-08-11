/**
 * @component MessageItem
 * @category features/comms
 * @description Component-тесты для UX-правки B-022: убран визуальный акцент
 * isLastMessage (R-24/T3). Проверяется, что bg-акцент убран, animate-fade-in
 * сохранён, проп isLastMessage остаётся в интерфейсе.
 *
 * @covers AC-R24-1: в cn() корневого div нет bg-[var(--theme-info)]/10 и подушек
 * @covers AC-R24-2: animate-fade-in сохранён в cn()
 * @covers AC-R24-3 / AC-NEG-01: проп isLastMessage остаётся в MessageItemProps
 */
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MessageItem } from '@/components/features/comms/MessageItem';

vi.mock('@/components/features/comms/ReadReceiptIcon', () => ({
  ReadReceiptIcon: (props: any) => (
    <div data-testid="read-receipt-icon" data-props={JSON.stringify(props)} />
  ),
}));

vi.mock('@/components/ui/ConfirmDialog', () => ({
  ConfirmDialog: () => null,
}));

const CURRENT_USER = 'user-1';
const OTHER_USER = 'user-2';

function createMessage(overrides: any = {}) {
  return {
    id: 'm1',
    conversationId: 'conv-1',
    senderId: OTHER_USER,
    senderName: 'Иван Петров',
    senderEmail: 'ivan@example.com',
    senderAvatarUrl: null,
    content: 'Привет',
    replyToId: null,
    isDeleted: false,
    deletedBy: null,
    deletedAt: null,
    createdAt: '2024-01-15T10:00:00.000Z',
    updatedAt: '2024-01-15T10:00:00.000Z',
    ...overrides,
  };
}

describe('MessageItem — акцент isLastMessage (B-022, R-24/T3)', () => {
  // AC-R24-1: корневой div не должен содержать bg-акцент
  it('AC-R24-1: корневой div не содержит bg-[var(--theme-info)]/10 при isLastMessage', () => {
    const { container } = render(
      <MessageItem
        message={createMessage()}
        currentUserId={CURRENT_USER}
        isLastMessage
      />
    );

    const root = container.querySelector('[role="article"]')!;
    expect(root.className).not.toContain('theme-info');
    expect(root.className).not.toContain('-mx-2 px-2 py-1 rounded-lg');
    // Не содержит подушек, которые были у акцента
    expect(root.className).not.toContain('px-2');
    expect(root.className).not.toContain('py-1');
  });

  // AC-R24-2: animate-fade-in сохранён в cn()
  it('AC-R24-2: animate-fade-in сохранён в cn() корневого div', () => {
    const { container } = render(
      <MessageItem
        message={createMessage()}
        currentUserId={CURRENT_USER}
        isLastMessage
      />
    );

    const root = container.querySelector('[role="article"]')!;
    expect(root.className).toContain('animate-fade-in');
  });

  // AC-R24-3 / AC-NEG-01: isLastMessage остаётся в интерфейсе и не влияет на стили
  it('AC-R24-3: isLastMessage=true не меняет стили (нет bg-акцента), как и при false', () => {
    // Рендер с isLastMessage и без — одинаковый набор классов акцента
    const withLast = render(
      <MessageItem message={createMessage()} currentUserId={CURRENT_USER} isLastMessage />
    );
    const rootLast = withLast.container.querySelector('[role="article"]')!;
    withLast.unmount();

    const withoutLast = render(
      <MessageItem message={createMessage()} currentUserId={CURRENT_USER} />
    );
    const rootPlain = withoutLast.container.querySelector('[role="article"]')!;

    // Ни один не должен содержать bg-акцент
    expect(rootLast.className).not.toContain('theme-info');
    expect(rootPlain.className).not.toContain('theme-info');
    // animate-fade-in присутствует в обоих случаях
    expect(rootLast.className).toContain('animate-fade-in');
    expect(rootPlain.className).toContain('animate-fade-in');
  });

  // AC-R24-3: проп isLastMessage остаётся в интерфейсе (принимается без ошибок типов)
  it('AC-R24-3: компонент принимает isLastMessage и корректно рендерится без него', () => {
    // Передача isLastMessage в обеих формах не ломает рендер → проп в интерфейсе
    render(<MessageItem message={createMessage()} currentUserId={CURRENT_USER} />);
    expect(screen.getByRole('article')).toBeInTheDocument();
  });
});
