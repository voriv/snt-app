/**
 * @component MessageItem
 * @category features/comms
 * @description Component-тесты для отображения read receipts в сообщениях (B-026, US-39-02)
 *
 * @covers AC-5 (US-39-02): Read receipts видны только для сообщений текущего пользователя
 * @covers AC-1/AC-2 (US-39-02): Галочки для своих DIRECT-сообщений
 * @covers AC-3 (US-39-02): Счётчик для GROUP-сообщений
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MessageItem } from '@/components/features/comms/MessageItem';

// Мокируем ReadReceiptIcon — проверяем только передачу пропсов и наличие
vi.mock('@/components/features/comms/ReadReceiptIcon', () => ({
  ReadReceiptIcon: (props: any) => (
    <div data-testid="read-receipt-icon" data-props={JSON.stringify(props)}>
      receipt
    </div>
  ),
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

describe('MessageItem — read receipts (US-39-02)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // AC-5: сообщения собеседника без read receipts
  it('AC-5: не должен отображать read receipt для сообщения собеседника', () => {
    render(
      <MessageItem
        message={createMessage()}
        currentUserId={CURRENT_USER}
        conversationType="DIRECT"
        readStatus={{ isReadByRecipient: true }}
      />
    );

    expect(screen.queryByTestId('read-receipt-icon')).not.toBeInTheDocument();
  });

  // AC-1/AC-2: должен отображать read receipt для своего сообщения
  it('AC-1/AC-2: должен отображать read receipt для сообщения текущего пользователя', () => {
    render(
      <MessageItem
        message={createMessage({ senderId: CURRENT_USER })}
        currentUserId={CURRENT_USER}
        conversationType="DIRECT"
        readStatus={{ isReadByRecipient: false }}
      />
    );

    expect(screen.getByTestId('read-receipt-icon')).toBeInTheDocument();
  });

  // Читать параметры: isRead, readByCount, totalParticipants, conversationType
  it('должен передавать readStatus и conversationType в ReadReceiptIcon', () => {
    render(
      <MessageItem
        message={createMessage({ senderId: CURRENT_USER })}
        currentUserId={CURRENT_USER}
        conversationType="GROUP"
        readStatus={{
          isReadByRecipient: true,
          readByCount: 2,
          totalParticipants: 5,
        }}
      />
    );

    const icon = screen.getByTestId('read-receipt-icon');
    const props = JSON.parse(icon.getAttribute('data-props')!);
    expect(props.isRead).toBe(true);
    expect(props.readByCount).toBe(2);
    expect(props.totalParticipants).toBe(5);
    expect(props.conversationType).toBe('GROUP');
  });
});
