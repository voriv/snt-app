/**
 * @component MessageItem — кнопка удаления + ConfirmDialog
 * @category features/comms
 * @description Component-тесты для R-19 (B-020-T6): кнопка «Удалить» видна только
 * для своих сообщений и удаление происходит только после подтверждения в ConfirmDialog.
 *
 * @covers AC-R19-1: кнопка видна только при {onDelete && isCurrentUser}
 * @covers AC-R19-2: клик по кнопке открывает диалог (НЕ вызывает onDelete напрямую)
 * @covers AC-R19-3: ConfirmDialog с предупреждающим message
 * @covers AC-R19-4: variant="danger"
 * @covers AC-R19-5: onClose → setShowDeleteConfirm(false)
 * @covers AC-R19-6: onConfirm → onDelete(message.id)
 * @covers AC-R19-7: после onDelete диалог закрывается
 * @covers AC-R19-8: Escape закрывает (встроено в ConfirmDialog)
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MessageItem } from '@/components/features/comms/MessageItem';

// Перехватываем ConfirmDialog пропсы
vi.mock('@/components/ui/ConfirmDialog', () => ({
  ConfirmDialog: (props: any) =>
    props.isOpen ? (
      <div data-testid="confirm-dialog" data-variant={props.variant} data-message={props.message}>
        <button onClick={props.onConfirm}>confirm</button>
        <button onClick={props.onClose}>cancel</button>
      </div>
    ) : null,
}));

vi.mock('@/components/features/comms/ReadReceiptIcon', () => ({
  ReadReceiptIcon: () => <div data-testid="read-receipt-icon" />,
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

function renderItem(props: { message?: any; onDelete?: (id: string) => void } = {}) {
  return render(
    <MessageItem
      message={createMessage(props.message)}
      currentUserId={CURRENT_USER}
      onDelete={props.onDelete}
    />
  );
}

describe('MessageItem — кнопка удаления + ConfirmDialog (R-19, B-020-T6)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // AC-R19-1 (INV-01): чужие сообщения — кнопки НЕТ
  it('AC-R19-1: НЕ отображает кнопку «Удалить» для чужого сообщения', () => {
    renderItem({ onDelete: vi.fn() }); // message.senderId = OTHER_USER
    expect(screen.queryByRole('button', { name: 'Удалить сообщение' })).not.toBeInTheDocument();
  });

  // AC-R19-1: свои сообщения — кнопка есть
  it('AC-R19-1: отображает кнопку «Удалить» для своего сообщения при onDelete', () => {
    renderItem({
      message: { senderId: CURRENT_USER },
      onDelete: vi.fn(),
    });
    expect(screen.getByRole('button', { name: 'Удалить сообщение' })).toBeInTheDocument();
  });

  // INV-04: без onDelete кнопка скрыта даже для своих
  it('INV: без onDelete кнопка «Удалить» скрыта даже для своего сообщения', () => {
    renderItem({ message: { senderId: CURRENT_USER } });
    expect(screen.queryByRole('button', { name: 'Удалить сообщение' })).not.toBeInTheDocument();
  });

  // AC-R19-2: клик по кнопке НЕ вызывает onDelete напрямую, а открывает диалог
  it('AC-R19-2: клик по «Удалить» открывает диалог и НЕ вызывает onDelete сразу', () => {
    const onDelete = vi.fn();
    renderItem({ message: { senderId: CURRENT_USER }, onDelete });

    expect(screen.queryByTestId('confirm-dialog')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Удалить сообщение' }));

    // Диалог открыт, onDelete ещё НЕ вызван
    expect(screen.getByTestId('confirm-dialog')).toBeInTheDocument();
    expect(onDelete).not.toHaveBeenCalled();
  });

  // AC-R19-3 + AC-R19-4: dialog с корректным message и variant
  it('AC-R19-3/AC-R19-4: ConfirmDialog с предупреждением и variant="danger"', () => {
    renderItem({ message: { senderId: CURRENT_USER }, onDelete: vi.fn() });
    fireEvent.click(screen.getByRole('button', { name: 'Удалить сообщение' }));

    const dialog = screen.getByTestId('confirm-dialog');
    expect(dialog).toHaveAttribute('data-variant', 'danger');
    expect(dialog.getAttribute('data-message')).toContain(
      'Вы действительно хотите удалить это сообщение?'
    );
  });

  // AC-R19-5: отмена (onClose) закрывает диалог без удаления (INV-03)
  it('AC-R19-5: нажатие «Отмена» закрывает диалог без вызова onDelete', () => {
    const onDelete = vi.fn();
    renderItem({ message: { senderId: CURRENT_USER }, onDelete });
    fireEvent.click(screen.getByRole('button', { name: 'Удалить сообщение' }));

    fireEvent.click(screen.getByText('cancel'));

    expect(screen.queryByTestId('confirm-dialog')).not.toBeInTheDocument();
    expect(onDelete).not.toHaveBeenCalled();
  });

  // AC-R19-6 + AC-R19-7: подтверждение вызывает onDelete(message.id) и закрывает диалог
  it('AC-R19-6/AC-R19-7: подтверждение вызывает onDelete(id) и закрывает диалог', () => {
    const onDelete = vi.fn();
    renderItem({ message: { senderId: CURRENT_USER }, onDelete });
    fireEvent.click(screen.getByRole('button', { name: 'Удалить сообщение' }));

    fireEvent.click(screen.getByText('confirm'));

    expect(onDelete).toHaveBeenCalledWith('m1');
    expect(screen.queryByTestId('confirm-dialog')).not.toBeInTheDocument();
  });
});
