/**
 * @component EditChatForm
 * @category features/comms
 * @description Component-тесты для EditChatForm после миграции на DS-компоненты (B-019-T12, R-13)
 *
 * @covers B-019-T12: <input> → <Input>, <textarea> → <Input as="textarea">, <button> → <Button>
 * @covers B-019-T2 (R-23): кастомная ошибка → <ErrorMessage>
 * @covers US-21-06: валидация названия (мин 2 символа), PATCH /chats/:id
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EditChatForm } from '@/components/features/comms/EditChatForm';
import type { Conversation } from '@/domains/comms/comms.types';

const mockPatch = vi.fn();
vi.mock('@/lib/api-client', () => ({
  apiClient: {
    patch: (...args: unknown[]) => mockPatch(...args),
  },
}));

const onSaved = vi.fn();
const onCancel = vi.fn();

function renderForm(overrides: Record<string, unknown> = {}) {
  return render(
    <EditChatForm
      chatId="chat-1"
      initialName="Мой чат"
      initialDescription="Описание"
      onSaved={onSaved}
      onCancel={onCancel}
      {...overrides}
    />
  );
}

const conversation = {
  id: 'chat-1',
  title: 'Мой чат',
  description: 'Описание',
} as Conversation;

describe('EditChatForm — DS миграция (B-019)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPatch.mockReset();
  });

  // B-019-T12: название через <Input label="Название чата">
  it('рендерит название через <Input>', () => {
    renderForm();
    expect(screen.getByLabelText('Название чата')).toBeInTheDocument();
  });

  // B-019-T12: описание через <Input as="textarea">
  it('рендерит описание через <Input as="textarea">', () => {
    const { container } = renderForm();
    expect(container.querySelector('textarea')).toBeInTheDocument();
  });

  // кнопки DS: «Отмена» (secondary) и «Сохранить» (primary)
  it('содержит кнопки «Отмена» и «Сохранить»', () => {
    renderForm();
    expect(screen.getByRole('button', { name: 'Отмена' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Сохранить' })).toBeInTheDocument();
  });

  // US-21-06: не отправляет при названии < 2 символов, показывает валидацию
  it('валидация: название короче 2 символов → ошибка', async () => {
    renderForm({ initialName: 'A' });
    fireEvent.click(screen.getByRole('button', { name: 'Сохранить' }));
    expect(screen.getByRole('alert')).toHaveTextContent(/минимум 2 символа/i);
    expect(mockPatch).not.toHaveBeenCalled();
  });

  // US-21-06: успешное сохранение вызывает PATCH и onSaved
  it('успешное сохранение: PATCH /chats/:id и onSaved', async () => {
    mockPatch.mockResolvedValue({ success: true, data: conversation });
    renderForm();

    fireEvent.click(screen.getByRole('button', { name: 'Сохранить' }));

    await waitFor(() => {
      expect(mockPatch).toHaveBeenCalledWith('/chats/chat-1', {
        name: 'Мой чат',
        description: 'Описание',
      });
    });
    await waitFor(() => expect(onSaved).toHaveBeenCalledWith(conversation));
  });

  // R-23: ошибка сохранения → <ErrorMessage>
  it('рендерит ошибку через <ErrorMessage> при сбое PATCH', async () => {
    mockPatch.mockResolvedValue({ success: false, error: { message: 'Ошибка сервера' } });
    renderForm();

    fireEvent.click(screen.getByRole('button', { name: 'Сохранить' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Ошибка сервера');
    });
  });

  // Отмена вызывает onCancel
  it('«Отмена» вызывает onCancel', () => {
    renderForm();
    fireEvent.click(screen.getByRole('button', { name: 'Отмена' }));
    expect(onCancel).toHaveBeenCalled();
  });
});
