/**
 * @component Input
 * @category ui
 * @description Базовый компонент поля ввода с поддержкой label, ошибок и accessibility
 *
 * @example
 * ```tsx
 * <Input label="Email" type="email" id="email" />
 * <Input label="Пароль" type="password" id="password" error="Пароль обязателен" />
 * ```
 *
 * @spec
 * - Отображение label: если передан, показывается над полем
 * - Отображение ошибки: если передан error, показывается сообщение под полем
 * - Accessibility: aria-invalid="true" при наличии ошибки, aria-describedby ссылается на id сообщения ошибки
 * - Подсветка ошибки: красная рамка и текст при наличии error
 * - Focus management: focus-ring через Tailwind classes
 */
'use client';

import { forwardRef, InputHTMLAttributes } from 'react';
import { cn } from '@/shared/utils';

/**
 * @interface InputProps
 * @description Props для компонента Input
 */
export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Label для поля ввода */
  label?: string;
  /** Сообщение об ошибке. При наличии — включается режим отображения ошибки */
  error?: string;
}

/**
 * @component Input
 * @description Базовый компонент поля ввода с поддержкой label, ошибок и accessibility
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? `${inputId}-error` : undefined}
          className={cn(
            'block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2',
            error && 'border-red-300 text-red-900 placeholder-red-300 focus:border-red-500 focus:ring-red-500',
            className,
          )}
          {...props}
        />
        {error && (
          <p id={`${inputId}-error`} className="mt-1 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';
