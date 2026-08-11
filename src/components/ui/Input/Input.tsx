/**
 * @component Input
 * @category ui
 * @description Базовый компонент поля ввода с поддержкой label, ошибок и accessibility.
 * Поддерживает рендер `<input>` (по умолчанию) и `<textarea>` через `as="textarea"`.
 *
 * @example
 * ```tsx
 * <Input label="Email" type="email" id="email" />
 * <Input label="Пароль" type="password" id="password" error="Пароль обязателен" />
 * <Input as="textarea" label="Описание" rows={3} />
 * <Input as="textarea" autoResize placeholder="Сообщение" />
 * ```
 *
 * @spec
 * - Отображение label: если передан, показывается над полем
 * - Отображение ошибки: если передан error, показывается сообщение под полем
 * - Accessibility: aria-invalid="true" при наличии ошибки, aria-describedby ссылается на id сообщения ошибки
 * - Подсветка ошибки: красная рамка и текст при наличии error
 * - Focus management: focus-ring через Tailwind classes
 * - as="textarea": условный рендер textarea, наследует TextareaHTMLAttributes
 * - autoResize: авто-высота textarea по содержимому (только при as="textarea")
 */
'use client';

import { forwardRef } from 'react';
import { cn } from '@/shared/utils';

/**
 * Базовые пропсы, общие для input и textarea.
 */
export type InputBaseProps = {
  /** Тип рендера. "textarea" — рендер `<textarea>`, undefined — `<input>` (backward compatible) */
  as?: 'textarea';
  /** Label для поля ввода */
  label?: string;
  /** Сообщение об ошибке. При наличии — включается режим отображения ошибки */
  error?: string;
  /** Авто-высота textarea под содержимое (работает только при as="textarea") */
  autoResize?: boolean;
};

/**
 * Обработчики событий, расширенные на оба типа элемента (input | textarea),
 * чтобы сохранить backward compatibility для всех существующих потребителей,
 * передающих `onChange={(e) => ...}` без аннотации типа.
 */
type InputEventProps = {
  onChange?: React.ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement>;
  onKeyDown?: React.KeyboardEventHandler<HTMLInputElement | HTMLTextAreaElement>;
  onKeyUp?: React.KeyboardEventHandler<HTMLInputElement | HTMLTextAreaElement>;
  onBlur?: React.FocusEventHandler<HTMLInputElement | HTMLTextAreaElement>;
  onFocus?: React.FocusEventHandler<HTMLInputElement | HTMLTextAreaElement>;
  onInput?: React.FormEventHandler<HTMLInputElement | HTMLTextAreaElement>;
};

/**
 * @interface InputProps
 * @description Props для компонента Input.
 * Пересечение атрибутов input и textarea с расширенными обработчиками событий.
 * `rows`/`cols`/`wrap` доступны для textarea; для input они игнорируются.
 */
export type InputProps = InputBaseProps &
  InputEventProps &
  Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    'onChange' | 'onKeyDown' | 'onKeyUp' | 'onBlur' | 'onFocus' | 'onInput'
  > &
  Omit<
    React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    'onChange' | 'onKeyDown' | 'onKeyUp' | 'onBlur' | 'onFocus' | 'onInput'
  >;

/**
 * Авто-подгонка высоты textarea по содержимому.
 */
function autoresize(el: HTMLTextAreaElement | null): void {
  if (!el) return;
  el.style.height = 'auto';
  el.style.height = `${el.scrollHeight}px`;
}

/**
 * @component Input
 * @description Базовый компонент поля ввода с поддержкой label, ошибок, accessibility и textarea.
 */
export const Input = forwardRef<
  HTMLInputElement | HTMLTextAreaElement,
  InputProps
>(({ as, label, error, autoResize, className, id, ...props }, ref) => {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  const isTextarea = as === 'textarea';

  const sharedClassName = cn(
    'block w-full rounded-md border-[var(--theme-input-border)] bg-[var(--theme-input-bg)] text-[var(--theme-input-text)] placeholder-[var(--theme-input-placeholder)] shadow-sm focus:border-[var(--theme-input-focus-border)] focus:ring-[var(--theme-input-focus-border)] sm:text-sm px-3 py-2',
    error &&
      'border-[var(--theme-danger)] focus:border-[var(--theme-danger)] focus:ring-[var(--theme-danger)]',
    className,
  );

  const ariaInvalid = error ? 'true' : undefined;
  const ariaDescribedBy = error ? `${inputId}-error` : undefined;

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-[var(--theme-text-primary)] mb-1"
        >
          {label}
        </label>
      )}

      {isTextarea ? (
        <textarea
          ref={ref as React.Ref<HTMLTextAreaElement>}
          id={inputId}
          aria-invalid={ariaInvalid}
          aria-describedby={ariaDescribedBy}
          className={sharedClassName}
          onInput={(e) => {
            if (autoResize) autoresize(e.currentTarget);
            props.onInput?.(e);
          }}
          {...props}
        />
      ) : (
        <input
          ref={ref as React.Ref<HTMLInputElement>}
          id={inputId}
          aria-invalid={ariaInvalid}
          aria-describedby={ariaDescribedBy}
          className={sharedClassName}
          {...props}
        />
      )}

      {error && (
        <p
          id={`${inputId}-error`}
          className="mt-1 text-sm text-[var(--theme-danger)]"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';
