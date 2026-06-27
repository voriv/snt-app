import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Типы предупреждений.
 *
 * @public
 */
export type AlertType = 'info' | 'success' | 'warning' | 'error';

/**
 * Пропсы для компонента Alert.
 *
 * @public
 */
export interface AlertProps {
  /** Тип предупреждения */
  type?: AlertType;
  /** Заголовок сообщения */
  title?: string;
  /** Основное сообщение */
  message: string;
  /** Дополнительные классы Tailwind */
  className?: string;
  /** Действие при клике (опционально) */
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * Компонент для отображения сообщений об ошибках, уведомлениях и предупреждениях.
 *
 * @public
 */
export function Alert({
  type = 'info',
  title,
  message,
  className,
  action,
}: AlertProps): React.ReactElement {
  const colors = {
    info: {
      border: 'border-blue-300',
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      icon: (
        <svg
          className="h-5 w-5 flex-shrink-0"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
            clipRule="evenodd"
          />
        </svg>
      ),
    },
    success: {
      border: 'border-green-300',
      bg: 'bg-green-50',
      text: 'text-green-700',
      icon: (
        <svg
          className="h-5 w-5 flex-shrink-0"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
      ),
    },
    warning: {
      border: 'border-yellow-300',
      bg: 'bg-yellow-50',
      text: 'text-yellow-700',
      icon: (
        <svg
          className="h-5 w-5 flex-shrink-0"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l6.019 10.705c.764 1.359-.186 3.097-1.742 3.097H3.983c-1.556 0-2.506-1.738-1.742-3.097L8.257 3.1zM11 11a1 1 0 11-2 0v3a1 1 0 112 0v-3zm-1-4a1 1 0 100 2 1 1 0 000-2z"
            clipRule="evenodd"
          />
        </svg>
      ),
    },
    error: {
      border: 'border-red-300',
      bg: 'bg-red-50',
      text: 'text-red-700',
      icon: (
        <svg
          className="h-5 w-5 flex-shrink-0"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a1 1 0 00-1.414 1.414L8.586 10l-1.72 1.788a1 1 0 101.414 1.414L10 11.414l1.788 1.788a1 1 0 101.414-1.414L11.414 10l1.788-1.788a1 1 0 10-1.414-1.414L10 8.586 8.28 7.22z"
            clipRule="evenodd"
          />
        </svg>
      ),
    },
  };

  const currentColors = colors[type];

  return (
    <div
      role="alert"
      className={cn(
        'flex w-full items-start gap-3 rounded-lg border px-4 py-3 text-sm',
        currentColors.border,
        currentColors.bg,
        currentColors.text,
        className
      )}
    >
      <div className="flex-shrink-0">{currentColors.icon}</div>
      <div className="flex-1">
        {title && <p className="font-medium">{title}</p>}
        <p className={title ? 'mt-1' : ''}>{message}</p>
      </div>
      {action && (
        <button
          onClick={action.onClick}
          className="ml-4 inline-flex items-center rounded font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-current"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
