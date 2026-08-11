'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn } from '@/shared/utils/cn';

/**
 * @component MessageInput
 * @category features/comms
 * @description Компонент для ввода и отправки сообщений в диалоге
 *
 * @prop onSendMessage - Callback для отправки сообщения
 * @prop isLoading - Флаг загрузки для блокировки кнопки
 * @prop disabled - Блокировка ввода сообщения
 *
 * @spec
 * - Поддерживает отправку по нажатию Enter (без Shift)
 * - Shift + Enter создает новую строку
 * - Блокирует отправку пустых сообщений
 * - Блокирует кнопку отправки при isLoading
 * - Очищает поле после отправки сообщения
 * - Восстанавливает фокус в textarea после отправки сообщения
 */
export interface MessageInputProps {
  onSendMessage: (content: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  isLoading = false,
  disabled = false
}) => {
  const [message, setMessage] = useState('');
  const [wasSending, setWasSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Восстанавливаем фокус после завершения отправки
  useEffect(() => {
    if (wasSending && !isLoading && textareaRef.current) {
      // Небольшая задержка для предотвращения потери фокуса
      const timer = setTimeout(() => {
        textareaRef.current?.focus();
        setWasSending(false);
      }, 10);
      return () => clearTimeout(timer);
    }
  }, [wasSending, isLoading]);

  // Автоматическое расширение textarea
  const adjustHeight = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, []);

  // Обработчик изменения текста
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    adjustHeight();
  }, [adjustHeight]);

  // Обработчик отправки
  const handleSubmit = useCallback(() => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || isLoading || disabled) return;

    setWasSending(true);
    onSendMessage(trimmedMessage);
    setMessage('');
    
    // Сброс высоты textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [message, isLoading, disabled, onSendMessage]);

  // Обработчик нажатия клавиш
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  return (
    <div className="flex-shrink-0 border-t border-[var(--theme-border-color)] bg-[var(--theme-bg-primary)] px-4 py-3">
      <div className="flex gap-2 max-w-4xl mx-auto">
        <Input
          as="textarea"
          ref={textareaRef}
          value={message}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Напишите сообщение..."
          disabled={isLoading || disabled}
          rows={1}
          autoResize
          className={cn('flex-1 resize-none text-sm leading-relaxed')}
          style={{ maxHeight: '200px' }}
          aria-label="Поле ввода сообщения"
        />

        <Button
          variant="primary"
          size="md"
          type="button"
          onClick={handleSubmit}
          disabled={!message.trim() || isLoading || disabled}
        >
          {isLoading ? (
            <svg
              className="w-5 h-5 animate-spin"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          ) : (
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          )}
        </Button>
      </div>
      
      <p className="text-xs text-[var(--theme-text-secondary)] mt-2 text-center">
        Нажмите <kbd className="px-1 py-0.5 bg-[var(--theme-bg-secondary)] rounded text-xs">Enter</kbd> для отправки,{' '}
        <kbd className="px-1 py-0.5 bg-[var(--theme-bg-secondary)] rounded text-xs">Shift</kbd> +{' '}
        <kbd className="px-1 py-0.5 bg-[var(--theme-bg-secondary)] rounded text-xs">Enter</kbd> для новой строки
      </p>
    </div>
  );
};
