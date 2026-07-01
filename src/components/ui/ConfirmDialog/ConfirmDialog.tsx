/**
 * @component ConfirmDialog
 * @category ui
 * @description Переиспользуемый компонент модального диалога подтверждения действий
 *
 * @example
 * ```tsx
 * <ConfirmDialog
 *   isOpen={isLogoutModalOpen}
 *   onClose={() => setIsLogoutModalOpen(false)}
 *   title="Выход из системы"
 *   message="Вы действительно хотите выйти?"
 *   confirmLabel="Выйти"
 *   cancelLabel="Отмена"
 *   onConfirm={handleLogout}
 *   isLoading={isLoggingOut}
 *   variant="danger"
 * />
 * ```
 *
 * @spec
 * - Состояния: isOpen=true — диалог отображается, isOpen=false — скрыт
 * - Закрытие: через onClose (кнопка «Отмена»), клик вне области, клавиша Escape
 * - Варианты кнопки подтверждения: primary (default), danger (деструктивное действие)
 * - При isLoading=true: кнопка подтверждения блокируется, показывается спиннер
 * - Модальное окно блокирует скроллинг основного контента (modal backdrop)
 * - Доступность: фокус на кнопку подтверждения при открытии, Escape закрывает
 */
'use client';

import { useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/Button';

export interface ConfirmDialogProps {
  /** Показывать ли модальное окно */
  isOpen: boolean;
  /** Функция вызывается при закрытии диалога (отмена) */
  onClose: () => void;
  /** Заголовок диалога */
  title: string;
  /** Текст сообщения/вопроса */
  message: string;
  /** Текст кнопки подтверждения @default 'Подтвердить' */
  confirmLabel?: string;
  /** Текст кнопки отмены @default 'Отмена' */
  cancelLabel?: string;
  /** Функция вызывается при подтверждении действия */
  onConfirm: () => void;
  /** Показывать индикатор загрузки при выполнении действия @default false */
  isLoading?: boolean;
  /** Вариант кнопки подтверждения: primary (default), danger */
  variant?: 'primary' | 'danger';
}

export function ConfirmDialog({
  isOpen,
  onClose,
  title,
  message,
  confirmLabel = 'Подтвердить',
  cancelLabel = 'Отмена',
  onConfirm,
  isLoading = false,
  variant = 'primary',
}: ConfirmDialogProps): React.JSX.Element {
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  // Обработчик нажатия Escape
  const handleEscape = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    },
    [isOpen, onClose],
  );

  // Обработчик клика вне модального окна
  const handleBackdropClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (event.target === event.currentTarget) {
        onClose();
      }
    },
    [onClose],
  );

  // Подписка на клавишу Escape и установка фокуса
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
      confirmButtonRef.current?.focus();
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleEscape]);

  if (!isOpen) {
    return null;
  }

  const confirmButtonVariants = {
    primary:
      'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
        aria-hidden="true"
        onClick={handleBackdropClick}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
        <div
          className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-sm sm:p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <div>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
              <svg
                className="h-6 w-6 text-gray-600"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"
                />
              </svg>
            </div>
            <div className="mt-3 text-center sm:mt-5">
              <h3
                className="text-base font-semibold leading-6 text-gray-900"
                id="modal-title"
              >
                {title}
              </h3>
              <div className="mt-2">
                <p className="text-sm text-gray-500">{message}</p>
              </div>
            </div>
          </div>
          <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
            <Button
              variant={variant as 'primary' | 'danger'}
              isLoading={isLoading}
              onClick={onConfirm}
              ref={confirmButtonRef}
              autoFocus
            >
              {confirmLabel}
            </Button>
            <Button
              variant="secondary"
              onClick={onClose}
              disabled={isLoading}
            >
              {cancelLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
