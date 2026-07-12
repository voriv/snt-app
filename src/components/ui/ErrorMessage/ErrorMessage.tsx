/**
 * @component ErrorMessage
 * @category ui
 * @description Компонент для отображения сообщений об ошибках с поддержкой доступности
 *
 * @example
 * ```tsx
 * <ErrorMessage message="Неверный email или пароль" />
 * <ErrorMessage message={null} /> // Скрыть ошибку
 * ```
 *
 * @spec
 * - Отображает сообщение об ошибке с иконкой предупреждения
 * - Имеет aria-live="polite" для скринридеров
 * - При null/undefined сообщении компонент скрыт
 * - Использует красный цвет для визуального акцента
 */
'use client';

import { cn } from '@/shared/utils/cn';

export interface ErrorMessageProps {
  /** Сообщение об ошибке для отображения */
  message: string | null;
  /** Дополнительные CSS-классы для кастомизации */
  className?: string;
}

/**
 * Обработчик отображения сообщения об ошибке
 */
function ErrorMessage({ message, className }: ErrorMessageProps): React.JSX.Element {
  if (!message) {
    return <></>;
  }

  return (
    <div
      role="alert"
      aria-live="polite"
      className={cn(
        'rounded-md bg-red-50 px-4 py-3 text-sm text-red-700 flex items-start gap-2',
        className
      )}
    >
      <svg
        className="h-5 w-5 flex-shrink-0 mt-0.5"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
          clipRule="evenodd"
        />
      </svg>
      <span className="block text-sm font-medium">{message}</span>
    </div>
  );
}

export { ErrorMessage };
