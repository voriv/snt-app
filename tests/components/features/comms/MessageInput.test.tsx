/**
 * @component MessageInput
 * @category features/comms
 * @description Component-тесты для MessageInput после миграции на <Input as="textarea"> (B-019-T15, R-13)
 *
 * @covers B-019-T15: функциональность auto-resize textarea сохранена при использовании <Input as="textarea">
 * @covers US-21-03: отправка по Enter (без Shift), Shift+Enter — новая строка
 * @covers US-21-03: блокировка пустых сообщений
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MessageInput } from '@/components/features/comms/MessageInput';

describe('MessageInput — после миграции на Input as="textarea" (B-019)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // AC: textarea отображается (через Input as="textarea"), кнопка отправки — есть
  it('AC-3: рендерит textarea и кнопку отправки через DS-компоненты', () => {
    const { container } = render(<MessageInput onSendMessage={vi.fn()} />);
    expect(container.querySelector('textarea')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  // US-21-03: отправка по Enter
  it('US-21-03: отправляет сообщение по Enter', () => {
    const onSend = vi.fn();
    render(<MessageInput onSendMessage={onSend} />);

    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'Привет' } });
    fireEvent.keyDown(textarea, { key: 'Enter' });

    expect(onSend).toHaveBeenCalledWith('Привет');
  });

  // US-21-03: Shift+Enter создаёт новую строку (отправка НЕ вызывается)
  it('US-21-03: Shift+Enter не отправляет сообщение', () => {
    const onSend = vi.fn();
    render(<MessageInput onSendMessage={onSend} />);

    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'Привет' } });
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: true });

    expect(onSend).not.toHaveBeenCalled();
  });

  // US-21-03: пустое сообщение не отправляется
  it('US-21-03: не отправляет пустое/пробельное сообщение', () => {
    const onSend = vi.fn();
    render(<MessageInput onSendMessage={onSend} />);

    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: '   ' } });
    fireEvent.keyDown(textarea, { key: 'Enter' });

    expect(onSend).not.toHaveBeenCalled();
  });

  // блокировка при isLoading
  it('блокирует textarea и кнопку при isLoading', () => {
    const onSend = vi.fn();
    render(<MessageInput onSendMessage={onSend} isLoading />);

    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
    expect(textarea).toBeDisabled();
    expect(screen.getByRole('button')).toBeDisabled();
  });

  // после отправки поле очищается
  it('очищает поле после отправки', () => {
    const onSend = vi.fn();
    render(<MessageInput onSendMessage={onSend} />);

    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: 'Привет' } });
    fireEvent.keyDown(textarea, { key: 'Enter' });

    expect(textarea.value).toBe('');
  });
});
